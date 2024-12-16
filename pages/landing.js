import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false);

  const pokemonCards = [
    {
      name: 'Starter Deck',
      icon: '🎴',
      pokemon: '/pokemon/charmander.png',
      description: 'Begin your journey with basic flashcards',
      evolution: 'Charmander Level'
    },
    {
      name: 'Evolution Deck',
      icon: '🔥',
      pokemon: '/pokemon/charizard.png',
      description: 'Power up your learning with advanced cards',
      evolution: 'Charizard Level'
    },
    {
      name: 'Mega Evolution',
      icon: '⚡',
      pokemon: '/pokemon/mega-charizard-x.png',
      description: 'Master complex topics with mega evolved cards',
      evolution: 'Mega Evolution X'
    }
  ];

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
                Evolve Your Learning Journey with Pokemon-Powered Flashcards
              </p>
              <Link 
                href="/"
                className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transform hover:scale-105 transition-all"
              >
                Start Your Journey
              </Link>
            </div>

            {/* Pokemon Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pokemonCards.map((card, index) => (
                <div 
                  key={card.name}
                  className="pokemon-card group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="pokemon-card-inner">
                      <img 
                        src={card.pokemon}
                        alt={card.name}
                        className="w-32 h-32 mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="text-4xl mb-4">{card.icon}</div>
                      <h3 className="text-xl font-bold mb-2 text-yellow-400">{card.name}</h3>
                      <p className="text-gray-200 mb-2">{card.description}</p>
                      <span className="text-sm text-green-400">{card.evolution}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
