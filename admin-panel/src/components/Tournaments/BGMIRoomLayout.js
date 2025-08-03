import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Paper,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Skeleton,
  Snackbar,
  Avatar,
  Divider,
  Stack
} from '@mui/material';
import {
  Search,
  Visibility,
  VisibilityOff,
  PersonRemove,
  Edit,
  DragIndicator,
  GetApp,
  FilterList,
  Refresh,
  Schedule,
  CheckCircle,
  Cancel,
  PersonAdd,
  Group,
  SwapHoriz,
  Delete,
  MoreVert,
  SportsMma,
  EmojiEvents,
  People,
  Add
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSocket } from '../../contexts/SocketContext';

dayjs.extend(relativeTime);

const BGMIRoomLayout = ({ tournament, onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError } = useNotification();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isPlayerIdVisible, setIsPlayerIdVisible] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [kickDialog, setKickDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [addPlayerDialog, setAddPlayerDialog] = useState(false);
  const [createSquadDialog, setCreateSquadDialog] = useState(false);
  const [kickReason, setKickReason] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState(new Set());
  const [squadCreationMode, setSquadCreationMode] = useState(false);
  const [selectedForSquad, setSelectedForSquad] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);

  // Fetch participant statistics
  const { data: participantStats, refetch: refetchStats } = useQuery({
    queryKey: ['tournament-participant-stats', tournament?.data?._id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tournaments/${tournament?.data?._id}/participants/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch participant stats');
      return response.json();
    },
    enabled: !!tournament?.data?._id,
    refetchInterval: 5000
  });

  // Live sync with custom events from SocketContext
  useEffect(() => {
    const handleTournamentUpdate = (event) => {
      const data = event.detail;
      if (data.tournamentId === tournament?.data?._id) {
        onRefresh?.();
      }
    };

    const handleParticipantUpdate = (event) => {
      const data = event.detail;
      if (data.tournamentId === tournament?.data?._id) {
        onRefresh?.();
      }
    };

    const handleSlotsUpdate = (event) => {
      const data = event.detail;
      if (data.tournamentId === tournament?.data?._id) {
        onRefresh?.();
        setRecentlyUpdated(new Set([data.sourceSlot, data.destSlot]));
        setTimeout(() => setRecentlyUpdated(new Set()), 3000);
      }
    };

    const handleSquadUpdate = (event) => {
      const data = event.detail;
      if (data.tournamentId === tournament?.data?._id) {
        onRefresh?.();
      }
    };

    // Add event listeners
    window.addEventListener('tournamentUpdated', handleTournamentUpdate);
    window.addEventListener('participantUpdated', handleParticipantUpdate);
    window.addEventListener('participantsUpdated', handleParticipantUpdate);
    window.addEventListener('slotsUpdated', handleSlotsUpdate);
    window.addEventListener('squadUpdated', handleSquadUpdate);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('tournamentUpdated', handleTournamentUpdate);
      window.removeEventListener('participantUpdated', handleParticipantUpdate);
      window.removeEventListener('participantsUpdated', handleParticipantUpdate);
      window.removeEventListener('slotsUpdated', handleSlotsUpdate);
      window.removeEventListener('squadUpdated', handleSquadUpdate);
    };
  }, [tournament?.data?._id, onRefresh]);

  // Auto-refresh every 10 seconds (reduced frequency due to socket updates)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchStats]);

  // Organize participants into squads (4 players per squad)
  const organizeIntoSquads = useCallback(() => {
    const participants = tournament?.data?.participants || [];
    const squads = [];
    const maxParticipants = tournament?.data?.maxParticipants || 100;
    const totalSquads = Math.ceil(maxParticipants / 4);

    for (let i = 0; i < totalSquads; i++) {
      const squadNumber = i + 1;
      const squadParticipants = [];
      
      // Fill squad with participants (4 slots per squad)
      for (let j = 0; j < 4; j++) {
        const slotNumber = (i * 4) + j + 1;
        const participant = participants.find(p => p.slotNumber === slotNumber);
        
        squadParticipants.push({
          slotNumber,
          participant: participant || null,
          isEmpty: !participant
        });
      }

      squads.push({
        squadNumber,
        slots: squadParticipants,
        isComplete: squadParticipants.filter(s => !s.isEmpty).length === 4,
        confirmedCount: squadParticipants.filter(s => s.participant?.status === 'confirmed').length,
        waitingCount: squadParticipants.filter(s => s.participant?.status === 'waiting').length
      });
    }

    return squads;
  }, [tournament]);

  const squads = organizeIntoSquads();

  // Filter squads based on search and status
  const filteredSquads = squads.filter(squad => {
    if (filterStatus === 'complete' && !squad.isComplete) return false;
    if (filterStatus === 'incomplete' && squad.isComplete) return false;
    if (filterStatus === 'confirmed' && squad.confirmedCount === 0) return false;
    if (filterStatus === 'waiting' && squad.waitingCount === 0) return false;

    if (searchTerm) {
      return squad.slots.some(slot => {
        if (!slot.participant) return false;
        const participant = slot.participant;
        return (
          participant.user?.gameProfile?.bgmiName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.user?.gameProfile?.bgmiId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slot.slotNumber.toString().includes(searchTerm)
        );
      });
    }

    return true;
  });

  // Get participant status with color
  const getParticipantStatus = (participant) => {
    if (!participant) return { status: 'empty', color: 'default', label: 'Empty' };
    
    switch (participant.status) {
      case 'confirmed':
        return { status: 'confirmed', color: 'success', label: 'Confirmed' };
      case 'waiting':
        return { status: 'waiting', color: 'warning', label: 'Waiting' };
      case 'kicked':
        return { status: 'kicked', color: 'error', label: 'Kicked' };
      default:
        return { status: 'waiting', color: 'warning', label: 'Waiting' };
    }
  };

  // Handle drag and drop
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Extract slot numbers from droppableId
    const sourceSlot = parseInt(source.droppableId.split('-')[1]);
    const destSlot = parseInt(destination.droppableId.split('-')[1]);

    if (sourceSlot === destSlot) return;

    try {
      const response = await fetch(`/api/admin/tournaments/${tournament?.data?._id}/participants/swap-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          sourceSlot,
          destSlot
        })
      });

      if (!response.ok) throw new Error('Failed to swap slots');

      showSuccess('Players swapped successfully');
      onRefresh?.();
      
      // Highlight updated slots
      setRecentlyUpdated(new Set([sourceSlot, destSlot]));
      setTimeout(() => setRecentlyUpdated(new Set()), 3000);

    } catch (error) {
      showError(error.message || 'Failed to swap players');
    }
  };

  // Handle kick player
  const handleKickPlayer = async () => {
    if (!selectedParticipant) return;

    try {
      const response = await fetch(`/api/admin/tournaments/${tournament?.data?._id}/participants/${selectedParticipant._id}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ reason: kickReason })
      });

      if (!response.ok) throw new Error('Failed to kick player');

      showSuccess('Player kicked successfully');
      setKickDialog(false);
      setKickReason('');
      setSelectedParticipant(null);
      onRefresh?.();

    } catch (error) {
      showError(error.message || 'Failed to kick player');
    }
  };

  // Handle confirm player
  const handleConfirmPlayer = async (participant) => {
    try {
      const response = await fetch(`/api/admin/tournaments/${tournament?.data?._id}/participants/${participant._id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to confirm player');

      showSuccess('Player confirmed successfully');
      onRefresh?.();

    } catch (error) {
      showError(error.message || 'Failed to confirm player');
    }
  };

  // Handle confirm entire squad
  const handleConfirmSquad = async (squad) => {
    try {
      const participantIds = squad.slots
        .filter(slot => slot.participant && slot.participant.status !== 'confirmed')
        .map(slot => slot.participant._id);

      if (participantIds.length === 0) {
        showError('No players to confirm in this squad');
        return;
      }

      const response = await fetch(`/api/admin/tournaments/${tournament?.data?._id}/participants/bulk-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ participantIds })
      });

      if (!response.ok) throw new Error('Failed to confirm squad');

      showSuccess(`Confirmed ${participantIds.length} players in Squad ${squad.squadNumber}`);
      onRefresh?.();

    } catch (error) {
      showError(error.message || 'Failed to confirm squad');
    }
  };

  // Handle manual squad creation
  const handleCreateSquad = async () => {
    if (selectedForSquad.length !== 4) {
      showError('Please select exactly 4 players for the squad');
      return;
    }

    try {
      // Find 4 consecutive empty slots
      const participants = tournament?.data?.participants || [];
      const maxParticipants = tournament?.data?.maxParticipants || 100;
      let targetSlots = [];

      // Find 4 consecutive empty slots
      for (let i = 1; i <= maxParticipants - 3; i += 4) {
        const slots = [i, i + 1, i + 2, i + 3];
        const isEmpty = slots.every(slot => 
          !participants.some(p => p.slotNumber === slot)
        );
        
        if (isEmpty) {
          targetSlots = slots;
          break;
        }
      }

      if (targetSlots.length === 0) {
        showError('No 4 consecutive empty slots available');
        return;
      }

      // Move selected players to the target slots
      const squadId = `squad_${Date.now()}`;
      
      for (let i = 0; i < selectedForSquad.length; i++) {
        const participant = selectedForSquad[i];
        const targetSlot = targetSlots[i];

        const response = await fetch(`/api/admin/tournaments/${tournament?.data?._id}/participants/${participant._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ 
            slotNumber: targetSlot,
            squadId: squadId
          })
        });

        if (!response.ok) throw new Error(`Failed to move player to slot ${targetSlot}`);
      }

      showSuccess(`Squad created successfully in slots ${targetSlots.join(', ')}`);
      setSquadCreationMode(false);
      setSelectedForSquad([]);
      onRefresh?.();

    } catch (error) {
      showError(error.message || 'Failed to create squad');
    }
  };

  // Toggle squad creation mode
  const toggleSquadCreationMode = () => {
    setSquadCreationMode(!squadCreationMode);
    setSelectedForSquad([]);
  };

  // Handle player selection for squad creation
  const handlePlayerSelect = (participant) => {
    if (selectedForSquad.find(p => p._id === participant._id)) {
      setSelectedForSquad(selectedForSquad.filter(p => p._id !== participant._id));
    } else if (selectedForSquad.length < 4) {
      setSelectedForSquad([...selectedForSquad, participant]);
    } else {
      showError('You can only select 4 players for a squad');
    }
  };

  // Export functions
  const exportToCSV = () => {
    const csvData = [];
    squads.forEach(squad => {
      squad.slots.forEach(slot => {
        if (slot.participant) {
          csvData.push({
            'Squad': squad.squadNumber,
            'Slot No.': slot.slotNumber,
            'Player IGN': slot.participant.user?.gameProfile?.bgmiName || 'N/A',
            'Player ID': slot.participant.user?.gameProfile?.bgmiId || 'N/A',
            'Join Time': dayjs(slot.participant.joinedAt).format('DD/MM/YYYY HH:mm'),
            'Status': getParticipantStatus(slot.participant).label,
            'Kills': slot.participant.kills || 0,
            'Rank': slot.participant.rank || 'N/A'
          });
        }
      });
    });

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    XLSX.writeFile(wb, `${tournament?.data?.title || 'Tournament'}_Participants.xlsx`);
    showSuccess('Participant list exported successfully');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${tournament?.data?.title || 'Tournament'} - Squad Layout`, 20, 20);
    
    const tableData = [];
    squads.forEach(squad => {
      squad.slots.forEach(slot => {
        if (slot.participant) {
          tableData.push([
            squad.squadNumber,
            slot.slotNumber,
            slot.participant.user?.gameProfile?.bgmiName || 'N/A',
            slot.participant.user?.gameProfile?.bgmiId || 'N/A',
            dayjs(slot.participant.joinedAt).format('DD/MM/YYYY HH:mm'),
            getParticipantStatus(slot.participant).label,
            slot.participant.kills || 0,
            slot.participant.rank || 'N/A'
          ]);
        }
      });
    });

    doc.autoTable({
      head: [['Squad', 'Slot', 'Player IGN', 'Player ID', 'Join Time', 'Status', 'Kills', 'Rank']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${tournament?.data?.title || 'Tournament'}_Squad_Layout.pdf`);
    showSuccess('Squad layout exported successfully');
  };

  // Render empty slot
  const renderEmptySlot = (slotNumber, squadNumber) => (
    <Card
      sx={{
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed',
        borderColor: 'grey.300',
        backgroundColor: 'grey.50',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'primary.50'
        }
      }}
      onClick={() => {
        setSelectedSquad({ squadNumber, slotNumber });
        setAddPlayerDialog(true);
      }}
    >
      <Box textAlign="center">
        <Add sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Slot {slotNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click to add player
        </Typography>
      </Box>
    </Card>
  );

  // Render participant slot
  const renderParticipantSlot = (slot, squadNumber) => {
    const participant = slot.participant;
    const status = getParticipantStatus(participant);
    const isRecent = recentlyUpdated.has(slot.slotNumber);
    const isSelected = squadCreationMode && selectedForSquad.find(p => p._id === participant._id);

    return (
      <Draggable
        key={`participant-${slot.slotNumber}`}
        draggableId={`participant-${slot.slotNumber}`}
        index={0}
        isDragDisabled={squadCreationMode}
      >
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            onClick={() => squadCreationMode && handlePlayerSelect(participant)}
            sx={{
              minHeight: 120,
              position: 'relative',
              cursor: squadCreationMode ? 'pointer' : (snapshot.isDragging ? 'grabbing' : 'grab'),
              transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
              boxShadow: snapshot.isDragging ? 4 : (isSelected ? 3 : 1),
              border: isSelected ? '3px solid' : (isRecent ? '2px solid' : '1px solid'),
              borderColor: isSelected ? 'primary.main' : (isRecent ? 'success.main' : 'divider'),
              backgroundColor: isSelected ? 'primary.50' : (isRecent ? 'success.50' : 'background.paper'),
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: squadCreationMode ? 4 : 3
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              {/* Drag Handle */}
              <Box
                {...provided.dragHandleProps}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  cursor: 'grab'
                }}
              >
                <DragIndicator sx={{ color: 'grey.400', fontSize: 16 }} />
              </Box>

              {/* Slot Number */}
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Slot {slot.slotNumber}
              </Typography>

              {/* Player Info */}
              <Box sx={{ mb: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Tooltip title={isPlayerIdVisible ? "Click to show IGN" : "Click to view Player ID"}>
                    <IconButton
                      size="small"
                      onClick={() => setIsPlayerIdVisible(!isPlayerIdVisible)}
                      sx={{ p: 0.5 }}
                    >
                      {isPlayerIdVisible ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                  <Fade in={true} timeout={300}>
                    <Typography variant="body2" fontWeight="medium" noWrap>
                      {isPlayerIdVisible 
                        ? participant.user?.gameProfile?.bgmiId || 'N/A'
                        : participant.user?.gameProfile?.bgmiName || 'N/A'
                      }
                    </Typography>
                  </Fade>
                </Box>
              </Box>

              {/* Status */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip
                  label={status.label}
                  color={status.color}
                  size="small"
                  sx={{ fontSize: '0.7rem' }}
                />

                {/* Actions */}
                <Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setSelectedParticipant(participant);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              </Box>

              {/* Join Time */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {dayjs(participant.joinedAt).fromNow()}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Draggable>
    );
  };

  // Render squad
  const renderSquad = (squad) => (
    <Card key={squad.squadNumber} sx={{ mb: 3 }}>
      <CardContent>
        {/* Squad Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" color="primary">
              Squad {squad.squadNumber}
            </Typography>
            <Chip
              icon={<People />}
              label={`${squad.slots.filter(s => !s.isEmpty).length}/4`}
              color={squad.isComplete ? 'success' : 'default'}
              size="small"
            />
            {squad.confirmedCount > 0 && (
              <Chip
                icon={<CheckCircle />}
                label={`${squad.confirmedCount} Confirmed`}
                color="success"
                size="small"
                variant="outlined"
              />
            )}
            {squad.waitingCount > 0 && (
              <Chip
                icon={<Schedule />}
                label={`${squad.waitingCount} Waiting`}
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Squad Actions */}
          <Box display="flex" gap={1}>
            {squad.waitingCount > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleConfirmSquad(squad)}
              >
                Confirm Squad
              </Button>
            )}
          </Box>
        </Box>

        {/* Squad Slots */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Grid container spacing={2}>
            {squad.slots.map((slot) => (
              <Grid item xs={12} sm={6} md={3} key={slot.slotNumber}>
                {slot.isEmpty ? (
                  renderEmptySlot(slot.slotNumber, squad.squadNumber)
                ) : (
                  <Droppable droppableId={`slot-${slot.slotNumber}`}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          backgroundColor: snapshot.isDraggingOver ? 'primary.50' : 'transparent',
                          borderRadius: 1,
                          transition: 'background-color 0.3s ease'
                        }}
                      >
                        {renderParticipantSlot(slot, squad.squadNumber)}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                )}
              </Grid>
            ))}
          </Grid>
        </DragDropContext>
      </CardContent>
    </Card>
  );

  if (!tournament?.data) {
    return (
      <Box p={3}>
        <Typography>Loading tournament data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" color="primary" display="flex" alignItems="center" gap={1}>
            <SportsMma />
            BGMI Room Layout
          </Typography>
          {squadCreationMode && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
              Squad Creation Mode: Select 4 players to create a squad
            </Typography>
          )}
          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? 'success.main' : 'error.main'
              }}
            />
            <Typography variant="caption" color={isConnected ? 'success.main' : 'error.main'}>
              {isConnected ? 'Live Sync Active' : 'Live Sync Disconnected'}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          {/* Squad Creation Controls */}
          {squadCreationMode ? (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<Group />}
                onClick={handleCreateSquad}
                disabled={selectedForSquad.length !== 4}
                size="small"
              >
                Create Squad ({selectedForSquad.length}/4)
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={toggleSquadCreationMode}
                size="small"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Group />}
              onClick={toggleSquadCreationMode}
              size="small"
            >
              Create Squad
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={exportToCSV}
            size="small"
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={exportToPDF}
            size="small"
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {participantStats?.data && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary">
                  {participantStats.data.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Players
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">
                  {participantStats.data.confirmed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirmed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {participantStats.data.waiting}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Waiting
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="info.main">
                  {Math.ceil(participantStats.data.total / 4)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Squads
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search players, IDs, or slots..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 300 }}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter Squads</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Filter Squads"
          >
            <MenuItem value="all">All Squads</MenuItem>
            <MenuItem value="complete">Complete Squads</MenuItem>
            <MenuItem value="incomplete">Incomplete Squads</MenuItem>
            <MenuItem value="confirmed">With Confirmed</MenuItem>
            <MenuItem value="waiting">With Waiting</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Squad Layout */}
      <Box>
        {filteredSquads.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No squads found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredSquads.map(renderSquad)
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {selectedParticipant?.status !== 'confirmed' && (
          <MenuItem onClick={() => {
            handleConfirmPlayer(selectedParticipant);
            setAnchorEl(null);
          }}>
            <CheckCircle sx={{ mr: 1 }} />
            Confirm Player
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          setEditDialog(true);
          setAnchorEl(null);
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit Player
        </MenuItem>
        <MenuItem onClick={() => {
          setKickDialog(true);
          setAnchorEl(null);
        }}>
          <PersonRemove sx={{ mr: 1 }} />
          Kick Player
        </MenuItem>
      </Menu>

      {/* Kick Player Dialog */}
      <Dialog open={kickDialog} onClose={() => setKickDialog(false)}>
        <DialogTitle>Kick Player</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to kick {selectedParticipant?.user?.gameProfile?.bgmiName}?
          </Typography>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={kickReason}
            onChange={(e) => setKickReason(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKickDialog(false)}>Cancel</Button>
          <Button onClick={handleKickPlayer} color="error" variant="contained">
            Kick Player
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BGMIRoomLayout;