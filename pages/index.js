import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { UploadCloud } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [flippedCards, setFlippedCards] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(1);
  const [showAllCards, setShowAllCards] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  const pokemonStages = [
    { 
      name: 'Charmander', 
      image: '/pokemon/charmander.png',
      description: 'Basic Concepts'
    },
    { 
      name: 'Charmeleon', 
      image: '/pokemon/charmeleon.png',
      description: 'Intermediate Understanding'
    },
    { 
      name: 'Charizard', 
      image: '/pokemon/charizard.png',
      description: 'Advanced Applications'
    },
    { 
      name: 'Mega Charizard X', 
      image: '/pokemon/mega-charizard-x.png',
      description: 'Expert Analysis'
    },
    { 
      name: 'Mega Charizard Y', 
      image: '/pokemon/mega-charizard-y.png',
      description: 'Master Level'
    },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first");
      return;
    }
  
    setLoading(true);
    setError(null);
    setFlashcards([]);
  
    const formData = new FormData();
    formData.append('pdf', file);
  
    try {
      const response = await fetch('/.netlify/functions/process-pdf', {
        method: 'POST',
        body: formData,
      });
  
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', responseText.substring(0, 200));
        throw new Error('Invalid response format from server');
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      if (data.flashcards && Array.isArray(data.flashcards)) {
        setFlashcards(data.flashcards);
        setActiveCategory(1); // Start with the first category
      } else {
        throw new Error('Invalid flashcards data returned from server');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process PDF');
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (index) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const completeCategory = (category) => {
    if (category < 5) {
      setActiveCategory(category + 1);
    } else {
      // Show all cards and the congratulations message when all levels are completed
      setShowAllCards(true);
      setShowCompletionMessage(true);
    }
  };

  const handleCardClick = (index) => {
    // Removed currentCardIndex state and associated logic
  };

  // Get cards for the current category, or all cards if all levels completed
  const currentCategoryCards = showAllCards 
    ? flashcards 
    : flashcards.filter(card => card.category === activeCategory);

  return (
    <>
      <Head>
        <title>Flashcard Generator</title>
        <meta name="description" content="Generate flashcards from PDF" />
      </Head>

      {/* Background Scene */}
      <div className="scene-container">
        {/* Mountain Background */}
        <div className="background-mountain" />

        {/* Static Parallax Layers */}
        <div className="parallax-layer parallax-2" />
        <div className="parallax-layer parallax-3a" />
        <div className="parallax-layer parallax-3b" />
        <div className="parallax-layer parallax-4" />
        <div className="parallax-layer parallax-7" />
        <div className="parallax-layer parallax-8" />

        {/* Animated Stars */}
        <div className="stars">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="star" />
          ))}
        </div>

        {/* Flying Birds */}
        <div className="bird" style={{ top: '6%', animationDelay: '0s' }} />
        
        {/* Campfire */}
        <div className="campfire" style={{ top: '76%', animationDelay: '0s' }} />
       
        {/* Divider Background */}
        <div className="background-base" />
      </div>

      {/* Main Content */}
      <main className="min-h-screen relative">
        <div className="container mx-auto px-4 py-8">
          <div className="content-overlay">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left sidebar with progress */}
              <div className="w-full md:w-64 space-y-6">
                <div className="pokemon-progress backdrop-blur-md">
                  <h3 className="text-2xl font-pixel text-yellow-400 mb-4">Learning Journey</h3>
                  {pokemonStages.map((pokemon, index) => (
                    <div 
                      key={pokemon.name}
                      className={`pokemon-stage relative ${
                        index + 1 === activeCategory 
                          ? 'active' 
                          : index + 1 < activeCategory 
                            ? 'completed' 
                            : 'locked'
                      }`}
                    >
                      <div 
                        className="pokemon-icon"
                        style={{
                          backgroundImage: `url(${pokemon.image})`,
                        }}
                      />
                      <div className="pokemon-info">
                        <div className="pokemon-name text-white">{pokemon.name}</div>
                        <div className="pokemon-description text-gray-300">{pokemon.description}</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6">
                    <Link 
                      href="/landing" 
                      className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      Back to Landing Page
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main content area */}
              <div className="flex-1">
                {/* File upload section */}
                <div 
                  className={`bg-white/10 backdrop-blur-md border-2 border-dashed rounded-lg p-8 text-center mb-8
                    ${dragActive ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/30'}
                    ${error ? 'border-red-500 bg-red-500/10' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    id="file-upload"
                  />
                  
                  <label 
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <UploadCloud className="w-12 h-12 text-yellow-400" />
                    <span className="text-white">
                      {file ? file.name : "Drop your PDF here or click to upload"}
                    </span>
                  </label>

                  {error && (
                    <p className="text-red-400 mt-2">{error}</p>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className={`mt-4 px-6 py-2 rounded-full ${
                      !file || loading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white transition-colors`}
                  >
                    {loading ? 'Processing...' : 'Generate Flashcards'}
                  </button>
                </div>

                {/* Flashcards grid */}
                {currentCategoryCards.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-yellow-400">
                        {showAllCards ? 'All Flashcards' : `Level ${activeCategory} Flashcards`}
                      </h2>
                      {!showAllCards && (
                        <button
                          onClick={() => completeCategory(activeCategory)}
                          className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                        >
                          Complete Level
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentCategoryCards.map((card, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            toggleCard(index);
                            handleCardClick(index);
                          }}
                          className={`relative h-48 rounded-lg shadow-lg cursor-pointer transform transition-transform hover:scale-105
                            ${flippedCards[index] 
                              ? 'bg-white/20 backdrop-blur-md' 
                              : 'bg-white/10 backdrop-blur-md'}`}
                        >
                          <div className="absolute inset-0 p-4 flex flex-col">
                            <div className="flex-1 flex items-center justify-center text-center">
                              <p className="text-white">
                                {flippedCards[index] ? card.answer : card.question}
                              </p>
                            </div>
                            {showAllCards && (
                              <div className="mt-2 text-xs text-yellow-400 text-center">
                                Level {card.category}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Congratulations message when all levels are completed */}
                {showCompletionMessage && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
                    <div className="bg-white/20 backdrop-blur-md p-8 rounded-lg text-center max-w-md">
                      <h2 className="text-3xl font-bold text-yellow-400 mb-4">Congratulations!</h2>
                      <p className="text-white text-xl mb-6">You have successfully completed all the levels! Now you can review all your flashcards.</p>
                      <div className="flex flex-col space-y-3">
                        <button
                          onClick={() => setShowCompletionMessage(false)}
                          className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                        >
                          View All Cards
                        </button>
                        <Link 
                          href="/landing" 
                          className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
                        >
                          Back to Landing Page
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
