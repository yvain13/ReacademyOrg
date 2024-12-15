# Project Overview
Objective:
Develop a SaaS platform that converts PDFs into interactive flashcards by generating key queries using OpenAI.

Tech Stack:

Frontend: Next.js with shadcn/ui for UI components.
Backend: API routes in Next.js.
Processing Engine: LlamaParser for PDF parsing and OpenAI API for question generation.
User Flow:

User uploads a PDF.
Application parses the document.
OpenAI processes the parsed text to generate flashcard questions.
Questions are displayed in an interactive flashcard format.
# Core Functionalities
User Authentication (Optional for MVP):
Sign-up/Login via email or OAuth (e.g., Google).
PDF Upload and Parsing:
Allow users to upload PDF files.
Use LlamaParser to extract structured content (text, headings, etc.).
Flashcard Generation:
Send parsed content to OpenAI API to extract key queries.
Present queries in a Q&A format.
Interactive Flashcards:
Flashcards with "question" on one side and "answer" on the other.
Swipe or click functionality for navigation.
Save and Export:
Save flashcards for future use.
Export flashcards as a JSON or CSV file.
# Documentation
Project Setup

Install dependencies:
npx create-next-app@latest saas-flashcards
cd saas-flashcards
npm install shadcn-ui llama-parser openai
Configure shadcn/ui:
npx shadcn init
npx shadcn add card button
Set up OpenAI API key in .env.local:
OPENAI_API_KEY=your_key_here
Configure file uploads:
Use Next.js api/routes for backend upload handling.
API Documentation

LlamaParser Integration:
Use parse to extract relevant sections from PDFs:
const parsedContent = await llamaParser.parse(file);
OpenAI API Query Example:
const response = await openai.createChatCompletion({
  model: "gpt-4",
  messages: [
    { role: "system", content: "Extract key questions from the text." },
    { role: "user", content: parsedContent },
  ],
});
const flashcards = response.data.choices[0].message.content;
# Current File Structure
saas-flashcards/
├── public/          # Static assets
├── pages/           # Next.js pages
│   ├── api/         # API routes
│   │   ├── upload.js # File upload API
│   │   └── generate.js # Flashcard generation API
│   ├── index.js     # Main landing page
│   └── dashboard.js # User dashboard
├── components/      # Reusable UI components
│   ├── FlashCard.js # Flashcard UI
│   ├── UploadForm.js # PDF upload form
│   └── Loader.js    # Loading spinner
├── styles/          # CSS files or Tailwind configuration
├── utils/           # Utility functions (e.g., OpenAI integration)
├── .env.local       # API keys
└── package.json     # Project dependencies
# Important Implementation Notes
OpenAI Rate Limits:
Implement caching or batching to manage API rate limits and reduce costs.
Error Handling:
Validate PDF file size and format before processing.
Add graceful fallback messages for API errors.
State Management:
Use React context or libraries like Zustand if state sharing grows complex.
Responsive Design:
Ensure flashcard UI works well on mobile and desktop.
Scalability:
Use AWS S3 or Cloudinary for storing uploaded PDFs.
Optimize the backend with serverless functions for scalability.
Testing:
Unit tests for components.
Integration tests for API endpoints using tools like Jest or Playwright.@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}