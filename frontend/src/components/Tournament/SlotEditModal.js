import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  LinearProgress
} from '@mui/material';

import {
  Close as CloseIcon,
  Timer,
  TouchApp,
  Warning,
  Lock,
  Info
} from '@mui/icons-material';
import { DragDropContext } from '@hello-pangea/dnd';
import { RoomSlotLayout } from './Room';
import dayjs from 'dayjs';
import io from 'socket.io-client';
import config from '../../config';

const SlotEditModal = ({ 
  open, 
  onClose, 
  tournamentId, 
  user,
  showSuccess,
  showError,
  showInfo 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [roomSlot, setRoomSlot] = useState(null);
  const [playerSlot, setPlayerSlot] = useState(null);
  const [timeToStart, setTimeToStart] = useState(0);
  const [slotChangeLoading, setSlotChangeLoading] = useState(false);

  useEffect(() => {
    if (!open || !tournamentId) return;

    if (typeof window === 'undefined') return;

    const wsUrl = config.WS_URL;
    if (!wsUrl) {
      return;
    }

    const newSocket = io(wsUrl, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_tournament', tournamentId);
      console.log('Connected to slot edit modal');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time updates
    newSocket.on('slotChanged', (data) => {
      if (data.tournamentId === tournamentId) {
        setRoomSlot(data.roomSlot);
        if (data.playerId === user?._id) {
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

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_tournament', tournamentId);
      newSocket.close();
    };
  }, [open, tournamentId]);

  useEffect(() => {
    if (open && tournamentId) {
      fetchRoomData();
    }
  }, [open, tournamentId]);

  useEffect(() => {
    if (!tournament) return;

    const interval = setInterval(() => {
      const now = dayjs();
      const startTime = dayjs(tournament.startDate);
      setTimeToStart(startTime.diff(now));
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/room-slots/tournament/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        if (response.status === 403) {
          showError('You are not a participant in this tournament');
          onClose();
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
      const response = await fetch(`${config.API_BASE_URL}/room-slots/tournament/${tournamentId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ toTeam, toSlot })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'SLOT_TEMPORARILY_LOCKED') {
          showError('Another player is moving to this slot. Please try again.');
        } else {
          throw new Error(errorData.error || 'Failed to move slot');
        }
        return;
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

  if (!open) return null;

  const tournamentStatus = tournament?.status?.toLowerCase();
  const isTournamentLockedByStatus = ['live', 'active', 'completed', 'cancelled'].includes(tournamentStatus);
  const isParticipant = Boolean(playerSlot);

  const canEditSlots = isParticipant &&
    roomSlot?.settings?.allowSlotChange &&
    !roomSlot?.isLocked &&
    !isTournamentLockedByStatus;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          bgcolor: 'background.default',
          ...(isMobile ? {
            width: '90vw',
            maxWidth: '90vw',
            maxHeight: '80vh',
            m: 0,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          } : {})
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        bgcolor: 'background.default'
      }}>
        <Box>
          <Typography variant="h6">
            Edit Slot Position
          </Typography>
          {tournament && (
            <Typography variant="body2" color="text.secondary">
              {tournament.title}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, ...(isMobile ? { flex: 1, overflowY: 'auto' } : {}) }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        ) : !tournament || !roomSlot ? (
          <Box p={3}>
            <Alert severity="error">
              Failed to load tournament room data. Please try again.
            </Alert>
          </Box>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Box p={3}>
              {/* Status Cards */}
              <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
                {/* Tournament Info */}
                <Fade in timeout={800}>
                  <Box
                    sx={{
                      flex: '1 1 300px',
                      p: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Tournament Status
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Timer fontSize="small" color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Starts in: {formatTimeRemaining(timeToStart)}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>

                {/* Room Status */}
                <Fade in timeout={1000}>
                  <Box
                    sx={{
                      flex: '1 1 300px',
                      p: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      border: '1px solid',
                      borderColor: 'success.main',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle1" color="success.main" gutterBottom>
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
                  </Box>
                </Fade>
              </Box>

              {/* Instructions */}
              {canEditSlots && (
                <Fade in timeout={1000}>
                  <Alert
                    severity="info"
                    sx={{ mb: 3 }}
                    icon={<TouchApp />}
                  >
                    <AlertTitle>How to change your position:</AlertTitle>
                    On desktop: Drag your slot to move. On mobile: Tap an empty slot to move there.
                  </Alert>
                </Fade>
              )}

              {!canEditSlots && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Lock /> Slot editing is currently disabled or locked.
                </Alert>
              )}

              {/* Room Layout */}
              <RoomSlotLayout
                teams={roomSlot.teams}
                isSlotChangeable={canEditSlots}
                user={user}
                onSlotClick={handleSlotClick}
                showLockControls={false}
                isModal={true}
              />

              {/* Connection Status */}
              {!isConnected && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Warning /> Reconnecting to server...
                </Alert>
              )}
            </Box>
          </DragDropContext>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {canEditSlots && playerSlot && (
          <Button 
            variant="contained" 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(`/tournaments/${tournamentId}/room-lobby`, '_blank');
              }
            }}
          >
            Open Full Room Lobby
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SlotEditModal;