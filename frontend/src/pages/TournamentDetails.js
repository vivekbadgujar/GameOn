import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Clock, 
  Target,
  Play,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Award,
  Zap,
  Star,
  Edit3 as EditIcon,
  Grid3X3 as SlotIcon
} from 'lucide-react';
import { getTournamentById, joinTournament } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTournamentParticipation } from '../hooks/useTournamentParticipation';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SlotEditModal from '../components/Tournament/SlotEditModal';
import TournamentChat from '../components/Chat/TournamentChat';

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lastMessage } = useSocket();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [slotEditModal, setSlotEditModal] = useState(false);
  const [notifications, setNotifications] = useState({ success: '', error: '', info: '' });
  const [chatVisible, setChatVisible] = useState(false);

  // Use the participation hook for better duplicate prevention
  const {
    hasJoined,
    participationDetails,
    paymentStatus,
    canJoin,
    joinButtonState
  } = useTournamentParticipation(id);

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  // Notification helpers
  const showSuccess = (message) => {
    setNotifications(prev => ({ ...prev, success: message, error: '', info: '' }));
    setTimeout(() => setNotifications(prev => ({ ...prev, success: '' })), 3000);
  };

  const showError = (message) => {
    setNotifications(prev => ({ ...prev, error: message, success: '', info: '' }));
    setTimeout(() => setNotifications(prev => ({ ...prev, error: '' })), 5000);
  };

  const showInfo = (message) => {
    setNotifications(prev => ({ ...prev, info: message, success: '', error: '' }));
    setTimeout(() => setNotifications(prev => ({ ...prev, info: '' })), 3000);
  };

  // Slot edit handlers
  const handleOpenSlotEdit = () => {
    setSlotEditModal(true);
  };

  const handleCloseSlotEdit = () => {
    setSlotEditModal(false);
  };

  const handleOpenFullLobby = () => {
    navigate(`/tournament/${id}/room-lobby`);
  };

  // Real-time updates via socket
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('TournamentDetails: Received socket message:', lastMessage);
    
    // Handle both old and new message formats
    const messageType = lastMessage.type || lastMessage;
    const messageData = lastMessage.data || lastMessage;
    
    if (messageType === 'tournamentUpdated' && messageData._id === id) {
      console.log('TournamentDetails: Processing tournamentUpdated event for current tournament');
      // Update tournament data with new information
      setTournament(prev => prev ? { ...prev, ...messageData } : messageData);
    } else if (messageType === 'tournamentJoined' && messageData.tournamentId === id) {
      console.log('TournamentDetails: Processing tournamentJoined event for current tournament');
      // Refresh tournament data to show updated participant count
      fetchTournamentDetails();
    }
  }, [lastMessage, id]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      const data = await getTournamentById(id);
      setTournament(data);
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      setError('Tournament not found');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setJoining(true);
      await joinTournament(id);
      // Refresh tournament data to show updated participant count
      await fetchTournamentDetails();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

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
        return <Play className="w-4 h-4" />;
      case 'upcoming':
      case 'registration':
        return <Clock className="w-4 h-4" />;
      case 'completed':
      case 'finished':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const isUserJoined = () => {
    if (!tournament?.participants || !user?._id) return false;
    
    return tournament.participants.some(p => {
      // Handle different participant data structures
      const participantUserId = p.user?._id || p.user || p.userId || p._id;
      const currentUserId = user._id;
      
      // Convert to strings for comparison to handle ObjectId vs string
      const participantIdStr = participantUserId?.toString();
      const currentUserIdStr = currentUserId?.toString();
      
      return participantIdStr === currentUserIdStr;
    });
  };

  const canJoinTournament = () => {
    if (!tournament) return false;
    if (isUserJoined()) return false;
    if (tournament.status === 'completed' || tournament.status === 'finished') return false;
    if (tournament.participants?.length >= tournament.maxParticipants) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="container-custom">
          <div className="glass-card p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Tournament Not Found</h2>
            <p className="text-white/60 mb-6">
              The tournament you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/tournaments')}
              className="btn-primary"
            >
              Browse Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-white/60 hover:text-white mb-6 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tournaments</span>
        </motion.button>

        {/* Tournament Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 mb-8 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-32 translate-x-32" />
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-4xl">{getGameIcon(tournament.game)}</div>
                  <div>
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(tournament.status)}`}>
                      {getStatusIcon(tournament.status)}
                      <span className="capitalize">{tournament.status || 'Unknown'}</span>
                    </div>
                    <p className="text-white/60 text-sm mt-1 capitalize">
                      {tournament.game || 'Unknown Game'}
                    </p>
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold text-white mb-4">
                  {tournament.name || 'Unnamed Tournament'}
                </h1>
                
                <p className="text-white/80 text-lg leading-relaxed mb-6">
                  {tournament.description || 'No description available for this tournament.'}
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      ₹{(tournament.prizePool || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-white/60 text-sm">Prize Pool</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {tournament.participants?.length || 0}/{tournament.maxParticipants || 'N/A'}
                    </div>
                    <div className="text-white/60 text-sm">Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      ₹{(tournament.entryFee || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-white/60 text-sm">Entry Fee</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {tournament.format || 'Standard'}
                    </div>
                    <div className="text-white/60 text-sm">Format</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 mt-6 lg:mt-0 lg:ml-8">
                {canJoinTournament() ? (
                  <button
                    onClick={handleJoinTournament}
                    disabled={joining}
                    className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        <span>Join Tournament</span>
                      </>
                    )}
                  </button>
                ) : hasJoined ? (
                  <div className="space-y-3">
                    <div className="btn-secondary flex items-center justify-center space-x-2 cursor-default">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Already Joined</span>
                    </div>
                    
                    {/* Edit Slot Actions - Only show if payment is completed */}
                    {paymentStatus === 'completed' && (tournament.status === 'upcoming' || tournament.status === 'live') && (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleOpenSlotEdit}
                          className="btn-primary flex items-center justify-center space-x-2 flex-1"
                        >
                          <EditIcon className="w-4 h-4" />
                          <span>Edit Slot</span>
                        </button>
                        <button
                          onClick={handleOpenFullLobby}
                          className="btn-ghost p-3"
                          title="Open Full Room Lobby"
                        >
                          <SlotIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Payment Pending State */}
                    {paymentStatus === 'pending' && (
                      <div className="btn-ghost cursor-default opacity-75 text-yellow-400">
                        <span>Payment Pending</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="btn-ghost cursor-default opacity-50">
                    <span>Registration Closed</span>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button className="btn-ghost p-3">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="btn-ghost p-3">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {tournament.maxParticipants && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-white/60 mb-2">
                  <span>Registration Progress</span>
                  <span>
                    {Math.round(((tournament.participants?.length || 0) / tournament.maxParticipants) * 100)}% Full
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${((tournament.participants?.length || 0) / tournament.maxParticipants) * 100}%` 
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tournament Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Tournament Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-semibold">Start Time</p>
                      <p className="text-white/60 text-sm">{formatDate(tournament.startTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-semibold">Duration</p>
                      <p className="text-white/60 text-sm">{tournament.duration || 'TBD'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-semibold">Platform</p>
                      <p className="text-white/60 text-sm">{tournament.platform || 'Online'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-white font-semibold">Game Mode</p>
                      <p className="text-white/60 text-sm">{tournament.gameMode || 'Standard'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-semibold">Skill Level</p>
                      <p className="text-white/60 text-sm">{tournament.skillLevel || 'All Levels'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Region</p>
                      <p className="text-white/60 text-sm">{tournament.region || 'Global'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Rules & Regulations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Rules & Regulations</h2>
              
              <div className="space-y-4 text-white/80">
                {tournament.rules && tournament.rules.length > 0 ? (
                  tournament.rules.map((rule, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                      </div>
                      <p>{rule}</p>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-bold">1</span>
                      </div>
                      <p>All participants must follow fair play guidelines</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-bold">2</span>
                      </div>
                      <p>No cheating, hacking, or use of unauthorized software</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-bold">3</span>
                      </div>
                      <p>Participants must join the tournament lobby 15 minutes before start time</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-bold">4</span>
                      </div>
                      <p>Disputes will be resolved by tournament moderators</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Prize Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">Prize Distribution</h3>
              
              <div className="space-y-3">
                {tournament.prizeDistribution && tournament.prizeDistribution.length > 0 ? (
                  tournament.prizeDistribution.map((prize, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-300/20 text-gray-300' :
                          index === 2 ? 'bg-amber-600/20 text-amber-600' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {index < 3 ? <Trophy className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                        </div>
                        <span className="text-white font-semibold">
                          {index === 0 ? '1st Place' :
                           index === 1 ? '2nd Place' :
                           index === 2 ? '3rd Place' :
                           `${index + 1}th Place`}
                        </span>
                      </div>
                      <span className="text-green-400 font-bold">
                        ₹{prize.amount?.toLocaleString('en-IN') || '0'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        </div>
                        <span className="text-white font-semibold">1st Place</span>
                      </div>
                      <span className="text-green-400 font-bold">
                        ₹{Math.floor((tournament.prizePool || 0) * 0.5).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300/20 rounded-full flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-gray-300" />
                        </div>
                        <span className="text-white font-semibold">2nd Place</span>
                      </div>
                      <span className="text-green-400 font-bold">
                        ₹{Math.floor((tournament.prizePool || 0) * 0.3).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-600/20 rounded-full flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-white font-semibold">3rd Place</span>
                      </div>
                      <span className="text-green-400 font-bold">
                        ₹{Math.floor((tournament.prizePool || 0) * 0.2).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Participants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">
                Participants ({tournament.participants?.length || 0})
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {tournament.participants && tournament.participants.length > 0 ? (
                  tournament.participants.map((participant, index) => (
                    <div key={participant._id || index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {participant.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {participant.username || `Player ${index + 1}`}
                        </p>
                        <p className="text-white/60 text-xs">
                          Joined {new Date(participant.joinedAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      {participant._id === user?._id && (
                        <div className="text-green-400 text-xs font-semibold">You</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No participants yet</p>
                    <p className="text-white/40 text-sm">Be the first to join!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4"
          >
            <p className="text-red-400 text-center">{error}</p>
          </motion.div>
        )}

        {/* Notifications */}
        {notifications.success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 right-4 bg-green-500/20 border border-green-500/30 rounded-xl p-4 z-50"
          >
            <p className="text-green-400">{notifications.success}</p>
          </motion.div>
        )}
        
        {notifications.error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 right-4 bg-red-500/20 border border-red-500/30 rounded-xl p-4 z-50"
          >
            <p className="text-red-400">{notifications.error}</p>
          </motion.div>
        )}
        
        {notifications.info && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 right-4 bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 z-50"
          >
            <p className="text-blue-400">{notifications.info}</p>
          </motion.div>
        )}
      </div>

      {/* Slot Edit Modal */}
      <SlotEditModal
        open={slotEditModal}
        onClose={handleCloseSlotEdit}
        tournamentId={id}
        user={user}
        showSuccess={showSuccess}
        showError={showError}
        showInfo={showInfo}
      />

      {/* Tournament Chat - Only show for participants */}
      {hasJoined && tournament && (
        <TournamentChat
          tournamentId={id}
          isVisible={chatVisible}
          onToggle={() => setChatVisible(!chatVisible)}
          participantCount={tournament.currentParticipants}
        />
      )}
    </div>
  );
};

export default TournamentDetails;