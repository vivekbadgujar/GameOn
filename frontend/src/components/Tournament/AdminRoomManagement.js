import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Lock,
  LockOpen,
  Settings,
  SwapHoriz,
  GroupAdd,
  Timer,
  BugReport,
} from '@mui/icons-material';
import { DragDropContext } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import RoomSlotLayout from './RoomSlotLayout';

const AdminRoomManagement = ({
  tournamentId,
  socket,
  showSuccess,
  showError,
}) => {
  const theme = useTheme();
  const [roomSlots, setRoomSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [targetTeam, setTargetTeam] = useState('');
  const [targetSlot, setTargetSlot] = useState('');
  const [settings, setSettings] = useState({
    allowSlotChange: true,
    allowTeamSwitch: true,
    autoAssignTeams: true,
    slotChangeDeadline: null,
  });

  useEffect(() => {
    if (socket) {
      socket.on('roomSlotUpdated', (updatedSlots) => {
        setRoomSlots(updatedSlots);
      });

      socket.on('playerMoved', (data) => {
        setRoomSlots(data.roomSlot);
        showSuccess(`${data.username} moved to Team ${data.teamNumber}`);
      });

      socket.on('slotLocked', (data) => {
        setRoomSlots(data.roomSlot);
        showSuccess(`Slot locked in Team ${data.teamNumber}`);
      });

      socket.on('slotUnlocked', (data) => {
        setRoomSlots(data.roomSlot);
        showSuccess(`Slot unlocked in Team ${data.teamNumber}`);
      });

      socket.on('settingsUpdated', (data) => {
        setRoomSlots(data.roomSlot);
        setSettings(data.settings);
        showSuccess('Room settings updated');
      });
    }

    fetchRoomData();
    return () => socket?.disconnect();
  }, [tournamentId]);

  const fetchRoomData = async () => {
    try {
      const response = await fetch(`/api/admin/room-slots/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (!response.ok) throw new Error('Failed to fetch room data');
      const data = await response.json();
      setRoomSlots(data.data.roomSlot);
      setSettings(data.data.roomSlot.settings);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const [, sourceTeam, , sourceSlot] = result.source.droppableId.split('-');
    const [, destTeam, , destSlot] = result.destination.droppableId.split('-');
    const playerId = result.draggableId.split('-')[1];

    movePlayer(
      playerId,
      parseInt(sourceTeam),
      parseInt(sourceSlot),
      parseInt(destTeam),
      parseInt(destSlot)
    );
  };

  const movePlayer = async (playerId, fromTeam, fromSlot, toTeam, toSlot) => {
    try {
      const response = await fetch(`/api/admin/room-slots/${tournamentId}/move-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ playerId, toTeam, toSlot })
      });

      if (!response.ok) throw new Error('Failed to move player');

      const data = await response.json();
      setRoomSlots(data.data.roomSlot);
      socket.emit('adminPlayerMoved', { tournamentId, ...data.data });
      showSuccess('Player moved successfully');
    } catch (error) {
      showError(error.message);
    }
  };

  const toggleSlotLock = async (teamNumber, slotNumber, isLocked) => {
    try {
      const response = await fetch(`/api/admin/room-slots/${tournamentId}/toggle-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          teamNumber,
          slotNumber,
          action: isLocked ? 'unlock' : 'lock'
        })
      });

      if (!response.ok) throw new Error('Failed to toggle slot lock');

      const data = await response.json();
      setRoomSlots(data.data.roomSlot);
      socket.emit(isLocked ? 'adminSlotUnlocked' : 'adminSlotLocked', {
        tournamentId,
        ...data.data
      });
      showSuccess(`Slot ${isLocked ? 'unlocked' : 'locked'} successfully`);
    } catch (error) {
      showError(error.message);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetch(`/api/admin/room-slots/${tournamentId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) throw new Error('Failed to update settings');

      const data = await response.json();
      setRoomSlots(data.data.roomSlot);
      setSettings(data.data.roomSlot.settings);
      socket.emit('adminSettingsUpdated', { tournamentId, ...data.data });
      showSuccess('Settings updated successfully');
      setSettingsOpen(false);
    } catch (error) {
      showError(error.message);
    }
  };

  if (loading || !roomSlots) {
    return (
      <Box p={3}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Room Management</Typography>
          <Box display="flex" gap={2}>
            <Tooltip title="Room Settings">
              <IconButton onClick={() => setSettingsOpen(true)} color="primary">
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: 'primary.main',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <GroupAdd color="primary" />
                <Typography variant="h6" color="primary">
                  Occupancy
                </Typography>
              </Box>
              <Typography variant="h3" color="primary.dark" mb={1}>
                {((roomSlots.totalPlayers / (roomSlots.maxTeams * roomSlots.maxPlayersPerTeam)) * 100).toFixed(0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {roomSlots.totalPlayers} / {roomSlots.maxTeams * roomSlots.maxPlayersPerTeam} slots filled
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: '1px solid',
                borderColor: 'success.main',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Timer color="success" />
                <Typography variant="h6" color="success.main">
                  Teams Ready
                </Typography>
              </Box>
              <Typography variant="h3" color="success.dark" mb={1}>
                {roomSlots.teams.filter(t => t.isComplete).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete Teams / {roomSlots.maxTeams} total
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: '1px solid',
                borderColor: 'warning.main',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BugReport color="warning" />
                <Typography variant="h6" color="warning.main">
                  Slot Controls
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={roomSlots.isLocked ? <LockOpen /> : <Lock />}
                  onClick={() => {
                    // Implement lock all slots functionality
                  }}
                >
                  {roomSlots.isLocked ? 'Unlock All' : 'Lock All'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <RoomSlotLayout
          teams={roomSlots.teams}
          isSlotChangeable={true}
          user={{ _id: 'admin' }}
          onSlotClick={() => {}}
          showLockControls={true}
          onToggleLock={toggleSlotLock}
        />

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Room Settings</DialogTitle>
          <DialogContent>
            <Box py={2} display="flex" flexDirection="column" gap={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowSlotChange}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      allowSlotChange: e.target.checked
                    }))}
                  />
                }
                label="Allow Players to Change Slots"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowTeamSwitch}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      allowTeamSwitch: e.target.checked
                    }))}
                  />
                }
                label="Allow Team Switching"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoAssignTeams}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      autoAssignTeams: e.target.checked
                    }))}
                  />
                }
                label="Auto-assign Teams on Join"
              />

              <TextField
                label="Slot Change Deadline"
                type="datetime-local"
                value={settings.slotChangeDeadline ? dayjs(settings.slotChangeDeadline).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  slotChangeDeadline: e.target.value
                }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={() => updateSettings(settings)} variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Move Player Dialog */}
        <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)}>
          <DialogTitle>Move Player</DialogTitle>
          <DialogContent>
            <Box py={2} display="flex" flexDirection="column" gap={2}>
              <TextField
                select
                label="To Team"
                value={targetTeam}
                onChange={(e) => setTargetTeam(e.target.value)}
                fullWidth
              >
                {Array.from({ length: roomSlots.maxTeams }, (_, i) => i + 1).map((num) => (
                  <MenuItem key={num} value={num}>Team {num}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="To Slot"
                value={targetSlot}
                onChange={(e) => setTargetSlot(e.target.value)}
                fullWidth
              >
                {Array.from({ length: 4 }, (_, i) => i + 1).map((num) => (
                  <MenuItem key={num} value={num}>Slot {num}</MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedPlayer && targetTeam && targetSlot) {
                  let currentTeam, currentSlot;
                  roomSlots.teams.forEach(team => {
                    team.slots.forEach(slot => {
                      if (slot.player?._id === selectedPlayer) {
                        currentTeam = team.teamNumber;
                        currentSlot = slot.slotNumber;
                      }
                    });
                  });
                  movePlayer(
                    selectedPlayer,
                    currentTeam,
                    currentSlot,
                    parseInt(targetTeam),
                    parseInt(targetSlot)
                  );
                  setMoveDialogOpen(false);
                  setTargetTeam('');
                  setTargetSlot('');
                }
              }}
              variant="contained"
              color="primary"
            >
              Move Player
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DragDropContext>
  );
};

export default AdminRoomManagement;