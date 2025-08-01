import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  User, 
  Wallet, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Trophy,
  Play,
  HelpCircle,
  Home,
  Video,
  CreditCard,
  LogIn,
  UserPlus,
  Image,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import AuthModal from '../Auth/AuthModal';
import { useAuthModal } from '../../hooks/useAuthModal';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const profileRef = useRef(null);
  
  const { 
    isAuthModalOpen, 
    authModalTab, 
    openAuthModal, 
    closeAuthModal, 
    openLoginModal, 
    openRegisterModal 
  } = useAuthModal();

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/media', label: 'Videos & Gallery', icon: Play },
    { path: '/wallet', label: 'Wallet', icon: CreditCard },
    { path: '/support', label: 'Support', icon: HelpCircle },
  ];

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      });

      socket.on('walletUpdate', (balance) => {
        setWalletBalance(balance);
      });

      return () => {
        socket.off('notification');
        socket.off('walletUpdate');
      };
    }
  }, [socket]);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchNotifications();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setWalletBalance(data.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  const markNotificationsAsRead = () => {
    setUnreadCount(0);
    // API call to mark as read
    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  };

  // Don't show header on auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10"
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">GameOn</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/10 text-blue-400' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance */}
                <div className="hidden sm:flex items-center space-x-2 glass-card px-4 py-2">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-green-400">
                    ₹{walletBalance.toLocaleString()}
                  </span>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={markNotificationsAsRead}
                    className="relative p-2 rounded-xl hover:bg-white/10 transition-colors duration-300"
                  >
                    <Bell className="w-5 h-5 text-white/70" />
                    {unreadCount > 0 && (
                      <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-colors duration-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:block font-medium text-white">
                      {user?.username || 'User'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="profile-dropdown"
                  >
                    <div className="space-y-2">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="font-semibold text-white">{user?.username}</p>
                        <p className="text-sm text-white/60">{user?.email}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors duration-300"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      
                      <Link
                        to="/wallet"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors duration-300"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Wallet</span>
                      </Link>
                      
                      <button
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors duration-300 w-full text-left"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      <div className="border-t border-white/10 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors duration-300 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                {/* Single Auth Button with Dropdown for Non-authenticated Users */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="font-medium">Join GameOn</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-white/10">
                          <h3 className="text-white font-semibold mb-1">Welcome to GameOn!</h3>
                          <p className="text-white/60 text-sm">Join India's premier gaming platform</p>
                        </div>
                        
                        <div className="p-2">
                          <button
                            onClick={() => {
                              openLoginModal();
                              setIsProfileOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 text-left group"
                          >
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                              <LogIn className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium">Login</div>
                              <div className="text-white/60 text-xs">Access your account</div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              openRegisterModal();
                              setIsProfileOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 text-left group"
                          >
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                              <UserPlus className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium">Sign Up</div>
                              <div className="text-white/60 text-xs">Create new account</div>
                            </div>
                          </button>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-t border-white/10">
                          <div className="flex items-center space-x-2 text-xs text-white/60">
                            <Trophy className="w-3 h-3" />
                            <span>Join 50,000+ gamers competing daily</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mobile-nav-content"
          >
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/10 text-blue-400' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Wallet Balance */}
              <div className="flex items-center justify-between px-4 py-3 glass-card">
                <div className="flex items-center space-x-3">
                  <Wallet className="w-5 h-5 text-green-400" />
                  <span className="font-medium">Wallet Balance</span>
                </div>
                <span className="font-bold text-green-400">
                  ₹{walletBalance.toLocaleString()}
                </span>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        defaultTab={authModalTab} 
      />
    </motion.header>
  );
};

export default Header;