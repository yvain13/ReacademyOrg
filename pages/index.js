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
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'
  const [favorites, setFavorites] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

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
    console.log('File dropped');
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      console.log('Valid PDF dropped:', droppedFile.name);
      setFile(droppedFile);
      setError(null);
    } else {
      console.log('Invalid file type dropped:', droppedFile?.type);
      setError("Please upload a PDF file");
    }
  };

  const handleFileChange = (e) => {
    console.log('File input changed');
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === "application/pdf") {
      console.log('Valid PDF selected:', selectedFile.name);
      setFile(selectedFile);
      setError(null);
    } else {
      console.log('Invalid file type:', selectedFile?.type);
      setError("Please upload a PDF file");
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

  const handleUpload = async () => {
    console.log('handleUpload called');
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    setLoading(true);
    setError(null);
    setFlashcards([]); // Clear existing flashcards

    const formData = new FormData();
    formData.append('pdf', file);

    // Log FormData contents
    console.log('FormData created with:', {
      hasFile: formData.has('pdf'),
      fileName: file.name
    });

    try {
      console.log('Starting API request...');
      // Always use /api/process-pdf since we've configured the Netlify function to use this path
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });
      console.log('API request completed:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error processing PDF');
      }

      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error('Invalid flashcard data received');
      }

      setFlashcards(data.flashcards);
      setCurrentPage(1);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    console.log('Upload button clicked');
    if (!file) {
      console.log('No file selected for upload');
      setError("Please select a PDF file first");
      return;
    }
    handleUpload();
  };

  const filteredCards = activeTab === 'all' 
    ? flashcards 
    : flashcards.filter((_, index) => favorites.has(index));

  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const currentCards = filteredCards.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  return (
    <div className="min-h-screen h-screen bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <Head>
        <title>Reacademy.ai - Flashcards</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Background Scene */}
      <div className="scene-container">
        <div className="background-mountain" />
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
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-1 text-white font-mono">
                Reacademy.ai
              </h1>
              <p className="text-gray-400 text-sm tracking-wide">
                Transform your learning with AI-powered flashcards
              </p>
            </div>

            <div className="flex gap-8 flex-1 min-h-0">
              {/* Left Panel - PDF Upload only */}
              <div className="w-1/2 flex flex-col upload-section">
                <div className="flex-1 flex flex-col justify-center">
                  {error && (
                    <div className="mb-4 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
                      <p className="text-red-400">{error}</p>
                    </div>
                  )}
                  <div 
                    className={`relative backdrop-blur-md bg-white/5 border rounded-xl p-6 text-center transition-all duration-300 ease-in-out ${
                      dragActive 
                        ? 'border-white/30 bg-white/10 shadow-lg' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-white/5 rounded-full mb-4 border border-white/10">
                          <UploadCloud className="h-8 w-8 text-white/70" />
                        </div>
                        <p className="text-lg font-medium text-white/90 mb-2">
                          {file ? file.name : 'Drop your PDF here'}
                        </p>
                        <p className="text-sm text-gray-400">
                          or click to browse
                        </p>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleUploadClick}
                    disabled={!file || loading}
                    className="w-full mt-4 bg-white/10 backdrop-blur-md text-white border border-white/10 py-3 px-4 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Generate Flashcards'
                    )}
                  </button>
                </div>
              </div>

              {/* Right Panel - Flashcards */}
              <div className="w-1/2 flex flex-col min-h-0">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 flex-1 flex flex-col min-h-0">
                  {/* Tabs */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        activeTab === 'all'
                          ? 'bg-white/20 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      All Cards ({flashcards.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('favorites')}
                      className={`px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        activeTab === 'favorites'
                          ? 'bg-white/20 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Favorites ({favorites.size})
                    </button>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto flex-1 p-2">
                    {currentCards.length > 0 ? (
                      currentCards.map((card, index) => {
                        const originalIndex = flashcards.indexOf(card);
                        console.log('Rendering card:', { card, index, originalIndex });
                        return (
                          <div
                            key={originalIndex}
                            className="h-64 perspective-1000"
                          >
                            <div
                              className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${
                                flippedCards[originalIndex] ? 'rotate-y-180' : ''
                              }`}
                              onClick={() => toggleCard(originalIndex)}
                            >
                              {/* Favorite Button - Outside card flip container */}
                              <div className="absolute top-2 right-2 z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(originalIndex);
                                  }}
                                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                                >
                                  <Heart
                                    className={`h-4 w-4 transition-colors duration-300 ${
                                      favorites.has(originalIndex)
                                        ? 'text-red-400 fill-red-400'
                                        : 'text-white/70'
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* Front of card */}
                              <div className="absolute w-full h-full backface-hidden">
                                <div className="w-full h-full backdrop-blur-xl bg-white/5 rounded-xl p-6 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                                  <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-lg"></div>
                                    <div className="text-center z-10 w-full">
                                      <div className="card-label">Question</div>
                                      <p className="card-question">
                                        {card?.question || 'No question available'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Back of card */}
                              <div className="absolute w-full h-full backface-hidden rotate-y-180">
                                <div className="w-full h-full backdrop-blur-xl bg-white/10 rounded-xl p-6 flex items-center justify-center border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                                  <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg"></div>
                                    <div className="text-center z-10 w-full">
                                      <div className="card-label">Answer</div>
                                      <p className="card-answer">
                                        {card?.answer || 'No answer available'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        {loading ? 'Generating flashcards...' : 'No flashcards available'}
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded-full transition-all duration-300 ${
                            currentPage === i + 1
                              ? 'bg-white/20 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
