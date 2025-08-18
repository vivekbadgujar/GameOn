import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FiSearch, FiUserPlus, FiCheck, FiClock, FiX, FiStar,
  FiRefreshCw, FiUsers, FiFilter
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

const AddFriends = ({ onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(new Set());
  const [suggestions, setSuggestions] = useState([]);
  const [filter, setFilter] = useState('all');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/friends/search?query=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users || []);
        } else {
          throw new Error('Search failed');
        }
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Failed to search users');
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      // For now, we'll use the search endpoint with a random query to get suggestions
      // In a real app, you'd have a dedicated suggestions endpoint
      const response = await fetch('/api/friends/search?query=a&limit=6', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users?.filter(user => user.friendshipStatus === 'none') || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSendRequest = async (userId) => {
    setSending(prev => new Set(prev).add(userId));
    
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientId: userId })
      });

      if (response.ok) {
        toast.success('Friend request sent!');
        
        // Update the user's status in search results
        setSearchResults(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, friendshipStatus: 'sent' }
              : user
          )
        );
        
        // Update suggestions
        setSuggestions(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, friendshipStatus: 'sent' }
              : user
          )
        );
        
        onRefresh();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(error.message || 'Failed to send friend request');
    } finally {
      setSending(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getFriendshipStatusButton = (user) => {
    const isProcessing = sending.has(user.id);

    switch (user.friendshipStatus) {
      case 'friends':
        return (
          <button
            disabled
            className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
          >
            <FiCheck className="w-4 h-4" />
            <span>Friends</span>
          </button>
        );
      
      case 'sent':
        return (
          <button
            disabled
            className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
          >
            <FiClock className="w-4 h-4" />
            <span>Sent</span>
          </button>
        );
      
      case 'received':
        return (
          <button
            disabled
            className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
          >
            <FiUsers className="w-4 h-4" />
            <span>Pending</span>
          </button>
        );
      
      case 'blocked':
        return (
          <button
            disabled
            className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
          >
            <FiX className="w-4 h-4" />
            <span>Blocked</span>
          </button>
        );
      
      default:
        return (
          <button
            onClick={() => handleSendRequest(user.id)}
            disabled={isProcessing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FiUserPlus className="w-4 h-4" />
            )}
            <span>Add</span>
          </button>
        );
    }
  };

  const filteredResults = searchResults.filter(user => {
    if (filter === 'available') return user.friendshipStatus === 'none';
    if (filter === 'sent') return user.friendshipStatus === 'sent';
    return true;
  });

  const UserCard = ({ user, index }) => (
    <motion.div
      key={user.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card p-4 hover:bg-white/10 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar || '/default-avatar.png'}
            alt={user.displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-white">
              {user.displayName}
            </h3>
            <p className="text-sm text-gray-400">
              @{user.username}
            </p>
            <div className="flex items-center space-x-4 mt-1 text-sm">
              <div className="flex items-center space-x-1">
                <FiStar className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">Lvl {user.stats.level}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">BGMI:</span>
                <span className="text-white">{user.gameProfile.bgmiName}</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {user.gameProfile.tier}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {getFriendshipStatusButton(user)}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Find Friends</h2>
        
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by username, email, or BGMI name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          />
          {loading && (
            <FiRefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
          )}
        </div>

        {/* Search Filters */}
        {searchResults.length > 0 && (
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({searchResults.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'available' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Available ({searchResults.filter(u => u.friendshipStatus === 'none').length})
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'sent' ? 'bg-yellow-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sent ({searchResults.filter(u => u.friendshipStatus === 'sent').length})
            </button>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery.trim().length >= 2 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Search Results ({filteredResults.length})
          </h3>
          
          {filteredResults.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <FiSearch className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Results Found</h3>
              <p className="text-gray-500">
                Try searching with a different username or email.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((user, index) => (
                <UserCard key={user.id} user={user} index={index} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {searchQuery.trim().length < 2 && suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Suggested Friends
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((user, index) => (
              <UserCard key={user.id} user={user} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchQuery.trim().length < 2 && suggestions.length === 0 && (
        <div className="glass-card p-8 text-center">
          <FiUserPlus className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Find Your Gaming Friends</h3>
          <p className="text-gray-500 mb-4">
            Search for friends by their username, email, or BGMI name to start building your gaming network.
          </p>
          <div className="text-sm text-gray-400">
            <p>💡 <strong>Tips:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Search for at least 2 characters</li>
              <li>Try searching by BGMI in-game name</li>
              <li>Use exact usernames for better results</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFriends;