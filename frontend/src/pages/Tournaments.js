import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Trophy, 
  Users, 
  Clock,
  Gamepad2,
  Target,
  Zap,
  Star,
  ChevronDown,
  X
} from 'lucide-react';
import { getTournaments } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TournamentCard from '../components/UI/TournamentCard';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from '../contexts/NotificationContext';
import AuthModal from '../components/Auth/AuthModal';
import { useAuthModal } from '../hooks/useAuthModal';

const Tournaments = () => {
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const { 
    isAuthModalOpen, 
    authModalTab, 
    openAuthModal, 
    closeAuthModal 
  } = useAuthModal();
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const { lastMessage } = useSocket();
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedPrizeRange, setSelectedPrizeRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'ongoing', label: 'Live', icon: Zap, count: 0 },
    { id: 'upcoming', label: 'Upcoming', icon: Clock, count: 0 },
    { id: 'completed', label: 'Completed', icon: Trophy, count: 0 }
  ];

  const games = [
    { id: 'all', name: 'All Games', icon: '🎮' },
    { id: 'bgmi', name: 'BGMI', icon: '🔫' },
    { id: 'valorant', name: 'VALORANT', icon: '⚡' },
    { id: 'chess', name: 'Chess', icon: '♟️' },
    { id: 'freefire', name: 'Free Fire', icon: '🔥' },
    { id: 'codm', name: 'COD Mobile', icon: '💥' }
  ];

  const prizeRanges = [
    { id: 'all', label: 'All Prizes' },
    { id: '0-1000', label: '₹0 - ₹1,000' },
    { id: '1000-5000', label: '₹1,000 - ₹5,000' },
    { id: '5000-10000', label: '₹5,000 - ₹10,000' },
    { id: '10000+', label: '₹10,000+' }
  ];

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, activeTab, searchQuery, selectedGame, selectedPrizeRange]);

  // Real-time updates via socket
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Tournaments Page: Received socket message:', lastMessage);
    
    // Handle both old and new message formats
    const messageType = lastMessage.type || lastMessage;
    const messageData = lastMessage.data || lastMessage;
    
    if (messageType === 'tournamentAdded') {
      console.log('Tournaments Page: Processing tournamentAdded event');
      // Add new tournament to the list
      setTournaments(prev => {
        const exists = prev.some(t => t._id === messageData._id);
        if (!exists) {
          console.log('Tournaments Page: Adding new tournament to list');
          return [messageData, ...prev];
        }
        return prev;
      });
    } else if (messageType === 'tournamentUpdated') {
      console.log('Tournaments Page: Processing tournamentUpdated event');
      // Update existing tournament
      setTournaments(prev => 
        prev.map(t => t._id === messageData._id ? messageData : t)
      );
    } else if (messageType === 'tournamentDeleted') {
      console.log('Tournaments Page: Processing tournamentDeleted event');
      // Remove tournament from list
      setTournaments(prev => 
        prev.filter(t => t._id !== messageData._id)
      );
    }
  }, [lastMessage]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await getTournaments();
      const tournaments = response?.tournaments || [];
      console.log('Tournaments Page: Received tournaments:', tournaments.length);
      
      setTournaments(tournaments);
      
      // Update tab counts
      const ongoing = tournaments.filter(t => t.status === 'ongoing' || t.status === 'live').length;
      const upcoming = tournaments.filter(t => t.status === 'upcoming' || t.status === 'registration').length;
      const completed = tournaments.filter(t => t.status === 'completed' || t.status === 'finished').length;
      
      console.log('Tournaments Page: Tab counts - Ongoing:', ongoing, 'Upcoming:', upcoming, 'Completed:', completed);
      
      tabs[0].count = ongoing;
      tabs[1].count = upcoming;
      tabs[2].count = completed;
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTournaments = () => {
    let filtered = tournaments;

    // Filter by status/tab
    if (activeTab === 'ongoing') {
      filtered = filtered.filter(t => t.status === 'ongoing' || t.status === 'live');
    } else if (activeTab === 'upcoming') {
      filtered = filtered.filter(t => t.status === 'upcoming' || t.status === 'registration');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed' || t.status === 'finished');
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.game?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by game
    if (selectedGame !== 'all') {
      filtered = filtered.filter(t => 
        t.game?.toLowerCase() === selectedGame.toLowerCase()
      );
    }

    // Filter by prize range
    if (selectedPrizeRange !== 'all') {
      const [min, max] = selectedPrizeRange.split('-').map(v => 
        v === '10000+' ? Infinity : parseInt(v) || 0
      );
      filtered = filtered.filter(t => {
        const prize = t.prizePool || 0;
        return prize >= min && (max === Infinity || prize <= max);
      });
    }

    setFilteredTournaments(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGame('all');
    setSelectedPrizeRange('all');
    setShowFilters(false);
  };

  const handleJoinTournament = async (tournament) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    
    // Navigate to tournament details page for joining
    window.location.href = `/tournament/${tournament._id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Tournaments</span>
            </h1>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              Join live tournaments and compete with the best players
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'glass-card text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12 w-full"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                showFilters ? 'rotate-180' : ''
              }`} />
            </button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 glass-card p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Game Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Game</label>
                    <div className="grid grid-cols-2 gap-2">
                      {games.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => setSelectedGame(game.id)}
                          className={`flex items-center space-x-2 p-3 rounded-xl transition-all duration-300 ${
                            selectedGame === game.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-lg">{game.icon}</span>
                          <span className="font-medium">{game.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prize Range Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Prize Range</label>
                    <div className="space-y-2">
                      {prizeRanges.map((range) => (
                        <button
                          key={range.id}
                          onClick={() => setSelectedPrizeRange(range.id)}
                          className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                            selectedPrizeRange === range.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors duration-300"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Active Filters */}
        {(searchQuery || selectedGame !== 'all' || selectedPrizeRange !== 'all') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap gap-2"
          >
            {searchQuery && (
              <div className="flex items-center space-x-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                <span className="text-sm">Search: {searchQuery}</span>
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {selectedGame !== 'all' && (
              <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                <span className="text-sm">
                  Game: {games.find(g => g.id === selectedGame)?.name}
                </span>
                <button onClick={() => setSelectedGame('all')}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {selectedPrizeRange !== 'all' && (
              <div className="flex items-center space-x-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                <span className="text-sm">
                  Prize: {prizeRanges.find(p => p.id === selectedPrizeRange)?.label}
                </span>
                <button onClick={() => setSelectedPrizeRange('all')}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Tournament Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament, index) => (
                <motion.div
                  key={tournament._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <TournamentCard 
                    tournament={tournament} 
                    isAuthenticated={isAuthenticated}
                    onRequireAuth={openAuthModal}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Trophy className="w-16 h-16 text-white/40 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">No Tournaments Found</h3>
              <p className="text-white/60 mb-6">
                {searchQuery || selectedGame !== 'all' || selectedPrizeRange !== 'all'
                  ? 'Try adjusting your filters to find more tournaments'
                  : 'No tournaments available in this category right now'
                }
              </p>
              {(searchQuery || selectedGame !== 'all' || selectedPrizeRange !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Tournament Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="glass-card p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">
              {tournaments.filter(t => t.status === 'ongoing').length}
            </p>
            <p className="text-white/60 text-sm">Live Now</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">
              {tournaments.filter(t => t.status === 'upcoming').length}
            </p>
            <p className="text-white/60 text-sm">Upcoming</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">
              {tournaments.reduce((sum, t) => sum + (t.participants?.length || 0), 0)}
            </p>
            <p className="text-white/60 text-sm">Total Players</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Target className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">
              ₹{tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0).toLocaleString()}
            </p>
            <p className="text-white/60 text-sm">Total Prizes</p>
          </div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialTab={authModalTab}
      />
    </div>
  );
};

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}

export default Tournaments;