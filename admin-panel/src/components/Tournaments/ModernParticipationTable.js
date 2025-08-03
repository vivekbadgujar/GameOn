import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tooltip,
  Paper,
  Avatar,
  Stack
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  CheckCircle,
  Visibility,
  VisibilityOff,
  PersonRemove,
  SortByAlpha,
  Refresh
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';
import dayjs from 'dayjs';

const ModernParticipationTable = ({ tournamentId }) => {
  const { showSuccess, showError } = useNotification();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('slotNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showPlayerIds, setShowPlayerIds] = useState(false);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [kickDialog, setKickDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [kickReason, setKickReason] = useState('');
  const [editForm, setEditForm] = useState({ bgmiName: '', bgmiId: '' });
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuParticipant, setMenuParticipant] = useState(null);

  // Fetch participants data
  const { data: participantsData, isLoading, refetch } = useQuery({
    queryKey: ['tournament-participants', tournamentId],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    enabled: !!tournamentId,
    refetchInterval: 5000
  });

  // Live sync with socket events
  useEffect(() => {
    const handleUpdate = () => {
      refetch();
    };

    window.addEventListener('participantUpdated', handleUpdate);
    window.addEventListener('participantsUpdated', handleUpdate);
    window.addEventListener('slotsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('participantUpdated', handleUpdate);
      window.removeEventListener('participantsUpdated', handleUpdate);
      window.removeEventListener('slotsUpdated', handleUpdate);
    };
  }, [refetch]);

  const participants = participantsData?.data?.participants || [];

  // Filter and sort participants
  const filteredParticipants = participants
    .filter(participant => {
      const matchesSearch = 
        participant.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.user?.gameProfile?.bgmiName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.user?.gameProfile?.bgmiId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.slotNumber?.toString().includes(searchTerm);
      
      const matchesStatus = filterStatus === 'all' || participant.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'slotNumber':
          aValue = a.slotNumber || 0;
          bValue = b.slotNumber || 0;
          break;
        case 'username':
          aValue = a.user?.username || '';
          bValue = b.user?.username || '';
          break;
        case 'bgmiName':
          aValue = a.user?.gameProfile?.bgmiName || '';
          bValue = b.user?.gameProfile?.bgmiName || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'joinedAt':
          aValue = new Date(a.joinedAt || 0);
          bValue = new Date(b.joinedAt || 0);
          break;
        default:
          aValue = a.slotNumber || 0;
          bValue = b.slotNumber || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const paginatedParticipants = filteredParticipants.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle menu actions
  const handleMenuOpen = (event, participant) => {
    setAnchorEl(event.currentTarget);
    setMenuParticipant(participant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuParticipant(null);
  };

  // Handle edit participant
  const handleEditOpen = (participant) => {
    setSelectedParticipant(participant);
    setEditForm({
      bgmiName: participant.user?.gameProfile?.bgmiName || '',
      bgmiId: participant.user?.gameProfile?.bgmiId || ''
    });
    setEditDialog(true);
    handleMenuClose();
  };

  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/participants/${selectedParticipant._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editForm)
        }
      );

      if (!response.ok) throw new Error('Failed to update participant');

      showSuccess('Participant updated successfully');
      setEditDialog(false);
      refetch();

    } catch (error) {
      showError(error.message || 'Failed to update participant');
    }
  };

  // Handle kick participant
  const handleKickOpen = (participant) => {
    setSelectedParticipant(participant);
    setKickDialog(true);
    handleMenuClose();
  };

  const handleKickSubmit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/participants/${selectedParticipant._id}/kick`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: kickReason })
        }
      );

      if (!response.ok) throw new Error('Failed to kick participant');

      showSuccess('Participant kicked successfully');
      setKickDialog(false);
      setKickReason('');
      refetch();

    } catch (error) {
      showError(error.message || 'Failed to kick participant');
    }
  };

  // Handle confirm participant
  const handleConfirm = async (participant) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/participants/${participant._id}/confirm`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to confirm participant');

      showSuccess('Participant confirmed successfully');
      refetch();

    } catch (error) {
      showError(error.message || 'Failed to confirm participant');
    }
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'waiting': return 'warning';
      case 'kicked': return 'error';
      default: return 'default';
    }
  };

  // Get team number from slot
  const getTeamNumber = (slotNumber) => {
    return Math.ceil(slotNumber / 4);
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" color="primary">
            Tournament Participants ({filteredParticipants.length})
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? 'success.main' : 'error.main'
              }}
            />
            <Typography variant="caption" color={isConnected ? 'success.main' : 'error.main'}>
              {isConnected ? 'Live Sync' : 'Disconnected'}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filters and Search */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="waiting">Waiting</MenuItem>
              <MenuItem value="kicked">Kicked</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="slotNumber">Slot Number</MenuItem>
              <MenuItem value="username">Username</MenuItem>
              <MenuItem value="bgmiName">IGN</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="joinedAt">Join Date</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            startIcon={<SortByAlpha />}
          >
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowPlayerIds(!showPlayerIds)}
            startIcon={showPlayerIds ? <VisibilityOff /> : <Visibility />}
          >
            {showPlayerIds ? 'Hide' : 'Show'} Player IDs
          </Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell><strong>Team</strong></TableCell>
                <TableCell><strong>Slot</strong></TableCell>
                <TableCell><strong>Player</strong></TableCell>
                <TableCell><strong>IGN</strong></TableCell>
                {showPlayerIds && <TableCell><strong>Player ID</strong></TableCell>}
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Joined</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedParticipants.map((participant) => (
                <TableRow 
                  key={participant._id}
                  hover
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: 'grey.25' },
                    opacity: participant.status === 'kicked' ? 0.6 : 1
                  }}
                >
                  <TableCell>
                    <Chip
                      label={`Team ${getTeamNumber(participant.slotNumber)}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      #{participant.slotNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {participant.user?.username?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {participant.user?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {participant.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {participant.user?.gameProfile?.bgmiName || 'Not set'}
                    </Typography>
                  </TableCell>
                  {showPlayerIds && (
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {participant.user?.gameProfile?.bgmiId || 'Not set'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip
                      label={participant.status || 'waiting'}
                      size="small"
                      color={getStatusColor(participant.status)}
                      variant={participant.status === 'confirmed' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {dayjs(participant.joinedAt).format('MMM DD, HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, participant)}
                      disabled={participant.status === 'kicked'}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedParticipants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={showPlayerIds ? 8 : 7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'No participants match your filters' 
                        : 'No participants yet'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredParticipants.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {menuParticipant?.status !== 'confirmed' && (
            <MenuItem onClick={() => handleConfirm(menuParticipant)}>
              <CheckCircle sx={{ mr: 1 }} color="success" />
              Confirm Player
            </MenuItem>
          )}
          <MenuItem onClick={() => handleEditOpen(menuParticipant)}>
            <Edit sx={{ mr: 1 }} />
            Edit Player
          </MenuItem>
          <MenuItem onClick={() => handleKickOpen(menuParticipant)} sx={{ color: 'error.main' }}>
            <PersonRemove sx={{ mr: 1 }} />
            Kick Player
          </MenuItem>
        </Menu>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Player Information</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="IGN (In-Game Name)"
                value={editForm.bgmiName}
                onChange={(e) => setEditForm({ ...editForm, bgmiName: e.target.value })}
                fullWidth
                placeholder="Enter BGMI username"
              />
              <TextField
                label="Player ID"
                value={editForm.bgmiId}
                onChange={(e) => setEditForm({ ...editForm, bgmiId: e.target.value })}
                fullWidth
                placeholder="Enter BGMI player ID"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Kick Dialog */}
        <Dialog open={kickDialog} onClose={() => setKickDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle color="error.main">Kick Player</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This will remove the player from the tournament and free up their slot.
            </Alert>
            <TextField
              label="Reason for kicking (optional)"
              value={kickReason}
              onChange={(e) => setKickReason(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Enter reason for removing this player..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setKickDialog(false)}>Cancel</Button>
            <Button onClick={handleKickSubmit} color="error" variant="contained">
              Kick Player
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ModernParticipationTable;