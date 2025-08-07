import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Clock, 
  Target,
  Play,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useTournamentParticipation } from '../../hooks/useTournamentParticipation';

const SimpleTournamentCard = ({ tournament, isAuthenticated, onRequireAuth }) => {
  // Use the participation hook to check if user has joined
  const {
    hasJoined,
    paymentStatus,
    canJoin
  } = useTournamentParticipation(tournament?._id);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'ongoing':
        return 'bg-red-500 text-white animate-pulse';
      case 'upcoming':
      case 'registration':
        return 'bg-yellow-500 text-black';
      case 'completed':
      case 'finished':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'ongoing':
        return <Play className="w-3 h-3" />;
      case 'upcoming':
      case 'registration':
        return <Clock className="w-3 h-3" />;
      case 'completed':
      case 'finished':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'TBD';
    }
  };

  const handleJoinClick = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    // Navigate to tournament details for joining
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card overflow-hidden group cursor-pointer"
    >
      <Link to={`/tournament/${tournament._id}`} className="block">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-2">
                {tournament.title || tournament.name}
              </h3>
              <p className="text-white/60 text-sm capitalize">
                {tournament.game} • {tournament.teamType || tournament.tournamentType || 'Squad'}
              </p>
            </div>
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}`}>
              {getStatusIcon(tournament.status)}
              <span className="capitalize">{tournament.status || 'upcoming'}</span>
            </div>
          </div>

          {/* Prize Pool */}
          <div className="flex items-center justify-center mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <Trophy className="w-6 h-6 text-yellow-400 mr-3" />
            <div className="text-center">
              <p className="text-yellow-400 text-sm font-medium">Prize Pool</p>
              <p className="text-2xl font-bold text-white">
                ₹{(tournament.prizePool || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">Participants</span>
              </div>
              <span className="text-white font-semibold">
                {tournament.participants?.length || 0}/{tournament.maxParticipants || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-white/80 text-sm">Entry Fee</span>
              </div>
              <span className="text-white font-semibold">
                ₹{(tournament.entryFee || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-white/80 text-sm">Start Time</span>
              </div>
              <span className="text-white font-semibold text-sm">
                {formatDate(tournament.startDate || tournament.startTime)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {tournament.maxParticipants && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-white/60 mb-2">
                <span>Registration Progress</span>
                <span>
                  {Math.round(((tournament.participants?.length || 0) / tournament.maxParticipants) * 100)}%
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${((tournament.participants?.length || 0) / tournament.maxParticipants) * 100}%` 
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                />
              </div>
            </div>
          )}

          {/* Join Status */}
          {hasJoined ? (
            <div className="flex items-center justify-center space-x-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">
                {paymentStatus === 'completed' ? 'Joined & Paid' : 'Joined - Payment Pending'}
              </span>
            </div>
          ) : (
            <button
              onClick={handleJoinClick}
              disabled={!canJoin && tournament.status !== 'upcoming'}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                canJoin && tournament.status === 'upcoming'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!isAuthenticated ? (
                <>
                  <Lock className="w-4 h-4 inline mr-2" />
                  Login to Join
                </>
              ) : tournament.status === 'completed' ? (
                'Tournament Completed'
              ) : tournament.status === 'live' ? (
                'Tournament Live'
              ) : !canJoin ? (
                'Tournament Full'
              ) : (
                <>
                  <Play className="w-4 h-4 inline mr-2" />
                  Join Tournament
                </>
              )}
            </button>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default SimpleTournamentCard;