import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Image, 
  Video, 
  Filter, 
  Grid, 
  List,
  Search,
  Download,
  Eye,
  Calendar,
  Tag
} from 'lucide-react';
import { getPublicMedia } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Gallery = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [filter]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        if (filter === 'images') params.type = 'image';
        else if (filter === 'videos') params.type = 'video';
        else params.category = filter;
      }
      
      const response = await getPublicMedia(params);
      if (response.success) {
        setMedia(response.media);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openModal = (mediaItem) => {
    setSelectedMedia(mediaItem);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedMedia(null);
    setShowModal(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Media Gallery</span>
            </h1>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              Explore our collection of tournament highlights, promotional content, and gaming moments
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-white/60" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">All Media</option>
                  <option value="images">Images</option>
                  <option value="videos">Videos</option>
                  <option value="tournament">Tournaments</option>
                  <option value="promotional">Promotional</option>
                  <option value="branding">Branding</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Media Grid/List */}
        {filteredMedia.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredMedia.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className={
                  viewMode === 'grid'
                    ? 'glass-card-hover group cursor-pointer'
                    : 'glass-card-hover group cursor-pointer flex items-center gap-4 p-4'
                }
                onClick={() => openModal(item)}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="relative overflow-hidden rounded-t-xl">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="glass-card p-8">
              <Image className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Media Found</h3>
              <p className="text-white/60">
                {searchTerm ? 'No media matches your search criteria.' : 'No media available at the moment.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Media Modal */}
        {showModal && selectedMedia && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="relative">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.title}
                    className="w-full max-h-[60vh] object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="w-full max-h-[60vh]"
                  />
                )}
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedMedia.title}</h2>
                {selectedMedia.description && (
                  <p className="text-white/70 mb-4">{selectedMedia.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedMedia.createdAt)}
                    </span>
                    <span className="capitalize bg-white/10 px-3 py-1 rounded-full">
                      {selectedMedia.category}
                    </span>
                  </div>
                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-white/60" />
                      {selectedMedia.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-white/10 text-white/80 px-2 py-1 rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;