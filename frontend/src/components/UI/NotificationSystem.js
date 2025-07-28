import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Wallet, Users, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const { socket, lastMessage } = useSocket();

  // Real-time updates
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'notificationAdded' || lastMessage.type === 'notificationSent') {
      setNotifications(prev => [{ ...lastMessage.data, id: lastMessage.data._id || Date.now(), timestamp: new Date() }, ...prev.slice(0, 4)]);
    } else if (lastMessage.type === 'notificationUpdated') {
      setNotifications(prev => prev.map(n => n._id === lastMessage.data._id ? { ...n, ...lastMessage.data } : n));
    } else if (lastMessage.type === 'notificationDeleted') {
      setNotifications(prev => prev.filter(n => n._id !== lastMessage.data && n.id !== lastMessage.data));
    }
  }, [lastMessage]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'tournament':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'wallet':
        return <Wallet className="w-5 h-5 text-green-400" />;
      case 'social':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'tournament':
        return 'border-yellow-400/30 bg-yellow-400/10';
      case 'wallet':
        return 'border-green-400/30 bg-green-400/10';
      case 'social':
        return 'border-blue-400/30 bg-blue-400/10';
      case 'error':
        return 'border-red-400/30 bg-red-400/10';
      case 'success':
        return 'border-green-400/30 bg-green-400/10';
      default:
        return 'border-white/20 bg-white/10';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`glass-card border ${getNotificationColor(notification.type)} p-4 relative overflow-hidden`}
          >
            {/* Close Button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full transition-colors duration-300"
            >
              <X className="w-3 h-3 text-white/60" />
            </button>

            {/* Content */}
            <div className="flex items-start space-x-3 pr-6">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-white/80 text-xs leading-relaxed">
                  {notification.message}
                </p>
                {notification.action && (
                  <button
                    onClick={notification.action.onClick}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300"
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 bg-white/30"
            />

            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;