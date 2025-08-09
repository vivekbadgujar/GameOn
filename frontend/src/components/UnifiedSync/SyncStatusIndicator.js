/**
 * Sync Status Indicator
 * Shows real-time sync status and connection info
 */

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import useUnifiedApi from '../../hooks/useUnifiedApi';
import './SyncStatusIndicator.css';

const SyncStatusIndicator = () => {
  const { isConnected, syncStatus, lastSyncTime, activeSessions, platforms } = useSocket();
  const { user } = useAuth();
  const { sync } = useUnifiedApi();
  const [showDetails, setShowDetails] = useState(false);
  const [syncData, setSyncData] = useState(null);

  useEffect(() => {
    if (isConnected && user) {
      loadSyncData();
    }
  }, [isConnected, user]);

  const loadSyncData = async () => {
    try {
      const response = await sync.getStatus();
      if (response.success) {
        setSyncData(response.data);
      }
    } catch (error) {
      console.error('Failed to load sync data:', error);
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#9E9E9E';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚫';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'connected': return 'Synced';
      case 'connecting': return 'Syncing...';
      case 'disconnected': return 'Offline';
      case 'error': return 'Sync Error';
      default: return 'Unknown';
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const syncTime = new Date(lastSyncTime);
    const diffMs = now - syncTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return syncTime.toLocaleTimeString();
  };

  const handleForceSync = async () => {
    try {
      await sync.forceSync('manual_refresh', {
        timestamp: new Date().toISOString(),
        source: 'sync_indicator'
      });
      await loadSyncData();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="sync-status-indicator">
      <div 
        className={`sync-status-badge ${syncStatus}`}
        onClick={() => setShowDetails(!showDetails)}
        title={`Sync Status: ${getStatusText()}`}
      >
        <span className="sync-icon">{getStatusIcon()}</span>
        <span className="sync-text">{getStatusText()}</span>
        {activeSessions > 1 && (
          <span className="session-count">{activeSessions}</span>
        )}
      </div>

      {showDetails && (
        <div className="sync-details-popup">
          <div className="sync-details-header">
            <h4>Sync Status</h4>
            <button 
              className="close-button"
              onClick={() => setShowDetails(false)}
            >
              ×
            </button>
          </div>
          
          <div className="sync-details-content">
            <div className="sync-info-row">
              <span className="label">Status:</span>
              <span className={`value status-${syncStatus}`}>
                {getStatusIcon()} {getStatusText()}
              </span>
            </div>
            
            <div className="sync-info-row">
              <span className="label">Last Sync:</span>
              <span className="value">{formatLastSync()}</span>
            </div>
            
            <div className="sync-info-row">
              <span className="label">Active Sessions:</span>
              <span className="value">{activeSessions || 1}</span>
            </div>
            
            {platforms.length > 0 && (
              <div className="sync-info-row">
                <span className="label">Platforms:</span>
                <span className="value">
                  {platforms.map(platform => (
                    <span key={platform} className={`platform-badge ${platform}`}>
                      {platform}
                    </span>
                  ))}
                </span>
              </div>
            )}
            
            {syncData && (
              <>
                <div className="sync-info-row">
                  <span className="label">User ID:</span>
                  <span className="value">{syncData.userId}</span>
                </div>
                
                <div className="sync-info-row">
                  <span className="label">Online:</span>
                  <span className="value">
                    {syncData.isOnline ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <div className="sync-details-actions">
            <button 
              className="sync-action-button force-sync"
              onClick={handleForceSync}
              disabled={!isConnected}
            >
              🔄 Force Sync
            </button>
            
            <button 
              className="sync-action-button refresh-data"
              onClick={loadSyncData}
            >
              📊 Refresh Data
            </button>
          </div>
          
          <div className="sync-help">
            <p>
              <strong>Real-time Sync:</strong> Your data syncs automatically across 
              all devices. Green means everything is up to date!
            </p>
            {platforms.includes('mobile') && (
              <p>
                <strong>Mobile App:</strong> Changes made on mobile will appear 
                here instantly.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;