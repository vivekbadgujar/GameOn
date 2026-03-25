import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  User,
  Lock,
  Settings,
  LogOut,
  Menu,
  X,
  Trophy,
  Play,
  HelpCircle,
  Home,
  CreditCard,
  LogIn,
  UserPlus,
  ChevronDown,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import AuthModal from '../Auth/AuthModal';
import { useAuthModal } from '../../hooks/useAuthModal';
import Logo from '../UI/Logo';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const profileRef = useRef(null);

  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openLoginModal,
    openRegisterModal
  } = useAuthModal();
  const lockedNavItems = new Set(['/friends', '/wallet']);

  // Navigation items
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/friends', label: 'Friends', icon: Users },
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationOpen(false);
    setIsProfileOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobileMenuOpen]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      });

      // Wallet updates are now handled by AuthContext

      return () => {
        socket.off('notification');
        socket.off('walletUpdate');
      };
    }
  }, [socket]);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);



  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // If no token, just set empty notifications
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'https://api.gameonesport.xyz/api';
      const response = await fetch(`${apiUrl}/user/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.data || data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set empty state on error to prevent crashes
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    setIsProfileOpen(false);
  };

  const markNotificationsAsRead = () => {
    setUnreadCount(0);
    // API call to mark all user notifications as read
    const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'https://api.gameonesport.xyz/api';
    fetch(`${apiUrl}/user/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error('Error marking notifications as read:', error);
    });
  };

  // Don't show header on auth pages
  if (router.pathname === '/login' || router.pathname === '/register') {
    return null;
  }

  const renderLockedBadge = () => (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
      <Lock className="w-3 h-3" />
      <span>Soon</span>
    </span>
  );

  const renderMobileDrawerItem = (item) => {
    const Icon = item.icon;
    const isActive = router.pathname === item.path;
    const isLocked = lockedNavItems.has(item.path);
    const className = `flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-300 ${isLocked
        ? 'cursor-not-allowed opacity-60 text-white/55 bg-white/[0.04]'
        : isActive
          ? 'border border-blue-400/20 bg-blue-500/15 text-blue-300'
          : 'text-white/80 hover:bg-white/[0.06]'
      }`;

    if (isLocked) {
      return (
        <button
          key={item.path}
          type="button"
          disabled
          title="Feature coming soon"
          className={className + " relative overflow-hidden group"}
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-medium">{item.label}</span>
          <div className="absolute inset-0 flex items-center justify-center bg-yellow-500/20 backdrop-blur-[2px] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(234,179,8,0.2)_10px,rgba(234,179,8,0.2)_20px)]">
            <span className="text-yellow-400 font-bold text-xs tracking-widest uppercase bg-gray-900/90 px-3 py-1 rounded shadow-lg border border-yellow-500/30">Coming Soon</span>
          </div>
        </button>
      );
    }

    return (
      <Link
        key={item.path}
        href={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={className}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="flex-1 font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl border-b border-white/10">
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="container-custom"
        >
          <div className="hidden min-h-16 items-center justify-between gap-3 py-2 md:flex">
            {/* Logo */}
            <Link href="/" className="flex min-w-0 items-center">
              <Logo size="md" showText={true} />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.path;
                const isLocked = lockedNavItems.has(item.path);
                const className = `flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${isLocked
                    ? 'cursor-not-allowed opacity-55 text-white/50'
                    : isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-400/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`;

                if (isLocked) {
                  return (
                    <button
                      key={item.path}
                      type="button"
                      disabled
                      title="Feature coming soon"
                      className={className}
                    >
                      <Lock className="w-4 h-4" />
                      <span className="font-medium text-sm">{item.label}</span>
                      {renderLockedBadge()}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={className}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setIsNotificationOpen(!isNotificationOpen);
                        if (!isNotificationOpen) markNotificationsAsRead();
                      }}
                      className="relative min-h-[44px] min-w-[44px] rounded-xl p-2 hover:bg-white/10 transition-colors duration-300"
                    >
                      <Bell className="w-5 h-5 text-white/70" />
                      {unreadCount > 0 && (
                        <span className="notification-badge">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>


                    <AnimatePresence>
                      {isNotificationOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="p-4 border-b border-white/10">
                            <h3 className="text-white font-semibold">Notifications</h3>
                          </div>

                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map((notification, index) => (
                                <div key={index} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <h4 className="text-white font-medium text-sm">{notification.title}</h4>
                                      <p className="text-white/60 text-xs mt-1">{notification.message}</p>
                                      <p className="text-white/40 text-xs mt-2">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                <p className="text-white/60">No notifications yet</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <Link
                      href="/profile"
                      className="flex min-h-[44px] items-center space-x-2 rounded-xl p-2 hover:bg-white/10 transition-colors duration-300"
                    >
                      <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-md">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    <span className="hidden sm:block font-medium text-white text-sm">
                      {user?.username || 'User'}
                    </span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Single Auth Button with Dropdown for Non-authenticated Users */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="hidden min-h-[44px] items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl sm:flex"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="font-medium text-sm">Join GameOn</span>
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
                        className="absolute right-0 mt-2 w-64 glass-card backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden z-50"
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
          </div>
        </div>

      <div className="flex min-h-16 items-center justify-between gap-3 py-2 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors duration-300 hover:bg-white/10"
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex min-w-0 items-center">
            <Logo size="md" showText={true} />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    if (!isNotificationOpen) markNotificationsAsRead();
                  }}
                  className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors duration-300 hover:bg-white/10"
                >
                  <Bell className="w-5 h-5 text-white/80" />
                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-white/10">
                        <h3 className="text-white font-semibold">Notifications</h3>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification, index) => (
                            <div key={index} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                              <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm">{notification.title}</h4>
                                  <p className="text-white/60 text-xs mt-1">{notification.message}</p>
                                  <p className="text-white/40 text-xs mt-2">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                            <p className="text-white/60">No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <Link
                  href="/profile"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors duration-300 hover:bg-white/10 shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </Link>
              </div>
            </>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
            >
              Login
            </button>
          )}
        </div>
      </div>
      </motion.div >
    </header >

  {/* Mobile Menu */ }
  < AnimatePresence >
  { isMobileMenuOpen && (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px] md:hidden"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-label="Close navigation overlay"
      />
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.15, ease: 'easeOut', type: 'tween' }}
        className="fixed inset-y-0 left-0 z-[80] w-[82vw] max-w-[360px] bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl md:hidden overflow-hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="min-w-0">
              <p className="text-sm uppercase tracking-[0.2em] text-white/40">Navigation</p>
              <p className="truncate text-lg font-semibold text-white">
                {isAuthenticated ? (user?.username || 'Player') : 'Welcome to GameOn'}
              </p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors duration-300 hover:bg-white/10"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <nav className="mobile-nav-content flex-1 overflow-y-auto border-0">
            {!isAuthenticated && (
              <div className="mb-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 to-cyan-500/5 p-4">
                <p className="text-sm text-white/60">Compete in daily esports tournaments.</p>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openLoginModal();
                    }}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openRegisterModal();
                    }}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </button>
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{user?.username || 'User'}</p>
                  <p className="truncate text-sm text-white/50">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-secondary min-h-[36px] px-4 py-2 text-sm shrink-0"
                >
                  Profile
                </Link>
              </div>
            )}

            <div className="space-y-2">
              {navItems
                .filter((item) => item.path !== '/')
                .map((item) => renderMobileDrawerItem(item))}
            </div>

            {isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsNotificationOpen(true);
                    markNotificationsAsRead();
                  }}
                  className="flex min-h-[48px] w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-left text-white/80 transition-all duration-300 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-white/70" />
                    <span className="font-medium">Notifications</span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-400 transition-all duration-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            )}
          </nav>

          <div className="border-t border-white/10 px-4 py-4 text-xs text-white/40">
            Swipe-free navigation drawer tuned for compact mobile screens.
          </div>
        </div>
      </motion.div>
    </>
  )}
      </AnimatePresence >

  {/* Auth Modal */ }
  < AuthModal
isOpen = { isAuthModalOpen }
onClose = { closeAuthModal }
defaultTab = { authModalTab }
  />
    </>
  );
};

export default Header;
