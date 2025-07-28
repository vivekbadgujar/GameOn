import React, { useEffect, useState } from 'react';
import { getYouTubeVideos } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastMessage } = useSocket();

  useEffect(() => {
    setLoading(true);
    getYouTubeVideos()
      .then(data => {
        console.log('Fetched videos data:', data);
        if (data?.success) {
          setVideos(data.videos || []);
        } else {
          setVideos([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading videos:', err);
        setError('Failed to load videos');
        setLoading(false);
      });
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Videos page received socket message:', lastMessage);
    
    if (lastMessage.type === 'videoAdded') {
      console.log('Adding new video:', lastMessage.data);
      // Transform admin video data to frontend format
      const newVideo = {
        id: lastMessage.data._id,
        youtubeId: lastMessage.data.youtubeId,
        title: lastMessage.data.title,
        description: lastMessage.data.description,
        thumbnail: `https://img.youtube.com/vi/${lastMessage.data.youtubeId}/maxresdefault.jpg`,
        url: lastMessage.data.youtubeUrl,
        game: lastMessage.data.game,
        category: lastMessage.data.category,
        tournament: lastMessage.data.tournament,
        createdAt: lastMessage.data.createdAt
      };
      setVideos(prev => {
        // Check if video already exists to avoid duplicates
        const exists = prev.find(v => v.id === newVideo.id);
        if (exists) return prev;
        return [newVideo, ...prev];
      });
    } else if (lastMessage.type === 'videoUpdated') {
      console.log('Updating video:', lastMessage.data);
      const updatedVideo = {
        id: lastMessage.data._id,
        youtubeId: lastMessage.data.youtubeId,
        title: lastMessage.data.title,
        description: lastMessage.data.description,
        thumbnail: `https://img.youtube.com/vi/${lastMessage.data.youtubeId}/maxresdefault.jpg`,
        url: lastMessage.data.youtubeUrl,
        game: lastMessage.data.game,
        category: lastMessage.data.category,
        tournament: lastMessage.data.tournament,
        createdAt: lastMessage.data.createdAt
      };
      setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
    } else if (lastMessage.type === 'videoDeleted') {
      console.log('Deleting video:', lastMessage.data);
      setVideos(prev => prev.filter(v => v.id !== lastMessage.data));
    }
  }, [lastMessage]);

  if (loading) return <div className="text-center text-secondary py-12">Loading videos...</div>;
  if (error) return <div className="text-center text-accent-red py-12">{error}</div>;

  return (
    <div className="mt-8">
      <h2 className="font-display text-3xl mb-6">Tournament Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {videos.length === 0 ? (
          <div className="col-span-full text-center text-secondary py-12">
            No tournament videos available yet.
          </div>
        ) : (
          videos.map((v, i) => (
            <div key={v.id || i} className="bg-glass rounded-xl shadow-glass p-4 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer">
              <div className="w-full aspect-video bg-secondary-bg rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {v.thumbnail ? (
                  <img 
                    src={v.thumbnail} 
                    alt={v.title} 
                    className="rounded-lg w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
                    }}
                  />
                ) : (
                  <div className="text-secondary">No thumbnail</div>
                )}
              </div>
              <span className="text-lg font-semibold line-clamp-2 text-center mb-2">
                {v.title || `Video Highlight ${i+1}`}
              </span>
              {v.game && (
                <span className="text-sm text-accent-blue bg-accent-blue/10 px-2 py-1 rounded-full">
                  {v.game}
                </span>
              )}
              {v.url && (
                <a 
                  href={v.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 px-4 py-2 bg-accent-red text-white rounded-lg hover:bg-accent-red/80 transition-colors text-sm"
                >
                  Watch on YouTube
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 