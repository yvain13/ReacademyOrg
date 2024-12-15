import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_LENGTH = 10000; // 10,000 characters

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('API request received:', {
      method: req.method,
      url: req.url,
      headers: req.headers
    });

    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
    });

    console.log('Parsing form data...');
    
    try {
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      const pdfFile = files.pdf?.[0];
      console.log('PDF file received:', pdfFile ? {
        name: pdfFile.originalFilename,
        size: pdfFile.size,
        type: pdfFile.mimetype,
        path: pdfFile.filepath
      } : 'No PDF file');
      
      if (!pdfFile) {
        console.log('No PDF file uploaded');
        return res.status(400).json({ message: 'No PDF file uploaded' });
      }

      console.log('Reading PDF file...');
      const dataBuffer = fs.readFileSync(pdfFile.filepath);
      const pdfData = await pdfParse(dataBuffer);
      console.log('PDF parsed successfully, text length:', pdfData.text.length);

      if (pdfData.text.length > MAX_PDF_LENGTH) {
        console.log('PDF content too long:', pdfData.text.length);
        return res.status(400).json({ 
          message: 'PDF content is too long. Please use a shorter document (maximum 10,000 characters).' 
        });
      }

      const prompt = `Create 5-10 flashcards from the following text. Each flashcard should have a question and answer. Format the response as a JSON array of objects with 'question' and 'answer' properties. The questions should test understanding of key concepts. Keep both questions and answers concise.

Example format:
[
  {
    "question": "What is the main concept?",
    "answer": "The clear, concise answer"
  }
]

Text:
${pdfData.text}`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0].message.content;
      console.log('OpenAI Response:', content);
      
      let flashcards;
      try {
        // First try to parse the content directly
        try {
          flashcards = JSON.parse(content);
        } catch (e) {
          // If direct parsing fails, try to clean the content
          const cleanedContent = content.replace(/```json|```/g, '').trim();
          console.log('Cleaned Content:', cleanedContent);
          flashcards = JSON.parse(cleanedContent);
        }

        // Validate flashcard structure
        if (!Array.isArray(flashcards)) {
          throw new Error('Response is not an array');
        }

        // Ensure each flashcard has the correct structure
        flashcards = flashcards.map((card, index) => {
          if (!card || typeof card !== 'object') {
            throw new Error(`Invalid card at index ${index}`);
          }
          
          return {
            question: String(card.question || '').trim(),
            answer: String(card.answer || '').trim()
          };
        });

        console.log('Processed Flashcards:', flashcards);

        if (flashcards.length === 0) {
          throw new Error('No valid flashcards generated');
        }

        // Check if any card is empty
        const hasEmptyCard = flashcards.some(card => 
          !card.question.length || !card.answer.length
        );

        if (hasEmptyCard) {
          throw new Error('Some flashcards have empty questions or answers');
        }

      } catch (parseError) {
        console.error('Error processing flashcards:', parseError);
        return res.status(422).json({ 
          message: 'Error generating flashcards. Please try again.',
          error: parseError.message
        });
      }

      // Clean up the temporary file
      try {
        fs.unlinkSync(pdfFile.filepath);
      } catch (unlinkError) {
        console.error('Error cleaning up temp file:', unlinkError);
      }

      // Set proper headers and send response
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: true,
        message: 'PDF processed successfully',
        flashcards 
      });

    } catch (error) {
      console.error('Error processing request:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Error processing PDF',
      });
    }

  } catch (error) {
    console.error('Error handling API request:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
