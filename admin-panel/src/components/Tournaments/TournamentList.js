import React, { useState } from 'react';
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
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
  GridRowModes
} from '@mui/x-data-grid';
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  FilterList,
  Refresh,
  EmojiEvents,
  Schedule,
  People,
  Payment,
  VpnKey
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const TournamentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lastMessage } = useSocket();

  // Fetch tournaments - MUST be defined before using refetch in useEffect
  const { data: tournaments, isLoading, error, refetch } = useQuery({
    queryKey: ['tournaments', searchTerm, statusFilter, gameFilter],
    queryFn: () => tournamentAPI.getAll({ search: searchTerm, status: statusFilter, game: gameFilter }),
    onSuccess: (data) => {
      console.log('Admin Panel - Query success:', data);
      console.log('Admin Panel - Tournaments data:', data?.data?.tournaments);
      console.log('Admin Panel - Tournaments count:', data?.data?.tournaments?.length || 0);
    },
    onError: (error) => {
      console.error('Admin Panel - Query error:', error);
    }
  });

  // Real-time socket updates
  React.useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Admin Panel - Received socket message:', lastMessage);
    
    // Handle both old and new message formats
    const messageType = lastMessage.type || lastMessage;
    
    if (
      messageType === 'tournamentAdded' ||
      messageType === 'tournamentUpdated' ||
      messageType === 'tournamentDeleted' ||
      messageType === 'adminUpdate'
    ) {
      console.log('Admin Panel - Refreshing tournament list due to socket event:', messageType);
      queryClient.invalidateQueries(['tournaments']);
      // Force immediate refetch
      setTimeout(() => {
        refetch();
      }, 100);
    }
  }, [lastMessage, queryClient, refetch]);

  // Auto-refresh tournaments every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log('Admin Panel - Auto-refreshing tournaments...');
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Delete tournament mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => tournamentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments']);
      setDeleteDialogOpen(false);
      setSelectedTournament(null);
    },
  });

  // Update tournament status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => tournamentAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments']);
    },
  });

  // Release room credentials mutation
  const releaseCredentialsMutation = useMutation({
    mutationFn: (id) => tournamentAPI.releaseCredentials(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments']);
    },
  });

  const handleDelete = (tournament) => {
    setSelectedTournament(tournament);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTournament) {
      deleteMutation.mutate(selectedTournament._id);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleReleaseCredentials = (tournamentId) => {
    releaseCredentialsMutation.mutate(tournamentId);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'upcoming': return 'info';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  const getGameIcon = (game) => {
    switch (game.toLowerCase()) {
      case 'pubg':
      case 'bgmi':
        return '🎮';
      case 'free fire':
        return '🔥';
      case 'cod':
        return '⚔️';
      default:
        return '🎯';
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Tournament',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {params.row.title}
          </Typography>
          <Chip
            label={params.row.game}
            size="small"
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      ),
    },
    {
      field: 'game',
      headerName: 'Game',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>{getGameIcon(params.value)}</span>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'participants',
      headerName: 'Participants',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <People sx={{ fontSize: 16 }} />
          <Typography variant="body2">
            {params.row.currentParticipants || 0}/{params.row.maxParticipants}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'prizePool',
      headerName: 'Prize Pool',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          ₹{params.value?.toLocaleString() || 0}
        </Typography>
      ),
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.createdBy?.username || 'Admin'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Visibility />}
          label="View"
          onClick={() => navigate(`/tournaments/${params.row._id}`)}
          color="primary"
        />,
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => navigate(`/tournaments/${params.row._id}/edit`)}
          color="primary"
        />,
        <GridActionsCellItem
          icon={<MoreVert />}
          label="More"
          onClick={(event) => handleMenuOpen(event, params.row)}
          color="primary"
        />,
      ],
    },
  ];

  // Handle different response structures and ensure all tournaments are visible
  const filteredData = (() => {
    console.log('Admin Panel - Raw tournament response:', tournaments);
    
    let tournamentList = [];
    
    // Extract tournaments from various possible response structures
    if (Array.isArray(tournaments?.data?.tournaments)) {
      tournamentList = tournaments.data.tournaments;
    } else if (Array.isArray(tournaments?.data?.data)) {
      tournamentList = tournaments.data.data;
    } else if (Array.isArray(tournaments?.data)) {
      tournamentList = tournaments.data;
    } else if (Array.isArray(tournaments)) {
      tournamentList = tournaments;
    }
    
    console.log('Admin Panel - Extracted tournament list:', tournamentList);
    console.log('Admin Panel - Tournament count:', tournamentList.length);
    
    // Apply filters if any
    let filtered = tournamentList;
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.game?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (gameFilter && gameFilter !== 'all') {
      filtered = filtered.filter(t => t.game === gameFilter);
    }
    
    console.log('Admin Panel - Filtered tournament count:', filtered.length);
    return filtered;
  })();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Tournaments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all tournaments and their settings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/tournaments/new')}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            },
          }}
        >
          Create Tournament
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="live">Live</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Game</InputLabel>
                <Select
                  value={gameFilter}
                  label="Game"
                  onChange={(e) => setGameFilter(e.target.value)}
                >
                  <MenuItem value="all">All Games</MenuItem>
                  <MenuItem value="PUBG">PUBG</MenuItem>
                  <MenuItem value="BGMI">BGMI</MenuItem>
                  <MenuItem value="Free Fire">Free Fire</MenuItem>
                  <MenuItem value="COD">COD</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetch()}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredData}
              columns={columns}
              getRowId={(row) => row._id}
              loading={isLoading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              slots={{
                toolbar: GridToolbar,
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderBottom: '2px solid rgba(148, 163, 184, 0.1)',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <MenuItem onClick={() => {
          navigate(`/tournaments/${selectedRow?._id}/results`);
          handleMenuClose();
        }}>
          <EmojiEvents sx={{ mr: 1 }} />
          Post Results
        </MenuItem>
        <MenuItem onClick={() => {
          handleStatusChange(selectedRow?._id, 'live');
          handleMenuClose();
        }}>
          <Schedule sx={{ mr: 1 }} />
          Activate
        </MenuItem>
        <MenuItem onClick={() => {
          handleStatusChange(selectedRow?._id, 'completed');
          handleMenuClose();
        }}>
          <Payment sx={{ mr: 1 }} />
          Mark Complete
        </MenuItem>
        <MenuItem onClick={() => handleReleaseCredentials(selectedRow?._id)}>
          <VpnKey sx={{ mr: 1 }} />
          Release Room Credentials
        </MenuItem>
        <MenuItem onClick={() => {
          handleDelete(selectedRow);
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tournament</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTournament?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load tournaments. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default TournamentList; 