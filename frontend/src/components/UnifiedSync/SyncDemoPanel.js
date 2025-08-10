/**
 * Sync Demo Panel
 * Demonstrates real-time sync between web and mobile
 */

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import useUnifiedApi from '../../hooks/useUnifiedApi';
import './SyncDemoPanel.css';

const SyncDemoPanel = () => {
  const { user } = useAuth();
  const { isConnected, lastMessage, activeSessions, platforms } = useSocket();
  const { wallet, tournaments, sync } = useUnifiedApi();
  
  const [demoActions, setDemoActions] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    // Listen for real-time updates
    if (lastMessage) {
      const timestamp = new Date().toLocaleTimeString();
      
      switch (lastMessage.type) {
        case 'wallet_sync':
          addDemoAction(`💰 Wallet updated: ₹${lastMessage.data.balance}`, 'wallet', timestamp);
          setWalletBalance(lastMessage.data.balance);
          break;
        case 'tournament_sync':
          addDemoAction(`🎮 Tournament: ${lastMessage.data.title}`, 'tournament', timestamp);
          break;
        case 'user_sync':
          addDemoAction(`👤 User data synced`, 'user', timestamp);
          break;
        default:
          if (lastMessage.type.includes('sync')) {
            addDemoAction(`🔄 ${lastMessage.type} received`, 'sync', timestamp);
          }
      }
    }
  }, [lastMessage]);

  const addDemoAction = (message, type, timestamp) => {
    setDemoActions(prev => [
      { id: Date.now(), message, type, timestamp },
      ...prev.slice(0, 9) // Keep only last 10 actions
    ]);
  };

  const simulateWalletUpdate = async () => {
    try {
      const newAmount = Math.floor(Math.random() * 500) + 100;
      await wallet.addMoney(newAmount, 'demo');
      addDemoAction(`💰 Demo: Added ₹${newAmount} to wallet`, 'demo', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Demo wallet update failed:', error);
    }
  };

  const simulateTournamentJoin = async () => {
    try {
      // Get available tournaments
      const response = await tournaments.getAll({ status: 'upcoming', limit: 1 });
      if (response.success && response.data.tournaments.length > 0) {
        const tournament = response.data.tournaments[0];
        await tournaments.join(tournament._id);
        addDemoAction(`🎮 Demo: Joined ${tournament.title}`, 'demo', new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Demo tournament join failed:', error);
    }
  };

  const forceSync = async () => {
    try {
      await sync.forceSync('demo_sync', { timestamp: new Date().toISOString() });
      addDemoAction(`🔄 Demo: Force sync triggered`, 'demo', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  if (!user) return null;

  return (
    <div className={`sync-demo-panel ${isVisible ? 'visible' : 'collapsed'}`}>
      <div className="demo-header">
        <button 
          className="demo-toggle"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? '📱 Hide Sync Demo' : '📱 Show Sync Demo'}
        </button>
      </div>

      {isVisible && (
        <div className="demo-content">
          <div className="demo-status">
            <h3>🔄 Real-time Sync Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Connection:</span>
                <span className={`status-value ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Active Sessions:</span>
                <span className="status-value">{activeSessions || 1}</span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Platforms:</span>
                <span className="status-value">
                  {platforms.map(platform => (
                    <span key={platform} className={`platform-tag ${platform}`}>
                      {platform}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>

          <div className="demo-actions">
            <h4>🎮 Test Sync Actions</h4>
            <p className="demo-description">
              Try these actions and see them sync instantly on your mobile app!
            </p>
            
            <div className="action-buttons">
              <button 
                className="action-button wallet-action"
                onClick={simulateWalletUpdate}
                disabled={!isConnected}
              >
                💰 Add Money (Demo)
              </button>
              
              <button 
                className="action-button tournament-action"
                onClick={simulateTournamentJoin}
                disabled={!isConnected}
              >
                🎮 Join Tournament (Demo)
              </button>
              
              <button 
                className="action-button sync-action"
                onClick={forceSync}
                disabled={!isConnected}
              >
                🔄 Force Sync
              </button>
            </div>
          </div>

          <div className="demo-log">
            <h4>📋 Real-time Activity Log</h4>
            <div className="log-container">
              {demoActions.length === 0 ? (
                <div className="log-empty">
                  <p>No sync activities yet. Try the demo actions above!</p>
                </div>
              ) : (
                demoActions.map(action => (
                  <div key={action.id} className={`log-item ${action.type}`}>
                    <span className="log-time">{action.timestamp}</span>
                    <span className="log-message">{action.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="demo-instructions">
            <h4>📱 How to Test Cross-Platform Sync</h4>
            <ol>
              <li>
                <strong>Download the mobile app</strong> and login with the same account
              </li>
              <li>
                <strong>Keep both devices open</strong> - website and mobile app
              </li>
              <li>
                <strong>Try these actions:</strong>
                <ul>
                  <li>Add money to wallet on website → See balance update on mobile</li>
                  <li>Join tournament on mobile → See status update on website</li>
                  <li>Change profile on website → See changes on mobile</li>
                </ul>
              </li>
              <li>
                <strong>Watch the magic!</strong> Changes appear instantly on both platforms
              </li>
            </ol>
          </div>

          <div className="demo-features">
            <h4>✨ Unified Platform Features</h4>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span className="feature-text">Real-time sync &lt; 100ms</span>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                <span className="feature-text">Cross-platform consistency</span>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span className="feature-text">Multi-device sessions</span>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🔔</span>
                <span className="feature-text">Push notifications</span>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">💾</span>
                <span className="feature-text">Offline-first mobile</span>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <span className="feature-text">Secure authentication</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncDemoPanel;