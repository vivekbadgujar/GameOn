import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import MediaGallery component
const MediaGallery = dynamic(() => import('./MediaGallery'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
    </div>
  )
});

export default function Media() {
  return (
    <>
      <Head>
        <title>Videos & Gallery | GameOn</title>
        <meta name="description" content="Explore tournament highlights, videos, and media gallery on GameOn." />
      </Head>
      
      <MediaGallery />
    </>
  );
}

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {},
  };
}
