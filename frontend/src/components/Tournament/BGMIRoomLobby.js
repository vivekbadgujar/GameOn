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
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import io from 'socket.io-client';

const BGMIRoomLobby = ({ tournament, onClose }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [movingSlot, setMovingSlot] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (tournament?._id) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.emit('joinTournamentRoom', tournament._id);
      
      // Listen for real-time updates
      newSocket.on('slotChanged', handleSlotUpdate);
      newSocket.on('playerAssigned', handleSlotUpdate);
      newSocket.on('slotsLocked', handleSlotsLocked);

      setSocket(newSocket);

      return () => {
        newSocket.emit('leaveTournamentRoom', tournament._id);
        newSocket.disconnect();
      };
    }
  }, [tournament?._id]);

  // Fetch room data
  const fetchRoomData = useCallback(async () => {
    if (!tournament?._id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/room-slots/tournament/${tournament._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch room data');
      }

      const data = await response.json();
      setRoomData(data.data);
    } catch (error) {
      console.error('Error fetching room data:', error);
      showError('Failed to load room data');
    } finally {
      setLoading(false);
    }
  }, [tournament?._id, showError]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Handle real-time slot updates
  const handleSlotUpdate = useCallback((data) => {
    if (data.tournamentId === tournament?._id) {
      setRoomData(prev => ({
        ...prev,
        roomSlot: data.roomSlot
      }));
      showInfo('Room layout updated');
    }
  }, [tournament?._id, showInfo]);

  // Handle slots locked
  const handleSlotsLocked = useCallback((data) => {
    if (data.tournamentId === tournament?._id) {
      setRoomData(prev => ({
        ...prev,
        roomSlot: {
          ...prev.roomSlot,
          isLocked: true,
          lockedAt: data.lockedAt
        }
      }));
      showInfo(data.reason || 'Slots have been locked');
    }
  }, [tournament?._id, showInfo]);

  // Handle slot selection for moving
  const handleSlotClick = (teamNumber, slotNumber, slot) => {
    if (roomData?.roomSlot?.isLocked) {
      showError('Slots are locked and cannot be changed');
      return;
    }

    // If clicking on current player's slot, deselect
    if (slot?.player?._id === user?._id) {
      setSelectedSlot(selectedSlot ? null : { teamNumber, slotNumber });
      return;
    }

    // If no slot selected and clicking on empty slot, do nothing
    if (!selectedSlot && !slot?.player) {
      return;
    }

    // If slot selected and clicking on empty slot, move player
    if (selectedSlot && !slot?.player && !slot?.isLocked) {
      movePlayerToSlot(teamNumber, slotNumber);
      return;
    }

    // If clicking on occupied slot (not current player), show info
    if (slot?.player && slot.player._id !== user?._id) {
      showInfo('This slot is occupied by another player');
      return;
    }
  };

  // Move player to selected slot
  const movePlayerToSlot = async (toTeam, toSlot) => {
    if (!selectedSlot || movingSlot) return;

    try {
      setMovingSlot(true);
      const response = await fetch(`/api/room-slots/tournament/${tournament._id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          toTeam,
          toSlot
        })
      });

      if (!response.ok) {
        const error = await response.json();
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
      console.error('Error moving slot:', error);
      showError(error.message);
    } finally {
      setMovingSlot(false);
    }
  };

  // Get slot background color
  const getSlotBgColor = (slot, teamNumber, slotNumber) => {
    if (slot?.isLocked) return alpha(theme.palette.error.main, 0.1);
    if (slot?.player?._id === user?._id) return alpha(theme.palette.primary.main, 0.2);
    if (selectedSlot?.teamNumber === teamNumber && selectedSlot?.slotNumber === slotNumber) {
      return alpha(theme.palette.warning.main, 0.2);
    }
    if (slot?.player) return alpha(theme.palette.success.main, 0.1);
    return alpha(theme.palette.grey[300], 0.1);
  };

  // Get slot border color
  const getSlotBorderColor = (slot, teamNumber, slotNumber) => {
    if (slot?.player?._id === user?._id) return theme.palette.primary.main;
    if (selectedSlot?.teamNumber === teamNumber && selectedSlot?.slotNumber === slotNumber) {
      return theme.palette.warning.main;
    }
    if (slot?.player) return theme.palette.success.main;
    return theme.palette.grey[300];
  };

  // Copy to clipboard
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label} copied to clipboard!`);
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  // Render slot
  const renderSlot = (slot, teamNumber, slotNumber) => {
    const isCurrentPlayer = slot?.player?._id === user?._id;
    const isSelected = selectedSlot?.teamNumber === teamNumber && selectedSlot?.slotNumber === slotNumber;
    const isEmpty = !slot?.player;
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
          transition: 'all 0.2s ease',
          '&:hover': roomData?.roomSlot?.isLocked ? {} : {
            transform: 'scale(1.02)',
            boxShadow: 3
          },
          position: 'relative'
        }}
        onClick={() => handleSlotClick(teamNumber, slotNumber, slot)}
      >
        <CardContent sx={{ p: 0.75, textAlign: 'center', '&:last-child': { pb: 0.75 } }}>
          {isLocked && (
            <LockIcon 
              sx={{ 
                position: 'absolute', 
                top: 4, 
                right: 4, 
                fontSize: 16,
                color: 'error.main'
              }} 
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
                  bgcolor: isCurrentPlayer ? 'primary.main' : 'success.main'
                }}
              >
                {slot.player.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="caption" display="block" fontWeight="bold" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                {(slot.player.displayName || slot.player.username).length > 8 
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
              {isCurrentPlayer && (
                <Chip 
                  label="YOU" 
                  size="small" 
                  color="primary" 
                  sx={{ mt: 0.25, fontSize: '0.55rem', height: 14 }} 
                />
              )}
            </>
          ) : (
            <>
              <PersonIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.25 }} />
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                Empty Slot
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render team
  const renderTeam = (team) => (
    <Card key={team.teamNumber} sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <GroupsIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {team.teamName}
            </Typography>
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
              <Typography variant="h6">
                {tournament?.title} - Room Lobby
              </Typography>
              <Typography variant="caption" color="text.secondary">
                BGMI Style Slot Management
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Room Status */}
        <Alert 
          severity={roomData?.roomSlot?.isLocked ? "warning" : "info"} 
          sx={{ mb: 2 }}
          icon={roomData?.roomSlot?.isLocked ? <LockIcon /> : <SwapIcon />}
        >
          {roomData?.roomSlot?.isLocked 
            ? "Slots are locked! Tournament starts soon." 
            : "Click on your slot and then an empty slot to change position"
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
                    <IconButton 
                      size="small"
                      onClick={() => copyToClipboard(tournament.roomDetails.roomId, 'Room ID')}
                    >
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
                    <IconButton 
                      size="small"
                      onClick={() => copyToClipboard(tournament.roomDetails.password, 'Password')}
                    >
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
                      {roomData?.roomSlot?.totalPlayers || 0}/{roomData?.roomSlot?.maxTeams * roomData?.roomSlot?.maxPlayersPerTeam || 0}
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

        {/* Selected Slot Info */}
        {selectedSlot && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Selected: Team {selectedSlot.teamNumber}, Slot {selectedSlot.slotNumber}
              <br />
              Click on an empty slot to move there, or click your current slot to cancel.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {selectedSlot && (
          <Button 
            onClick={() => setSelectedSlot(null)} 
            variant="outlined" 
            color="warning"
          >
            Cancel Move
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BGMIRoomLobby;