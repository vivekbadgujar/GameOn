import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
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
  Badge,
  LinearProgress,
  Fade,
  Zoom
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
  GamepadOutlined,
  EmojiEvents,
  Schedule,
  People,
  TouchApp,
  DragIndicator
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import io from 'socket.io-client';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const RoomLobby = () => {
  const router = useRouter();
  const { tournamentId } = router.query;
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // State management
  const [tournament, setTournament] = useState(null);
  const [roomSlot, setRoomSlot] = useState(null);
  const [playerSlot, setPlayerSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotChangeLoading, setSlotChangeLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [timeToStart, setTimeToStart] = useState(null);
  const [timeToLock, setTimeToLock] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_WS_URL || 'https://api.gameonesport.xyz';
    const newSocket = io(apiUrl);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_tournament', tournamentId);
      console.log('Connected to room lobby');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time slot updates
    newSocket.on('slotChanged', (data) => {
      if (data.tournamentId === tournamentId) {
        setRoomSlot(data.roomSlot);
        showInfo(`Player moved to Team ${data.toTeam}, Slot ${data.toSlot}`);
      }
    });

    newSocket.on('playerAssigned', (data) => {
      if (data.tournamentId === tournamentId) {
        fetchRoomData();
        showInfo(`${data.username} joined Team ${data.teamNumber}`);
      }
    });

    newSocket.on('slotsLocked', (data) => {
      if (data.tournamentId === tournamentId) {
        fetchRoomData();
        showInfo('🔒 Slots are now locked! No more position changes allowed.');
      }
    });

    newSocket.on('roomCredentialsReleased', (data) => {
      if (data.tournamentId === tournamentId) {
        fetchRoomData();
        showSuccess('🎯 Room credentials are now available!');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_tournament', tournamentId);
      newSocket.close();
    };
  }, [tournamentId, showSuccess, showError, showInfo]);

  // Fetch room data
  const fetchRoomData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/room-slots/tournament/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          showError('You are not a participant in this tournament');
          router.push('/tournaments');
          return;
        }
        throw new Error('Failed to fetch room data');
      }
      
      const data = await response.json();
      setTournament(data.data.tournament);
      setRoomSlot(data.data.roomSlot);
      setPlayerSlot(data.data.playerSlot);

      // Show welcome message for new players
      if (data.data.playerSlot && !sessionStorage.getItem(`welcomed_${tournamentId}`)) {
        showSuccess(`Welcome to ${data.data.tournament.title}! You're assigned to Team ${data.data.playerSlot.teamNumber}, Slot ${data.data.playerSlot.slotNumber}`);
        sessionStorage.setItem(`welcomed_${tournamentId}`, 'true');
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
      showError(error.message || 'Failed to load room data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate time remaining and auto-lock slots
  useEffect(() => {
    if (!tournament) return;

    const interval = setInterval(() => {
      const now = dayjs();
      const startTime = dayjs(tournament.startDate);
      const lockTime = startTime.subtract(10, 'minutes'); // Lock 10 minutes before start

      const timeToLockMs = lockTime.diff(now);
      const timeToStartMs = startTime.diff(now);

      setTimeToLock(timeToLockMs);
      setTimeToStart(timeToStartMs);

      // Auto-lock slots when time reaches 10 minutes before start
      if (timeToLockMs <= 0 && roomSlot && !roomSlot.isLocked) {
        showInfo('🔒 Slots are now locked! Tournament starts soon.');
        fetchRoomData(); // Refresh to get updated lock status
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament, roomSlot, showInfo]);

  // Initial data fetch
  useEffect(() => {
    fetchRoomData();
  }, [tournamentId]);

  // Handle slot move
  const handleSlotMove = async (toTeam, toSlot) => {
    if (!roomSlot?.settings?.allowSlotChange) {
      showError('Slot changes are not allowed');
      return;
    }

    if (roomSlot.isLocked) {
      showError('Slots are locked! No more changes allowed.');
      return;
    }

    try {
      setSlotChangeLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/room-slots/tournament/${tournamentId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toTeam, toSlot })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move slot');
      }

      const data = await response.json();
      setRoomSlot(data.data.roomSlot);
      setPlayerSlot(data.data.playerSlot);
      showSuccess('Position changed successfully!');

    } catch (error) {
      showError(error.message || 'Failed to change position');
    } finally {
      setSlotChangeLoading(false);
    }
  };

  // Handle drag and drop
  const onDragEnd = (result) => {
    if (!result.destination || roomSlot?.isLocked) return;

    const destTeam = parseInt(result.destination.droppableId.split('-')[1]);
    const destSlot = parseInt(result.destination.droppableId.split('-')[2]);

    handleSlotMove(destTeam, destSlot);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  };

  // Format time remaining
  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Started';
    
    const dur = dayjs.duration(milliseconds);
    const hours = Math.floor(dur.asHours());
    const minutes = dur.minutes();
    const seconds = dur.seconds();
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Handle slot click for mobile
  const handleSlotClick = (teamNumber, slotNumber) => {
    if (roomSlot?.isLocked || !roomSlot?.settings?.allowSlotChange) return;
    
    // Check if slot is empty
    const team = roomSlot.teams.find(t => t.teamNumber === teamNumber);
    const slot = team?.slots.find(s => s.slotNumber === slotNumber);
    
    if (!slot?.player) {
      handleSlotMove(teamNumber, slotNumber);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (!tournament || !roomSlot) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load tournament room data. Please try again.
        </Alert>
      </Container>
    );
  }

  const isSlotChangeable = roomSlot.settings.allowSlotChange && !roomSlot.isLocked;
  const credentialsAvailable = tournament.roomDetails?.credentialsReleased;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header Card */}
// Incorrect - missing initializer
const { myVariable };

// Correct - with initializer
const { myVariable } = someObject;
        <Fade in timeout={800}>
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    🎮 {tournament.title}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Room Lobby - Team Assignment
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mt={1}>
                    <Chip
                      icon={<People />}
                      label={`${roomSlot.totalPlayers}/${roomSlot.maxTeams * roomSlot.maxPlayersPerTeam} Players`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                    <Chip
                      icon={<Group />}
                      label={`${roomSlot.teams.filter(t => t.isComplete).length}/${roomSlot.maxTeams} Teams Complete`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  {/* Connection Status */}
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: isConnected ? '#4caf50' : '#f44336',
                        boxShadow: isConnected ? '0 0 10px #4caf50' : '0 0 10px #f44336'
                      }}
                    />
                    <Typography variant="body2" fontWeight="medium">
                      {isConnected ? 'Live' : 'Disconnected'}
                    </Typography>
                  </Box>

                  {/* Time Remaining */}
                  {timeToStart > 0 && (
                    <Chip
                      icon={<Timer />}
                      label={`Starts in ${formatTimeRemaining(timeToStart)}`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  )}

                  {/* Slot Status */}
                  <Chip
                    icon={isSlotChangeable ? <LockOpen /> : <Lock />}
                    label={isSlotChangeable ? 'Slots Unlocked' : 'Slots Locked'}
                    sx={{ 
                      bgcolor: isSlotChangeable ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)', 
                      color: 'white' 
                    }}
                  />

                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchRoomData}
                    disabled={loading}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>
                  Tournament Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(roomSlot.totalPlayers / (roomSlot.maxTeams * roomSlot.maxPlayersPerTeam)) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4caf50'
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Fade>

        {/* Instructions Card */}
        {isSlotChangeable && (
          <Fade in timeout={1000}>
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              icon={<TouchApp />}
            >
              <Typography variant="body2">
                <strong>How to change your position:</strong> 
                {' '}On desktop: Drag your slot to move. On mobile: Tap an empty slot to move there.
                {timeToLock > 0 && timeToLock < 600000 && (
                  <span style={{ color: '#ff9800', fontWeight: 'bold' }}>
                    {' '}⚠️ Slots will lock in {formatTimeRemaining(timeToLock)}!
                  </span>
                )}
              </Typography>
            </Alert>
          </Fade>
        )}

        {/* Room Credentials */}
        {credentialsAvailable && (
          <Fade in timeout={1200}>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1" fontWeight="medium">
                  🎯 Room credentials are available!
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowCredentials(!showCredentials)}
                  startIcon={showCredentials ? <VisibilityOff /> : <Visibility />}
                  variant="outlined"
                  color="success"
                >
                  {showCredentials ? 'Hide' : 'Show'}
                </Button>
              </Box>
              
              {showCredentials && (
                <Zoom in={showCredentials}>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #4caf50' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">Room ID:</Typography>
                          <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
                            {tournament.roomDetails.roomId}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(tournament.roomDetails.roomId)}
                            color="success"
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">Password:</Typography>
                          <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
                            {tournament.roomDetails.password}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(tournament.roomDetails.password)}
                            color="success"
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Zoom>
              )}
            </Alert>
          </Fade>
        )}

        {/* Your Current Position */}
        {playerSlot && (
          <Fade in timeout={1400}>
            <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" color="primary">
                      Your Position
                    </Typography>
                    <Typography variant="body1">
                      Team {playerSlot.teamNumber}, Slot {playerSlot.slotNumber}
                      {playerSlot.isCaptain && (
                        <Chip 
                          label="Captain" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }} 
                          icon={<EmojiEvents />}
                        />
                      )}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Teams Grid */}
        <Grid container spacing={3}>
          {roomSlot.teams.map((team, teamIndex) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={team.teamNumber}>
              <Zoom in timeout={1600 + (teamIndex * 100)}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: '2px solid',
                    borderColor: team.slots.some(slot => slot.player && slot.player._id === user._id) 
                      ? 'primary.main' 
                      : team.isComplete 
                        ? 'success.main'
                        : 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Group color={team.isComplete ? 'success' : 'primary'} />
                      <Typography variant="h6" color={team.isComplete ? 'success.main' : 'primary.main'}>
                        {team.teamName}
                      </Typography>
                      <Chip
                        label={`${team.slots.filter(s => s.player).length}/${roomSlot.maxPlayersPerTeam}`}
                        size="small"
                        color={team.isComplete ? 'success' : 'default'}
                        variant={team.isComplete ? 'filled' : 'outlined'}
                      />
                    </Box>

                    {/* Team Slots */}
                    <Box display="flex" flexDirection="column" gap={1}>
                      {team.slots.map((slot) => (
                        <Droppable
                          key={`team-${team.teamNumber}-slot-${slot.slotNumber}`}
                          droppableId={`team-${team.teamNumber}-slot-${slot.slotNumber}`}
                          isDropDisabled={!isSlotChangeable || (slot.player && slot.player._id !== user._id)}
                        >
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              onClick={() => handleSlotClick(team.teamNumber, slot.slotNumber)}
                              sx={{
                                p: 2,
                                minHeight: 70,
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: snapshot.isDraggingOver 
                                  ? 'primary.50' 
                                  : slot.player 
                                    ? 'background.paper' 
                                    : 'grey.50',
                                border: '2px solid',
                                borderColor: snapshot.isDraggingOver 
                                  ? 'primary.main' 
                                  : slot.player?._id === user._id
                                    ? 'primary.main'
                                    : slot.player
                                      ? 'success.light'
                                      : 'grey.300',
                                borderStyle: slot.player ? 'solid' : 'dashed',
                                cursor: (!slot.player && isSlotChangeable) ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: (!slot.player && isSlotChangeable) ? 'primary.50' : undefined
                                }
                              }}
                            >
                              {!slot.player ? (
                                <Box display="flex" alignItems="center" gap={1} width="100%">
                                  <PersonAdd color="disabled" />
                                  <Typography variant="body2" color="text.secondary">
                                    Slot {slot.slotNumber}
                                  </Typography>
                                  {isSlotChangeable && (
                                    <Typography variant="caption" color="primary" sx={{ ml: 'auto' }}>
                                      Tap to join
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Draggable
                                  draggableId={`player-${slot.player._id}-${team.teamNumber}-${slot.slotNumber}`}
                                  index={0}
                                  isDragDisabled={!isSlotChangeable || slot.player._id !== user._id}
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
                                        transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                        transition: 'transform 0.2s ease'
                                      }}
                                    >
                                      <Badge
                                        badgeContent={slot.slotNumber}
                                        color="primary"
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                      >
                                        <Avatar 
                                          sx={{ 
                                            width: 40, 
                                            height: 40,
                                            bgcolor: slot.player._id === user._id ? 'primary.main' : 'secondary.main'
                                          }}
                                          src={slot.player.avatar}
                                        >
                                          {slot.player.username?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                      </Badge>
                                      <Box flex={1} minWidth={0}>
                                        <Typography variant="body2" fontWeight="medium" noWrap>
                                          {slot.player.gameProfile?.bgmiName || slot.player.username}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          {slot.player._id === user._id ? 'You' : 'Player'}
                                          {team.captain && team.captain._id === slot.player._id && ' • Captain'}
                                        </Typography>
                                      </Box>
                                      {slot.player._id === user._id && isSlotChangeable && (
                                        <Tooltip title="Drag to move">
                                          <DragIndicator color="primary" fontSize="small" />
                                        </Tooltip>
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
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="center" gap={2} mt={4}>
          <Button
            variant="outlined"
            startIcon={<GamepadOutlined />}
            onClick={() => router.push(`/tournament/${tournamentId}`)}
            size="large"
          >
            Tournament Details
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToApp />}
            onClick={() => setLeaveDialog(true)}
            size="large"
          >
            Leave Tournament
          </Button>
        </Box>

        {/* Leave Tournament Dialog */}
        <Dialog open={leaveDialog} onClose={() => setLeaveDialog(false)}>
          <DialogTitle color="error.main">Leave Tournament</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to leave this tournament? 
              Your slot will be freed up for other players and you won't be able to rejoin.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaveDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                // Handle leave tournament logic here
                setLeaveDialog(false);
                router.push('/tournaments');
              }} 
              color="error" 
              variant="contained"
            >
              Leave Tournament
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading Overlay */}
        {slotChangeLoading && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgcolor="rgba(0,0,0,0.5)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={9999}
          >
            <Card sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress />
                <Typography>Moving to new position...</Typography>
              </Box>
            </Card>
          </Box>
        )}
      </Container>
    </DragDropContext>
  );
};

export default RoomLobby;

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}