import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { getLeaderboard } from '../../services/api';

const LeaderboardSlider = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await getLeaderboard('overall', 'month', 10);
      setPlayers(response.players || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Mock data for demo
      setPlayers([
        { _id: '1', username: 'ProGamer123', totalPoints: 2450, rank: 1, avatar: null },
        { _id: '2', username: 'ElitePlayer', totalPoints: 2380, rank: 2, avatar: null },
        { _id: '3', username: 'GameMaster', totalPoints: 2290, rank: 3, avatar: null },
        { _id: '4', username: 'SkillShot', totalPoints: 2150, rank: 4, avatar: null },
        { _id: '5', username: 'Victory', totalPoints: 2080, rank: 5, avatar: null },
        { _id: '6', username: 'Champion', totalPoints: 1950, rank: 6, avatar: null },
        { _id: '7', username: 'Legend', totalPoints: 1890, rank: 7, avatar: null },
        { _id: '8', username: 'Warrior', totalPoints: 1820, rank: 8, avatar: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <Star className="w-5 h-5 text-blue-400" />;
    }
  };

  const getRankBadgeClass = (rank) => {
    switch (rank) {
      case 1:
        return 'rank-1';
      case 2:
        return 'rank-2';
      case 3:
        return 'rank-3';
      default:
        return 'rank-other';
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      {/* Scrollable Container */}
      <div className="overflow-x-auto scrollbar-hide">
        <motion.div 
          className="flex space-x-4 pb-4"
          initial={{ x: -50 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {players.map((player, index) => (
            <motion.div
              key={player._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="leaderboard-item min-w-[280px] relative overflow-hidden"
            >
              {/* Rank Badge */}
              <div className={`rank-badge ${getRankBadgeClass(player.rank)}`}>
                {player.rank <= 3 ? getRankIcon(player.rank) : `#${player.rank}`}
              </div>

              {/* Player Avatar */}
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                {player.avatar ? (
                  <img 
                    src={player.avatar} 
                    alt={player.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {player.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg">
                  {player.username || `Player ${index + 1}`}
                </h4>
                <div className="flex items-center space-x-2 text-white/60">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">
                    {(player.totalPoints || 0).toLocaleString()} points
                  </span>
                </div>
              </div>

              {/* Rank Change Indicator */}
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  #{player.rank}
                </div>
                {player.rankChange && (
                  <div className={`text-xs font-semibold ${
                    player.rankChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {player.rankChange > 0 ? '+' : ''}{player.rankChange}
                  </div>
                )}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* View All Button */}
      <div className="mt-6 text-center">
        <button className="btn-secondary">
          View Full Leaderboard
        </button>
      </div>
    </div>
  );
};

export default LeaderboardSlider;