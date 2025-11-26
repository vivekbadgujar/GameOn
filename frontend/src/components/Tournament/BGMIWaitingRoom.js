import React, { useState, useEffect } from 'react';
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
  Divider,
  IconButton,
  Tooltip,
  Badge
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
  Group
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import io from 'socket.io-client';
import dayjs from 'dayjs';

const BGMIWaitingRoom = ({ tournament, onLeave }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // State management
  const [participants, setParticipants] = useState([]);
  const [roomCredentials, setRoomCredentials] = useState(null);
  const [slotsLocked, setSlotsLocked] = useState(false);
  const [timeToLock, setTimeToLock] = useState(null);
  const [timeToStart, setTimeToStart] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to waiting room');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time updates
    newSocket.on('participantJoined', (data) => {
      if (data.tournamentId === tournament._id) {
        fetchParticipants();
        showInfo(`${data.username} joined the tournament`);
      }
    });

    newSocket.on('participantLeft', (data) => {
      if (data.tournamentId === tournament._id) {
        fetchParticipants();
        showInfo(`${data.username} left the tournament`);
      }
    });

    newSocket.on('slotsSwapped', (data) => {
      if (data.tournamentId === tournament._id) {
        fetchParticipants();
        showInfo('Slot positions updated');
      }
    });

    newSocket.on('slotsLocked', (data) => {
      if (data.tournamentId === tournament._id) {
        setSlotsLocked(true);
        showInfo('Slots are now locked! No more position changes allowed.');
      }
    });

    newSocket.on('roomCredentialsReleased', (data) => {
      if (data.tournamentId === tournament._id) {
        setRoomCredentials(data.roomCredentials);
        showSuccess('Room credentials are now available!');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [tournament._id, showSuccess, showError, showInfo]);

  // Fetch participants
  const fetchParticipants = async () => {
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
  };

  // Calculate time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      const now = dayjs();
      const startTime = dayjs(tournament.startDate);
      const lockTime = startTime.subtract(10, 'minutes'); // Lock 10 minutes before start
      const credentialsTime = startTime.subtract(30, 'minutes'); // Show credentials 30 minutes before

      // Check if slots should be locked
      if (now.isAfter(lockTime) && !slotsLocked) {
        setSlotsLocked(true);
      }

      // Check if credentials should be shown
      if (now.isAfter(credentialsTime) && tournament.roomDetails) {
        setRoomCredentials(tournament.roomDetails);
      }

      // Calculate time remaining
      setTimeToLock(lockTime.diff(now));
      setTimeToStart(startTime.diff(now));
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament.startDate, tournament.roomDetails, slotsLocked]);

  // Initial data fetch
  useEffect(() => {
    fetchParticipants();
  }, [tournament._id]);

  // Organize participants into teams
  const organizeIntoTeams = () => {
    const teams = [];
    const maxTeams = Math.ceil(tournament.maxParticipants / 4);
    
    for (let i = 0; i < maxTeams; i++) {
      const teamSlots = [];
      for (let j = 1; j <= 4; j++) {
        const slotNumber = (i * 4) + j;
        const participant = participants.find(p => p.slotNumber === slotNumber);
        teamSlots.push({
          slotNumber,
          participant,
          isEmpty: !participant
        });
      }
      teams.push({
        teamNumber: i + 1,
        slots: teamSlots
      });
    }
    
    return teams;
  };

  // Handle slot swap
  const handleSlotSwap = async (sourceSlot, destSlot) => {
    if (slotsLocked) {
      showError('Slots are locked! No more changes allowed.');
      return;
    }

    // Check if user is trying to move their own slot
    const sourceParticipant = participants.find(p => p.slotNumber === sourceSlot);
    if (sourceParticipant?.user._id !== user._id) {
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

  // Handle drag and drop
  const onDragEnd = (result) => {
    if (!result.destination || slotsLocked) return;

    const sourceSlot = parseInt(result.draggableId.split('-')[1]);
    const destSlot = parseInt(result.destination.droppableId.split('-')[1]);

    if (sourceSlot !== destSlot) {
      handleSlotSwap(sourceSlot, destSlot);
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

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  };

  // Format time remaining
  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Started';
    
    const duration = dayjs.duration(milliseconds);
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const teams = organizeIntoTeams();
  const userParticipant = participants.find(p => p.user._id === user._id);

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
              
              <Box display="flex" alignItems="center" gap={2}>
                {/* Connection Status */}
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
                    {isConnected ? 'Live' : 'Disconnected'}
                  </Typography>
                </Box>

                {/* Time Remaining */}
                {timeToStart > 0 && (
                  <Chip
                    icon={<Timer />}
                    label={`Starts in ${formatTimeRemaining(timeToStart)}`}
                    color="primary"
                    variant="outlined"
                  />
                )}

                {/* Slots Lock Status */}
                <Chip
                  icon={slotsLocked ? <Lock /> : <LockOpen />}
                  label={slotsLocked ? 'Slots Locked' : 'Slots Unlocked'}
                  color={slotsLocked ? 'error' : 'success'}
                  variant="filled"
                />

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchParticipants}
                  disabled={loading}
                >
                  Refresh
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ExitToApp />}
                  onClick={() => setLeaveDialog(true)}
                >
                  Leave
                </Button>
              </Box>
            </Box>

            {/* Slot Lock Warning */}
            {!slotsLocked && timeToLock > 0 && timeToLock < 600000 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                ⚠️ Slots will be locked in {formatTimeRemaining(timeToLock)}. 
                Change your position now if needed!
              </Alert>
            )}

            {/* Room Credentials */}
            {roomCredentials && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">
                    🎯 Room credentials are available! 
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
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(roomCredentials.roomId)}
                          >
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
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(roomCredentials.password)}
                          >
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
                  border: team.slots.some(slot => slot.participant?.user._id === user._id) 
                    ? '2px solid' 
                    : '1px solid',
                  borderColor: team.slots.some(slot => slot.participant?.user._id === user._id)
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

                  {/* Team Slots */}
                  <Box display="flex" flexDirection="column" gap={1}>
                    {team.slots.map((slot) => (
                      <Droppable
                        key={`slot-${slot.slotNumber}`}
                        droppableId={`slot-${slot.slotNumber}`}
                        isDropDisabled={slotsLocked || (!slot.isEmpty && slot.participant?.user._id !== user._id)}
                      >
                        {(provided, snapshot) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                              p: 2,
                              minHeight: 60,
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: snapshot.isDraggingOver 
                                ? 'primary.50' 
                                : slot.isEmpty 
                                  ? 'grey.50' 
                                  : 'background.paper',
                              border: '1px solid',
                              borderColor: snapshot.isDraggingOver 
                                ? 'primary.main' 
                                : 'divider',
                              borderStyle: slot.isEmpty ? 'dashed' : 'solid',
                              cursor: slot.isEmpty ? 'pointer' : 'default'
                            }}
                          >
                            {slot.isEmpty ? (
                              <Box display="flex" alignItems="center" gap={1} width="100%">
                                <PersonAdd color="disabled" />
                                <Typography variant="body2" color="text.secondary">
                                  Slot #{slot.slotNumber}
                                </Typography>
                              </Box>
                            ) : (
                              <Draggable
                                draggableId={`participant-${slot.slotNumber}`}
                                index={0}
                                isDragDisabled={slotsLocked || slot.participant?.user._id !== user._id}
                              >
                                {(provided, snapshot) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    width="100%"
                                    sx={{
                                      opacity: snapshot.isDragging ? 0.8 : 1,
                                      transform: snapshot.isDragging ? 'rotate(5deg)' : 'none'
                                    }}
                                  >
                                    <Badge
                                      badgeContent={slot.slotNumber}
                                      color="primary"
                                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    >
                                      <Avatar sx={{ width: 32, height: 32 }}>
                                        {slot.participant?.user?.username?.charAt(0)?.toUpperCase()}
                                      </Avatar>
                                    </Badge>
                                    <Box flex={1} minWidth={0}>
                                      <Typography variant="body2" fontWeight="medium" noWrap>
                                        {slot.participant?.user?.gameProfile?.bgmiName || 
                                         slot.participant?.user?.username}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" noWrap>
                                        {slot.participant?.user._id === user._id ? 'You' : 'Player'}
                                      </Typography>
                                    </Box>
                                    {slot.participant?.user._id === user._id && !slotsLocked && (
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