import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  Target, 
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Star
} from 'lucide-react';

const TournamentResults = ({ tournament, isVisible = true }) => {
  const [results, setResults] = useState([]);
  const [payoutStatus, setPayoutStatus] = useState('pending');
  const [userResult, setUserResult] = useState(null);

  useEffect(() => {
    if (tournament && tournament.status === 'completed') {
      generateMockResults();
    }
  }, [tournament]);

  const generateMockResults = () => {
    // Generate mock leaderboard data
    const mockResults = [
      {
        rank: 1,
        username: 'ProGamer_2024',
        kills: 15,
        damage: 2847,
        survivalTime: '28:45',
        prize: Math.floor((tournament.prizePool || 1000) * 0.5),
        avatar: '🏆'
      },
      {
        rank: 2,
        username: 'SnipeKing',
        kills: 12,
        damage: 2156,
        survivalTime: '26:32',
        prize: Math.floor((tournament.prizePool || 1000) * 0.3),
        avatar: '🥈'
      },
      {
        rank: 3,
        username: 'RushMaster',
        kills: 10,
        damage: 1923,
        survivalTime: '24:18',
        prize: Math.floor((tournament.prizePool || 1000) * 0.2),
        avatar: '🥉'
      },
      {
        rank: 4,
        username: 'SilentAssassin',
        kills: 8,
        damage: 1654,
        survivalTime: '22:45',
        prize: 0,
        avatar: '🎯'
      },
      {
        rank: 5,
        username: 'BattleRoyale',
        kills: 7,
        damage: 1432,
        survivalTime: '20:12',
        prize: 0,
        avatar: '⚡'
      }
    ];

    setResults(mockResults);
    
    // Set user result (mock)
    setUserResult({
      rank: 8,
      kills: 5,
      damage: 1123,
      survivalTime: '18:34',
      prize: 0
    });

    // Simulate payout processing
    setTimeout(() => {
      setPayoutStatus('completed');
    }, 3000);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Star className="w-6 h-6 text-blue-400" />;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const getPayoutStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'processing':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'pending':
      default:
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    }
  };

  const getPayoutStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'pending':
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!isVisible || !tournament || tournament.status !== 'completed') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Tournament Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Tournament Results</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {tournament.participants?.length || 0}
            </div>
            <div className="text-white/60 text-sm">Total Players</div>
          </div>
          <div className="glass-card p-4 text-center">
            <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">
              ₹{(tournament.prizePool || 0).toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">Prize Pool</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {results.reduce((sum, player) => sum + player.kills, 0)}
            </div>
            <div className="text-white/60 text-sm">Total Kills</div>
          </div>
          <div className="glass-card p-4 text-center">
            <TrendingUp className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {results[0]?.kills || 0}
            </div>
            <div className="text-white/60 text-sm">Highest Kills</div>
          </div>
        </div>
      </div>

      {/* User Performance */}
      {userResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6 bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/20"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeColor(userResult.rank)}`}>
              #{userResult.rank}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Your Performance</h3>
              <p className="text-white/60">Final ranking and stats</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">#{userResult.rank}</div>
              <div className="text-white/60 text-sm">Final Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{userResult.kills}</div>
              <div className="text-white/60 text-sm">Kills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{userResult.damage}</div>
              <div className="text-white/60 text-sm">Damage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {userResult.prize > 0 ? `₹${userResult.prize}` : '₹0'}
              </div>
              <div className="text-white/60 text-sm">Winnings</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Final Leaderboard</h3>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold border ${getPayoutStatusColor(payoutStatus)}`}>
            {getPayoutStatusIcon(payoutStatus)}
            <span>Payout {payoutStatus}</span>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {results.map((player, index) => (
              <motion.div
                key={player.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                  player.rank <= 3 
                    ? 'glass-card bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20' 
                    : 'glass-card hover:bg-white/5'
                }`}
              >
                {/* Rank */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeColor(player.rank)}`}>
                  {player.rank <= 3 ? getRankIcon(player.rank) : `#${player.rank}`}
                </div>

                {/* Player Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{player.avatar}</span>
                    <div>
                      <p className="text-white font-semibold">{player.username}</p>
                      <p className="text-white/60 text-sm">Survival: {player.survivalTime}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center space-x-6 text-center">
                  <div>
                    <div className="text-red-400 font-bold">{player.kills}</div>
                    <div className="text-white/60 text-xs">Kills</div>
                  </div>
                  <div>
                    <div className="text-purple-400 font-bold">{player.damage}</div>
                    <div className="text-white/60 text-xs">Damage</div>
                  </div>
                </div>

                {/* Prize */}
                <div className="text-right min-w-[100px]">
                  {player.prize > 0 ? (
                    <div className="text-green-400 font-bold text-lg">
                      ₹{player.prize.toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-white/40 text-sm">No prize</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Payout Information */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <DollarSign className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Payout Information</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card">
            <span className="text-white/80">Prize Distribution</span>
            <span className="text-green-400 font-semibold">
              ₹{results.reduce((sum, player) => sum + player.prize, 0).toLocaleString()} / ₹{(tournament.prizePool || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 glass-card">
            <span className="text-white/80">Processing Time</span>
            <span className="text-white/60">24-48 hours</span>
          </div>

          <div className="flex items-center justify-between p-4 glass-card">
            <span className="text-white/80">Payment Method</span>
            <span className="text-white/60">Direct to Wallet</span>
          </div>

          {payoutStatus === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">
                  All payouts have been processed successfully!
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentResults;