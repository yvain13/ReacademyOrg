import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      <Head>
        <title>Reacademy.ai - Learning Made Fun</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Background Layers */}
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
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-6xl font-bold mb-4 text-yellow-400 pixel-font animate-float">
                Reacademy.ai
              </h1>
              <p className="text-2xl text-white mb-8 text-shadow-lg">
                Transform Your Learning Journey
              </p>
              <Link 
                href="/"
                className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Start Learning
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 text-white">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-2">PDF to Flashcards</h3>
                <p className="text-gray-200">Convert any PDF into interactive flashcards instantly</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 text-white">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
                <p className="text-gray-200">Smart learning algorithms adapt to your needs</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 text-white">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-bold mb-2">Gamified Learning</h3>
                <p className="text-gray-200">Make studying fun and engaging</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
