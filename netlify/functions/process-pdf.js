const { createReadStream } = require('fs');
const { IncomingForm } = require('formidable');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const busboy = require('busboy');

// Function to safely parse JSON with fallbacks
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

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Use busboy to parse the multipart form data
    const buf = Buffer.from(event.body, 'base64');
    const contentType = event.headers['content-type'] || '';
    
    // If this isn't multipart, return an error
    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid content type. Expected multipart/form-data' })
      };
    }
    
    // Parse the PDF data using busboy
    const pdfBuffer = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: { 'content-type': contentType } });
      let buffer = null;
      
      bb.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        console.log(`Processing file: ${filename}, type: ${mimeType}`);
        
        if (!mimeType.includes('application/pdf')) {
          reject(new Error('Only PDF files are supported'));
          return;
        }
        
        const chunks = [];
        file.on('data', (data) => {
          chunks.push(data);
        });
        
        file.on('end', () => {
          buffer = Buffer.concat(chunks);
        });
      });
      
      bb.on('finish', () => {
        if (!buffer) {
          reject(new Error('No PDF file found in request'));
          return;
        }
        resolve(buffer);
      });
      
      bb.on('error', (err) => {
        reject(err);
      });
      
      bb.write(buf);
      bb.end();
    });
    
    // Limit PDF text length to prevent token overflow
    const maxTextLength = process.env.MAX_PDF_LENGTH || 10000;
    
    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer);
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

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ flashcards })
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
