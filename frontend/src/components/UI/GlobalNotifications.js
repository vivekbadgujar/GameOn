import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const GlobalNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for token expiration events
    const handleTokenExpired = (event) => {
      const message = event.detail?.message || 'Your session has expired. Please login again.';
      addNotification(message, 'error', 5000);
    };

    // Listen for other global events
    const handleGlobalSuccess = (event) => {
      addNotification(event.detail.message, 'success', 3000);
    };

    const handleGlobalError = (event) => {
      addNotification(event.detail.message, 'error', 5000);
    };

    const handleGlobalInfo = (event) => {
      addNotification(event.detail.message, 'info', 4000);
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    window.addEventListener('globalSuccess', handleGlobalSuccess);
    window.addEventListener('globalError', handleGlobalError);
    window.addEventListener('globalInfo', handleGlobalInfo);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
      window.removeEventListener('globalSuccess', handleGlobalSuccess);
      window.removeEventListener('globalError', handleGlobalError);
      window.removeEventListener('globalInfo', handleGlobalInfo);
    };
  }, []);

  const addNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-100';
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-100';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-100';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-100';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`glass-card p-4 border ${getNotificationStyles(notification.type)} shadow-lg`}
          >
            <div className="flex items-start space-x-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GlobalNotifications;