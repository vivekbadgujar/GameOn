import React, { useState, useEffect } from 'react';
import config from '../../config';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Fade,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ContentCopy,
  Timer,
  Lock,
  TouchApp,
  Info,
  Warning,
} from '@mui/icons-material';
import { DragDropContext } from '@hello-pangea/dnd';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import io from 'socket.io-client';
import { RoomSlotLayout } from './Room';

const RoomLobby = ({
  tournamentId,
  user,
  showSuccess,
  showError,
  showInfo,
  isEditMode = false
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [roomSlot, setRoomSlot] = useState(null);
  const [playerSlot, setPlayerSlot] = useState(null);
  const [timeToStart, setTimeToStart] = useState(0);
  const [timeToLock, setTimeToLock] = useState(0);
  const [slotChangeLoading, setSlotChangeLoading] = useState(false);

  useEffect(() => {
    const newSocket = io(config.WS_URL);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_tournament', tournamentId);
      console.log('Connected to room lobby');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time updates
    newSocket.on('slotChanged', (data) => {
      if (data.tournamentId === tournamentId) {
        setRoomSlot(data.roomSlot);
        if (data.playerId === user._id) {
          setPlayerSlot(data.playerSlot);
        }
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
  }, [tournamentId]);

  useEffect(() => {
    if (!tournament) return;

    const interval = setInterval(() => {
      const now = dayjs();
      const startTime = dayjs(tournament.startDate);
      const lockTime = startTime.subtract(10, 'minutes'); // Lock 10 minutes before start
      setTimeToLock(lockTime.diff(now));
      setTimeToStart(startTime.diff(now));
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/room-slots/tournament/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
    } catch (error) {
      console.error('Error fetching room data:', error);
      showError(error.message || 'Failed to load room data');
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch(`/api/room-slots/tournament/${tournamentId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  const onDragEnd = (result) => {
    if (!result.destination || roomSlot?.isLocked) return;

    const destTeam = parseInt(result.destination.droppableId.split('-')[1]);
    const destSlot = parseInt(result.destination.droppableId.split('-')[3]);
    handleSlotMove(destTeam, destSlot);
  };

  const handleSlotClick = (teamNumber, slotNumber) => {
    if (roomSlot?.isLocked || !roomSlot?.settings?.allowSlotChange) return;

    const team = roomSlot.teams.find(t => t.teamNumber === teamNumber);
    const slot = team?.slots.find(s => s.slotNumber === slotNumber);
    
    if (!slot?.player) {
      handleSlotMove(teamNumber, slotNumber);
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

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
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

  // Determine if the user can edit slots based on tournament status and user participation
  const canEditSlots = roomSlot.settings.allowSlotChange && 
    !roomSlot.isLocked && 
    tournament.status !== 'completed' &&
    tournament.participants?.some(p => p.user._id === user._id);

  const isSlotChangeable = canEditSlots;
  const credentialsAvailable = tournament.roomDetails?.credentialsReleased;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Status Cards */}
        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          {/* Tournament Info */}
          <Fade in timeout={800}>
            <Paper
              elevation={0}
              sx={{
                flex: '1 1 300px',
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="h6" color="primary" gutterBottom>
                {tournament.title}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Timer fontSize="small" color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Starts in: {formatTimeRemaining(timeToStart)}
                </Typography>
              </Box>
            </Paper>
          </Fade>

          {/* Room Status */}
          <Fade in timeout={1000}>
            <Paper
              elevation={0}
              sx={{
                flex: '1 1 300px',
                p: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: '1px solid',
                borderColor: 'success.main',
              }}
            >
              <Typography variant="h6" color="success.main" gutterBottom>
                Room Status
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Players: {roomSlot.totalPlayers}/{roomSlot.maxTeams * roomSlot.maxPlayersPerTeam}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(roomSlot.totalPlayers / (roomSlot.maxTeams * roomSlot.maxPlayersPerTeam)) * 100}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.success.main,
                    }
                  }}
                />
              </Box>
            </Paper>
          </Fade>

          {/* Room Credentials */}
          {credentialsAvailable && (
            <Fade in timeout={1200}>
              <Paper
                elevation={0}
                sx={{
                  flex: '1 1 300px',
                  p: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: '1px solid',
                  borderColor: 'warning.main',
                }}
              >
                <Typography variant="h6" color="warning.main" gutterBottom>
                  Room Credentials
                </Typography>
                <Box display="flex" gap={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Room ID</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{tournament.roomDetails.roomId}</Typography>
                      <Tooltip title="Copy Room ID">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(tournament.roomDetails.roomId)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Password</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{tournament.roomDetails.password}</Typography>
                      <Tooltip title="Copy Password">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(tournament.roomDetails.password)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          )}
        </Box>

        {/* Instructions */}
        {isSlotChangeable && (
          <Fade in timeout={1000}>
            <Alert
              severity="info"
              sx={{ mb: 3 }}
              icon={<TouchApp />}
            >
              <AlertTitle>How to change your position:</AlertTitle>
              On desktop: Drag your slot to move. On mobile: Tap an empty slot to move there.
              {timeToLock > 0 && timeToLock < 600000 && (
                <Typography color="warning.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                  ⚠️ Slots will lock in {formatTimeRemaining(timeToLock)}!
                </Typography>
              )}
            </Alert>
          </Fade>
        )}

        {/* Room Layout */}
        <RoomSlotLayout
          teams={roomSlot.teams}
          isSlotChangeable={isSlotChangeable}
          user={user}
          onSlotClick={handleSlotClick}
          showLockControls={false}
        />

        {/* Connection Status */}
        {!isConnected && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Warning /> Reconnecting to server...
          </Alert>
        )}
      </Container>
    </DragDropContext>
  );
};

export default RoomLobby;