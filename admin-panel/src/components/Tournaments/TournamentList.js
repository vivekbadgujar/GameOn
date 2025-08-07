import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  Stop,
  CheckCircle,
  Schedule,
  EmojiEvents,
  Cancel,
  Search,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';
import { tournamentAPI } from '../../services/api';
import dayjs from 'dayjs';

const TournamentList = () => {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Fetch tournaments
  const { data: tournamentsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-tournaments', searchTerm, gameFilter],
    queryFn: async () => {
      const params = {
        page: 1,
        limit: 100, // Increased limit to get more tournaments
        status: 'all', // Get all tournaments and filter on frontend
        search: searchTerm,
        game: gameFilter
      };

      console.log('TournamentList: Fetching tournaments with params:', params);
      const response = await tournamentAPI.getAll(params);
      console.log('TournamentList: API response:', response);
      console.log('TournamentList: Tournaments data:', response.data);
      return response.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Live sync with socket events
  useEffect(() => {
    const handleTournamentUpdate = () => {
      refetch();
    };

    window.addEventListener('tournamentUpdated', handleTournamentUpdate);
    window.addEventListener('tournamentDeleted', handleTournamentUpdate);

    return () => {
      window.removeEventListener('tournamentUpdated', handleTournamentUpdate);
      window.removeEventListener('tournamentDeleted', handleTournamentUpdate);
    };
  }, [refetch]);

  // Get status for current tab
  const getStatusForTab = (tabIndex) => {
    switch (tabIndex) {
      case 0: return 'upcoming'; // Active
      case 1: return 'live';     // Live
      case 2: return 'completed'; // Completed
      case 3: return 'cancelled'; // Cancelled
      default: return 'all';
    }
  };

  // Get tab counts
  const getTabCounts = () => {
    // Try multiple possible data structures
    const tournaments = tournamentsData?.tournaments || 
                       tournamentsData?.data?.tournaments || 
                       tournamentsData?.data || 
                       [];
    console.log('TournamentList: Getting tab counts for tournaments:', tournaments.length);
    return {
      upcoming: tournaments.filter(t => t.status === 'upcoming').length,
      live: tournaments.filter(t => t.status === 'live').length,
      completed: tournaments.filter(t => t.status === 'completed').length,
      cancelled: tournaments.filter(t => t.status === 'cancelled').length
    };
  };

  // Handle menu actions
  const handleMenuOpen = (event, tournament) => {
    setAnchorEl(event.currentTarget);
    setSelectedTournament(tournament);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTournament(null);
  };

  // Handle tournament status change
  const handleStatusChange = async (tournament, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tournaments/${tournament._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update tournament status');

      showSuccess(`Tournament ${status === 'completed' ? 'completed' : 'updated'} successfully`);
      refetch();
      handleMenuClose();

    } catch (error) {
      showError(error.message || 'Failed to update tournament status');
    }
  };

  // Handle tournament deletion
  const handleDeleteTournament = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tournaments/${selectedTournament._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete tournament');

      showSuccess('Tournament deleted successfully');
      setDeleteDialog(false);
      refetch();
      handleMenuClose();

    } catch (error) {
      showError(error.message || 'Failed to delete tournament');
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'upcoming':
        return { color: 'success', icon: <Schedule />, label: 'Active' };
      case 'live':
        return { color: 'warning', icon: <PlayArrow />, label: 'Live' };
      case 'completed':
        return { color: 'info', icon: <EmojiEvents />, label: 'Completed' };
      case 'cancelled':
        return { color: 'error', icon: <Cancel />, label: 'Cancelled' };
      default:
        return { color: 'default', icon: <Schedule />, label: 'Unknown' };
    }
  };

  // Filter tournaments
  const allTournaments = tournamentsData?.tournaments || 
                         tournamentsData?.data?.tournaments || 
                         tournamentsData?.data || 
                         [];
  
  console.log('TournamentList: All tournaments for filtering:', allTournaments.length);
  console.log('TournamentList: Sample tournament:', allTournaments[0]);
  
  const filteredTournaments = allTournaments
    .filter(tournament => {
      const matchesSearch = !searchTerm || 
        tournament.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.game?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = getStatusForTab(activeTab) === 'all' || 
        tournament.status === getStatusForTab(activeTab);
      
      const matchesGame = gameFilter === 'all' || tournament.game === gameFilter;
      
      return matchesSearch && matchesStatus && matchesGame;
    });
  
  console.log('TournamentList: Filtered tournaments:', filteredTournaments.length);
  console.log('TournamentList: Active tab:', activeTab, 'Status filter:', getStatusForTab(activeTab));

  const tabCounts = getTabCounts();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Tournament Management
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? 'success.main' : 'error.main'
              }}
            />
            <Typography variant="caption">
              {isConnected ? 'Live Sync' : 'Disconnected'}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/tournaments/create')}
          >
            Create Tournament
          </Button>
        </Box>
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
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Game</InputLabel>
                <Select
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                  label="Game"
                >
                  <MenuItem value="all">All Games</MenuItem>
                  <MenuItem value="BGMI">BGMI</MenuItem>
                  <MenuItem value="Free Fire">Free Fire</MenuItem>
                  <MenuItem value="COD Mobile">COD Mobile</MenuItem>
                  <MenuItem value="Valorant">Valorant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            label={
              <Badge badgeContent={tabCounts.upcoming} color="success">
                Active
              </Badge>
            }
            icon={<Schedule />}
          />
          <Tab
            label={
              <Badge badgeContent={tabCounts.live} color="warning">
                Live
              </Badge>
            }
            icon={<PlayArrow />}
          />
          <Tab
            label={
              <Badge badgeContent={tabCounts.completed} color="info">
                Completed
              </Badge>
            }
            icon={<EmojiEvents />}
          />
          <Tab
            label={
              <Badge badgeContent={tabCounts.cancelled} color="error">
                Cancelled
              </Badge>
            }
            icon={<Cancel />}
          />
        </Tabs>
      </Card>

      {/* Tournament Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredTournaments.map((tournament) => {
            const statusDisplay = getStatusDisplay(tournament.status);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={tournament._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Tournament Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2" noWrap>
                        {tournament.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, tournament)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Status and Game */}
                    <Box display="flex" gap={1} mb={2}>
                      <Chip
                        icon={statusDisplay.icon}
                        label={statusDisplay.label}
                        color={statusDisplay.color}
                        size="small"
                      />
                      <Chip
                        label={tournament.game}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    {/* Tournament Info */}
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {dayjs(tournament.startDate).format('MMM DD, YYYY HH:mm')}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      Entry Fee: ₹{tournament.entryFee}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      Participants: {tournament.currentParticipants}/{tournament.maxParticipants}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Prize Pool: ₹{tournament.prizePool}
                    </Typography>
                  </CardContent>

                  {/* Action Buttons */}
                  <Box p={2} pt={0}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/tournaments/${tournament._id}`)}
                    >
                      View Details
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}

          {filteredTournaments.length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  No tournaments found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || gameFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Create your first tournament to get started'
                  }
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => navigate(`/tournaments/${selectedTournament?._id}`)}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        
        <MenuItem onClick={() => navigate(`/tournaments/${selectedTournament?._id}/edit`)}>
          <Edit sx={{ mr: 1 }} />
          Edit Tournament
        </MenuItem>

        {selectedTournament?.status === 'upcoming' && (
          <MenuItem onClick={() => handleStatusChange(selectedTournament, 'completed')}>
            <CheckCircle sx={{ mr: 1 }} color="success" />
            Mark Complete
          </MenuItem>
        )}

        {selectedTournament?.status === 'completed' && (
          <MenuItem onClick={() => handleStatusChange(selectedTournament, 'upcoming')}>
            <PlayArrow sx={{ mr: 1 }} color="primary" />
            Reactivate
          </MenuItem>
        )}

        {selectedTournament?.status === 'completed' && (
          <MenuItem 
            onClick={() => setDeleteDialog(true)}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} />
            Delete Permanently
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle color="error.main">
          Delete Tournament Permanently
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to permanently delete "{selectedTournament?.title}"?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>This action cannot be undone!</strong>
            <br />
            This will permanently delete:
            <ul>
              <li>All participant registrations</li>
              <li>Payment transaction records</li>
              <li>Tournament results and statistics</li>
              <li>All associated media and files</li>
            </ul>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteTournament}
            color="error"
            variant="contained"
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentList;