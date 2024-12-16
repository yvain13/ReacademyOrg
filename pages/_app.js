import '../styles/globals.css'
import '../styles/pokemon.css'
import '../styles/scene.css'
import '../styles/content.css'
import '../styles/landing.css'
import '../styles/flashcards.css'
import '../styles/mobile.css'  // Add mobile styles
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp
