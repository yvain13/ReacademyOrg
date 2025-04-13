import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { IncomingForm } from 'formidable';

// Disable body parsing, we'll handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Function to convert base64 to buffer
function base64ToBuffer(base64) {
  const base64Str = base64.includes('base64,') 
    ? base64.split('base64,')[1] 
    : base64;
  return Buffer.from(base64Str, 'base64');
}

// Function to safely parse JSON with fallback
function safeJsonParse(str) {
  try {
    // First attempt: direct parse
    return JSON.parse(str);
  } catch (error) {
    try {
      // Second attempt: Remove markdown code blocks
      const cleaned = str.replace(/```(?:json)?|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      try {
        // Third attempt: Find JSON array pattern
        const match = str.match(/\[[\s\S]*\]/);
        if (match && match[0]) {
          return JSON.parse(match[0]);
        }
      } catch (error) {
        // No more attempts, throw the original error
        throw new Error(`Failed to parse response as JSON: ${str.substring(0, 100)}...`);
      }
    }
  }
}

// Function to read raw file data from request
const readFileFromRequest = (req) => {
  return new Promise((resolve, reject) => {
    let fileData = [];
    
    req.on('data', (chunk) => {
      fileData.push(chunk);
    });
    
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(fileData);
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
};

// Function to extract PDF data from multipart form
const extractPdfFromMultipart = async (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ 
      keepExtensions: true,
      multiples: false,
    });
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      
      try {
        // Get first file regardless of field name
        const fileKey = Object.keys(files)[0];
        const file = files[fileKey]?.[0] || files[fileKey];
        
        if (!file) {
          return reject(new Error('No file found in request'));
        }
        
        // Handle both filepath (local) and buffer (serverless) cases
        let pdfBuffer;
        
        if (file.filepath) {
          // Local environment
          const fs = await import('fs/promises');
          pdfBuffer = await fs.readFile(file.filepath);
          
          // Clean up
          try {
            await fs.unlink(file.filepath);
          } catch (error) {
            console.warn('Failed to clean up temp file:', error);
          }
        } else if (file.buffer) {
          // Some serverless environments
          pdfBuffer = file.buffer;
        } else {
          return reject(new Error('Cannot read file data'));
        }
        
        resolve(pdfBuffer);
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Format the flashcards into a consistent structure
function formatFlashcards(cards) {
  // Ensure we have valid data
  if (!Array.isArray(cards)) {
    throw new Error('Response is not an array of flashcards');
  }
  
  // Map to ensure consistent structure
  return cards.map((card, index) => ({
    question: card.question || `Question ${index + 1}`,
    answer: card.answer || `Answer ${index + 1}`,
    category: typeof card.category === 'number' ? card.category : 
              typeof card.category === 'string' ? parseInt(card.category, 10) :
              Math.min(5, Math.floor(index / 3) + 1) // Fallback category calculation
  })).slice(0, 15); // Ensure we have exactly 15 cards maximum
}

// Main handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check content type to determine how to handle the request
    const contentType = req.headers['content-type'] || '';
    
    let pdfBuffer;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data
      pdfBuffer = await extractPdfFromMultipart(req);
    } else if (contentType.includes('application/json')) {
      // Handle JSON with base64
      const rawData = await readFileFromRequest(req);
      const { pdf } = JSON.parse(rawData.toString());
      
      if (!pdf) {
        return res.status(400).json({ error: 'No PDF data found in request' });
      }
      
      pdfBuffer = base64ToBuffer(pdf);
    } else {
      // Handle raw binary
      pdfBuffer = await readFileFromRequest(req);
    }
    
    // Limit PDF text length to prevent token overflow
    const maxTextLength = process.env.MAX_PDF_LENGTH || 10000;
    
    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer, {
      max: maxTextLength, // Limit processed text
      pagerender: function(pageData) {
        // Custom page renderer to skip problematic font commands
        try {
          return pageData.getTextContent({ 
            disableCombineTextItems: false,
            normalizeWhitespace: true
          });
        } catch (err) {
          console.warn(`Warning: Error rendering page: ${err.message}`);
          return { items: [] }; // Return empty content for problematic pages
        }
      }
    });
    const pdfText = pdfData.text.substring(0, maxTextLength);
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate flashcards
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates flashcards from PDF text. Always return valid JSON in the exact format requested, with no additional text or explanation."
        },
        {
          role: "user",
          content: `Create exactly 15 flashcards from this text, divided into 5 categories of increasing difficulty (3 cards per category). Each category should build upon the previous one, starting from basic concepts and progressing to advanced applications.

Format the response as a JSON array ONLY with objects containing:
- 'question': The question text
- 'answer': The answer text
- 'category': A number from 1 to 5 indicating difficulty level (1=basic, 5=advanced)

Example format:
[
  {
    "question": "Basic concept question",
    "answer": "Clear answer",
    "category": 1
  }
]

Text to process:
${pdfText}`
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { "type": "json_object" }
    });

    // Get the response content
    const content = completion.choices[0].message.content;
    
    // Parse the JSON response with our safe parsing function
    const jsonResponse = safeJsonParse(content);
    
    // Get the flashcards array from the response
    // This handles both direct array and { flashcards: [...] } formats
    const rawFlashcards = Array.isArray(jsonResponse) ? jsonResponse : 
                         jsonResponse.flashcards || jsonResponse.cards || [];
    
    // Format flashcards to ensure consistent structure
    const flashcards = formatFlashcards(rawFlashcards);

    // Send response
    res.status(200).json({ flashcards });

  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
