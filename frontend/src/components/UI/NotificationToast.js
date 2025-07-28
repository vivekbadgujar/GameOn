import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { getNotifications, markNotificationAsRead } from '../../services/api';

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const { lastMessage } = useSocket();

  // Fetch existing notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        if (data?.success) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Handle real-time notifications
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'newNotification') {
      const notification = lastMessage.data;
      console.log('New notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast
      setCurrentNotification(notification);
      setShowToast(true);
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
        setCurrentNotification(null);
      }, 5000);
    }
  }, [lastMessage]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleCloseToast = () => {
    setShowToast(false);
    setCurrentNotification(null);
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && currentNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <div className="bg-card-bg border border-accent-blue/30 rounded-lg shadow-lg p-4 animate-slide-in-right">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-primary mb-1">
                  {currentNotification.title}
                </h4>
                <p className="text-secondary text-sm">
                  {currentNotification.message}
                </p>
                {currentNotification.priority === 'high' && (
                  <span className="inline-block mt-2 px-2 py-1 bg-accent-red/20 text-accent-red text-xs rounded-full">
                    High Priority
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseToast}
                className="ml-2 text-secondary hover:text-primary transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Bell Icon (optional - can be added to header) */}
      <div className="relative">
        {notifications.filter(n => !n.isRead).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.filter(n => !n.isRead).length}
          </span>
        )}
      </div>
    </>
  );
};

export default NotificationToast;