import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PaymentModal from '../components/Modals/PaymentModal';
import SlotEditModal from '../components/Dashboard/SlotEditModal';
import CountdownTimer from '../components/UI/CountdownTimer';
import toast from 'react-hot-toast';

const TournamentDetailsRedesigned = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { balance, hasSufficientBalance, deductFromWallet } = useWallet();
  const { showSuccess, showError, showWarning } = useNotification();
  
  // State management
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSlotEditModal, setShowSlotEditModal] = useState(false);
  const [userSlot, setUserSlot] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentialsCopied, setCredentialsCopied] = useState({ id: false, password: false });

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      console.log('🔍 Fetching tournament details for ID:', id);
      
      // SSR-safe URL logging
      if (typeof window !== 'undefined') {
        console.log('🔍 Current URL:', window.location.href);
      }
      
      // Use production API URL
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://api.gameonesport.xyz/api';
      console.log('🔍 API Base URL:', apiBaseUrl);
      
      // Use our API service directly (no direct fetch testing in production)
      console.log('🔍 Using API service...');
      const data = await getTournamentById(id);
      console.log('🔍 Tournament data received:', data);
      
      if (!data) {
        throw new Error('No tournament data received from API service');
      }
      
      setTournament(data);
      console.log('🔍 Tournament state set successfully');
      
      // Check if user is already joined and get slot number
      const userParticipant = data.participants?.find(p => p._id === user?._id || p.userId === user?._id);
      if (userParticipant) {
        setUserSlot(userParticipant.slotNumber || Math.floor(Math.random() * 100) + 1);
      }
    } catch (error) {
      console.error('❌ Error fetching tournament details:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      let errorMessage = 'Failed to load tournament details. ';
      
      if (error.response?.status === 404) {
        errorMessage = 'Tournament not found. It may have been deleted or the URL is incorrect.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try refreshing the page.';
      }
      
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!user) {
      showError('Please login to join tournaments');
      router.push('/login');
      return;
    }

    if (!tournament) {
      showError('Tournament data not available');
      return;
    }

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      showError('Tournament is full');
      return;
    }

    // Check if user is already joined
    const isAlreadyJoined = tournament.participants?.some(p => 
      p._id === user._id || p.userId === user._id
    );
    
    if (isAlreadyJoined) {
      showWarning('You are already registered for this tournament');
      return;
    }

    // Check wallet balance
    if (!hasSufficientBalance(tournament.entryFee)) {
      showError(`Insufficient balance. Required: ₹${tournament.entryFee}`);
      return;
    }

    try {
      setJoining(true);
      
      // Create payment order
      const orderResponse = await createPaymentOrder({
        amount: tournament.entryFee,
        tournamentId: tournament._id,
        currency: 'INR'
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      // Show payment modal with Cashfree integration
      setShowPaymentModal(true);
      
    } catch (error) {
      console.error('Join tournament error:', error);
      showError(error.message || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Join tournament after successful payment
      const joinResponse = await joinTournament(tournament._id, {
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId
      });

      if (joinResponse.success) {
        showSuccess('Successfully joined tournament!');
        setShowPaymentModal(false);
        
        // Refresh tournament data
        await fetchTournamentDetails();
        
        // Deduct from wallet
        deductFromWallet(tournament.entryFee);
        
        // Redirect to room lobby if available
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            router.push(`/tournament/${tournament._id}/room-lobby`);
          }, 2000);
        }
      } else {
        throw new Error(joinResponse.message || 'Failed to join tournament');
      }
    } catch (error) {
      console.error('Payment success handling error:', error);
      showError(error.message || 'Failed to complete tournament registration');
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    showError(error.message || 'Payment failed. Please try again.');
    setShowPaymentModal(false);
  };

  const copyToClipboard = async (text, type) => {
    if (typeof window === 'undefined' || !navigator.clipboard) {
      // Fallback for older browsers or SSR
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } else {
      await navigator.clipboard.writeText(text);
    }
    
    setCredentialsCopied({ ...credentialsCopied, [type]: true });
    toast.success(`${type === 'id' ? 'Room ID' : 'Password'} copied to clipboard!`);
    
    setTimeout(() => {
      setCredentialsCopied({ ...credentialsCopied, [type]: false });
    }, 2000);
  };

  const shareToSocial = (platform) => {
    if (typeof window === 'undefined') return;
    
    const url = window.location.href;
    const text = `Check out this amazing BGMI tournament: ${tournament?.title}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Tournament</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchTournamentDetails}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/tournaments')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Tournament Not Found</h2>
          <p className="text-gray-300 mb-6">The tournament you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/tournaments')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Browse Tournaments
          </button>
        </div>
      </div>
    );
  }

  const isUserJoined = tournament.participants?.some(p => 
    p._id === user?._id || p.userId === user?._id
  );

  const canJoin = !isUserJoined && 
                  tournament.currentParticipants < tournament.maxParticipants &&
                  tournament.status === 'upcoming';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Tournament Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/tournaments')}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tournaments
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => shareToSocial('whatsapp')}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title="Share on WhatsApp"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => shareToSocial('telegram')}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Share on Telegram"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tournament Info */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{tournament.title}</h1>
                    <p className="text-gray-300 text-lg">{tournament.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <span className="text-2xl font-bold text-yellow-400">₹{tournament.prizePool}</span>
                  </div>
                </div>

                {/* Tournament Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                    <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{tournament.currentParticipants}</div>
                    <div className="text-sm text-gray-300">/ {tournament.maxParticipants}</div>
                  </div>
                  
                  <div className="bg-green-500/20 rounded-lg p-4 text-center">
                    <CreditCard className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">₹{tournament.entryFee}</div>
                    <div className="text-sm text-gray-300">Entry Fee</div>
                  </div>
                  
                  <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-white">
                      {new Date(tournament.startTime).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-300">
                      {new Date(tournament.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="bg-yellow-500/20 rounded-lg p-4 text-center">
                    <Target className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-white">{tournament.gameMode}</div>
                    <div className="text-sm text-gray-300">Mode</div>
                  </div>
                </div>

                {/* Countdown Timer */}
                {tournament.status === 'upcoming' && (
                  <div className="mb-8">
                    <CountdownTimer targetDate={tournament.startTime} />
                  </div>
                )}

                {/* Room Credentials (if user is joined) */}
                {isUserJoined && tournament.roomId && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-400">Room Credentials</h3>
                      <button
                        onClick={() => setShowCredentials(!showCredentials)}
                        className="text-green-400 hover:text-green-300"
                      >
                        {showCredentials ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {showCredentials && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-black/20 rounded-lg p-4">
                          <div>
                            <div className="text-sm text-gray-300">Room ID</div>
                            <div className="text-lg font-mono text-white">{tournament.roomId}</div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(tournament.roomId, 'id')}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          >
                            {credentialsCopied.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        {tournament.roomPassword && (
                          <div className="flex items-center justify-between bg-black/20 rounded-lg p-4">
                            <div>
                              <div className="text-sm text-gray-300">Password</div>
                              <div className="text-lg font-mono text-white">{tournament.roomPassword}</div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(tournament.roomPassword, 'password')}
                              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                            >
                              {credentialsCopied.password ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Panel */}
            <div className="space-y-6">
              {/* Join Tournament Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Tournament Status</h3>
                
                {isUserJoined ? (
                  <div className="space-y-4">
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-semibold">You're registered!</span>
                    </div>
                    
                    {userSlot && (
                      <div className="bg-green-500/20 rounded-lg p-4">
                        <div className="text-sm text-gray-300">Your Slot</div>
                        <div className="text-2xl font-bold text-green-400">#{userSlot}</div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowSlotEditModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Manage Slot
                    </button>
                  </div>
                ) : canJoin ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">₹{tournament.entryFee}</div>
                      <div className="text-gray-300">Entry Fee</div>
                    </div>
                    
                    <button
                      onClick={handleJoinTournament}
                      disabled={joining}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {joining ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Joining...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Play className="w-5 h-5 mr-2" />
                          Join Tournament
                        </div>
                      )}
                    </button>
                    
                    {user && balance < tournament.entryFee && (
                      <div className="text-center text-red-400 text-sm">
                        Insufficient balance. Add ₹{tournament.entryFee - balance} to your wallet.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <div className="text-yellow-400 font-semibold">
                      {tournament.currentParticipants >= tournament.maxParticipants 
                        ? 'Tournament Full' 
                        : tournament.status === 'live' 
                          ? 'Tournament Started' 
                          : 'Registration Closed'
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Prize Distribution */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Prize Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                      <span className="text-gray-300">1st Place</span>
                    </div>
                    <span className="text-yellow-400 font-bold">₹{Math.floor(tournament.prizePool * 0.5)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Medal className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-300">2nd Place</span>
                    </div>
                    <span className="text-gray-400 font-bold">₹{Math.floor(tournament.prizePool * 0.3)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-orange-400 mr-2" />
                      <span className="text-gray-300">3rd Place</span>
                    </div>
                    <span className="text-orange-400 font-bold">₹{Math.floor(tournament.prizePool * 0.2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={tournament.entryFee}
          tournamentId={tournament._id}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}

      {/* Slot Edit Modal */}
      {showSlotEditModal && (
        <SlotEditModal
          isOpen={showSlotEditModal}
          onClose={() => setShowSlotEditModal(false)}
          tournamentId={tournament._id}
          currentSlot={userSlot}
          onSlotUpdate={(newSlot) => setUserSlot(newSlot)}
        />
      )}
    </div>
  );
};

export default TournamentDetailsRedesigned;

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}
