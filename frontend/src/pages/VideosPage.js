import React, { useEffect, useState } from 'react';
import { getYouTubeVideos } from '../services/api';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getYouTubeVideos()
      .then(data => {
        setVideos(data?.videos || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load videos');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center text-secondary py-12">Loading videos...</div>;
  if (error) return <div className="text-center text-accent-red py-12">{error}</div>;

  return (
    <div className="mt-8">
      <h2 className="font-display text-3xl mb-6">Tournament Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {videos.map((v, i) => (
          <div key={v.id || i} className="bg-glass rounded-xl shadow-glass p-4 flex flex-col items-center">
            <div className="w-full aspect-video bg-secondary-bg rounded-lg mb-2 flex items-center justify-center">
              {v.thumbnail ? <img src={v.thumbnail} alt={v.title} className="rounded-lg w-full h-full object-cover" /> : null}
            </div>
            <span className="text-lg font-semibold line-clamp-2">{v.title || `Video Highlight ${i+1}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 