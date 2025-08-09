import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Wallet, 
  Play, 
  Eye, 
  TrendingUp, 
  Users, 
  Calendar,
  Star,
  ArrowRight,
  Crown,
  Target,
  Zap,
  Clock,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { getTournaments, getWalletBalance, getUserStats } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TournamentCard from '../components/UI/TournamentCard';
import LeaderboardSlider from '../components/UI/LeaderboardSlider';
import AuthModal from '../components/Auth/AuthModal';
import TournamentSlots from '../components/Dashboard/TournamentSlots';
import { useAuthModal } from '../hooks/useAuthModal';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { lastMessage } = useSocket();
  const { 
    isAuthModalOpen, 
    authModalTab, 
    openAuthModal, 
    closeAuthModal, 
    openLoginModal, 
    openRegisterModal 
  } = useAuthModal();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    tournaments: [],
    walletBalance: 0,
    userStats: {},
    recentActivity: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [isAuthenticated]);

  // Real-time updates via socket
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Dashboard: Received socket message:', lastMessage);
    
    // Handle both old and new message formats
    const messageType = lastMessage.type || lastMessage;
    const messageData = lastMessage.data || lastMessage;
    
    if (messageType === 'tournamentAdded') {
      console.log('Dashboard: Processing tournamentAdded event');
      setDashboardData(prev => {
        // Check if tournament already exists to prevent duplicates
        const exists = prev.tournaments.some(t => t._id === messageData._id);
        if (!exists) {
          console.log('Dashboard: Adding new tournament to list');
          const newTournaments = [messageData, ...prev.tournaments.slice(0, 5)];
          // Ensure unique tournaments
          const uniqueTournaments = newTournaments.filter((tournament, index, self) => 
            index === self.findIndex(t => t._id === tournament._id)
          );
          return {
            ...prev,
            tournaments: uniqueTournaments
          };
        }
        console.log('Dashboard: Tournament already exists, skipping');
        return prev;
      });
    } else if (messageType === 'tournamentUpdated') {
      console.log('Dashboard: Processing tournamentUpdated event');
      setDashboardData(prev => ({
        ...prev,
        tournaments: prev.tournaments.map(t => 
          t._id === messageData._id ? messageData : t
        )
      }));
    } else if (messageType === 'walletUpdated') {
      setDashboardData(prev => ({
        ...prev,
        walletBalance: messageData.balance
      }));
    } else if (messageType === 'statsUpdated') {
      setDashboardData(prev => ({
        ...prev,
        userStats: { ...prev.userStats, ...messageData }
      }));
    }
  }, [lastMessage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Always fetch tournaments - get all statuses for better visibility
      const tournamentsRes = await getTournaments({ limit: 6 });
      
      // Only fetch wallet and stats if user is authenticated
      let walletRes = { balance: 0 };
      let statsRes = {};
      
      if (isAuthenticated) {
        const [walletResponse, statsResponse] = await Promise.all([
          getWalletBalance().catch(() => ({ balance: 0 })),
          getUserStats().catch(() => ({}))
        ]);
        walletRes = walletResponse;
        statsRes = statsResponse;
      }

      // Handle new API response structure
      const tournaments = tournamentsRes?.tournaments || [];
      console.log('Dashboard: Received tournaments:', tournaments.length);
      
      // Ensure unique tournaments to prevent duplicate key warnings
      const uniqueTournaments = tournaments.filter((tournament, index, self) => 
        index === self.findIndex(t => t._id === tournament._id)
      );
      
      console.log('Dashboard: Unique tournaments after filtering:', uniqueTournaments.length);
      
      setDashboardData({
        tournaments: uniqueTournaments,
        walletBalance: walletRes.balance || 0,
        userStats: statsRes || {},
        recentActivity: statsRes.recentActivity || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Join Tournament',
      description: 'Find and join live tournaments',
      icon: Trophy,
      color: 'from-blue-500 to-cyan-400',
      link: '/tournaments',
      action: 'primary'
    },
    {
      title: 'Watch Live',
      description: 'Watch ongoing tournaments',
      icon: Play,
      color: 'from-red-500 to-pink-400',
      link: '/videos',
      action: 'secondary'
    },
    {
      title: 'View Wallet',
      description: 'Manage your funds',
      icon: Wallet,
      color: 'from-green-500 to-emerald-400',
      link: '/wallet',
      action: 'secondary'
    }
  ];

  const statsCards = [
    {
      title: 'Tournaments Joined',
      value: dashboardData.userStats.tournamentsJoined || 0,
      icon: Trophy,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Tournaments Won',
      value: dashboardData.userStats.tournamentsWon || 0,
      icon: Crown,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      title: 'Total Earnings',
      value: `₹${(dashboardData.userStats.totalEarnings || 0).toLocaleString()}`,
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Current Rank',
      value: `#${dashboardData.userStats.currentRank || 'N/A'}`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    }
  ];

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
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Welcome back, {user?.username || 'Gamer'} 👋</span>
            </h1>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              Ready to dominate some tournaments today?
            </p>
          </div>

          {/* Wallet Balance Card */}
          {isAuthenticated && (
            <div className="flex justify-center mb-6">
              <div className="glass-card px-6 py-3">
                <div className="flex items-center space-x-3">
                  <Wallet className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-white/60">Wallet Balance</p>
                    <p className="text-xl font-bold text-green-400">
                      ₹{dashboardData.walletBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="group"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`glass-card-hover p-6 relative overflow-hidden ${
                      action.action === 'primary' ? 'ring-2 ring-blue-400/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
                    <p className="text-white/60">{action.description}</p>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Your Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="glass-card p-6 text-center"
                >
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-white/60">{stat.title}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* My Tournaments (for authenticated users) */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <TournamentSlots />
          </motion.div>
        )}

        {/* Upcoming Tournaments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: isAuthenticated ? 0.4 : 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Upcoming Tournaments</h2>
            <Link
              to="/tournaments"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {dashboardData.tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.tournaments.map((tournament, index) => (
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
            <div className="glass-card p-8 text-center">
              <Calendar className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Upcoming Tournaments</h3>
              <p className="text-white/60 mb-4">Check back later for new tournaments</p>
              <Link to="/tournaments" className="btn-primary inline-flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Browse All Tournaments</span>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: isAuthenticated ? 0.5 : 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Top Players This Month</h2>
            <div className="flex items-center space-x-2 text-white/60">
              <Star className="w-4 h-4" />
              <span className="text-sm">Live Rankings</span>
            </div>
          </div>
          <LeaderboardSlider />
        </motion.div>



        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: isAuthenticated ? 0.6 : 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="glass-card p-6">
            {dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.description}</p>
                      <p className="text-white/60 text-sm">{activity.timestamp}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-green-400 font-semibold">
                        +₹{activity.amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Recent Activity</h3>
                <p className="text-white/60">Join a tournament to see your activity here</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        defaultTab={authModalTab} 
      />
    </div>
  );
};

export default Dashboard;