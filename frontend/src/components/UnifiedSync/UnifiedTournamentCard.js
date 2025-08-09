/**
 * Unified Tournament Card
 * Enhanced tournament card with real-time sync capabilities
 */

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import useUnifiedApi from '../../hooks/useUnifiedApi';
import './UnifiedTournamentCard.css';

const UnifiedTournamentCard = ({ tournament: initialTournament, onJoin, onView }) => {
  const [tournament, setTournament] = useState(initialTournament);
  const [isJoining, setIsJoining] = useState(false);
  const [userParticipation, setUserParticipation] = useState(null);
  
  const { user } = useAuth();
  const { lastMessage, joinTournament, isConnected } = useSocket();
  const { showNotification } = useNotification();
  const { tournaments, loading } = useUnifiedApi();

  useEffect(() => {
    // Listen for real-time tournament updates
    if (lastMessage && lastMessage.type === 'tournament_sync') {
      const { data } = lastMessage;
      if (data.tournamentId === tournament._id) {
        setTournament(prev => ({
          ...prev,
          ...data.data,
          currentParticipants: data.data.currentParticipants || prev.currentParticipants,
          participants: data.data.participants || prev.participants
        }));

        // Check if current user joined
        if (data.type === 'tournament_joined' && data.data.userJoined?.userId === user?.id) {
          setUserParticipation({
            slotNumber: data.data.userJoined.slotNumber,
            joinedAt: data.data.userJoined.joinedAt
          });
          showNotification('Tournament Joined!', `You successfully joined ${tournament.title}`, 'success');
        }
      }
    }
  }, [lastMessage, tournament._id, user?.id, tournament.title, showNotification]);

  useEffect(() => {
    // Check if user is already participating
    if (user && tournament.participants) {
      const participation = tournament.participants.find(p => 
        p.user === user.id || p.user?._id === user.id
      );
      setUserParticipation(participation);
    }
  }, [user, tournament.participants]);

  const handleJoinTournament = async () => {
    if (!user) {
      showNotification('Login Required', 'Please login to join tournaments', 'warning');
      return;
    }

    if (userParticipation) {
      showNotification('Already Joined', 'You have already joined this tournament', 'info');
      return;
    }

    setIsJoining(true);
    
    try {
      // Join tournament via unified API
      const response = await tournaments.join(tournament._id, {
        paymentData: null // Handle payment separately if needed
      });

      if (response.success) {
        // Join socket room for real-time updates
        if (isConnected) {
          joinTournament(tournament._id);
        }

        // Update local state
        setUserParticipation({
          slotNumber: response.data.slotNumber,
          joinedAt: new Date().toISOString()
        });

        setTournament(prev => ({
          ...prev,
          currentParticipants: prev.currentParticipants + 1
        }));

        showNotification(
          'Tournament Joined!', 
          `Successfully joined ${tournament.title}`, 
          'success'
        );

        if (onJoin) {
          onJoin(tournament, response.data);
        }
      }
    } catch (error) {
      console.error('Failed to join tournament:', error);
      showNotification(
        'Join Failed', 
        error.message || 'Failed to join tournament', 
        'error'
      );
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusColor = () => {
    switch (tournament.status) {
      case 'upcoming': return '#4CAF50';
      case 'live': return '#FF6B35';
      case 'completed': return '#9E9E9E';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = () => {
    switch (tournament.status) {
      case 'upcoming': return '⏰';
      case 'live': return '🔴';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const participationPercentage = tournament.maxParticipants > 0 
    ? (tournament.currentParticipants / tournament.maxParticipants) * 100 
    : 0;

  const isAlmostFull = participationPercentage >= 80;
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const canJoin = tournament.status === 'upcoming' && !isFull && !userParticipation;

  return (
    <div className={`unified-tournament-card ${tournament.status}`}>
      {/* Real-time sync indicator */}
      {isConnected && (
        <div className="sync-indicator connected" title="Real-time sync active">
          🟢
        </div>
      )}

      {/* Urgent indicators */}
      {isAlmostFull && tournament.status === 'upcoming' && (
        <div className="urgent-indicator">
          🔥 Filling Fast!
        </div>
      )}
      
      {tournament.status === 'live' && (
        <div className="live-indicator">
          <div className="live-dot"></div>
          LIVE NOW
        </div>
      )}

      <div className="tournament-header">
        <div className="tournament-info">
          <div className="game-icon">
            <img 
              src={`/images/games/${tournament.game?.toLowerCase()}.png`} 
              alt={tournament.game}
              onError={(e) => {
                e.target.src = '/images/games/default.png';
              }}
            />
          </div>
          <div className="tournament-details">
            <h3 className="tournament-title">{tournament.title}</h3>
            <p className="tournament-game">{tournament.game}</p>
          </div>
        </div>
        
        <div className="tournament-status">
          <span 
            className={`status-badge ${tournament.status}`}
            style={{ backgroundColor: getStatusColor() }}
          >
            {getStatusIcon()} {tournament.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="tournament-meta">
        <div className="meta-item">
          <span className="meta-icon">💰</span>
          <span className="meta-text">₹{tournament.entryFee}</span>
        </div>
        
        <div className="meta-item">
          <span className="meta-icon">🏆</span>
          <span className="meta-text">₹{tournament.prizePool}</span>
        </div>
        
        <div className="meta-item">
          <span className="meta-icon">⏰</span>
          <span className="meta-text">{formatDate(tournament.startDate)}</span>
        </div>
      </div>

      <div className="participation-info">
        <div className="participation-header">
          <span className="participation-text">
            {tournament.currentParticipants}/{tournament.maxParticipants} Players
          </span>
          <span 
            className={`participation-percentage ${isAlmostFull ? 'warning' : 'normal'}`}
          >
            {Math.round(participationPercentage)}%
          </span>
        </div>
        
        <div className="participation-bar">
          <div 
            className={`participation-fill ${isAlmostFull ? 'warning' : 'normal'}`}
            style={{ width: `${participationPercentage}%` }}
          ></div>
        </div>
      </div>

      {userParticipation && (
        <div className="user-participation">
          <div className="participation-badge">
            ✅ Joined - Slot #{userParticipation.slotNumber}
          </div>
          <div className="participation-time">
            Joined: {formatDate(userParticipation.joinedAt)}
          </div>
        </div>
      )}

      <div className="tournament-actions">
        {canJoin && (
          <button 
            className="action-button join-button"
            onClick={handleJoinTournament}
            disabled={isJoining || loading}
          >
            {isJoining ? (
              <>
                <div className="loading-spinner"></div>
                Joining...
              </>
            ) : (
              <>
                <span className="button-icon">➕</span>
                Join Tournament
              </>
            )}
          </button>
        )}
        
        {tournament.status === 'live' && (
          <button 
            className="action-button live-button"
            onClick={() => onView && onView(tournament)}
          >
            <span className="button-icon">▶️</span>
            View Live
          </button>
        )}
        
        {isFull && tournament.status === 'upcoming' && (
          <button className="action-button full-button" disabled>
            <span className="button-icon">🚫</span>
            Tournament Full
          </button>
        )}
        
        {tournament.status === 'completed' && (
          <button 
            className="action-button completed-button"
            onClick={() => onView && onView(tournament)}
          >
            <span className="button-icon">🏆</span>
            View Results
          </button>
        )}

        <button 
          className="action-button view-button"
          onClick={() => onView && onView(tournament)}
        >
          <span className="button-icon">👁️</span>
          View Details
        </button>
      </div>

      {/* Tournament type and map */}
      <div className="tournament-tags">
        <span className="tag type-tag">
          {tournament.tournamentType || 'Solo'}
        </span>
        
        {tournament.map && (
          <span className="tag map-tag">
            {tournament.map}
          </span>
        )}
      </div>
    </div>
  );
};

export default UnifiedTournamentCard;