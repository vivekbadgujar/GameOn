import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiHeart, FiMessageCircle, FiShare2, FiMoreHorizontal,
  FiAward, FiStar, FiTarget, FiUsers, FiZap,
  FiRefreshCw, FiFilter, FiTrendingUp
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AchievementsFeed = ({ achievements, onRefresh }) => {
  const [feed, setFeed] = useState(achievements || []);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showComments, setShowComments] = useState(new Set());
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    setFeed(achievements || []);
  }, [achievements]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/achievements/feed', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFeed(data.feed || []);
      }
    } catch (error) {
      console.error('Error loading achievements feed:', error);
      toast.error('Failed to load achievements feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (achievementId) => {
    try {
      const achievement = feed.find(a => a.id === achievementId);
      const isLiked = achievement.isLiked;

      // Optimistic update
      setFeed(prev => prev.map(a => 
        a.id === achievementId 
          ? { 
              ...a, 
              isLiked: !isLiked,
              likeCount: isLiked ? a.likeCount - 1 : a.likeCount + 1
            }
          : a
      ));

      const response = await fetch(`/api/achievements/${achievementId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setFeed(prev => prev.map(a => 
          a.id === achievementId 
            ? { 
                ...a, 
                isLiked: isLiked,
                likeCount: isLiked ? a.likeCount + 1 : a.likeCount - 1
              }
            : a
        ));
        throw new Error('Failed to update like');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleComment = async (achievementId) => {
    const comment = commentText[achievementId]?.trim();
    if (!comment) return;

    try {
      const response = await fetch(`/api/achievements/${achievementId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update feed with new comment
        setFeed(prev => prev.map(a => 
          a.id === achievementId 
            ? { 
                ...a, 
                comments: [...a.comments, data.comment],
                commentCount: data.commentCount
              }
            : a
        ));

        // Clear comment text
        setCommentText(prev => ({ ...prev, [achievementId]: '' }));
        toast.success('Comment added!');
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async (achievement) => {
    try {
      const response = await fetch(`/api/achievements/${achievement.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ platform: 'whatsapp' })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update share count
        setFeed(prev => prev.map(a => 
          a.id === achievement.id 
            ? { ...a, shareCount: data.shareCount }
            : a
        ));

        // Open share link
        if (data.shareLink) {
          window.open(data.shareLink, '_blank');
        }
      } else {
        throw new Error('Failed to share achievement');
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      toast.error('Failed to share achievement');
    }
  };

  const getAchievementIcon = (type, category) => {
    switch (category) {
      case 'combat':
        return <FiTarget className="w-5 h-5 text-red-400" />;
      case 'social':
        return <FiUsers className="w-5 h-5 text-blue-400" />;
      case 'progression':
        return <FiTrendingUp className="w-5 h-5 text-green-400" />;
      case 'tournament':
        return <FiAward className="w-5 h-5 text-yellow-400" />;
      default:
        return <FiStar className="w-5 h-5 text-purple-400" />;
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-400 border-gray-400';
      case 'rare':
        return 'text-blue-400 border-blue-400';
      case 'epic':
        return 'text-purple-400 border-purple-400';
      case 'legendary':
        return 'text-yellow-400 border-yellow-400';
      case 'mythic':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const filteredFeed = feed.filter(achievement => {
    if (filter === 'all') return true;
    return achievement.category === filter;
  });

  const categories = [
    { id: 'all', label: 'All', icon: FiStar },
    { id: 'combat', label: 'Combat', icon: FiTarget },
    { id: 'social', label: 'Social', icon: FiUsers },
    { id: 'progression', label: 'Progress', icon: FiTrendingUp },
    { id: 'tournament', label: 'Tournament', icon: FiAward }
  ];

  if (feed.length === 0 && !loading) {
    return (
      <div className="glass-card p-8 text-center">
        <FiStar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Achievements Yet</h3>
        <p className="text-gray-500 mb-4">
          Your friends' achievements will appear here when they unlock them.
        </p>
        <button
          onClick={loadFeed}
          className="btn-primary"
        >
          Refresh Feed
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilter(category.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  filter === category.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={loadFeed}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Achievements Feed */}
      <div className="space-y-4">
        {filteredFeed.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6"
          >
            {/* Achievement Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={achievement.user.avatar || '/default-avatar.png'}
                  alt={achievement.user.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-white">
                      {achievement.user.displayName}
                    </h3>
                    <span className="text-sm text-gray-400">
                      earned an achievement
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(achievement.earnedAt).toLocaleDateString()} • 
                    {new Date(achievement.earnedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <button className="p-1 text-gray-400 hover:text-white">
                <FiMoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Achievement Content */}
            <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full border-2 ${getRarityColor(achievement.rarity)} flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5`}>
                  {getAchievementIcon(achievement.type, achievement.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-lg font-semibold text-white">
                      {achievement.title}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityColor(achievement.rarity)} bg-current/20`}>
                      {achievement.rarity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    {achievement.description}
                  </p>
                  
                  {/* Achievement Value */}
                  {achievement.value && (
                    <div className="text-sm text-blue-400">
                      Value: {achievement.value.toLocaleString()}
                    </div>
                  )}
                  
                  {/* Rewards */}
                  {(achievement.rewards.xp > 0 || achievement.rewards.coins > 0) && (
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      {achievement.rewards.xp > 0 && (
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <FiStar className="w-4 h-4" />
                          <span>+{achievement.rewards.xp} XP</span>
                        </div>
                      )}
                      {achievement.rewards.coins > 0 && (
                        <div className="flex items-center space-x-1 text-green-400">
                          <span>💰</span>
                          <span>+{achievement.rewards.coins} coins</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => handleLike(achievement.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    achievement.isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <FiHeart className={`w-5 h-5 ${achievement.isLiked ? 'fill-current' : ''}`} />
                  <span>{achievement.likeCount}</span>
                </button>
                
                <button
                  onClick={() => setShowComments(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(achievement.id)) {
                      newSet.delete(achievement.id);
                    } else {
                      newSet.add(achievement.id);
                    }
                    return newSet;
                  })}
                  className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <FiMessageCircle className="w-5 h-5" />
                  <span>{achievement.commentCount}</span>
                </button>
                
                <button
                  onClick={() => handleShare(achievement)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors"
                >
                  <FiShare2 className="w-5 h-5" />
                  <span>{achievement.shareCount}</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments.has(achievement.id) && (
              <div className="border-t border-white/10 pt-4">
                {/* Existing Comments */}
                {achievement.comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {achievement.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <img
                          src={comment.user.avatar || '/default-avatar.png'}
                          alt={comment.user.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-white text-sm">
                                {comment.user.displayName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{comment.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText[achievement.id] || ''}
                    onChange={(e) => setCommentText(prev => ({
                      ...prev,
                      [achievement.id]: e.target.value
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleComment(achievement.id);
                      }
                    }}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
                  />
                  <button
                    onClick={() => handleComment(achievement.id)}
                    disabled={!commentText[achievement.id]?.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {filteredFeed.length > 0 && (
        <div className="text-center">
          <button
            onClick={loadFeed}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Load More Achievements
          </button>
        </div>
      )}
    </div>
  );
};

export default AchievementsFeed;