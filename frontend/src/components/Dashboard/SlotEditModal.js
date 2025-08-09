import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Timer, 
  Hand, 
  AlertTriangle, 
  Lock, 
  Info,
  Users,
  Zap,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';

const SlotEditModal = ({ 
  open, 
  onClose, 
  tournamentId, 
  user,
  showSuccess,
  showError,
  showInfo 
}) => {
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [playerSlot, setPlayerSlot] = useState(null);
  const [timeToStart, setTimeToStart] = useState(0);
  const [timeToLock, setTimeToLock] = useState(0);
  const [slotChangeLoading, setSlotChangeLoading] = useState(false);

  useEffect(() => {
    if (!open || !tournamentId) return;

    // Join tournament room for real-time updates
    if (socket) {
      socket.emit('join_tournament', tournamentId);
      
      // Listen for real-time updates
      socket.on('slotChanged', (data) => {
        if (data.tournamentId === tournamentId) {
          // Update room data with new slot information
          setRoomData(prevData => ({
            ...prevData,
            teams: data.teams || prevData?.teams
          }));
          if (data.playerId === user._id) {
            setPlayerSlot(data.playerSlot);
          }
          showInfo(`Player moved to Team ${data.toTeam}, Slot ${data.toSlot}`);
        }
      });

      socket.on('playerAssigned', (data) => {
        if (data.tournamentId === tournamentId) {
          fetchRoomData();
          showInfo(`${data.username} joined Team ${data.teamNumber}`);
        }
      });

      socket.on('slotsLocked', (data) => {
        if (data.tournamentId === tournamentId) {
          fetchRoomData();
          showInfo('🔒 Slots are now locked! No more position changes allowed.');
        }
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_tournament', tournamentId);
      }
    };
  }, [open, tournamentId, socket]);

  useEffect(() => {
    if (open && tournamentId) {
      fetchRoomData();
    }
  }, [open, tournamentId]);

  useEffect(() => {
    if (!tournament) return;

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(tournament.startDate);
      const lockTime = new Date(startTime.getTime() - 10 * 60 * 1000); // Lock 10 minutes before start
      setTimeToLock(lockTime.getTime() - now.getTime());
      setTimeToStart(startTime.getTime() - now.getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Fetching room data for tournament:', tournamentId);
      console.log('Token available:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');
      
      if (!token) {
        showError('Authentication required. Please log in.');
        onClose();
        return;
      }

      const url = `http://localhost:5000/api/tournaments/${tournamentId}/room-layout`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        
        // Try to get the response text to see what's actually being returned
        const responseText = await response.text();
        console.error('Response text:', responseText);
        
        if (response.status === 403) {
          showError('You need to join this tournament first to access the room layout');
          onClose();
          return;
        } else if (response.status === 404) {
          showError('Tournament room not found');
          onClose();
          return;
        } else if (response.status === 401) {
          showError('Please log in to access the room layout');
          onClose();
          return;
        }
        
        // Check if the response is HTML (which would indicate a routing issue)
        if (responseText.includes('<!DOCTYPE')) {
          showError('API endpoint not found. Please check if the backend server is running correctly.');
          console.error('Received HTML instead of JSON - likely a routing issue');
          onClose();
          return;
        }
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      }

      const responseText = await response.text();
      console.log('Success response text:', responseText);
      
      const data = JSON.parse(responseText);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch room data');
      }
      
      // Handle new API response structure
      const { tournament, teams, userSlot, settings } = data.data;
      
      setTournament(tournament);
      setRoomData({
        teams: teams || [],
        tournament: tournament,
        userSlot: userSlot,
        settings: settings
      });
      setPlayerSlot(userSlot);
      
      console.log('Room data loaded:', {
        tournament: tournament?.title,
        teamsCount: teams?.length || 0,
        userSlot: userSlot ? `Team ${userSlot.teamNumber}, Slot ${userSlot.slotNumber}` : 'none',
        canEditSlots: settings?.canEditSlots
      });
      
    } catch (error) {
      console.error('Error fetching room data:', error);
      showError(error.message || 'Failed to load room data');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotMove = async (toTeam, toSlot) => {
    if (!canEditSlots) {
      showError('Slot changes are not allowed for this tournament');
      return;
    }

    // Check if the slot is already taken
    const targetTeam = roomData?.teams?.find(t => t.teamNumber === toTeam);
    const targetSlot = targetTeam?.slots?.find(s => s.slotNumber === toSlot);
    
    if (targetSlot?.player) {
      showError('This slot is already taken by another player');
      return;
    }

    try {
      setSlotChangeLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/move-slot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ toTeam, toSlot })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.code === 'SLOT_TEMPORARILY_LOCKED') {
          showError('⏳ Another player is moving to this slot. Please try again in a moment.');
        } else if (response.status === 403) {
          showError('🔒 Slot changes are not allowed or slots are locked');
        } else if (response.status === 400) {
          showError(errorData.error || 'Invalid slot selection');
        } else {
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to move slot');
      }
      
      // Update player slot with new position
      setPlayerSlot({
        teamNumber: toTeam,
        slotNumber: toSlot
      });
      
      // Refresh room data
      fetchRoomData();
      
      showSuccess(`✅ Moved to Team ${toTeam}, Slot ${toSlot} successfully!`);
      
      console.log('Slot move successful:', {
        toTeam,
        toSlot,
        newPosition: data.data.newPosition
      });
      
    } catch (error) {
      console.error('Error moving slot:', error);
      showError(error.message || 'Failed to change position');
    } finally {
      setSlotChangeLoading(false);
    }
  };

  const handleSlotClick = (teamNumber, slotNumber) => {
    if (!canEditSlots) return;

    const team = roomData?.teams?.find(t => t.teamNumber === teamNumber);
    const slot = team?.slots?.find(s => s.slotNumber === slotNumber);
    
    if (!slot?.player) {
      handleSlotMove(teamNumber, slotNumber);
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Started';
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const canEditSlots = roomData?.settings?.canEditSlots && 
    tournament?.status !== 'completed' &&
    tournament?.participants?.some(p => p.user._id === user._id);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" 
          style={{ 
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100vw'
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl overflow-hidden"
            style={{
              background: 'rgba(17, 24, 39, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              maxHeight: 'calc(100vh - 4rem)',
              margin: '0 auto',
              position: 'relative'
            }}
          >
            {/* Loading Overlay for Slot Changes */}
            {slotChangeLoading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="glass-card p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                  <p className="text-white font-medium">Moving to new slot...</p>
                </div>
              </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span>Edit Slot Position</span>
                </h2>
                {tournament && (
                  <p className="text-white/60 mt-1">{tournament.title}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/60 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                </div>
              ) : !tournament || !roomData ? (
                <div className="text-center py-20">
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Room Data</h3>
                  <p className="text-white/60">Please try again later</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Tournament Info */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card p-3 bg-blue-500/10 border-blue-500/20"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Timer className="w-4 h-4 text-blue-400" />
                        <h3 className="text-base font-semibold text-white">Tournament Status</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Starts in:</span>
                          <span className="text-blue-400 font-mono">{formatTimeRemaining(timeToStart)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Status:</span>
                          <span className="text-green-400 capitalize">{tournament.status}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Room Status */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card p-3 bg-green-500/10 border-green-500/20"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-green-400" />
                        <h3 className="text-base font-semibold text-white">Room Status</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Players:</span>
                          <span className="text-green-400 font-mono">
                            {tournament.currentParticipants}/{tournament.maxParticipants}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-green-400 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(tournament.currentParticipants / tournament.maxParticipants) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Instructions */}
                  {canEditSlots && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-3 bg-yellow-500/10 border-yellow-500/20"
                    >
                      <div className="flex items-start space-x-2">
                        <Hand className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <div>
                          <h3 className="text-base font-semibold text-yellow-400 mb-1">How to change your position:</h3>
                          <p className="text-white/80 mb-1 text-sm">
                            Click on any empty slot to move there. Your current position will be highlighted in blue.
                          </p>
                          {timeToLock > 0 && timeToLock < 600000 && (
                            <div className="flex items-center space-x-2 text-orange-400 font-semibold">
                              <AlertTriangle className="w-4 h-4" />
                              <span>⚠️ Slots will lock in {formatTimeRemaining(timeToLock)}!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!canEditSlots && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-3 bg-red-500/10 border-red-500/20"
                    >
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-semibold text-sm">Slot editing is currently disabled or locked.</span>
                      </div>
                    </motion.div>
                  )}

                  {/* BGMI Room Layout */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <BGMIRoomLayout
                      teams={roomData?.teams || []}
                      isSlotChangeable={canEditSlots}
                      user={user}
                      onSlotClick={handleSlotClick}
                      playerSlot={playerSlot}
                    />
                  </motion.div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-white/10">
              <div className="flex items-center space-x-4">
                {/* Connection Status */}
                <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`} />
                  <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                
                {playerSlot && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>You're in Team {playerSlot.teamNumber}, Slot {playerSlot.slotNumber}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                {canEditSlots && playerSlot && (
                  <button
                    onClick={() => window.open(`/tournament/${tournamentId}/room-lobby`, '_blank')}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Open Full Room Lobby
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// BGMI Room Layout Component
const BGMIRoomLayout = ({ teams, isSlotChangeable, user, onSlotClick, playerSlot }) => {
  const totalPlayers = teams.reduce((acc, team) => acc + team.slots.filter(s => s.player).length, 0);
  
  return (
    <div className="space-y-4">
      {/* BGMI-Style Room Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-white font-bold text-lg">WF~ZaRU's room</div>
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Connected</span>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-white/80">
            <div className="text-center">
              <div className="text-sm text-white/60">Room ID</div>
              <div className="font-mono font-bold">8720966</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-white/60">Players</div>
              <div className="font-bold">{totalPlayers}/100</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* BGMI-Style Team Grid */}
      <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Teams 1, 3, 5 */}
          <div className="space-y-4">
            {teams.filter((_, index) => index % 2 === 0).map((team) => (
              <BGMITeamCard
                key={team.teamNumber}
                team={team}
                isSlotChangeable={isSlotChangeable}
                user={user}
                onSlotClick={onSlotClick}
                playerSlot={playerSlot}
              />
            ))}
          </div>
          
          {/* Right Column - Teams 2, 4, 6 */}
          <div className="space-y-4">
            {teams.filter((_, index) => index % 2 === 1).map((team) => (
              <BGMITeamCard
                key={team.teamNumber}
                team={team}
                isSlotChangeable={isSlotChangeable}
                user={user}
                onSlotClick={onSlotClick}
                playerSlot={playerSlot}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Room Controls Footer */}
      <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
              Invite Friend
            </button>
            <div className="text-white/60 text-sm">
              [DARK×SAHIL]: [Recruitment]Ranked - Livik - Ig
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-white/60 text-sm">Room held for another 01:49:43</div>
            <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors">
              Start Preparation
            </button>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      {isSlotChangeable && (
        <div className="text-center text-blue-400 text-sm bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
          💡 Click on any empty slot to move there • Your current position is highlighted in blue
        </div>
      )}
    </div>
  );
};

// BGMI Team Card Component
const BGMITeamCard = ({ team, isSlotChangeable, user, onSlotClick, playerSlot }) => {
  const filledSlots = team.slots.filter(s => s.player).length;
  const isComplete = filledSlots === 4;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: team.teamNumber * 0.1 }}
      className="bg-gray-800/80 rounded-lg border border-gray-600 overflow-hidden shadow-lg"
    >
      {/* Team Header - BGMI Style */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-3 py-2 border-b border-gray-500">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-bold text-base">Team {team.teamNumber}</h4>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-300 font-medium">
              {filledSlots}/4
            </span>
            {isComplete && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium">READY</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Team Slots Grid - 2x2 like BGMI */}
      <div className="p-3 bg-gray-900/40">
        <div className="grid grid-cols-2 gap-2">
          {team.slots.map((slot) => (
            <BGMISlotCard
              key={`${team.teamNumber}-${slot.slotNumber}`}
              team={team}
              slot={slot}
              isSlotChangeable={isSlotChangeable}
              user={user}
              onSlotClick={onSlotClick}
              isMySlot={slot.player?._id === user?._id}
              playerSlot={playerSlot}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// BGMI-Style Slot Card Component (Authentic BGMI Look)
const BGMISlotCard = ({ team, slot, isSlotChangeable, user, onSlotClick, isMySlot, playerSlot }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const handleClick = () => {
    if (isSlotChangeable && !slot.player) {
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onSlotClick(team.teamNumber, slot.slotNumber);
    }
  };

  const isEmpty = !slot.player;
  const isClickable = isSlotChangeable && isEmpty;

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.02 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative aspect-[3/2] rounded-lg border-2 transition-all duration-200 overflow-hidden
        ${isEmpty 
          ? isClickable 
            ? 'border-dashed border-blue-400/60 bg-gray-700/40 hover:bg-blue-500/20 hover:border-blue-400 cursor-pointer hover:shadow-lg' 
            : 'border-dashed border-gray-600/60 bg-gray-800/40 cursor-not-allowed'
          : isMySlot 
            ? 'border-solid border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/50' 
            : 'border-solid border-gray-500/60 bg-gray-700/60'
        }
      `}
    >
      {isEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
          {/* Empty Slot - BGMI Style */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
            isClickable 
              ? 'bg-blue-500/20 border border-blue-400/50' 
              : 'bg-gray-600/40 border border-gray-600'
          }`}>
            <Users className={`w-4 h-4 ${
              isClickable ? 'text-blue-400' : 'text-gray-500'
            }`} />
          </div>
          
          {/* Click Hint */}
          {isClickable && (
            <span className="text-xs text-blue-400 font-medium">
              {isHovered ? 'Click to join' : 'Available'}
            </span>
          )}
          
          {/* Hover Effect */}
          {isClickable && isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg"
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 p-2">
          {/* Player Card - BGMI Style */}
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-gray-600/50">
            
            {/* Player Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
              isMySlot 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-400/70' 
                : 'bg-gradient-to-br from-gray-600 to-gray-700 border border-gray-500'
            }`}>
              <span className="text-white text-xs font-bold">
                {slot.player.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Player Info */}
            <div className="text-center w-full">
              <div className={`text-xs font-semibold truncate ${
                isMySlot ? 'text-blue-300' : 'text-white'
              }`}>
                {slot.player.username.length > 8 ? slot.player.username.substring(0, 8) + '...' : slot.player.username}
              </div>
              
              {/* BGMI ID */}
              {slot.player.gameProfile?.bgmiName && (
                <div className="text-xs text-gray-400 truncate">
                  {slot.player.gameProfile.bgmiName.length > 8 ? slot.player.gameProfile.bgmiName.substring(0, 8) + '...' : slot.player.gameProfile.bgmiName}
                </div>
              )}
            </div>
            
            {/* Status Indicators */}
            {isMySlot && (
              <>
                {/* "You" Badge */}
                <div className="absolute -top-0.5 -right-0.5">
                  <div className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg">
                    YOU
                  </div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-blue-500/10 rounded-lg animate-pulse"></div>
              </>
            )}
            
            {/* Connection Status */}
            <div className="absolute bottom-1 left-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SlotEditModal;