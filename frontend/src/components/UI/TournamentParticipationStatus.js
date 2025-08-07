import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Edit3,
  Grid3X3
} from 'lucide-react';

/**
 * Comprehensive Tournament Participation Status Component
 * Shows detailed participation status with appropriate actions
 */
const TournamentParticipationStatus = ({
  tournament,
  participationStatus,
  onEditSlot,
  onOpenFullLobby,
  className = ''
}) => {
  if (!participationStatus) {
    return null;
  }

  const { hasJoined, participation, payments, canJoin } = participationStatus;

  // Not joined - show join status
  if (!hasJoined) {
    if (canJoin) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm font-medium">Available to Join</span>
        </div>
      );
    }

    // Check for pending payments
    const pendingPayment = payments?.find(p => p.status === 'pending');
    if (pendingPayment) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm font-medium">Payment Pending</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <XCircle className="w-4 h-4 text-red-400" />
        <span className="text-red-400 text-sm font-medium">Cannot Join</span>
      </div>
    );
  }

  // Joined - show participation status
  const latestPayment = payments?.[0];
  const paymentStatus = latestPayment?.status || 'pending';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`space-y-3 ${className}`}
    >
      {/* Main Status */}
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-green-400 text-sm font-medium">Joined Tournament</span>
        {participation?.slotNumber && (
          <span className="text-white/60 text-xs">
            (Slot #{participation.slotNumber})
          </span>
        )}
      </div>

      {/* Payment Status */}
      <div className="flex items-center space-x-2">
        {paymentStatus === 'completed' ? (
          <>
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-xs">Payment Confirmed</span>
          </>
        ) : paymentStatus === 'pending' ? (
          <>
            <Clock className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 text-xs">Payment Pending</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-red-400 text-xs">Payment Required</span>
          </>
        )}
      </div>

      {/* Slot Edit Actions - Only show if payment is completed and tournament is active */}
      {paymentStatus === 'completed' && 
       (tournament.status === 'upcoming' || tournament.status === 'live') && (
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEditSlot}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-medium transition-all duration-200"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Slot</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenFullLobby}
            className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-xs font-medium transition-all duration-200"
          >
            <Grid3X3 className="w-3 h-3" />
            <span>Room Lobby</span>
          </motion.button>
        </div>
      )}

      {/* Slot Locked Warning */}
      {tournament.status === 'live' && (
        <div className="flex items-center space-x-2 text-yellow-400">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-xs">Slots may be locked during live tournament</span>
        </div>
      )}
    </motion.div>
  );
};

export default TournamentParticipationStatus;