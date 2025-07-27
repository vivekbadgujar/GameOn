import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, Home, Trophy, Video, Users, Menu, LogOut, Settings } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

const navLinks = [
  { name: 'Home', to: '/', icon: <Home size={20} /> },
  { name: 'Tournaments', to: '/tournaments', icon: <Trophy size={20} /> },
  { name: 'Videos', to: '/videos', icon: <Video size={20} /> },
  { name: 'Players', to: '/players', icon: <Users size={20} /> },
];

const userMenu = [
  { name: 'Profile', to: '/profile', icon: <User size={18} /> },
  { name: 'Settings', to: '/settings', icon: <Settings size={18} /> },
  { name: 'Logout', to: '/logout', icon: <LogOut size={18} /> },
];

export default function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef();
  const profileRef = useRef();
  const { lastMessage } = useSocket();

  // Listen for real-time notifications
  useEffect(() => {
    if (!lastMessage) return;
    if (['tournamentAdded','tournamentUpdated','tournamentDeleted','broadcastSent','broadcastScheduled'].includes(lastMessage.type)) {
      setNotifications(prev => [{
        id: Date.now(),
        type: lastMessage.type,
        data: lastMessage.data,
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));
    }
  }, [lastMessage]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-30 bg-glass backdrop-blur-xl border-b border-border shadow-xl">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-blue to-accent-purple shadow-neon flex items-center justify-center">
            <span className="font-display text-2xl text-primary">G</span>
          </div>
          <span className="font-display text-xl font-bold text-primary hidden sm:block">GameOn</span>
        </Link>
        <nav className="hidden md:flex gap-2">
          {navLinks.map(link => (
            <Link key={link.name} to={link.to} className="flex items-center gap-2 px-4 py-2 rounded-xl text-secondary hover:text-primary hover:bg-glass transition-all font-medium">
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button className="relative p-2 rounded-full hover:bg-glass transition" onClick={() => setNotifOpen(v => !v)}>
              <Bell size={22} className="text-accent-blue" />
              {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-accent-pink rounded-full animate-pulse" />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-glass rounded-xl shadow-xl border border-border z-50 animate-fade-in">
                <div className="p-4 border-b border-border font-bold text-primary">Notifications</div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="p-4 text-secondary text-center">No notifications</li>
                  ) : notifications.map(n => (
                    <li key={n.id} className="p-4 border-b border-border last:border-0 hover:bg-glass transition-all">
                      <div className="font-semibold text-accent-blue mb-1">{n.type.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-sm text-secondary line-clamp-2">{JSON.stringify(n.data)}</div>
                      <div className="text-xs text-muted mt-1">{n.time}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button className="p-2 rounded-full hover:bg-glass transition" onClick={() => setProfileOpen(v => !v)}>
              <User size={22} className="text-accent-green" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-glass rounded-xl shadow-xl border border-border z-50 animate-fade-in">
                <ul>
                  {userMenu.map(item => (
                    <li key={item.name}>
                      <Link to={item.to} className="flex items-center gap-3 px-4 py-3 hover:bg-glass rounded-xl transition-all text-primary">
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button className="md:hidden p-2 rounded-full hover:bg-glass transition">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
} 