import { useState } from 'react';
import Head from 'next/head';
import { UploadCloud, Heart } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [flippedCards, setFlippedCards] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(1);
  const [favorites, setFavorites] = useState(new Set());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

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

  const pokemonProgress = [
    {
      stage: 'Beginner',
      pokemon: 'charmander',
      description: 'Created first flashcard deck',
      progress: 0,
      cards: 0,
      required: 10,
      unlocked: true
    },
    {
      stage: 'Intermediate',
      pokemon: 'charmeleon',
      description: 'Master your first deck',
      progress: 0,
      cards: 0,
      required: 25,
      unlocked: false
    },
    {
      stage: 'Advanced',
      pokemon: 'charizard',
      description: 'Create multiple decks',
      progress: 0,
      cards: 0,
      required: 50,
      unlocked: false
    },
    {
      stage: 'Expert',
      pokemon: 'mega-charizard-x',
      description: 'Complete all challenges',
      progress: 0,
      cards: 0,
      required: 100,
      unlocked: false
    }
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
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
  
      const data = await response.json();
      setFlashcards(data.flashcards);
      setActiveCategory(1); // Start with the first category
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

  const toggleFavorite = (index) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(index)) {
        newFavorites.delete(index);
      } else {
        newFavorites.add(index);
      }
      return newFavorites;
    });
  };

  const completeCategory = (category) => {
    if (category < 5) {
      setActiveCategory(category + 1);
    }
  };

  const handleCardClick = (index) => {
    setCurrentCardIndex(index);
  };

  // Filter cards by current category
  const currentCategoryCards = flashcards.filter(card => card.category === activeCategory);

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
                            : index + 1 > activeCategory 
                              ? 'locked'
                              : ''
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
                        {index + 1 === activeCategory && (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ 
                                width: `${(currentCardIndex / 3) * 100}%`
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                        Level {activeCategory} Flashcards
                      </h2>
                      <button
                        onClick={() => completeCategory(activeCategory)}
                        className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                      >
                        Complete Level
                      </button>
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
                            <div className="flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(index);
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Heart
                                  className={favorites.has(index) ? 'fill-current text-red-500' : ''}
                                />
                              </button>
                            </div>
                            <div className="flex-1 flex items-center justify-center text-center">
                              <p className="text-white">
                                {flippedCards[index] ? card.answer : card.question}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
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
