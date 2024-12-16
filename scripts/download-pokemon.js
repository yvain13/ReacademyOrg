const https = require('https');
const fs = require('fs');
const path = require('path');

const pokemonImages = [
  {
    name: 'charmander.png',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png'
  },
  {
    name: 'charmeleon.png',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/5.png'
  },
  {
    name: 'charizard.png',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png'
  },
  {
    name: 'mega-charizard-x.png',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png'
  },
  {
    name: 'mega-charizard-y.png',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10035.png'
  }
];

const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(filename);
      reject(err);
    });
  });
};

async function downloadAllImages() {
  const pokemonDir = path.join(process.cwd(), 'public', 'pokemon');
  
  for (const pokemon of pokemonImages) {
    const filePath = path.join(pokemonDir, pokemon.name);
    console.log(`Downloading ${pokemon.name}...`);
    try {
      await downloadImage(pokemon.url, filePath);
      console.log(`Successfully downloaded ${pokemon.name}`);
    } catch (error) {
      console.error(`Error downloading ${pokemon.name}:`, error);
    }
  }
}

downloadAllImages();
