import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  X, 
  Users, 
  Smile,
  Image,
  Paperclip,
  MoreVertical,
  Flag,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatAPI } from '../../services/api';

const TournamentChat = ({ tournamentId, isVisible, onToggle, participantCount = 0 }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat messages when component mounts
  useEffect(() => {
    if (isVisible && tournamentId) {
      loadMessages();
      joinTournamentRoom();
    }
    
    return () => {
      if (socket && tournamentId) {
        socket.emit('leave_tournament_chat', { tournamentId });
      }
    };
  }, [isVisible, tournamentId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.tournamentId === tournamentId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleUserJoined = (data) => {
      if (data.tournamentId === tournamentId) {
        setOnlineUsers(data.onlineUsers);
      }
    };

    const handleUserLeft = (data) => {
      if (data.tournamentId === tournamentId) {
        setOnlineUsers(data.onlineUsers);
      }
    };

    socket.on('tournament_message', handleNewMessage);
    socket.on('user_joined_chat', handleUserJoined);
    socket.on('user_left_chat', handleUserLeft);

    return () => {
      socket.off('tournament_message', handleNewMessage);
      socket.off('user_joined_chat', handleUserJoined);
      socket.off('user_left_chat', handleUserLeft);
    };
  }, [socket, tournamentId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getTournamentMessages(tournamentId);
      if (response.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinTournamentRoom = () => {
    if (socket && user) {
      socket.emit('join_tournament_chat', {
        tournamentId,
        userId: user._id,
        username: user.username || user.displayName,
        gamerTag: user.gameProfile?.bgmiId || user.username
      });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    const messageData = {
      tournamentId,
      userId: user._id,
      message: newMessage.trim(),
      type: 'text'
    };

    try {
      // Send via API
      const response = await chatAPI.sendTournamentMessage(tournamentId, messageData);
      
      if (response.success) {
        // Emit via socket for real-time updates
        if (socket) {
          socket.emit('send_tournament_message', {
            ...messageData,
            username: user.username || user.displayName,
            gamerTag: user.gameProfile?.bgmiId || user.username,
            timestamp: new Date().toISOString()
          });
        }
        
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const isOwnMessage = (message) => {
    return message.userId === user?._id;
  };

  if (!isVisible) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-colors duration-300"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6" />
          {participantCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {participantCount > 99 ? '99+' : participantCount}
            </div>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      style={{ 
        width: '380px', 
        height: isMinimized ? '60px' : '500px',
        transition: 'height 0.3s ease-in-out'
      }}
    >
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Tournament Chat</h3>
            <p className="text-white/70 text-xs flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{onlineUsers.length} online</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/60 text-sm">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-xs">Be the first to say something!</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                    {!isOwnMessage(message) && (
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(message.username || message.gamerTag || 'U')[0].toUpperCase()}
                        </div>
                        <span className="text-white/70 text-xs font-medium">
                          {message.gamerTag || message.username}
                        </span>
                        <span className="text-white/40 text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-2xl ${
                      isOwnMessage(message)
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white/10 text-white rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      {isOwnMessage(message) && (
                        <div className="text-right mt-1">
                          <span className="text-white/70 text-xs">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10">
            <form onSubmit={sendMessage} className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  maxLength={500}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <button
                    type="button"
                    className="text-white/50 hover:text-white/70 transition-colors duration-200"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            
            <div className="flex items-center justify-between mt-2 text-xs text-white/50">
              <span>Press Enter to send</span>
              <span>{newMessage.length}/500</span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default TournamentChat;