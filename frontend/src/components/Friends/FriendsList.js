import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMessageCircle, FiZap, FiMoreHorizontal, FiEye, FiEyeOff,
  FiClock, FiCircle, FiStar, FiAward, FiTarget, FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const FriendsList = ({ friends, onChallenge, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const getOnlineStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <FiCircle className="w-3 h-3 text-green-400 fill-current" />;
      case 'recently_played':
        return <FiClock className="w-3 h-3 text-yellow-400" />;
      default:
        return <FiEyeOff className="w-3 h-3 text-gray-500" />;
    }
  };

  const getOnlineStatusText = (status, lastSeen) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'recently_played':
        return 'Recently played';
      case 'hidden':
        return 'Status hidden';
      default:
        if (lastSeen) {
          const diff = Date.now() - new Date(lastSeen).getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (days > 0) return `${days}d ago`;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          if (hours > 0) return `${hours}h ago`;
          return 'Recently';
        }
        return 'Offline';
    }
  };

  const filteredFriends = friends.filter(friendship => {
    if (filter === 'online') return friendship.friend.onlineStatus === 'online';
    if (filter === 'recent') return friendship.friend.onlineStatus === 'recently_played';
    return true;
  });

  const sortedFriends = [...filteredFriends].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.friend.displayName.localeCompare(b.friend.displayName);
      case 'level':
        return b.friend.stats.level - a.friend.stats.level;
      case 'recent':
        return new Date(b.interactions.lastInteraction || b.friendsSince) - 
               new Date(a.interactions.lastInteraction || a.friendsSince);
      default:
        return 0;
    }
  });

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast.success('Friend removed');
        onRefresh();
      } else {
        throw new Error('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  const handleMessage = (friend) => {
    // TODO: Implement messaging system
    toast.info('Messaging feature coming soon!');
  };

  if (friends.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <FiEye className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Friends Yet</h3>
        <p className="text-gray-500 mb-4">
          Start building your gaming network by adding friends!
        </p>
        <button className="btn-primary">
          Add Your First Friend
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({friends.length})
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'online' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Online ({friends.filter(f => f.friend.onlineStatus === 'online').length})
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'recent' ? 'bg-yellow-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Recent ({friends.filter(f => f.friend.onlineStatus === 'recently_played').length})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white"
          >
            <option value="recent">Recent Activity</option>
            <option value="name">Name</option>
            <option value="level">Level</option>
          </select>
        </div>
      </div>

      {/* Friends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFriends.map((friendship, index) => (
          <motion.div
            key={friendship.friendshipId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 hover:bg-white/10 transition-all duration-300"
          >
            {/* Friend Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={friendship.friend.avatar || '/default-avatar.png'}
                    alt={friendship.friend.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getOnlineStatusIcon(friendship.friend.onlineStatus)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {friendship.friend.displayName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    @{friendship.friend.username}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <button className="p-1 text-gray-400 hover:text-white">
                  <FiMoreHorizontal className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg py-2 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => handleRemoveFriend(friendship.friend.id)}
                    className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Game Profile */}
            <div className="mb-3">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">BGMI:</span>
                <span className="text-white">{friendship.friend.gameProfile.bgmiName}</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {friendship.friend.gameProfile.tier}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <div className="flex items-center space-x-1">
                  <FiStar className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-400">Lvl {friendship.friend.stats.level}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiAward className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">{friendship.friend.stats.xpPoints} XP</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm">
                {getOnlineStatusIcon(friendship.friend.onlineStatus)}
                <span className="text-gray-400">
                  {getOnlineStatusText(friendship.friend.onlineStatus, friendship.friend.lastSeen)}
                </span>
              </div>
            </div>

            {/* Badges */}
            {friendship.friend.badges && friendship.friend.badges.length > 0 && (
              <div className="flex space-x-1 mb-4">
                {friendship.friend.badges.slice(0, 3).map((badge, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                    title={badge.name}
                  >
                    <span className="text-xs">🏆</span>
                  </div>
                ))}
                {friendship.friend.badges.length > 3 && (
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-300">+{friendship.friend.badges.length - 3}</span>
                  </div>
                )}
              </div>
            )}

            {/* Interaction Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
              <div className="text-center">
                <div className="text-blue-400 font-semibold">
                  {friendship.interactions.gamesPlayedTogether}
                </div>
                <div className="text-gray-500">Games</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-semibold">
                  {friendship.interactions.messagesExchanged}
                </div>
                <div className="text-gray-500">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-semibold">
                  {friendship.interactions.challengesSent + friendship.interactions.challengesReceived}
                </div>
                <div className="text-gray-500">Challenges</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => onChallenge(friendship.friend)}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center justify-center space-x-1"
              >
                <FiZap className="w-4 h-4" />
                <span>Challenge</span>
              </button>
              <button
                onClick={() => handleMessage(friendship.friend)}
                className="bg-white/10 text-white py-2 px-3 rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                <FiMessageCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Friends Since */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-500">
                Friends since {new Date(friendship.friendsSince).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FriendsList;