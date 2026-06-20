import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Chip,
} from '@mui/material';
import {
  ContentCopy,
  Timer,
  Lock,
  LockOpen,
  TouchApp,
  Info,
  Warning,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import { DragDropContext } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { RoomSlotLayout } from './Room';
import { buildSlotMovePayload } from '../../utils/slotMove';
import { useSocket } from '../../contexts/SocketContext';

dayjs.extend(duration);

const API_BASE = config.API_BASE_URL || 'https://api.gameonesport.xyz/api';

const RoomLobby = ({
  tournamentId,
  user,
  showSuccess,
  showError,
  showInfo,
  isEditMode = false
}) => {
  const theme = useTheme();
  const { socket, isConnected, joinTournament, leaveTournament } = useSocket();

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [roomSlot, setRoomSlot] = useState(null);
  const [playerSlot, setPlayerSlot] = useState(null);
  const [timeToStart, setTimeToStart] = useState(0);
  const [timeToLock, setTimeToLock] = useState(0);
  const [slotChangeLoading, setSlotChangeLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // for click-to-move

  const fetchRoomData = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/room-slots/tournament/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch room data');
      }

      const data = await response.json();
      setTournament(data.data.tournament);
      setRoomSlot(data.data.roomSlot);
      setPlayerSlot(data.data.playerSlot);
    } catch (error) {
      console.error('[RoomLobby] Fetch error:', error);
      showError?.(error.message || 'Failed to load room data');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showError]);

  // Initial fetch
  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Join socket room
  useEffect(() => {
    if (tournamentId && isConnected) {
      joinTournament(tournamentId);
      return () => leaveTournament(tournamentId);
    }
  }, [tournamentId, isConnected, joinTournament, leaveTournament]);

  // Real-time slot updates via window events (dispatched by SocketContext)
  useEffect(() => {
    const handleSlotChanged = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournamentId) return;
      if (data.roomSlot) setRoomSlot(data.roomSlot);
      if (data.playerId === user?._id && data.playerSlot) {
        setPlayerSlot(data.playerSlot);
      }
      showInfo?.(`A player moved to Team ${data.toTeam}, Slot ${data.toSlot}`);
    };

    const handlePlayerAssigned = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournamentId) return;
      if (data.roomSlot) setRoomSlot(data.roomSlot);
      showInfo?.(`${data.username || 'A player'} joined Team ${data.teamNumber}`);
    };

    const handleSlotsLocked = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournamentId) return;
      setRoomSlot(prev => prev ? { ...prev, isLocked: true } : prev);
      showInfo?.('🔒 Slots are now locked!');
    };

    const handleSlotsUnlocked = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournamentId) return;
      setRoomSlot(prev => prev ? { ...prev, isLocked: false } : prev);
      showInfo?.('🔓 Slots are now unlocked!');
    };

    const handleRoomSlotUpdated = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournamentId) return;
      // Full refresh on any admin change
      fetchRoomData();
    };

    const handleAdminSlotChanged = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournamentId) return;
      if (data.roomSlot) setRoomSlot(data.roomSlot);
      if (data.playerId === user?._id && data.playerSlot) {
        setPlayerSlot(data.playerSlot);
      }
      showInfo?.('Admin updated slot assignments');
    };

    const handleCredentialsReleased = (e) => {
      const data = e.detail;
      if (data.tournamentId !== tournamentId) return;
      fetchRoomData(); // refresh to get credentials
      showSuccess?.('🎯 Room credentials are now available!');
    };

    window.addEventListener('slotChanged', handleSlotChanged);
    window.addEventListener('playerAssigned', handlePlayerAssigned);
    window.addEventListener('slotsLocked', handleSlotsLocked);
    window.addEventListener('slotsUnlocked', handleSlotsUnlocked);
    window.addEventListener('roomSlotUpdated', handleRoomSlotUpdated);
    window.addEventListener('adminSlotChanged', handleAdminSlotChanged);
    window.addEventListener('roomCredentialsReleased', handleCredentialsReleased);

    return () => {
      window.removeEventListener('slotChanged', handleSlotChanged);
      window.removeEventListener('playerAssigned', handlePlayerAssigned);
      window.removeEventListener('slotsLocked', handleSlotsLocked);
      window.removeEventListener('slotsUnlocked', handleSlotsUnlocked);
      window.removeEventListener('roomSlotUpdated', handleRoomSlotUpdated);
      window.removeEventListener('adminSlotChanged', handleAdminSlotChanged);
      window.removeEventListener('roomCredentialsReleased', handleCredentialsReleased);
    };
  }, [tournamentId, user?._id, fetchRoomData, showInfo, showSuccess]);

  // Timer countdown
  useEffect(() => {
    if (!tournament) return;

    const interval = setInterval(() => {
      const now = dayjs();
      const startTime = dayjs(tournament.startDate);
      const lockTime = startTime.subtract(10, 'minutes');
      setTimeToLock(lockTime.diff(now));
      setTimeToStart(startTime.diff(now));
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament]);

  // ── Slot move handler ──────────────────────────────────────────────────────
  const handleSlotMove = async (toTeam, toSlotNum) => {
    if (!roomSlot?.settings?.allowSlotChange) {
      showError?.('Slot changes are not allowed');
      return;
    }
    if (roomSlot.isLocked) {
      showError?.('Slots are locked!');
      return;
    }
    if (!playerSlot) {
      showError?.('You are not assigned to a slot yet');
      return;
    }

    try {
      setSlotChangeLoading(true);
      const token = localStorage.getItem('token');
      const payload = buildSlotMovePayload({
        tournamentId,
        playerId: user?._id,
        fromSlot: playerSlot,
        toTeam,
        toSlot: toSlotNum
      });

      const response = await fetch(`${API_BASE}/room-slots/tournament/${tournamentId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to move slot');
      }

      const data = await response.json();
      setRoomSlot(data.data.roomSlot);
      setPlayerSlot(data.data.playerSlot);
      setSelectedSlot(null);
      showSuccess?.('Position changed successfully!');
    } catch (error) {
      showError?.(error.message || 'Failed to change position');
    } finally {
      setSlotChangeLoading(false);
    }
  };

  // ── Click handler: two-click move (click my slot → click target) ──────────
  const handleSlotClick = (teamNumber, slotNumber) => {
    if (roomSlot?.isLocked || !roomSlot?.settings?.allowSlotChange) {
      showError?.('Slots are locked');
      return;
    }

    const team = roomSlot.teams.find(t => t.teamNumber === teamNumber);
    const slot = team?.slots.find(s => s.slotNumber === slotNumber);

    const isMySlot = slot?.player?._id === user?._id ||
                     slot?.player?.toString?.() === user?._id?.toString?.();

    if (isMySlot) {
      // Toggle selection of own slot
      if (selectedSlot?.teamNumber === teamNumber && selectedSlot?.slotNumber === slotNumber) {
        setSelectedSlot(null);
      } else {
        setSelectedSlot({ teamNumber, slotNumber });
      }
      return;
    }

    if (slot?.player) {
      // Occupied by another player
      showInfo?.('This slot is occupied by another player');
      return;
    }

    // Empty slot: if we have a selection, move there
    if (selectedSlot) {
      handleSlotMove(teamNumber, slotNumber);
    }
    // No selection yet, but user clicked empty slot - inform them
  };

  // ── Drag & Drop handler ────────────────────────────────────────────────────
  const onDragEnd = (result) => {
    if (!result.destination || roomSlot?.isLocked) return;

    // droppableId format: "team-{N}-slot-{M}"
    const [, destTeamStr, , destSlotStr] = result.destination.droppableId.split('-');
    const destTeam = parseInt(destTeamStr);
    const destSlot = parseInt(destSlotStr);

    if (!isNaN(destTeam) && !isNaN(destSlot)) {
      handleSlotMove(destTeam, destSlot);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccess?.('Copied to clipboard!');
    }).catch(() => {
      showError?.('Failed to copy');
    });
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
        <Alert severity="error" action={
          <IconButton onClick={fetchRoomData} size="small">↻</IconButton>
        }>
          Failed to load tournament room data.
        </Alert>
      </Container>
    );
  }

  const canEditSlots = roomSlot.settings.allowSlotChange &&
    !roomSlot.isLocked &&
    tournament.status !== 'completed' &&
    playerSlot != null;

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
                flex: '1 1 280px',
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
                flex: '1 1 280px',
                p: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: '1px solid',
                borderColor: 'success.main',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" color="success.main">Room Status</Typography>
                <Chip
                  icon={roomSlot.isLocked ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                  label={roomSlot.isLocked ? 'Slots Locked' : 'Slots Open'}
                  color={roomSlot.isLocked ? 'error' : 'success'}
                  size="small"
                />
              </Box>
              <Box display="flex" gap={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Players: {roomSlot.totalPlayers || 0}/{(roomSlot.maxTeams || 0) * (roomSlot.maxPlayersPerTeam || 0)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={((roomSlot.totalPlayers || 0) / ((roomSlot.maxTeams || 1) * (roomSlot.maxPlayersPerTeam || 1))) * 100}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': { bgcolor: theme.palette.success.main }
                  }}
                />
              </Box>
            </Paper>
          </Fade>

          {/* Connection Status */}
          <Fade in timeout={1100}>
            <Paper
              elevation={0}
              sx={{
                flex: '0 1 180px',
                p: 2,
                bgcolor: alpha(isConnected ? theme.palette.success.main : theme.palette.warning.main, 0.1),
                border: '1px solid',
                borderColor: isConnected ? 'success.main' : 'warning.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {isConnected ? <Wifi color="success" /> : <WifiOff color="warning" />}
              <Box>
                <Typography variant="caption" color="text.secondary">Connection</Typography>
                <Typography variant="body2" fontWeight="bold" color={isConnected ? 'success.main' : 'warning.main'}>
                  {isConnected ? 'Live' : 'Polling'}
                </Typography>
              </Box>
            </Paper>
          </Fade>

          {/* Room Credentials */}
          {credentialsAvailable && (
            <Fade in timeout={1200}>
              <Paper
                elevation={0}
                sx={{
                  flex: '1 1 280px',
                  p: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: '1px solid',
                  borderColor: 'warning.main',
                }}
              >
                <Typography variant="h6" color="warning.main" gutterBottom>Room Credentials</Typography>
                <Box display="flex" gap={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Room ID</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{tournament.roomDetails.roomId}</Typography>
                      <Tooltip title="Copy Room ID">
                        <IconButton size="small" onClick={() => copyToClipboard(tournament.roomDetails.roomId)}>
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
                        <IconButton size="small" onClick={() => copyToClipboard(tournament.roomDetails.password)}>
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

        {/* Locked warning */}
        {roomSlot.isLocked && (
          <Alert severity="warning" icon={<Lock />} sx={{ mb: 3 }}>
            <AlertTitle>Slots Locked</AlertTitle>
            Slots have been locked by the admin. No more position changes are allowed.
          </Alert>
        )}

        {/* Instructions */}
        {isSlotChangeable && !roomSlot.isLocked && (
          <Fade in timeout={1000}>
            <Alert severity="info" sx={{ mb: 3 }} icon={<TouchApp />}>
              <AlertTitle>How to change your position</AlertTitle>
              <strong>Click</strong> your slot to select it, then click an empty slot to move. 
              On mobile: tap your slot then tap destination.
              On desktop: drag your slot to a new position.
              {selectedSlot && (
                <Typography color="warning.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                  ✓ Slot selected: Team {selectedSlot.teamNumber}, Slot {selectedSlot.slotNumber} — now click an empty slot to move there.
                </Typography>
              )}
              {timeToLock > 0 && timeToLock < 600000 && (
                <Typography color="error.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                  ⚠️ Slots will lock in {formatTimeRemaining(timeToLock)}!
                </Typography>
              )}
            </Alert>
          </Fade>
        )}

        {/* Slot change loading */}
        {slotChangeLoading && (
          <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
        )}

        {/* Room Layout */}
        <RoomSlotLayout
          teams={roomSlot.teams}
          isSlotChangeable={isSlotChangeable && !slotChangeLoading}
          user={user}
          onSlotClick={handleSlotClick}
          selectedSlot={selectedSlot}
          showLockControls={false}
        />

        {/* Disconnected info */}
        {!isConnected && (
          <Alert severity="info" sx={{ mt: 3 }} icon={<WifiOff />}>
            Real-time updates are not available. The page will still work — your changes save instantly to the server.
          </Alert>
        )}
      </Container>
    </DragDropContext>
  );
};

export default RoomLobby;
