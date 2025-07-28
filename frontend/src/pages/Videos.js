import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Search, 
  Filter, 
  Clock, 
  Eye, 
  Calendar,
  X,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { getYouTubeVideos } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const games = [
    { id: 'all', name: 'All Games', icon: '🎮' },
    { id: 'bgmi', name: 'BGMI', icon: '🔫' },
    { id: 'valorant', name: 'VALORANT', icon: '⚡' },
    { id: 'chess', name: 'Chess', icon: '♟️' },
    { id: 'freefire', name: 'Free Fire', icon: '🔥' },
    { id: 'codm', name: 'COD Mobile', icon: '💥' }
  ];

  const videoTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'highlights', name: 'Highlights' },
    { id: 'finals', name: 'Finals' },
    { id: 'tutorials', name: 'Tutorials' },
    { id: 'interviews', name: 'Interviews' }
  ];

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, searchQuery, selectedGame, selectedType]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await getYouTubeVideos();
      const videosData = response.videos || [];
      
      setVideos(videosData);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(video =>
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by game
    if (selectedGame !== 'all') {
      filtered = filtered.filter(video =>
        video.game?.toLowerCase() === selectedGame.toLowerCase()
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(video =>
        video.type?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    setFilteredVideos(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGame('all');
    setSelectedType('all');
    setShowFilters(false);
  };

  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    return duration;
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (typeof views === 'string') return views;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const openVideoModal = (video) => {
    setSelectedVideo(video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  const getGameIcon = (game) => {
    const gameData = games.find(g => g.id === game?.toLowerCase());
    return gameData?.icon || '🎮';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Tournament Videos</h1>
          <p className="text-white/60 text-lg">
            Watch highlights, tutorials, and epic moments from our tournaments
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12 w-full"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                showFilters ? 'rotate-180' : ''
              }`} />
            </button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 glass-card p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Game Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Game</label>
                    <div className="grid grid-cols-2 gap-2">
                      {games.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => setSelectedGame(game.id)}
                          className={`flex items-center space-x-2 p-3 rounded-xl transition-all duration-300 ${
                            selectedGame === game.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-lg">{game.icon}</span>
                          <span className="font-medium">{game.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Video Type</label>
                    <div className="space-y-2">
                      {videoTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                            selectedType === type.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors duration-300"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Videos Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="glass-card-hover overflow-hidden group cursor-pointer"
                  onClick={() => openVideoModal(video)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-800 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/640x360/1a1a1a/ffffff?text=Video+Thumbnail';
                      }}
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>

                    {/* Game Badge */}
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                      <span>{getGameIcon(video.game)}</span>
                      <span className="capitalize">{video.game || 'Gaming'}</span>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors duration-300">
                      {video.title}
                    </h3>
                    
                    <p className="text-white/60 text-sm mb-3 line-clamp-2">
                      {video.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-white/50">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatViews(video.views)} views</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(video.publishedAt)}</span>
                        </div>
                      </div>
                      
                      {video.type && (
                        <span className="bg-white/10 px-2 py-1 rounded capitalize">
                          {video.type}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Play className="w-16 h-16 text-white/40 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">No Videos Found</h3>
              <p className="text-white/60 mb-6">
                {searchQuery || selectedGame !== 'all' || selectedType !== 'all'
                  ? 'Try adjusting your filters to find more videos'
                  : 'No videos available right now. Check back later!'
                }
              </p>
              {(searchQuery || selectedGame !== 'all' || selectedType !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Video Modal */}
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeVideoModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">{selectedVideo.title}</h2>
                  <button
                    onClick={closeVideoModal}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Video Player */}
                <div className="p-6">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideo.videoId}`}
                      title={selectedVideo.title}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>

                  {/* Video Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-white/60">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{formatViews(selectedVideo.views)} views</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(selectedVideo.publishedAt)}</span>
                        </div>
                      </div>
                      
                      <a
                        href={`https://www.youtube.com/watch?v=${selectedVideo.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Watch on YouTube</span>
                      </a>
                    </div>

                    <p className="text-white/80 leading-relaxed">
                      {selectedVideo.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Videos;