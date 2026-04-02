import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  User,
  Lock,
  Trophy,
  Play,
  HelpCircle,
  Home,
  CreditCard,
  LogIn,
  UserPlus,
  ChevronDown,
  Users,
  Film,
  Compass
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import AuthModal from '../Auth/AuthModal';
import { useAuthModal } from '../../hooks/useAuthModal';
import Logo from '../UI/Logo';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  // Desktop navigation items
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/friends', label: 'Friends', icon: Users },
    { path: '/media', label: 'Videos & Gallery', icon: Play },
    { path: '/wallet', label: 'Wallet', icon: CreditCard },
    { path: '/support', label: 'Support', icon: HelpCircle },
  ];

  // Mobile bottom nav — icon-only, 5 items
  const bottomNavItems = [
    { path: '/', icon: Home },
    { path: '/tournaments', icon: Trophy },
    { path: '/media', icon: Compass },
    { path: '/support', icon: HelpCircle },
    { path: '/profile', icon: User, isProfile: true },
  ];

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
    setIsNotificationOpen(false);
    setIsProfileOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      });
      return () => {
        socket.off('notification');
        socket.off('walletUpdate');
      };
    }
  }, [socket]);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setNotifications([]); setUnreadCount(0); return; }
      const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'https://api.gameonesport.xyz/api';
      const response = await fetch(`${apiUrl}/user/notifications`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setNotifications(data.data || data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]); setUnreadCount(0);
    }
  };

  const handleLogout = () => { logout(); router.push('/login'); setIsProfileOpen(false); };

  const markNotificationsAsRead = () => {
    setUnreadCount(0);
    const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'https://api.gameonesport.xyz/api';
    fetch(`${apiUrl}/user/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
    }).catch(() => {});
  };

  if (router.pathname === '/login' || router.pathname === '/register') return null;

  const renderLockedBadge = () => (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
      <Lock className="w-3 h-3" /><span>Soon</span>
    </span>
  );

  return (
    <>
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl border-b border-white/10">
        <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className="container-custom">

          {/* Desktop Header */}
          <div className="hidden min-h-16 items-center justify-between gap-3 py-2 md:flex">
            <Link href="/" className="flex min-w-0 items-center"><Logo size="md" showText={true} /></Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.path;
                const isLocked = lockedNavItems.has(item.path);
                const cls = `flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isLocked ? 'cursor-not-allowed opacity-55 text-white/50'
                  : isActive ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-400/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }`;
                if (isLocked) return (
                  <button key={item.path} type="button" disabled title="Feature coming soon" className={cls}>
                    <Lock className="w-4 h-4" /><span className="font-medium text-sm">{item.label}</span>{renderLockedBadge()}
                  </button>
                );
                return (
                  <Link key={item.path} href={item.path} className={cls}>
                    <Icon className="w-4 h-4" /><span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <button
                      onClick={() => { setIsNotificationOpen(!isNotificationOpen); if (!isNotificationOpen) markNotificationsAsRead(); }}
                      className="relative min-h-[44px] min-w-[44px] rounded-xl p-2 hover:bg-white/10 transition-colors duration-300"
                    >
                      <Bell className="w-5 h-5 text-white/70" />
                      {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>
                    <AnimatePresence>
                      {isNotificationOpen && (
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                          <div className="p-4 border-b border-white/10"><h3 className="text-white font-semibold">Notifications</h3></div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((n, i) => (
                              <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div className="flex items-start space-x-3">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h4 className="text-white font-medium text-sm">{n.title}</h4>
                                    <p className="text-white/60 text-xs mt-1">{n.message}</p>
                                    <p className="text-white/40 text-xs mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="p-8 text-center"><Bell className="w-12 h-12 text-white/20 mx-auto mb-3" /><p className="text-white/60">No notifications yet</p></div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Link href="/profile" className="flex min-h-[44px] items-center space-x-2 rounded-xl p-2 hover:bg-white/10 transition-colors duration-300">
                    <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-md">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="hidden sm:block font-medium text-white text-sm">{user?.username || 'User'}</span>
                  </Link>
                </>
              ) : (
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="hidden min-h-[44px] items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl sm:flex">
                    <UserPlus className="w-4 h-4" /><span className="font-medium text-sm">Join GameOn</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 glass-card backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden z-50">
                        <div className="p-4 border-b border-white/10">
                          <h3 className="text-white font-semibold mb-1">Welcome to GameOn!</h3>
                          <p className="text-white/60 text-sm">Join India&apos;s premier gaming platform</p>
                        </div>
                        <div className="p-2">
                          <button onClick={() => { openLoginModal(); setIsProfileOpen(false); }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 text-left group">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors"><LogIn className="w-4 h-4 text-blue-400" /></div>
                            <div><div className="text-white font-medium">Login</div><div className="text-white/60 text-xs">Access your account</div></div>
                          </button>
                          <button onClick={() => { openRegisterModal(); setIsProfileOpen(false); }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 text-left group">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors"><UserPlus className="w-4 h-4 text-purple-400" /></div>
                            <div><div className="text-white font-medium">Sign Up</div><div className="text-white/60 text-xs">Create new account</div></div>
                          </button>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-t border-white/10">
                          <div className="flex items-center space-x-2 text-xs text-white/60"><Trophy className="w-3 h-3" /><span>Join 50,000+ gamers competing daily</span></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Header — logo + notification only */}
          <div className="flex min-h-14 items-center justify-between gap-3 py-2 md:hidden">
            <Link href="/" className="flex min-w-0 items-center"><Logo size="md" showText={true} /></Link>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => { setIsNotificationOpen(!isNotificationOpen); if (!isNotificationOpen) markNotificationsAsRead(); }}
                    className="relative flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
                    <Bell className="w-5 h-5 text-white/80" />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-4 border-b border-white/10"><h3 className="text-white font-semibold">Notifications</h3></div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? notifications.map((n, i) => (
                            <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                              <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm">{n.title}</h4>
                                  <p className="text-white/60 text-xs mt-1">{n.message}</p>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="p-8 text-center"><Bell className="w-12 h-12 text-white/20 mx-auto mb-3" /><p className="text-white/60">No notifications</p></div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button onClick={openLoginModal} className="flex min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                  Login
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </header>

      {/* ── Mobile Bottom Nav — Icon-only, Premium ── */}
      <nav className="btm-nav md:hidden" id="bottom-nav">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/'
            ? router.pathname === '/'
            : router.pathname === item.path || router.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              href={item.isProfile && !isAuthenticated ? '#' : item.path}
              onClick={(e) => { if (item.isProfile && !isAuthenticated) { e.preventDefault(); openLoginModal(); } }}
              className={`btm-nav-item ${isActive ? 'btm-nav-active' : ''}`}
            >
              {item.isProfile && isAuthenticated && user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className={`w-[26px] h-[26px] rounded-full object-cover ${isActive ? 'ring-[2px] ring-blue-400' : 'ring-1 ring-white/20'}`} />
              ) : (
                <Icon className="btm-nav-icon" strokeWidth={isActive ? 2.4 : 1.8} />
              )}
              {isActive && <span className="btm-nav-dot" />}
            </Link>
          );
        })}
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} defaultTab={authModalTab} />
    </>
  );
};

export default Header;
