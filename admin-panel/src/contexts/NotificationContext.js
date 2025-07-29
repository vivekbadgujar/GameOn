import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration,
      open: true
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-hide notification
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, open: false } : notif
        )
      );
      
      // Remove from array after animation
      setTimeout(() => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
      }, 300);
    }, duration);

    return id;
  }, []);

  const hideNotification = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, open: false } : notif
      )
    );
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 300);
  }, []);

  // Convenience methods for different types
  const showSuccess = useCallback((message, duration) => {
    return showNotification(`✅ ${message}`, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message, duration) => {
    return showNotification(`❌ ${message}`, 'error', duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration) => {
    return showNotification(`⚠️ ${message}`, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration) => {
    return showNotification(`ℹ️ ${message}`, 'info', duration);
  }, [showNotification]);

  // Esports-themed notifications
  const showTournamentSuccess = useCallback((action, tournamentName) => {
    const messages = {
      create: `🏆 Successfully created tournament "${tournamentName}"`,
      update: `⚡ Successfully updated tournament "${tournamentName}"`,
      delete: `🗑️ Successfully deleted tournament "${tournamentName}"`,
      publish: `🚀 Tournament "${tournamentName}" is now live!`,
      complete: `🎉 Tournament "${tournamentName}" completed successfully`
    };
    return showSuccess(messages[action] || `✅ Tournament action completed`, 5000);
  }, [showSuccess]);

  const showTournamentError = useCallback((action, error) => {
    const messages = {
      create: `Failed to create tournament: ${error}`,
      update: `Failed to update tournament: ${error}`,
      delete: `Failed to delete tournament: ${error}`,
      publish: `Failed to publish tournament: ${error}`,
      complete: `Failed to complete tournament: ${error}`
    };
    return showError(messages[action] || `Tournament action failed: ${error}`, 6000);
  }, [showError]);

  const showVideoSuccess = useCallback((action, videoTitle) => {
    const messages = {
      add: `🎬 Successfully added video "${videoTitle}"`,
      update: `📝 Successfully updated video "${videoTitle}"`,
      delete: `🗑️ Successfully deleted video "${videoTitle}"`,
      publish: `📺 Video "${videoTitle}" is now visible`
    };
    return showSuccess(messages[action] || `✅ Video action completed`, 4000);
  }, [showSuccess]);

  const showVideoError = useCallback((action, error) => {
    const messages = {
      add: `Failed to add video: ${error}`,
      update: `Failed to update video: ${error}`,
      delete: `Failed to delete video: ${error}`,
      publish: `Failed to publish video: ${error}`
    };
    return showError(messages[action] || `Video action failed: ${error}`, 5000);
  }, [showError]);

  const value = {
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showTournamentSuccess,
    showTournamentError,
    showVideoSuccess,
    showVideoError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={notification.open}
          anchorOrigin={{ 
            vertical: 'top', 
            horizontal: 'right' 
          }}
          TransitionComponent={SlideTransition}
          style={{
            top: `${80 + (index * 70)}px`, // Stack notifications
            zIndex: 9999
          }}
          onClose={() => hideNotification(notification.id)}
        >
          <Alert
            onClose={() => hideNotification(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{
              minWidth: '300px',
              fontSize: '0.95rem',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              '& .MuiAlert-icon': {
                fontSize: '1.2rem'
              },
              '& .MuiAlert-message': {
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;