import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiAward, FiStar, FiZap, FiTarget, FiDollarSign,
  FiHexagon, FiTrendingUp, FiFilter
} from 'react-icons/fi';

const FriendsLeaderboard = ({ leaderboard, currentUser }) => {
  const [activeType, setActiveType] = useState('xp');
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(leaderboard || []);

  const leaderboardTypes = [
    { id: 'xp', label: 'XP Points', icon: FiStar, color: 'text-yellow-400' },
    { id: 'level', label: 'Level', icon: FiTrendingUp, color: 'text-blue-400' },
    { id: 'tournaments', label: 'Tournaments', icon: FiAward, color: 'text-green-400' },
    { id: 'wins', label: 'Wins', icon: FiHexagon, color: 'text-purple-400' },
    { id: 'kills', label: 'Kills', icon: FiTarget, color: 'text-red-400' },
    { id: 'earnings', label: 'Earnings', icon: FiDollarSign, color: 'text-emerald-400' }
  ];

  const timeframes = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' }
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [activeType, timeframe]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/friends/leaderboard?type=${activeType}&timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.leaderboard || []);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FiHexagon className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <FiAward className="w-6 h-6 text-gray-300" />;
      case 3:
        return <FiAward className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        2: 'bg-gradient-to-r from-gray-300 to-gray-500',
        3: 'bg-gradient-to-r from-amber-600 to-amber-800'
      };
      return `${colors[rank]} text-white`;
    }
    return 'bg-gray-600 text-gray-300';
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'xp':
        return `${value.toLocaleString()} XP`;
      case 'level':
        return `Level ${value}`;
      case 'tournaments':
        return `${value} tournaments`;
      case 'wins':
        return `${value} wins`;
      case 'kills':
        return `${value} kills`;
      case 'earnings':
        return `₹${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  const currentType = leaderboardTypes.find(type => type.id === activeType);

  if (data.length === 0 && !loading) {
    return (
      <div className="glass-card p-8 text-center">
        <FiAward className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Leaderboard Data</h3>
        <p className="text-gray-500">
          Add some friends to see the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          {/* Type Selector */}
          <div className="flex flex-wrap gap-2">
            {leaderboardTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeType === type.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <type.icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            {timeframes.map((tf) => (
              <option key={tf.id} value={tf.id} className="bg-gray-800">
                {tf.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Header */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <currentType.icon className={`w-6 h-6 ${currentType.color}`} />
          <h2 className="text-xl font-semibold text-white">
            {currentType.label} Leaderboard
          </h2>
          <span className="text-sm text-gray-400">
            ({timeframes.find(tf => tf.id === timeframe)?.label})
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((entry, index) => (
              <motion.div
                key={entry.user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  entry.isCurrentUser
                    ? 'bg-blue-500/20 border border-blue-500/30 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadge(entry.rank)}`}>
                    {entry.rank <= 3 ? (
                      getRankIcon(entry.rank)
                    ) : (
                      <span className="font-bold">#{entry.rank}</span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={entry.user.avatar || '/default-avatar.png'}
                      alt={entry.user.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">
                          {entry.user.displayName}
                        </h3>
                        {entry.isCurrentUser && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        @{entry.user.username}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs">
                        <span className="text-gray-500">
                          BGMI: {entry.user.gameProfile.bgmiName}
                        </span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {entry.user.gameProfile.tier}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Value and Badges */}
                <div className="text-right">
                  <div className={`text-lg font-bold ${currentType.color}`}>
                    {formatValue(entry.value, activeType)}
                  </div>
                  
                  {/* User Badges */}
                  {entry.user.badges && entry.user.badges.length > 0 && (
                    <div className="flex justify-end space-x-1 mt-2">
                      {entry.user.badges.slice(0, 3).map((badge, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                          title={badge.name}
                        >
                          <span className="text-xs">🏆</span>
                        </div>
                      ))}
                      {entry.user.badges.length > 3 && (
                        <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-300">+{entry.user.badges.length - 3}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional Stats */}
                  <div className="text-xs text-gray-500 mt-1">
                    Level {entry.user.stats.level}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Current User Position (if not in top results) */}
      {currentUser && !data.some(entry => entry.isCurrentUser) && (
        <div className="glass-card p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Your Position</h3>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">#?</span>
                </div>
                <div>
                  <div className="text-white font-semibold">{currentUser.displayName}</div>
                  <div className="text-sm text-gray-400">@{currentUser.username}</div>
                </div>
              </div>
              <div className="text-blue-400 font-bold">
                {formatValue(currentUser.stats[activeType] || 0, activeType)}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Keep playing to climb the leaderboard!
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard Info */}
      <div className="glass-card p-4">
        <div className="text-center text-sm text-gray-400">
          <p>🏆 Compete with your friends and climb the rankings!</p>
          <p className="mt-1">Leaderboard updates every hour</p>
        </div>
      </div>
    </div>
  );
};

export default FriendsLeaderboard;