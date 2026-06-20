import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person,
  PersonAdd,
  SwapHoriz,
  Lock,
  LockOpen,
  Refresh,
  ExitToApp,
  ContentCopy,
  Visibility,
  VisibilityOff,
  Timer,
  Group,
  Wifi,
  WifiOff
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const BGMIWaitingRoom = ({ tournament, onLeave }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const { isConnected, joinTournament, leaveTournament } = useSocket();

  // State management
  const [participants, setParticipants] = useState([]);
  const [roomCredentials, setRoomCredentials] = useState(null);
  // slotsLocked comes ONLY from backend state, not from client-side timer
  const [slotsLocked, setSlotsLocked] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeToStart, setTimeToStart] = useState(0);

  // Join socket room when connected
  useEffect(() => {
    if (tournament?._id && isConnected) {
      joinTournament(tournament._id);
      return () => leaveTournament(tournament._id);
    }
  }, [tournament?._id, isConnected, joinTournament, leaveTournament]);

  // Real-time slot event listeners (via window events from SocketContext)
  useEffect(() => {
    if (!tournament?._id) return;

    const handleSlotChanged = (e) => {
      if (e.detail.tournamentId === tournament._id) {
        fetchParticipants();
        showInfo('Slot positions updated');
      }
    };

    const handlePlayerAssigned = (e) => {
      if (e.detail.tournamentId === tournament._id) {
        fetchParticipants();
        showInfo(`${e.detail.username || 'A player'} joined`);
      }
    };

    const handleSlotsLocked = (e) => {
      if (e.detail.tournamentId === tournament._id) {
        setSlotsLocked(true);
        showInfo('Slots are now locked! No more position changes allowed.');
      }
    };

    const handleSlotsUnlocked = (e) => {
      if (e.detail.tournamentId === tournament._id) {
        setSlotsLocked(false);
        showInfo('Slots are now unlocked!');
      }
    };

    const handleCredentialsReleased = (e) => {
      if (e.detail.tournamentId === tournament._id) {
        setRoomCredentials(e.detail.roomCredentials || tournament.roomDetails);
        showSuccess('Room credentials are now available!');
      }
    };

    const handleRoomSlotUpdated = (e) => {
      if (e.detail.tournamentId === tournament._id) {
        fetchParticipants();
      }
    };

    window.addEventListener('slotChanged', handleSlotChanged);
    window.addEventListener('playerAssigned', handlePlayerAssigned);
    window.addEventListener('slotsLocked', handleSlotsLocked);
    window.addEventListener('slotsUnlocked', handleSlotsUnlocked);
    window.addEventListener('roomCredentialsReleased', handleCredentialsReleased);
    window.addEventListener('roomSlotUpdated', handleRoomSlotUpdated);

    return () => {
      window.removeEventListener('slotChanged', handleSlotChanged);
      window.removeEventListener('playerAssigned', handlePlayerAssigned);
      window.removeEventListener('slotsLocked', handleSlotsLocked);
      window.removeEventListener('slotsUnlocked', handleSlotsUnlocked);
      window.removeEventListener('roomCredentialsReleased', handleCredentialsReleased);
      window.removeEventListener('roomSlotUpdated', handleRoomSlotUpdated);
    };
  }, [tournament?._id, showInfo, showSuccess]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    if (!tournament?._id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tournaments/${tournament._id}/participants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch participants');

      const data = await response.json();
      setParticipants(data.data.participants || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, [tournament?._id]);

  // Countdown timer (display only, does NOT lock slots)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = dayjs();
      const startTime = dayjs(tournament.startDate);
      setTimeToStart(startTime.diff(now));

      // Show credentials if available and past -30 min
      const credentialsTime = startTime.subtract(30, 'minutes');
      if (now.isAfter(credentialsTime) && tournament.roomDetails && !roomCredentials) {
        setRoomCredentials(tournament.roomDetails);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament.startDate, tournament.roomDetails, roomCredentials]);

  // Initial data fetch
  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Organize participants into teams
  const organizeIntoTeams = () => {
    const teams = [];
    const maxTeams = Math.ceil(tournament.maxParticipants / 4);

    for (let i = 0; i < maxTeams; i++) {
      const teamSlots = [];
      for (let j = 1; j <= 4; j++) {
        const slotNumber = (i * 4) + j;
        const participant = participants.find(p => p.slotNumber === slotNumber);
        teamSlots.push({ slotNumber, participant, isEmpty: !participant });
      }
      teams.push({ teamNumber: i + 1, slots: teamSlots });
    }

    return teams;
  };

  // Handle drag and drop
  const onDragEnd = async (result) => {
    if (!result.destination || slotsLocked) return;

    const sourceSlot = parseInt(result.draggableId.split('-')[1]);
    const destSlot = parseInt(result.destination.droppableId.split('-')[1]);

    if (sourceSlot !== destSlot) {
      await handleSlotSwap(sourceSlot, destSlot);
    }
  };

  // Handle slot swap
  const handleSlotSwap = async (sourceSlot, destSlot) => {
    if (slotsLocked) {
      showError('Slots are locked!');
      return;
    }

    const sourceParticipant = participants.find(p => p.slotNumber === sourceSlot);
    if (sourceParticipant?.user?._id !== user._id) {
      showError('You can only move your own slot position.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tournaments/${tournament._id}/swap-slot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceSlot, destSlot })
      });

      if (!response.ok) throw new Error('Failed to swap slots');

      showSuccess('Position changed successfully!');
      fetchParticipants();
    } catch (error) {
      showError(error.message || 'Failed to change position');
    } finally {
      setLoading(false);
    }
  };

  // Handle leave tournament
  const handleLeaveTournament = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tournaments/${tournament._id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to leave tournament');

      showSuccess('Left tournament successfully');
      setLeaveDialog(false);
      onLeave?.();
    } catch (error) {
      showError(error.message || 'Failed to leave tournament');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  };

  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Started';
    const dur = dayjs.duration(milliseconds);
    const hours = Math.floor(dur.asHours());
    const minutes = dur.minutes();
    const seconds = dur.seconds();
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const teams = organizeIntoTeams();
  const userParticipant = participants.find(p => p.user?._id === user._id);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h5" color="primary" gutterBottom>
                  🎮 {tournament.title} - Waiting Room
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {participants.length}/{tournament.maxParticipants} players joined
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                {/* Connection Status - from actual socket state */}
                <Chip
                  icon={isConnected ? <Wifi fontSize="small" /> : <WifiOff fontSize="small" />}
                  label={isConnected ? 'Live' : 'Connected'}
                  color={isConnected ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />

                {/* Time Remaining */}
                {timeToStart > 0 && (
                  <Chip
                    icon={<Timer />}
                    label={`Starts in ${formatTimeRemaining(timeToStart)}`}
                    color="primary"
                    variant="outlined"
                  />
                )}

                {/* Slots Lock Status - from actual backend state only */}
                <Chip
                  icon={slotsLocked ? <Lock /> : <LockOpen />}
                  label={slotsLocked ? 'Slots Locked' : 'Slots Open'}
                  color={slotsLocked ? 'error' : 'success'}
                  variant="filled"
                />

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchParticipants}
                  disabled={loading}
                  size="small"
                >
                  Refresh
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ExitToApp />}
                  onClick={() => setLeaveDialog(true)}
                  size="small"
                >
                  Leave
                </Button>
              </Box>
            </Box>

            {/* Room Credentials */}
            {roomCredentials && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">
                    🎯 Room credentials are available!{' '}
                    <Button
                      size="small"
                      onClick={() => setShowCredentials(!showCredentials)}
                      startIcon={showCredentials ? <VisibilityOff /> : <Visibility />}
                      sx={{ ml: 1 }}
                    >
                      {showCredentials ? 'Hide' : 'Show'}
                    </Button>
                  </Typography>
                </Box>

                {showCredentials && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">Room ID:</Typography>
                          <Typography variant="body2" fontFamily="monospace">
                            {roomCredentials.roomId}
                          </Typography>
                          <IconButton size="small" onClick={() => copyToClipboard(roomCredentials.roomId)}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">Password:</Typography>
                          <Typography variant="body2" fontFamily="monospace">
                            {roomCredentials.password}
                          </Typography>
                          <IconButton size="small" onClick={() => copyToClipboard(roomCredentials.password)}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Teams Grid */}
        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={team.teamNumber}>
              <Card
                sx={{
                  height: '100%',
                  border: team.slots.some(slot => slot.participant?.user?._id === user._id)
                    ? '2px solid'
                    : '1px solid',
                  borderColor: team.slots.some(slot => slot.participant?.user?._id === user._id)
                    ? 'primary.main'
                    : 'divider'
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Group color="primary" />
                    <Typography variant="h6" color="primary">
                      Team {team.teamNumber}
                    </Typography>
                    <Chip
                      label={`${team.slots.filter(s => !s.isEmpty).length}/4`}
                      size="small"
                      color={team.slots.filter(s => !s.isEmpty).length === 4 ? 'success' : 'default'}
                    />
                  </Box>

                  <Box display="flex" flexDirection="column" gap={1}>
                    {team.slots.map((slot) => (
                      <Droppable
                        key={`slot-${slot.slotNumber}`}
                        droppableId={`slot-${slot.slotNumber}`}
                        isDropDisabled={slotsLocked || (!slot.isEmpty && slot.participant?.user?._id !== user._id)}
                      >
                        {(provided, snapshot) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                              p: 1.5,
                              minHeight: 56,
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: snapshot.isDraggingOver
                                ? 'primary.50'
                                : slot.isEmpty
                                  ? 'grey.50'
                                  : 'background.paper',
                              border: '1px solid',
                              borderColor: snapshot.isDraggingOver ? 'primary.main' : 'divider',
                              borderStyle: slot.isEmpty ? 'dashed' : 'solid',
                            }}
                          >
                            {slot.isEmpty ? (
                              <Box display="flex" alignItems="center" gap={1} width="100%">
                                <PersonAdd color="disabled" fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                  Slot #{slot.slotNumber}
                                </Typography>
                              </Box>
                            ) : (
                              <Draggable
                                draggableId={`participant-${slot.slotNumber}`}
                                index={0}
                                isDragDisabled={slotsLocked || slot.participant?.user?._id !== user._id}
                              >
                                {(dragProvided, dragSnapshot) => (
                                  <Box
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    width="100%"
                                    sx={{ opacity: dragSnapshot.isDragging ? 0.8 : 1 }}
                                  >
                                    <Avatar sx={{ width: 28, height: 28 }}>
                                      {slot.participant?.user?.username?.charAt(0)?.toUpperCase()}
                                    </Avatar>
                                    <Box flex={1} minWidth={0}>
                                      <Typography variant="body2" fontWeight="medium" noWrap>
                                        {slot.participant?.user?.gameProfile?.bgmiName ||
                                         slot.participant?.user?.username}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {slot.participant?.user?._id === user._id ? '(You)' : `Slot #${slot.slotNumber}`}
                                      </Typography>
                                    </Box>
                                    {slot.participant?.user?._id === user._id && !slotsLocked && (
                                      <SwapHoriz color="primary" fontSize="small" />
                                    )}
                                  </Box>
                                )}
                              </Draggable>
                            )}
                            {provided.placeholder}
                          </Paper>
                        )}
                      </Droppable>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Leave Tournament Dialog */}
        <Dialog open={leaveDialog} onClose={() => setLeaveDialog(false)}>
          <DialogTitle color="error.main">Leave Tournament</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to leave this tournament?
              Your slot will be freed up for other players.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaveDialog(false)}>Cancel</Button>
            <Button
              onClick={handleLeaveTournament}
              color="error"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Leave Tournament'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DragDropContext>
  );
};

export default BGMIWaitingRoom;
