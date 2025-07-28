import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Calendar, 
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
  Shield,
  CreditCard,
  Timer,
  Eye,
  EyeOff,
  Copy,
  Check,
  Crown,
  Medal,
  Gift
} from 'lucide-react';
import { getTournamentById, joinTournament, createPaymentOrder } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PaymentModal from '../components/Modals/PaymentModal';
import CountdownTimer from '../components/UI/CountdownTimer';
import toast from 'react-hot-toast';

const TournamentDetailsRedesigned = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userSlot, setUserSlot] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentialsCopied, setCredentialsCopied] = useState({ id: false, password: false });

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      const data = await getTournamentById(id);
      setTournament(data);
      
      // Check if user is already joined and get slot number
      const userParticipant = data.participants?.find(p => p._id === user?._id || p.userId === user?._id);
      if (userParticipant) {
        setUserSlot(userParticipant.slotNumber || Math.floor(Math.random() * 100) + 1);
      }
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

    if (tournament.entryFee > 0) {
      setShowPaymentModal(true);
    } else {
      await processJoin();
    }
  };

  const processJoin = async (paymentData = null) => {
    try {
      setJoining(true);
      await joinTournament(id, paymentData);
      
      // Generate slot number
      const slotNumber = tournament.participants?.length + 1 || 1;
      setUserSlot(slotNumber);
      
      // Refresh tournament data
      await fetchTournamentDetails();
      
      toast.success(`✅ Successfully joined! Your slot: #${slotNumber}`);
      setShowPaymentModal(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join tournament');
      toast.error('Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    processJoin(paymentData);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCredentialsCopied(prev => ({ ...prev, [type]: true }));
      toast.success(`${type === 'id' ? 'Room ID' : 'Password'} copied!`);
      setTimeout(() => {
        setCredentialsCopied(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy');
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

  const isUserJoined = () => {
    return tournament?.participants?.some(p => p._id === user?._id || p.userId === user?._id);
  };

  const canJoinTournament = () => {
    if (!tournament) return false;
    if (isUserJoined()) return false;
    if (tournament.status === 'completed' || tournament.status === 'finished') return false;
    if (tournament.participants?.length >= tournament.maxParticipants) return false;
    return true;
  };

  const shouldShowCredentials = () => {
    if (!tournament || !isUserJoined()) return false;
    const startTime = new Date(tournament.startTime || tournament.scheduledAt);
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    return timeDiff <= 30 * 60 * 1000; // 30 minutes before start
  };

  const getTimeUntilCredentials = () => {
    if (!tournament) return null;
    const startTime = new Date(tournament.startTime || tournament.scheduledAt);
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    const credentialsTime = timeDiff - (30 * 60 * 1000); // 30 minutes before
    return credentialsTime > 0 ? credentialsTime : 0;
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
    <div className="min-h-screen pt-20 pb-8 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container-custom">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-white/60 hover:text-white mb-6 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Tournaments</span>
        </motion.button>

        {/* Tournament Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 mb-8 relative overflow-hidden"
        >
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent rounded-full -translate-y-48 translate-x-48" />
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
              <div className="flex-1">
                {/* Game Logo & Status */}
                <div className="flex items-center space-x-6 mb-6">
                  <div className="text-6xl">{getGameLogo(tournament.game)}</div>
                  <div>
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(tournament.status)}`}>
                      {getStatusIcon(tournament.status)}
                      <span className="capitalize">{tournament.status || 'Unknown'}</span>
                    </div>
                    <p className="text-white/60 text-sm mt-2 capitalize font-medium">
                      {tournament.game || 'Unknown Game'}
                    </p>
                  </div>
                </div>
                
                {/* Tournament Title */}
                <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                  {tournament.title || tournament.name || 'Unnamed Tournament'}
                </h1>
                
                {/* Key Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="glass-card p-4 text-center">
                    <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-sm text-white/60">Date</div>
                    <div className="font-bold text-white">
                      {new Date(tournament.startTime || tournament.scheduledAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-white/60">Start Time</div>
                    <div className="font-bold text-white">
                      {new Date(tournament.startTime || tournament.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <CreditCard className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-sm text-white/60">Entry Fee</div>
                    <div className="font-bold text-green-400">
                      ₹{(tournament.entryFee || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-sm text-white/60">Prize Pool</div>
                    <div className="font-bold text-yellow-400">
                      ₹{(tournament.prizePool || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Registration Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-white/60 mb-2">
                    <span>Registration Progress</span>
                    <span>
                      {tournament.participants?.length || 0}/{tournament.maxParticipants || 'N/A'} Players
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${((tournament.participants?.length || 0) / (tournament.maxParticipants || 1)) * 100}%` 
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Action Section */}
              <div className="flex flex-col space-y-4 mt-6 lg:mt-0 lg:ml-8 min-w-[280px]">
                {/* Join Button or Status */}
                {canJoinTournament() ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoinTournament}
                    disabled={joining}
                    className="btn-primary flex items-center justify-center space-x-3 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <>
                        <Trophy className="w-5 h-5" />
                        <span>Join Tournament</span>
                      </>
                    )}
                  </motion.button>
                ) : isUserJoined() ? (
                  <div className="glass-card p-4 bg-green-500/20 border-green-500/30">
                    <div className="flex items-center justify-center space-x-3 text-green-400 font-bold">
                      <CheckCircle className="w-5 h-5" />
                      <span>Successfully Joined</span>
                    </div>
                    {userSlot && (
                      <div className="text-center mt-2">
                        <span className="text-white/80">Your Slot: </span>
                        <span className="text-white font-bold text-xl">#{userSlot}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-card p-4 bg-red-500/20 border-red-500/30">
                    <div className="text-center text-red-400 font-bold">
                      Registration Closed
                    </div>
                  </div>
                )}

                {/* Social Actions */}
                <div className="flex space-x-3">
                  <button className="btn-ghost flex-1 p-3 flex items-center justify-center space-x-2">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  <button className="btn-ghost flex-1 p-3 flex items-center justify-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Info Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card p-6"
            >
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-white/5 rounded-xl p-1">
                {[
                  { id: 'overview', label: 'Overview', icon: Target },
                  { id: 'rules', label: 'Rules', icon: Shield },
                  { id: 'rewards', label: 'Rewards', icon: Gift }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">Tournament Overview</h3>
                      <p className="text-white/80 leading-relaxed mb-6">
                        {tournament.description || 'Join this exciting tournament and compete with players from around the world. Show your skills and climb to the top of the leaderboard!'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Target className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-white font-semibold">Match Format</p>
                            <p className="text-white/60 text-sm">{tournament.format || tournament.teamType || 'Squad'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-white font-semibold">Map</p>
                            <p className="text-white/60 text-sm">{tournament.map || 'Erangel'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-white font-semibold">Max Players</p>
                            <p className="text-white/60 text-sm">{tournament.maxParticipants || 100}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
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
                        
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-white font-semibold">Duration</p>
                            <p className="text-white/60 text-sm">{tournament.duration || '30-45 minutes'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Allowed Devices */}
                    <div className="glass-card p-4 bg-blue-500/10 border-blue-500/20">
                      <h4 className="font-semibold text-white mb-2">Allowed Devices</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Mobile', 'Tablet', 'Emulator (Allowed)'].map((device) => (
                          <span key={device} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                            {device}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'rules' && (
                  <motion.div
                    key="rules"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">Rules & Regulations</h3>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {tournament.rules && tournament.rules.length > 0 ? (
                        Array.isArray(tournament.rules) ? tournament.rules.map((rule, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                            </div>
                            <p className="text-white/80">{rule}</p>
                          </div>
                        )) : tournament.rules.split('\n').map((rule, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                            </div>
                            <p className="text-white/80">{rule}</p>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-3">
                          {[
                            'All participants must follow fair play guidelines',
                            'No cheating, hacking, or use of unauthorized software',
                            'Participants must join the tournament lobby 15 minutes before start time',
                            'Screenshots of final results must be submitted within 5 minutes of match end',
                            'Disputes will be resolved by tournament moderators',
                            'Inappropriate behavior will result in immediate disqualification',
                            'Entry fees are non-refundable once the tournament begins'
                          ].map((rule, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                              </div>
                              <p className="text-white/80">{rule}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'rewards' && (
                  <motion.div
                    key="rewards"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">Prize Distribution</h3>
                    
                    <div className="space-y-3">
                      {tournament.prizeDistribution && tournament.prizeDistribution.length > 0 ? (
                        tournament.prizeDistribution.map((prize, index) => (
                          <div key={index} className="flex items-center justify-between p-4 glass-card bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                                index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
                                'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}>
                                {index === 0 ? <Crown className="w-6 h-6 text-black" /> :
                                 index === 1 ? <Medal className="w-6 h-6 text-black" /> :
                                 index === 2 ? <Award className="w-6 h-6 text-white" /> :
                                 <Star className="w-6 h-6 text-white" />}
                              </div>
                              <div>
                                <span className="text-white font-bold text-lg">
                                  {index === 0 ? '🥇 1st Place' :
                                   index === 1 ? '🥈 2nd Place' :
                                   index === 2 ? '🥉 3rd Place' :
                                   `#${index + 1} Place`}
                                </span>
                                <p className="text-white/60 text-sm">Winner</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-green-400 font-bold text-2xl">
                                ₹{prize.amount?.toLocaleString() || '0'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-3">
                          {[
                            { place: '🥇 1st Place', amount: Math.floor((tournament.prizePool || 0) * 0.5), gradient: 'from-yellow-400 to-yellow-600' },
                            { place: '🥈 2nd Place', amount: Math.floor((tournament.prizePool || 0) * 0.3), gradient: 'from-gray-300 to-gray-500' },
                            { place: '🥉 3rd Place', amount: Math.floor((tournament.prizePool || 0) * 0.2), gradient: 'from-amber-600 to-amber-800' }
                          ].map((prize, index) => (
                            <div key={index} className="flex items-center justify-between p-4 glass-card bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${prize.gradient}`}>
                                  {index === 0 ? <Crown className="w-6 h-6 text-black" /> :
                                   index === 1 ? <Medal className="w-6 h-6 text-black" /> :
                                   <Award className="w-6 h-6 text-white" />}
                                </div>
                                <div>
                                  <span className="text-white font-bold text-lg">{prize.place}</span>
                                  <p className="text-white/60 text-sm">Winner</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-green-400 font-bold text-2xl">
                                  ₹{prize.amount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Total Prize Pool */}
                    <div className="glass-card p-4 bg-gradient-to-r from-green-500/20 to-transparent border-green-500/30 mt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Trophy className="w-6 h-6 text-green-400" />
                          <span className="text-white font-bold text-lg">Total Prize Pool</span>
                        </div>
                        <span className="text-green-400 font-bold text-3xl">
                          ₹{(tournament.prizePool || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Match Credentials Section */}
            {isUserJoined() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-card p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Match Credentials</h3>
                </div>

                {shouldShowCredentials() ? (
                  <div className="space-y-4">
                    <div className="glass-card p-4 bg-green-500/10 border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">Room ID</span>
                        <button
                          onClick={() => copyToClipboard(tournament.roomDetails?.roomId || 'ROOM123', 'id')}
                          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {credentialsCopied.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="text-sm">Copy</span>
                        </button>
                      </div>
                      <div className="font-mono text-lg text-green-400 bg-black/20 p-3 rounded-lg">
                        {tournament.roomDetails?.roomId || 'ROOM123'}
                      </div>
                    </div>

                    <div className="glass-card p-4 bg-green-500/10 border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">Password</span>
                        <button
                          onClick={() => copyToClipboard(tournament.roomDetails?.password || 'PASS456', 'password')}
                          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {credentialsCopied.password ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="text-sm">Copy</span>
                        </button>
                      </div>
                      <div className="font-mono text-lg text-green-400 bg-black/20 p-3 rounded-lg">
                        {tournament.roomDetails?.password || 'PASS456'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Room credentials are now available</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Timer className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-2">Room credentials will be available</p>
                    <p className="text-white font-semibold">30 minutes before match start</p>
                    {getTimeUntilCredentials() > 0 && (
                      <div className="mt-4">
                        <CountdownTimer 
                          targetDate={new Date(Date.now() + getTimeUntilCredentials())}
                          onComplete={() => setShowCredentials(true)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Participants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Participants ({tournament.participants?.length || 0})</span>
              </h3>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tournament.participants && tournament.participants.length > 0 ? (
                  tournament.participants.map((participant, index) => (
                    <div key={participant._id || index} className="flex items-center space-x-3 p-3 glass-card hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {participant.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {participant.username || `Player ${index + 1}`}
                        </p>
                        <p className="text-white/60 text-xs">
                          Slot #{index + 1}
                        </p>
                      </div>
                      {participant._id === user?._id && (
                        <div className="text-green-400 text-xs font-semibold bg-green-500/20 px-2 py-1 rounded-full">
                          You
                        </div>
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

            {/* Tournament Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">Tournament Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Created</span>
                  <span className="text-white font-medium">
                    {new Date(tournament.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Organizer</span>
                  <span className="text-white font-medium">GameOn</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Tournament ID</span>
                  <span className="text-white font-mono text-sm">#{tournament._id?.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>
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
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            amount={tournament.entryFee}
            onSuccess={handlePaymentSuccess}
            tournamentName={tournament.title || tournament.name}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentDetailsRedesigned;