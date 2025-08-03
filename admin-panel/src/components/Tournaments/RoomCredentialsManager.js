import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  Save,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Send,
  Schedule,
  Lock,
  LockOpen,
  Refresh
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';
import dayjs from 'dayjs';

const RoomCredentialsManager = ({ tournament, onUpdate }) => {
  const { showSuccess, showError } = useNotification();
  const { socket, isConnected } = useSocket();

  // State management
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoRelease, setAutoRelease] = useState(true);
  const [manualRelease, setManualRelease] = useState(false);
  const [loading, setLoading] = useState(false);
  const [releaseDialog, setReleaseDialog] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (tournament?.roomDetails) {
      setRoomId(tournament.roomDetails.roomId || '');
      setPassword(tournament.roomDetails.password || '');
    }
  }, [tournament]);

  // Calculate release timing
  const getReleaseInfo = () => {
    if (!tournament?.startDate) return null;

    const now = dayjs();
    const startTime = dayjs(tournament.startDate);
    const autoReleaseTime = startTime.subtract(30, 'minutes');
    const lockTime = startTime.subtract(10, 'minutes');

    return {
      startTime,
      autoReleaseTime,
      lockTime,
      timeToAutoRelease: autoReleaseTime.diff(now),
      timeToLock: lockTime.diff(now),
      timeToStart: startTime.diff(now),
      isAutoReleaseTime: now.isAfter(autoReleaseTime),
      isLockTime: now.isAfter(lockTime),
      isStarted: now.isAfter(startTime)
    };
  };

  // Handle save room credentials
  const handleSaveCredentials = async () => {
    if (!roomId.trim() || !password.trim()) {
      showError('Please enter both Room ID and Password');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tournaments/${tournament._id}/set-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: roomId.trim(),
          password: password.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to save room credentials');

      showSuccess('Room credentials saved successfully');
      onUpdate?.();

    } catch (error) {
      showError(error.message || 'Failed to save room credentials');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual release
  const handleManualRelease = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tournaments/${tournament._id}/release-room`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to release room credentials');

      showSuccess('Room credentials released to all players');
      setReleaseDialog(false);
      onUpdate?.();

    } catch (error) {
      showError(error.message || 'Failed to release room credentials');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard`);
  };

  // Format time remaining
  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Now';
    
    const duration = dayjs.duration(milliseconds);
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const releaseInfo = getReleaseInfo();
  const hasCredentials = tournament?.roomDetails?.roomId && tournament?.roomDetails?.password;
  const isReleased = tournament?.roomDetails?.releasedAt;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" color="primary">
            🎮 Room Credentials Manager
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? 'success.main' : 'error.main'
              }}
            />
            <Typography variant="caption">
              {isConnected ? 'Live Sync' : 'Disconnected'}
            </Typography>
          </Box>
        </Box>

        {/* Release Timing Info */}
        {releaseInfo && (
          <Alert 
            severity={releaseInfo.isStarted ? 'success' : releaseInfo.isLockTime ? 'warning' : 'info'} 
            sx={{ mb: 3 }}
          >
            <Typography variant="body2" fontWeight="bold">
              Tournament Timeline:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption">
                  Auto-release: {releaseInfo.timeToAutoRelease > 0 
                    ? `in ${formatTimeRemaining(releaseInfo.timeToAutoRelease)}`
                    : 'Available now'
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption">
                  Slot lock: {releaseInfo.timeToLock > 0 
                    ? `in ${formatTimeRemaining(releaseInfo.timeToLock)}`
                    : 'Locked'
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption">
                  Start time: {releaseInfo.timeToStart > 0 
                    ? `in ${formatTimeRemaining(releaseInfo.timeToStart)}`
                    : 'Started'
                  }
                </Typography>
              </Grid>
            </Grid>
          </Alert>
        )}

        {/* Room Credentials Form */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter BGMI room ID"
              InputProps={{
                endAdornment: roomId && (
                  <IconButton
                    onClick={() => copyToClipboard(roomId, 'Room ID')}
                    size="small"
                  >
                    <ContentCopy />
                  </IconButton>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Room Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              InputProps={{
                endAdornment: (
                  <Box display="flex" gap={1}>
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    {password && (
                      <IconButton
                        onClick={() => copyToClipboard(password, 'Password')}
                        size="small"
                      >
                        <ContentCopy />
                      </IconButton>
                    )}
                  </Box>
                )
              }}
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box display="flex" gap={2} mt={3} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveCredentials}
            disabled={loading || !roomId.trim() || !password.trim()}
          >
            Save Credentials
          </Button>

          {hasCredentials && !isReleased && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<Send />}
              onClick={() => setReleaseDialog(true)}
              disabled={loading}
            >
              Release Now
            </Button>
          )}

          {hasCredentials && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onUpdate}
            >
              Refresh Status
            </Button>
          )}
        </Box>

        {/* Current Status */}
        {hasCredentials && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom>
              Current Status:
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">Room ID:</Typography>
                  <Chip 
                    label={tournament.roomDetails.roomId} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">Status:</Typography>
                  <Chip
                    icon={isReleased ? <LockOpen /> : <Lock />}
                    label={isReleased ? 'Released' : 'Not Released'}
                    color={isReleased ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>

              {isReleased && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Released at: {dayjs(tournament.roomDetails.releasedAt).format('MMM DD, YYYY HH:mm')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {/* Participant Count */}
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            {tournament.currentParticipants} confirmed players will receive the credentials
          </Typography>
        </Box>

        {/* Manual Release Dialog */}
        <Dialog open={releaseDialog} onClose={() => setReleaseDialog(false)}>
          <DialogTitle>Release Room Credentials</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Are you sure you want to release the room credentials now?
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              This will immediately send the room ID and password to all confirmed players.
              They will be able to see the credentials in their waiting room.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReleaseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualRelease}
              variant="contained"
              color="success"
              disabled={loading}
            >
              Release Credentials
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RoomCredentialsManager;