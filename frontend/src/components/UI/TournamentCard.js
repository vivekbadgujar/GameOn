import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Clock, 
  Target,
  Play,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';

const TournamentCard = ({ tournament, isAuthenticated, onRequireAuth }) => {
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGameIcon = (game) => {
    const gameIcons = {
      'bgmi': '🔫',
      'valorant': '⚡',
      'chess': '♟️',
      'freefire': '🔥',
      'codm': '💥',
      'cod mobile': '💥'
    };
    return gameIcons[game?.toLowerCase()] || '🎮';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="tournament-card group"
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}`}>
          {getStatusIcon(tournament.status)}
          <span className="capitalize">{tournament.status || 'Unknown'}</span>
        </div>
      </div>

      {/* Tournament Image/Game Icon */}
      <div className="relative h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-t-2xl overflow-hidden">
        {tournament.poster || tournament.posterUrl || tournament.image ? (
          <>
            <img 
              src={tournament.poster || tournament.posterUrl || tournament.image} 
              alt={tournament.title || tournament.name || 'Tournament'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 bg-black/30" />
            {/* Fallback content - hidden by default */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
              <div className="text-6xl opacity-80">
                {getGameIcon(tournament.game)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-80">
                {getGameIcon(tournament.game)}
              </div>
            </div>
          </>
        )}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white text-sm font-semibold">
              {tournament.game || 'Unknown Game'}
            </span>
          </div>
        </div>
      </div>

      {/* Tournament Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors duration-300">
          {tournament.title || tournament.name || 'Unnamed Tournament'}
        </h3>
        
        <p className="text-white/60 text-sm mb-4 line-clamp-2">
          {tournament.description || 'No description available'}
        </p>

        {/* Tournament Stats */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-white/80 text-sm">Prize Pool</span>
            </div>
            <span className="text-green-400 font-bold">
              ₹{(tournament.prizePool || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
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
              ₹{(tournament.entryFee || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
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
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        {isAuthenticated ? (
          <Link
            to={`/tournament/${tournament._id}`}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            {tournament.status === 'live' || tournament.status === 'ongoing' ? (
              <>
                <Play className="w-4 h-4" />
                <span>Join Live</span>
              </>
            ) : tournament.status === 'upcoming' || tournament.status === 'registration' ? (
              <>
                <Trophy className="w-4 h-4" />
                <span>Register Now</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>View Results</span>
              </>
            )}
          </Link>
        ) : (
          <button
            onClick={() => onRequireAuth && onRequireAuth('login')}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Login to Join</span>
          </button>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
    </motion.div>
  );
};

export default TournamentCard;