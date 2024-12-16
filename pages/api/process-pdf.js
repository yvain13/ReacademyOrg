import { formidable } from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Get the PDF file
    const pdfFile = files.pdf?.[0];
    if (!pdfFile) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(pdfFile.filepath);
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
    const flashcards = JSON.parse(content.replace(/```json|```/g, '').trim());

    // Clean up temp file
    fs.unlinkSync(pdfFile.filepath);

    // Send response
    res.status(200).json({ flashcards });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
