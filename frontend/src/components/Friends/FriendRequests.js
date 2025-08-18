import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheck, FiX, FiClock, FiUser, FiStar, FiTrophy,
  FiUserCheck, FiUserX, FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const FriendRequests = ({ receivedRequests, sentRequests, onAccept, onDecline, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('received');
  const [processing, setProcessing] = useState(new Set());

  const handleAccept = async (requestId) => {
    setProcessing(prev => new Set(prev).add(requestId));
    try {
      await onAccept(requestId);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDecline = async (requestId) => {
    setProcessing(prev => new Set(prev).add(requestId));
    try {
      await onDecline(requestId);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast.success('Friend request cancelled');
        onRefresh();
      } else {
        throw new Error('Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast.error('Failed to cancel friend request');
    }
  };

  const ReceivedRequests = () => {
    if (receivedRequests.length === 0) {
      return (
        <div className="glass-card p-8 text-center">
          <FiUserCheck className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Friend Requests</h3>
          <p className="text-gray-500">
            You don't have any pending friend requests at the moment.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {receivedRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={request.requester.avatar || '/default-avatar.png'}
                  alt={request.requester.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {request.requester.displayName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    @{request.requester.username}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-sm">
                    <div className="flex items-center space-x-1">
                      <FiStar className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400">Lvl {request.requester.stats.level}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">BGMI:</span>
                      <span className="text-white">{request.requester.gameProfile.bgmiName}</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {request.requester.gameProfile.tier}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Sent {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleAccept(request.id)}
                  disabled={processing.has(request.id)}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Accept"
                >
                  {processing.has(request.id) ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiCheck className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDecline(request.id)}
                  disabled={processing.has(request.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Decline"
                >
                  {processing.has(request.id) ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiX className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const SentRequests = () => {
    if (sentRequests.length === 0) {
      return (
        <div className="glass-card p-8 text-center">
          <FiUserX className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Sent Requests</h3>
          <p className="text-gray-500">
            You haven't sent any friend requests recently.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sentRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={request.recipient.avatar || '/default-avatar.png'}
                  alt={request.recipient.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {request.recipient.displayName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    @{request.recipient.username}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-sm">
                    <div className="flex items-center space-x-1">
                      <FiStar className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400">Lvl {request.recipient.stats.level}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">BGMI:</span>
                      <span className="text-white">{request.recipient.gameProfile.bgmiName}</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {request.recipient.gameProfile.tier}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Sent {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-yellow-400">
                  <FiClock className="w-4 h-4" />
                  <span className="text-sm">Pending</span>
                </div>
                <button
                  onClick={() => handleCancelRequest(request.id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                  title="Cancel Request"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="glass-card p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'received'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiUserCheck className="w-4 h-4" />
            <span>Received</span>
            {receivedRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {receivedRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'sent'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiUser className="w-4 h-4" />
            <span>Sent</span>
            {sentRequests.length > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                {sentRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'received' ? <ReceivedRequests /> : <SentRequests />}
    </div>
  );
};

export default FriendRequests;