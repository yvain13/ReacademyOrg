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
    
    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer);

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate flashcards
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Create exactly 15 flashcards from this text, divided into 5 categories of increasing difficulty (3 cards per category). Each category should build upon the previous one, starting from basic concepts and progressing to advanced applications.

Format the response as a JSON array with objects containing:
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
${pdfData.text}`
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 2500,
    });

    // Parse the response
    const content = completion.choices[0].message.content;
    const cleanedContent = content.replace(/```json|```/g, '').trim();
    const flashcards = JSON.parse(cleanedContent);

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
