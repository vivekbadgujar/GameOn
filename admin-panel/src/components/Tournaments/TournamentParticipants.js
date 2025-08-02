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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Skeleton,
  Snackbar
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
  Warning,
  SwapVert
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

dayjs.extend(relativeTime);

const TournamentParticipants = ({ tournamentId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { admin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [visiblePlayerIds, setVisiblePlayerIds] = useState(new Set());
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [recentlyJoined, setRecentlyJoined] = useState(new Set());
  const [recentlyRemoved, setRecentlyRemoved] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Fetch tournament participants
  const { data: tournament, isLoading, error } = useQuery({
    queryKey: ['tournament-participants', tournamentId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    refetchInterval: 5000, // Live sync every 5 seconds
    onSuccess: (newData) => {
      // Detect newly joined players
      const currentParticipants = tournament?.data?.participants || [];
      const newParticipants = newData?.data?.participants || [];
      
      const newPlayerIds = newParticipants
        .filter(p => !currentParticipants.find(cp => cp._id === p._id))
        .map(p => p._id);
      
      if (newPlayerIds.length > 0) {
        setRecentlyJoined(new Set(newPlayerIds));
        setTimeout(() => setRecentlyJoined(new Set()), 3000);
      }
    }
  });

  // Kick player mutation
  const kickPlayerMutation = useMutation({
    mutationFn: async ({ participantId, reason }) => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants/${participantId}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to kick player');
      return response.json();
    },
    onSuccess: (data, variables) => {
      showSuccess('Player kicked successfully');
      setRecentlyRemoved(new Set([variables.participantId]));
      setTimeout(() => setRecentlyRemoved(new Set()), 3000);
      queryClient.invalidateQueries(['tournament-participants', tournamentId]);
    },
    onError: (error) => {
      showError(`Failed to kick player: ${error.message}`);
    }
  });

  // Update slot mutation
  const updateSlotMutation = useMutation({
    mutationFn: async ({ participantId, newSlot }) => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants/${participantId}/slot`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ slotNumber: newSlot })
      });
      if (!response.ok) throw new Error('Failed to update slot');
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Slot updated successfully');
      queryClient.invalidateQueries(['tournament-participants', tournamentId]);
    },
    onError: (error) => {
      showError(`Failed to update slot: ${error.message}`);
    }
  });

  // Toggle player ID visibility
  const togglePlayerIdVisibility = (participantId) => {
    setVisiblePlayerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const participants = tournament?.data?.participants || [];
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const participant = participants[sourceIndex];
    const newSlot = destinationIndex + 1;

    updateSlotMutation.mutate({
      participantId: participant._id,
      newSlot
    });
  };

  // Export functions
  const exportToCSV = () => {
    const participants = filteredParticipants();
    const csvData = participants.map(p => ({
      'Slot No.': p.slotNumber,
      'Player IGN': p.user?.gameProfile?.bgmiName || 'N/A',
      'Player ID': p.user?.gameProfile?.bgmiId || 'N/A',
      'Join Time': dayjs(p.joinedAt).format('DD/MM/YYYY HH:mm'),
      'Status': getParticipantStatus(p),
      'Kills': p.kills || 0,
      'Rank': p.rank || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    XLSX.writeFile(wb, `${tournament?.data?.title || 'Tournament'}_Participants.xlsx`);
    
    showSuccess('Participant list exported successfully');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const participants = filteredParticipants();
    
    doc.setFontSize(16);
    doc.text(`${tournament?.data?.title || 'Tournament'} - Participants`, 20, 20);
    
    const tableData = participants.map(p => [
      p.slotNumber,
      p.user?.gameProfile?.bgmiName || 'N/A',
      p.user?.gameProfile?.bgmiId || 'N/A',
      dayjs(p.joinedAt).format('DD/MM/YYYY HH:mm'),
      getParticipantStatus(p),
      p.kills || 0,
      p.rank || 'N/A'
    ]);

    doc.autoTable({
      head: [['Slot', 'IGN', 'Player ID', 'Join Time', 'Status', 'Kills', 'Rank']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [63, 81, 181] }
    });

    doc.save(`${tournament?.data?.title || 'Tournament'}_Participants.pdf`);
    showSuccess('Participant list exported to PDF successfully');
  };

  // Filter participants
  const filteredParticipants = () => {
    const participants = tournament?.data?.participants || [];
    
    return participants.filter(participant => {
      const matchesSearch = !searchTerm || 
        participant.user?.gameProfile?.bgmiName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.user?.gameProfile?.bgmiId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.slotNumber?.toString().includes(searchTerm);

      const matchesStatus = filterStatus === 'all' || getParticipantStatus(participant) === filterStatus;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => a.slotNumber - b.slotNumber);
  };

  // Get participant status
  const getParticipantStatus = (participant) => {
    if (participant.status === 'kicked') return 'kicked';
    if (participant.status === 'confirmed') return 'confirmed';
    return 'waiting';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'waiting': return 'warning';
      case 'kicked': return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle />;
      case 'waiting': return <Schedule />;
      case 'kicked': return <Cancel />;
      default: return <Warning />;
    }
  };

  if (isLoading) {
    return (
      <Box p={3}>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load participants: {error.message}
      </Alert>
    );
  }

  const participants = filteredParticipants();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" gutterBottom>
            Tournament Participants
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {tournament?.data?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {participants.length} / {tournament?.data?.maxParticipants} participants
          </Typography>
        </Box>

        {/* Controls */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by IGN, ID, or Slot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filter Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="waiting">Waiting</MenuItem>
                  <MenuItem value="kicked">Kicked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<GetApp />}
                  onClick={exportToCSV}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<GetApp />}
                  onClick={exportToPDF}
                >
                  Export PDF
                </Button>
                <IconButton
                  size="small"
                  onClick={() => queryClient.invalidateQueries(['tournament-participants', tournamentId])}
                >
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Participants Table/Cards */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {isMobile ? (
            // Mobile Card View
            <Box sx={{ p: 2 }}>
              {participants.map((participant, index) => (
                <ParticipantCard
                  key={participant._id}
                  participant={participant}
                  index={index}
                  isRecentlyJoined={recentlyJoined.has(participant._id)}
                  isRecentlyRemoved={recentlyRemoved.has(participant._id)}
                  isPlayerIdVisible={visiblePlayerIds.has(participant._id)}
                  onTogglePlayerId={() => togglePlayerIdVisibility(participant._id)}
                  onKickPlayer={(reason) => kickPlayerMutation.mutate({ participantId: participant._id, reason })}
                  onEditPlayer={() => {
                    setEditingPlayer(participant);
                    setEditDialog(true);
                  }}
                />
              ))}
            </Box>
          ) : (
            // Desktop Table View
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="participants">
                {(provided) => (
                  <TableContainer>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell width="60px">Slot</TableCell>
                          <TableCell>Player IGN</TableCell>
                          <TableCell>Join Time</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {participants.map((participant, index) => (
                          <ParticipantRow
                            key={participant._id}
                            participant={participant}
                            index={index}
                            isRecentlyJoined={recentlyJoined.has(participant._id)}
                            isRecentlyRemoved={recentlyRemoved.has(participant._id)}
                            isPlayerIdVisible={visiblePlayerIds.has(participant._id)}
                            onTogglePlayerId={() => togglePlayerIdVisibility(participant._id)}
                            onKickPlayer={(reason) => kickPlayerMutation.mutate({ participantId: participant._id, reason })}
                            onEditPlayer={() => {
                              setEditingPlayer(participant);
                              setEditDialog(true);
                            }}
                          />
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Box>
      </CardContent>

      {/* Edit Player Dialog */}
      <EditPlayerDialog
        open={editDialog}
        player={editingPlayer}
        onClose={() => {
          setEditDialog(false);
          setEditingPlayer(null);
        }}
        onSave={(updatedData) => {
          // Handle player update
          showSuccess('Player information updated');
          setEditDialog(false);
          setEditingPlayer(null);
          queryClient.invalidateQueries(['tournament-participants', tournamentId]);
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Card>
  );
};

// Participant Row Component for Desktop
const ParticipantRow = ({ 
  participant, 
  index, 
  isRecentlyJoined, 
  isRecentlyRemoved, 
  isPlayerIdVisible, 
  onTogglePlayerId, 
  onKickPlayer, 
  onEditPlayer 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [kickDialog, setKickDialog] = useState(false);
  const [kickReason, setKickReason] = useState('');

  const getParticipantStatus = (participant) => {
    if (participant.status === 'kicked') return 'kicked';
    if (participant.status === 'confirmed') return 'confirmed';
    return 'waiting';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'waiting': return 'warning';
      case 'kicked': return 'error';
      default: return 'default';
    }
  };

  const status = getParticipantStatus(participant);

  return (
    <Draggable draggableId={participant._id} index={index}>
      {(provided, snapshot) => (
        <TableRow
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{
            backgroundColor: isRecentlyJoined ? 'success.light' : 
                           isRecentlyRemoved ? 'error.light' : 
                           snapshot.isDragging ? 'action.hover' : 'inherit',
            transition: 'background-color 0.3s ease',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <div {...provided.dragHandleProps}>
                <DragIndicator sx={{ color: 'text.secondary', cursor: 'grab' }} />
              </div>
              <Typography variant="h6" color="primary">
                #{participant.slotNumber}
              </Typography>
            </Box>
          </TableCell>
          
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={isPlayerIdVisible ? "Click to show IGN" : "Click to show Player ID"}>
                <IconButton
                  size="small"
                  onClick={onTogglePlayerId}
                  sx={{ 
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'scale(1.1)' }
                  }}
                >
                  {isPlayerIdVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
              <Fade in={true} timeout={300}>
                <Typography variant="body1" fontWeight="medium">
                  {isPlayerIdVisible 
                    ? participant.user?.gameProfile?.bgmiId || 'N/A'
                    : participant.user?.gameProfile?.bgmiName || 'N/A'
                  }
                </Typography>
              </Fade>
            </Box>
          </TableCell>
          
          <TableCell>
            <Typography variant="body2" color="text.secondary">
              {dayjs(participant.joinedAt).format('DD/MM/YY HH:mm')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayjs(participant.joinedAt).fromNow()}
            </Typography>
          </TableCell>
          
          <TableCell>
            <Chip
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              color={getStatusColor(status)}
              size="small"
              variant="outlined"
            />
          </TableCell>
          
          <TableCell>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Edit Player">
                <IconButton size="small" onClick={onEditPlayer}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Kick Player">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => setKickDialog(true)}
                  disabled={status === 'kicked'}
                >
                  <PersonRemove />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Kick Dialog */}
            <Dialog open={kickDialog} onClose={() => setKickDialog(false)}>
              <DialogTitle>Kick Player</DialogTitle>
              <DialogContent>
                <Typography gutterBottom>
                  Are you sure you want to kick {participant.user?.gameProfile?.bgmiName}?
                </Typography>
                <TextField
                  fullWidth
                  label="Reason (optional)"
                  value={kickReason}
                  onChange={(e) => setKickReason(e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setKickDialog(false)}>Cancel</Button>
                <Button 
                  color="error" 
                  onClick={() => {
                    onKickPlayer(kickReason);
                    setKickDialog(false);
                    setKickReason('');
                  }}
                >
                  Kick Player
                </Button>
              </DialogActions>
            </Dialog>
          </TableCell>
        </TableRow>
      )}
    </Draggable>
  );
};

// Participant Card Component for Mobile
const ParticipantCard = ({ 
  participant, 
  index, 
  isRecentlyJoined, 
  isRecentlyRemoved, 
  isPlayerIdVisible, 
  onTogglePlayerId, 
  onKickPlayer, 
  onEditPlayer 
}) => {
  const [kickDialog, setKickDialog] = useState(false);
  const [kickReason, setKickReason] = useState('');

  const getParticipantStatus = (participant) => {
    if (participant.status === 'kicked') return 'kicked';
    if (participant.status === 'confirmed') return 'confirmed';
    return 'waiting';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'waiting': return 'warning';
      case 'kicked': return 'error';
      default: return 'default';
    }
  };

  const status = getParticipantStatus(participant);

  return (
    <Zoom in={true} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
      <Card 
        sx={{ 
          mb: 2,
          backgroundColor: isRecentlyJoined ? 'success.light' : 
                         isRecentlyRemoved ? 'error.light' : 'inherit',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" color="primary">
              Slot #{participant.slotNumber}
            </Typography>
            <Chip
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              color={getStatusColor(status)}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Tooltip title={isPlayerIdVisible ? "Click to show IGN" : "Click to show Player ID"}>
              <IconButton size="small" onClick={onTogglePlayerId}>
                {isPlayerIdVisible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
            <Typography variant="body1" fontWeight="medium">
              {isPlayerIdVisible 
                ? participant.user?.gameProfile?.bgmiId || 'N/A'
                : participant.user?.gameProfile?.bgmiName || 'N/A'
              }
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Joined: {dayjs(participant.joinedAt).format('DD/MM/YY HH:mm')} ({dayjs(participant.joinedAt).fromNow()})
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button size="small" startIcon={<Edit />} onClick={onEditPlayer}>
              Edit
            </Button>
            <Button 
              size="small" 
              color="error" 
              startIcon={<PersonRemove />}
              onClick={() => setKickDialog(true)}
              disabled={status === 'kicked'}
            >
              Kick
            </Button>
          </Box>

          {/* Kick Dialog */}
          <Dialog open={kickDialog} onClose={() => setKickDialog(false)}>
            <DialogTitle>Kick Player</DialogTitle>
            <DialogContent>
              <Typography gutterBottom>
                Are you sure you want to kick {participant.user?.gameProfile?.bgmiName}?
              </Typography>
              <TextField
                fullWidth
                label="Reason (optional)"
                value={kickReason}
                onChange={(e) => setKickReason(e.target.value)}
                margin="normal"
                multiline
                rows={2}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setKickDialog(false)}>Cancel</Button>
              <Button 
                color="error" 
                onClick={() => {
                  onKickPlayer(kickReason);
                  setKickDialog(false);
                  setKickReason('');
                }}
              >
                Kick Player
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Zoom>
  );
};

// Edit Player Dialog Component
const EditPlayerDialog = ({ open, player, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    bgmiName: '',
    bgmiId: '',
    slotNumber: 1
  });

  useEffect(() => {
    if (player) {
      setFormData({
        bgmiName: player.user?.gameProfile?.bgmiName || '',
        bgmiId: player.user?.gameProfile?.bgmiId || '',
        slotNumber: player.slotNumber || 1
      });
    }
  }, [player]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Player Information</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Player IGN"
              value={formData.bgmiName}
              onChange={(e) => setFormData({ ...formData, bgmiName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Player ID"
              value={formData.bgmiId}
              onChange={(e) => setFormData({ ...formData, bgmiId: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Slot Number"
              value={formData.slotNumber}
              onChange={(e) => setFormData({ ...formData, slotNumber: parseInt(e.target.value) })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TournamentParticipants;