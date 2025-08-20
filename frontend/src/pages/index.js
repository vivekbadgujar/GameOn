import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import components that might use window/document
const HomePage = dynamic(() => import('./HomePage'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
    </div>
  )
});

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>GameOn - Premier BGMI Tournament Platform</title>
        <meta name="description" content="Join the ultimate BGMI tournaments on GameOn. Compete with the best players, win amazing prizes, and become a champion!" />
        <meta name="keywords" content="BGMI, tournament, gaming, esports, battle royale, competition" />
        <meta property="og:title" content="GameOn - Premier BGMI Tournament Platform" />
        <meta property="og:description" content="Join the ultimate BGMI tournaments on GameOn. Compete with the best players, win amazing prizes, and become a champion!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gameonesport.xyz" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <HomePage />
      </motion.div>
    </>
  );
}