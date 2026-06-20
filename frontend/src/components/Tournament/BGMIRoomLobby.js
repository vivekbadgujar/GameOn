import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  SwapHoriz as SwapIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  Room as RoomIcon,
  ContentCopy as CopyIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';
import { buildSlotMovePayload } from '../../utils/slotMove';
import config from '../../config';

const API_BASE = config.API_BASE_URL || 'https://api.gameonesport.xyz/api';

const BGMIRoomLobby = ({ tournament, onClose }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const { isConnected, joinTournament, leaveTournament } = useSocket();

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [movingSlot, setMovingSlot] = useState(false);

  // Join tournament socket room
  useEffect(() => {
    if (tournament?._id && isConnected) {
      joinTournament(tournament._id);
      return () => leaveTournament(tournament._id);
    }
  }, [tournament?._id, isConnected, joinTournament, leaveTournament]);

  // Fetch room data
  const fetchRoomData = useCallback(async () => {
    if (!tournament?._id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/room-slots/tournament/${tournament._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch room data');
      }

      const data = await response.json();
      setRoomData(data.data);
    } catch (error) {
      console.error('[BGMIRoomLobby] Fetch error:', error);
      showError(error.message || 'Failed to load room data');
    } finally {
      setLoading(false);
    }
  }, [tournament?._id, showError]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Real-time updates via window events
  useEffect(() => {
    if (!tournament?._id) return;

    const handleSlotUpdate = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournament._id) return;
      if (data.roomSlot) {
        setRoomData(prev => ({ ...prev, roomSlot: data.roomSlot }));
      }
      if (data.playerId === user?._id && data.playerSlot) {
        setRoomData(prev => ({ ...prev, playerSlot: data.playerSlot }));
      }
      showInfo('Room layout updated');
    };

    const handleSlotsLocked = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournament._id) return;
      setRoomData(prev => prev ? {
        ...prev,
        roomSlot: { ...prev.roomSlot, isLocked: true, lockedAt: data.lockedAt }
      } : prev);
      showInfo('Slots have been locked');
    };

    const handleSlotsUnlocked = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournament._id) return;
      setRoomData(prev => prev ? {
        ...prev,
        roomSlot: { ...prev.roomSlot, isLocked: false }
      } : prev);
      showInfo('Slots have been unlocked');
    };

    const handleRoomSlotUpdated = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournament._id) return;
      // Admin changes: full refresh
      fetchRoomData();
    };

    window.addEventListener('slotChanged', handleSlotUpdate);
    window.addEventListener('playerAssigned', handleSlotUpdate);
    window.addEventListener('adminSlotChanged', handleSlotUpdate);
    window.addEventListener('slotsLocked', handleSlotsLocked);
    window.addEventListener('slotsUnlocked', handleSlotsUnlocked);
    window.addEventListener('roomSlotUpdated', handleRoomSlotUpdated);

    return () => {
      window.removeEventListener('slotChanged', handleSlotUpdate);
      window.removeEventListener('playerAssigned', handleSlotUpdate);
      window.removeEventListener('adminSlotChanged', handleSlotUpdate);
      window.removeEventListener('slotsLocked', handleSlotsLocked);
      window.removeEventListener('slotsUnlocked', handleSlotsUnlocked);
      window.removeEventListener('roomSlotUpdated', handleRoomSlotUpdated);
    };
  }, [tournament?._id, user?._id, fetchRoomData, showInfo]);

  // Handle slot selection
  const handleSlotClick = (teamNumber, slotNumber, slot) => {
    if (roomData?.roomSlot?.isLocked) {
      showError('Slots are locked and cannot be changed');
      return;
    }

    const isMySlot = slot?.player?._id === user?._id ||
                     slot?.player?.toString?.() === user?._id?.toString?.();

    if (isMySlot) {
      // Toggle selection
      if (selectedSlot?.teamNumber === teamNumber && selectedSlot?.slotNumber === slotNumber) {
        setSelectedSlot(null);
      } else {
        setSelectedSlot({ teamNumber, slotNumber });
      }
      return;
    }

    if (slot?.player) {
      showInfo('This slot is occupied by another player');
      return;
    }

    // Empty slot with active selection → move
    if (selectedSlot && !slot?.isLocked) {
      movePlayerToSlot(teamNumber, slotNumber);
    }
  };

  // Move player
  const movePlayerToSlot = async (toTeam, toSlotNum) => {
    if (!selectedSlot || movingSlot) return;

    try {
      setMovingSlot(true);
      const token = localStorage.getItem('token');
      const payload = buildSlotMovePayload({
        tournamentId: tournament._id,
        playerId: user?._id,
        fromSlot: roomData?.playerSlot,
        toTeam,
        toSlot: toSlotNum
      });

      const response = await fetch(`${API_BASE}/room-slots/tournament/${tournament._id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to move slot');
      }

      const data = await response.json();
      setRoomData(prev => ({
        ...prev,
        roomSlot: data.data.roomSlot,
        playerSlot: data.data.playerSlot
      }));
      setSelectedSlot(null);
      showSuccess('Slot changed successfully!');
    } catch (error) {
      console.error('[BGMIRoomLobby] Move error:', error);
      showError(error.message || 'Failed to move slot');
    } finally {
      setMovingSlot(false);
    }
  };

  const getSlotBgColor = (slot, teamNumber, slotNumber) => {
    if (slot?.isLocked) return alpha(theme.palette.error.main, 0.1);
    const isMySlot = slot?.player?._id === user?._id;
    if (isMySlot) return alpha(theme.palette.primary.main, 0.2);
    if (selectedSlot?.teamNumber === teamNumber && selectedSlot?.slotNumber === slotNumber) {
      return alpha(theme.palette.warning.main, 0.2);
    }
    if (slot?.player) return alpha(theme.palette.success.main, 0.1);
    return alpha(theme.palette.grey[300], 0.1);
  };

  const getSlotBorderColor = (slot, teamNumber, slotNumber) => {
    const isMySlot = slot?.player?._id === user?._id;
    if (isMySlot) return theme.palette.primary.main;
    if (selectedSlot?.teamNumber === teamNumber && selectedSlot?.slotNumber === slotNumber) {
      return theme.palette.warning.main;
    }
    if (slot?.player) return theme.palette.success.main;
    return theme.palette.grey[300];
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label} copied!`);
    } catch (_) {
      showError('Failed to copy');
    }
  };

  const renderSlot = (slot, teamNumber, slotNumber) => {
    const isMySlot = slot?.player?._id === user?._id ||
                     slot?.player?.toString?.() === user?._id?.toString?.();
    const isSelected = selectedSlot?.teamNumber === teamNumber && selectedSlot?.slotNumber === slotNumber;
    const isLocked = slot?.isLocked;

    return (
      <Card
        key={`${teamNumber}-${slotNumber}`}
        sx={{
          minHeight: 65,
          cursor: roomData?.roomSlot?.isLocked ? 'not-allowed' : 'pointer',
          bgcolor: getSlotBgColor(slot, teamNumber, slotNumber),
          border: 1.5,
          borderColor: getSlotBorderColor(slot, teamNumber, slotNumber),
          borderStyle: isSelected ? 'dashed' : 'solid',
          transition: 'all 0.15s ease',
          '&:hover': roomData?.roomSlot?.isLocked ? {} : {
            transform: 'scale(1.02)',
            boxShadow: 3
          },
          '&:active': { transform: 'scale(0.98)' },
          position: 'relative'
        }}
        onClick={() => handleSlotClick(teamNumber, slotNumber, slot)}
        onDoubleClick={() => handleSlotClick(teamNumber, slotNumber, slot)}
      >
        <CardContent sx={{ p: 0.75, textAlign: 'center', '&:last-child': { pb: 0.75 } }}>
          {isLocked && (
            <LockIcon
              sx={{ position: 'absolute', top: 4, right: 4, fontSize: 14, color: 'error.main' }}
            />
          )}

          {slot?.player ? (
            <>
              <Avatar
                src={slot.player.avatar}
                sx={{
                  width: 28,
                  height: 28,
                  mx: 'auto',
                  mb: 0.25,
                  bgcolor: isMySlot ? 'primary.main' : 'success.main'
                }}
              >
                {slot.player.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="caption" display="block" fontWeight="bold" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                {(slot.player.displayName || slot.player.username || '').length > 8
                  ? `${(slot.player.displayName || slot.player.username).substring(0, 8)}...`
                  : slot.player.displayName || slot.player.username
                }
              </Typography>
              {slot.player.gameProfile?.bgmiName && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1.1 }}>
                  {slot.player.gameProfile.bgmiName.length > 10
                    ? `${slot.player.gameProfile.bgmiName.substring(0, 10)}...`
                    : slot.player.gameProfile.bgmiName
                  }
                </Typography>
              )}
              {isMySlot && (
                <Chip label="YOU" size="small" color="primary" sx={{ mt: 0.25, fontSize: '0.55rem', height: 14 }} />
              )}
            </>
          ) : (
            <>
              <PersonIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.25 }} />
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                {selectedSlot ? 'Move here' : 'Empty'}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTeam = (team) => (
    <Card key={team.teamNumber} sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <GroupsIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">{team.teamName}</Typography>
            {team.captain && (
              <Chip
                label={`Captain: ${team.captain.displayName || team.captain.username}`}
                size="small"
                color="secondary"
              />
            )}
          </Box>
          <Chip
            label={`${team.slots.filter(s => s.player).length}/${team.slots.length}`}
            color={team.isComplete ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Grid container spacing={0.75}>
          {team.slots.map((slot) => (
            <Grid item xs={6} sm={3} key={slot.slotNumber}>
              <Box textAlign="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Slot {slot.slotNumber}
                </Typography>
              </Box>
              {renderSlot(slot, team.teamNumber, slot.slotNumber)}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Dialog open maxWidth="lg" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '85vh',
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <RoomIcon color="primary" />
            <Box>
              <Typography variant="h6">{tournament?.title} - Room Lobby</Typography>
              <Typography variant="caption" color="text.secondary">
                BGMI Style Slot Management
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={isConnected ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
              label={isConnected ? 'Live' : 'Connected'}
              color={isConnected ? 'success' : 'default'}
              size="small"
              variant="outlined"
            />
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Room Status */}
        <Alert
          severity={roomData?.roomSlot?.isLocked ? 'warning' : 'info'}
          sx={{ mb: 2 }}
          icon={roomData?.roomSlot?.isLocked ? <LockIcon /> : <SwapIcon />}
        >
          {roomData?.roomSlot?.isLocked
            ? 'Slots are locked! Tournament starts soon.'
            : selectedSlot
              ? `Team ${selectedSlot.teamNumber} Slot ${selectedSlot.slotNumber} selected — click an empty slot to move there`
              : 'Click on your slot to select it, then click an empty slot to move there'
          }
        </Alert>

        {/* Room Credentials */}
        {tournament?.roomDetails?.credentialsReleased && (
          <Card sx={{ mb: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
            <CardContent>
              <Typography variant="h6" color="success.main" gutterBottom>
                🎮 Room Credentials Released
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Room ID</Typography>
                      <Typography variant="h6" fontFamily="monospace">
                        {tournament.roomDetails.roomId}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => copyToClipboard(tournament.roomDetails.roomId, 'Room ID')}>
                      <CopyIcon />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Password</Typography>
                      <Typography variant="h6" fontFamily="monospace">
                        {tournament.roomDetails.password}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => copyToClipboard(tournament.roomDetails.password, 'Password')}>
                      <CopyIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Tournament Info */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Start Time</Typography>
                    <Typography variant="body2">
                      {new Date(tournament?.startDate).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <GroupsIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Players</Typography>
                    <Typography variant="body2">
                      {roomData?.roomSlot?.totalPlayers || 0}/
                      {(roomData?.roomSlot?.maxTeams || 0) * (roomData?.roomSlot?.maxPlayersPerTeam || 0)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Tournament Type</Typography>
                  <Typography variant="body2" textTransform="capitalize">
                    {tournament?.tournamentType || 'Squad'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip
                    label={tournament?.status?.toUpperCase()}
                    size="small"
                    color={tournament?.status === 'live' ? 'error' : 'primary'}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {/* Teams Grid */}
        <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
          {roomData?.roomSlot?.teams?.map(renderTeam)}
        </Box>

        {/* Loading */}
        {movingSlot && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={24} />
            <Typography ml={1} variant="body2">Moving slot...</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">Close</Button>
        {selectedSlot && (
          <Button onClick={() => setSelectedSlot(null)} variant="outlined" color="warning">
            Cancel Move
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BGMIRoomLobby;
