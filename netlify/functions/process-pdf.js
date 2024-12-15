const formidable = require('formidable');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_LENGTH = 10000; // 10,000 characters

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Server configuration error' })
    };
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const pdfFile = files.pdf?.[0];
    if (!pdfFile) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'No PDF file uploaded' })
      };
    }

    // Read and parse the PDF
    const dataBuffer = fs.readFileSync(pdfFile.filepath);
    const pdfData = await pdfParse(dataBuffer);

    if (pdfData.text.length > MAX_PDF_LENGTH) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'PDF content is too long. Please use a shorter document (maximum 10,000 characters).' 
        })
      };
    }

    // Generate flashcards using OpenAI
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
    let flashcards;

    try {
      // First try to parse the content directly
      try {
        flashcards = JSON.parse(content);
      } catch (e) {
        // If direct parsing fails, try to clean the content
        const cleanedContent = content.replace(/```json|```/g, '').trim();
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
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({ 
          message: 'Error generating flashcards. Please try again.',
          error: parseError.message
        })
      };
    }

    // Clean up the temporary file
    try {
      fs.unlinkSync(pdfFile.filepath);
    } catch (unlinkError) {
      console.error('Error cleaning up temp file:', unlinkError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'PDF processed successfully',
        flashcards
      })
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        message: error.message || 'Error processing PDF'
      })
    };
  }
};
