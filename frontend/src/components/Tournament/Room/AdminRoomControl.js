import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Lock,
  LockOpen,
  Settings,
  GroupAdd,
  Timer,
  BugReport,
} from '@mui/icons-material';
import { DragDropContext } from 'react-beautiful-dnd';
import dayjs from 'dayjs';
import RoomSlotLayout from './RoomSlotLayout';

const AdminRoomControl = ({
  tournamentId,
  socket,
  showSuccess,
  showError,
}) => {
  const theme = useTheme();
  const [roomSlots, setRoomSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    allowSlotChange: true,
    allowTeamSwitch: true,
    autoAssignTeams: true,
    slotChangeDeadline: null,
  });

  // Fetch initial room data when component mounts
  React.useEffect(() => {
    fetchRoomData();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
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
    }
  };

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

  const toggleAllSlots = async (action) => {
    try {
      const response = await fetch(`/api/admin/room-slots/${tournamentId}/toggle-all-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) throw new Error(`Failed to ${action} all slots`);

      const data = await response.json();
      setRoomSlots(data.data.roomSlot);
      socket.emit('adminAllSlotsToggled', {
        tournamentId,
        action,
        ...data.data
      });
      showSuccess(`All slots ${action}ed successfully`);
    } catch (error) {
      showError(error.message);
    }
  };

  const updateSettings = async () => {
    try {
      const response = await fetch(`/api/admin/room-slots/${tournamentId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to update settings');

      const data = await response.json();
      setRoomSlots(data.data.roomSlot);
      socket.emit('adminSettingsUpdated', {
        tournamentId,
        ...data.data
      });
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
    <Box p={3}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
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
              <Typography variant="h6" color="primary">Room Status</Typography>
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
              <Typography variant="h6" color="success.main">Teams Ready</Typography>
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
              <Typography variant="h6" color="warning.main">Controls</Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="warning"
                startIcon={roomSlots.isLocked ? <LockOpen /> : <Lock />}
                onClick={() => toggleAllSlots(roomSlots.isLocked ? 'unlock' : 'lock')}
              >
                {roomSlots.isLocked ? 'Unlock All' : 'Lock All'}
              </Button>
              <Tooltip title="Room Settings">
                <IconButton onClick={() => setSettingsOpen(true)} color="primary">
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>

        {/* Room Layout */}
        <Grid item xs={12}>
          <RoomSlotLayout
            teams={roomSlots.teams}
            isSlotChangeable={true}
            user={{ _id: 'admin' }}
            onSlotClick={() => {}}
            showLockControls={true}
            onToggleLock={toggleSlotLock}
          />
        </Grid>
      </Grid>

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
          <Button onClick={updateSettings} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminRoomControl;