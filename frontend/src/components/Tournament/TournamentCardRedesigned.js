import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Clock, 
  CreditCard,
  Play,
  CheckCircle,
  AlertCircle,
  Target,
  Crown,
  Zap,
  Edit,
  Settings
} from 'lucide-react';
import SlotEditModal from './SlotEditModal';

const TournamentCardRedesigned = ({ 
  tournament, 
  index = 0, 
  userParticipation,
  user,
  showSuccess,
  showError,
  showInfo 
}) => {
  const [slotEditOpen, setSlotEditOpen] = useState(false);
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

  const getGameLogo = (game) => {
    const gameLogos = {
      'bgmi': '🔫',
      'valorant': '⚡',
      'chess': '♟️',
      'freefire': '🔥',
      'codm': '💥',
      'cod mobile': '💥'
    };
    return gameLogos[game?.toLowerCase()] || '🎮';
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

  const getProgressPercentage = () => {
    const current = tournament.participants?.length || tournament.currentParticipants || 0;
    const max = tournament.maxParticipants || 100;
    return Math.min((current / max) * 100, 100);
  };

  const isAlmostFull = () => {
    return getProgressPercentage() >= 80;
  };

  const isFull = () => {
    return getProgressPercentage() >= 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative"
    >
      <Link to={`/tournament/${tournament._id}`}>
        <div className="glass-card p-6 h-full relative overflow-hidden hover:bg-white/10 transition-all duration-300">
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
          
          {/* Header */}
          <div className="relative z-10 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getGameLogo(tournament.game)}</div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                    {tournament.title || tournament.name}
                  </h3>
                  <p className="text-white/60 text-sm capitalize">
                    {tournament.game} • {tournament.teamType || tournament.format || 'Squad'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}`}>
                {getStatusIcon(tournament.status)}
                <span className="capitalize">{tournament.status || 'upcoming'}</span>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-white/60 text-xs">Date & Time</p>
                <p className="text-white font-medium text-sm">
                  {formatDate(tournament.startTime || tournament.scheduledAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-white/60 text-xs">Entry Fee</p>
                <p className="text-green-400 font-bold text-sm">
                  ₹{(tournament.entryFee || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Prize Pool */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white/80 text-sm">Prize Pool</span>
              </div>
              <div className="text-yellow-400 font-bold text-lg">
                ₹{(tournament.prizePool || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Registration Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-white/80 text-sm">Registration</span>
              </div>
              <span className="text-white/60 text-sm">
                {tournament.participants?.length || tournament.currentParticipants || 0}/{tournament.maxParticipants || 100}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                className={`h-2 rounded-full ${
                  isFull() 
                    ? 'bg-red-500' 
                    : isAlmostFull() 
                    ? 'bg-yellow-500' 
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
              />
            </div>
            {isAlmostFull() && !isFull() && (
              <p className="text-yellow-400 text-xs mt-1 flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Filling fast!</span>
              </p>
            )}
            {isFull() && (
              <p className="text-red-400 text-xs mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Tournament full</span>
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            {userParticipation ? (
              <div className="flex space-x-2">
                <div className="flex-1 py-3 px-4 bg-green-500/20 border border-green-500/30 rounded-xl text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-400 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Already Registered</span>
                  </div>
                </div>
                {(tournament.status === 'upcoming' || tournament.status === 'live') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSlotEditOpen(true);
                    }}
                    className="py-3 px-4 bg-blue-500/20 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all duration-300"
                    title="Edit Slot Position"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </button>
                )}
              </div>
            ) : tournament.status === 'completed' ? (
              <div className="w-full py-3 px-4 bg-green-500/20 border border-green-500/30 rounded-xl text-center">
                <div className="flex items-center justify-center space-x-2 text-green-400 font-semibold">
                  <Trophy className="w-4 h-4" />
                  <span>View Results</span>
                </div>
              </div>
            ) : isFull() ? (
              <div className="w-full py-3 px-4 bg-red-500/20 border border-red-500/30 rounded-xl text-center">
                <div className="flex items-center justify-center space-x-2 text-red-400 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Registration Closed</span>
                </div>
              </div>
            ) : (
              <div className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl text-center group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <div className="flex items-center justify-center space-x-2 text-white font-bold">
                  <Target className="w-4 h-4" />
                  <span>Join Tournament</span>
                </div>
              </div>
            )}
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

          {/* Featured Badge */}
          {tournament.featured && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <Crown className="w-3 h-3" />
              <span>Featured</span>
            </div>
          )}
        </div>
      </Link>
      
      {/* Slot Edit Modal */}
      {slotEditOpen && (
        <SlotEditModal
          open={slotEditOpen}
          onClose={() => setSlotEditOpen(false)}
          tournamentId={tournament._id}
          user={user}
          showSuccess={showSuccess}
          showError={showError}
          showInfo={showInfo}
        />
      )}
    </motion.div>
  );
};

export default TournamentCardRedesigned;