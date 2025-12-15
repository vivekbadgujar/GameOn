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
  ExternalLink,
  Image,
  Video,
  Grid,
  List,
  Download,
  Tag,
  Loader
} from 'lucide-react';
import { getTournamentVideos, getPublicMedia } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const MediaGallery = () => {
  const [videos, setVideos] = useState([]);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

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

  const mediaTypes = [
    { id: 'all', name: 'All Media' },
    { id: 'images', name: 'Images' },
    { id: 'videos', name: 'Videos' },
    { id: 'tournament', name: 'Tournaments' },
    { id: 'promotional', name: 'Promotional' },
    { id: 'branding', name: 'Branding' }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch both videos and gallery media in parallel
      const [videosResponse, mediaResponse] = await Promise.all([
        getTournamentVideos(),
        getPublicMedia()
      ]);
      
      console.log('Videos response:', videosResponse);
      console.log('Media response:', mediaResponse);
      
      setVideos(videosResponse.videos || []);
      setGalleryMedia(mediaResponse.media || []);
    } catch (error) {
      console.error('Error fetching media data:', error);
      setVideos([]);
      setGalleryMedia([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter videos based on search and filters
  const filteredVideos = videos.filter(video => {
    const matchesSearch = !searchQuery || 
      video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGame = selectedGame === 'all' || 
      video.game?.toLowerCase() === selectedGame.toLowerCase();
    
    const matchesType = selectedType === 'all' || 
      video.type?.toLowerCase() === selectedType.toLowerCase();
    
    return matchesSearch && matchesGame && matchesType;
  });

  // Filter gallery media
  const filteredGalleryMedia = galleryMedia.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = mediaFilter === 'all' || 
      (mediaFilter === 'images' && item.type === 'image') ||
      (mediaFilter === 'videos' && item.type === 'video') ||
      item.category === mediaFilter;
    
    return matchesSearch && matchesFilter;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGame('all');
    setSelectedType('all');
    setMediaFilter('all');
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
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setShowVideoModal(false);
  };

  const openMediaModal = (mediaItem) => {
    setSelectedMedia(mediaItem);
    setShowMediaModal(true);
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
    setShowMediaModal(false);
  };

  const getGameIcon = (game) => {
    const gameData = games.find(g => g.id === game?.toLowerCase());
    return gameData?.icon || '🎮';
  };

  // Extract YouTube video ID from various URL formats
  const extractYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // If it's already just a video ID, return it
    if (url.length === 11 && !url.includes('/') && !url.includes('?')) {
      return url;
    }
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
      /m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Get proper YouTube embed URL
  const getYouTubeEmbedUrl = (video) => {
    const videoId = video.youtubeId || extractYouTubeVideoId(video.videoId || video.url || video.youtubeUrl);
    if (!videoId) {
      console.error('Could not extract video ID from:', video);
      return null;
    }
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-white/60 mt-4">Loading videos and gallery...</p>
        </div>
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
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Videos & Gallery</span>
            </h1>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              Watch tournament highlights, epic moments, and explore our gaming gallery
            </p>
          </div>
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
                placeholder="Search videos and media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-300"
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
                className="mt-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Game Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Game (Videos)</label>
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
                          <span className="font-medium text-sm">{game.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Type Filter */}
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

                  {/* Media Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Media Type</label>
                    <div className="space-y-2">
                      {mediaTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setMediaFilter(type.id)}
                          className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                            mediaFilter === type.id
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

        {/* Tournament Videos Section */}
        {filteredVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Tournament Videos</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
            </div>

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredVideos.map((video, index) => (
                <motion.div
                  key={video._id || video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className={viewMode === 'grid' 
                    ? "bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:bg-white/10 transition-all duration-300"
                    : "bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:bg-white/10 transition-all duration-300 flex items-center gap-4 p-4"
                  }
                  onClick={() => openVideoModal(video)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-gray-800 overflow-hidden">
                        <img
                          src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
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
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        )}

                        {/* Game Badge */}
                        {video.game && (
                          <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                            <span>{getGameIcon(video.game)}</span>
                            <span className="capitalize">{video.game}</span>
                          </div>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="p-4">
                        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors duration-300">
                          {video.title}
                        </h3>
                        
                        {video.description && (
                          <p className="text-white/60 text-sm mb-3 line-clamp-2">
                            {video.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-white/50">
                          <div className="flex items-center space-x-4">
                            {video.views && (
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{formatViews(video.views)} views</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(video.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/128x80/1a1a1a/ffffff?text=Video';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1 line-clamp-1">{video.title}</h3>
                        {video.description && (
                          <p className="text-white/60 text-sm mb-2 line-clamp-1">{video.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          {video.game && (
                            <span className="flex items-center gap-1">
                              <span>{getGameIcon(video.game)}</span>
                              <span className="capitalize">{video.game}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(video.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Gallery Section */}
        {filteredGalleryMedia.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Media Gallery</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
            </div>

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {filteredGalleryMedia.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className={viewMode === 'grid' 
                    ? "bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:bg-white/10 transition-all duration-300"
                    : "bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:bg-white/10 transition-all duration-300 flex items-center gap-4 p-4"
                  }
                  onClick={() => openMediaModal(item)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="relative overflow-hidden">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Video className="w-12 h-12 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            {item.type === 'image' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                            {item.type}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-2 line-clamp-2">{item.title}</h3>
                        {item.description && (
                          <p className="text-white/60 text-sm mb-3 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                          </span>
                          <span className="capitalize bg-white/10 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80x80/1a1a1a/ffffff?text=Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Video className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                        {item.description && (
                          <p className="text-white/60 text-sm mb-2 line-clamp-1">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            {item.type === 'image' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                            {item.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                          </span>
                          <span className="capitalize bg-white/10 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Content Message */}
        {filteredVideos.length === 0 && filteredGalleryMedia.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Content Found</h3>
              <p className="text-white/60 mb-6">
                {searchQuery ? 'No videos or media match your search criteria.' : 'No content available at the moment.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-300"
                >
                  Clear Search
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Video Modal */}
        <AnimatePresence>
          {showVideoModal && selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
              onClick={closeVideoModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-gray-900 rounded-xl w-full max-w-[95vw] md:max-w-6xl max-h-[90vh] overflow-y-auto md:overflow-hidden flex flex-col relative shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full shrink-0">
                  {/* Video Player */}
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(selectedVideo)}
                      title={selectedVideo.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={closeVideoModal}
                    className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-50 backdrop-blur-md border border-white/10"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
                
                {/* Video Info */}
                <div className="p-4 md:p-6 overflow-y-auto">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">{selectedVideo.title}</h2>
                  {selectedVideo.description && (
                    <p className="text-white/70 mb-4 text-sm md:text-base">{selectedVideo.description}</p>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-white/60">
                      {selectedVideo.game && (
                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                          <span>{getGameIcon(selectedVideo.game)}</span>
                          <span className="capitalize">{selectedVideo.game}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedVideo.createdAt)}
                      </span>
                      {selectedVideo.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatViews(selectedVideo.views)} views
                        </span>
                      )}
                    </div>
                    {selectedVideo.youtubeUrl && (
                      <a
                        href={selectedVideo.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 w-full md:w-auto"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Watch on YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Modal */}
        <AnimatePresence>
          {showMediaModal && selectedMedia && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
              onClick={closeMediaModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-gray-900 rounded-xl w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto md:overflow-hidden flex flex-col relative shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full bg-black flex items-center justify-center min-h-[200px]">
                  {selectedMedia.type === 'image' ? (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.title}
                      className="w-full max-h-[50vh] md:max-h-[60vh] object-contain"
                    />
                  ) : (
                    <video
                      src={selectedMedia.url}
                      controls
                      className="w-full max-h-[50vh] md:max-h-[60vh]"
                    />
                  )}
                  <button
                    onClick={closeMediaModal}
                    className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-50 backdrop-blur-md border border-white/10"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
                <div className="p-4 md:p-6 overflow-y-auto">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">{selectedMedia.title}</h2>
                  {selectedMedia.description && (
                    <p className="text-white/70 mb-4 text-sm md:text-base">{selectedMedia.description}</p>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-white/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedMedia.createdAt)}
                      </span>
                      <span className="capitalize bg-white/10 px-3 py-1 rounded-full text-xs md:text-sm">
                        {selectedMedia.category}
                      </span>
                    </div>
                    <a
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 w-full md:w-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
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

export default MediaGallery;