import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Share,
  Download,
  People,
  EmojiEvents,
  Schedule,
  AttachMoney,
  Visibility,
  Settings,
  Cancel,
  SportsMma,
  CheckCircle,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import dayjs from 'dayjs';
import TournamentParticipants from './TournamentParticipants';
import BGMIRoomLayout from './BGMIRoomLayout';

const TournamentDetails = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState(0);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Fetch tournament details
  const { data: tournament, isLoading, error } = useQuery({
    queryKey: ['tournament-details', tournamentId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tournament details');
      return response.json();
    }
  });

  // Fetch participant stats
  const { data: participantStats } = useQuery({
    queryKey: ['tournament-participant-stats', tournamentId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch participant stats');
      return response.json();
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle tournament status update
  const handleStatusUpdate = async () => {
    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update tournament status');

      showSuccess(`Tournament ${newStatus === 'completed' ? 'completed' : 'activated'} successfully`);
      setStatusDialog(false);
      
      // Refetch tournament data
      window.location.reload();

    } catch (error) {
      showError(error.message || 'Failed to update tournament status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'live': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return <Schedule />;
      case 'live': return <Visibility />;
      case 'completed': return <EmojiEvents />;
      case 'cancelled': return <Cancel />;
      default: return <Schedule />;
    }
  };

  if (isLoading) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading tournament details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load tournament details: {error.message}
      </Alert>
    );
  }

  const tournamentData = tournament?.data;
  const stats = participantStats?.data;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/tournaments')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {tournamentData?.title}
        </Typography>
        {/* Tournament Status Buttons */}
        {tournamentData?.status !== 'completed' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => {
              setNewStatus('completed');
              setStatusDialog(true);
            }}
          >
            Complete Tournament
          </Button>
        )}
        
        {tournamentData?.status === 'completed' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={() => {
              setNewStatus('upcoming');
              setStatusDialog(true);
            }}
          >
            Reactivate Tournament
          </Button>
        )}

        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => navigate(`/tournaments/${tournamentId}/edit`)}
        >
          Edit Tournament
        </Button>
      </Box>

      {/* Tournament Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  icon={getStatusIcon(tournamentData?.status)}
                  label={tournamentData?.status?.toUpperCase()}
                  color={getStatusColor(tournamentData?.status)}
                  variant="outlined"
                />
                <Chip
                  label={tournamentData?.game}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={tournamentData?.tournamentType?.toUpperCase()}
                  color="secondary"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body1" color="text.secondary" paragraph>
                {tournamentData?.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      ₹{tournamentData?.entryFee}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Entry Fee
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                      ₹{tournamentData?.prizePool}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Prize Pool
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">
                      {stats?.total || 0}/{tournamentData?.maxParticipants}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Participants
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">
                      {dayjs(tournamentData?.startDate).format('DD/MM')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Start Date
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Tournament Image */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  backgroundImage: `url(${tournamentData?.posterUrl || '/placeholder-tournament.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider'
                }}
              />
            </Grid>
          </Grid>

          {/* Participant Stats */}
          {stats && (
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Participant Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h5" color="success.dark">
                      {stats.confirmed}
                    </Typography>
                    <Typography variant="caption">
                      Confirmed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="h5" color="warning.dark">
                      {stats.waiting}
                    </Typography>
                    <Typography variant="caption">
                      Waiting
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="h5" color="error.dark">
                      {stats.kicked}
                    </Typography>
                    <Typography variant="caption">
                      Kicked
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="h5" color="info.dark">
                      {stats.recentJoins}
                    </Typography>
                    <Typography variant="caption">
                      Recent Joins
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label="BGMI Room Layout" 
              icon={<SportsMma />} 
              iconPosition="start"
            />
            <Tab 
              label="Participants List" 
              icon={<People />} 
              iconPosition="start"
            />
            <Tab 
              label="Results" 
              icon={<EmojiEvents />} 
              iconPosition="start"
            />
            <Tab 
              label="Settings" 
              icon={<Settings />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ minHeight: 600 }}>
          {activeTab === 0 && (
            <BGMIRoomLayout 
              tournament={tournament}
              onRefresh={() => {
                // Refetch tournament data
                window.location.reload();
              }}
            />
          )}

          {activeTab === 1 && (
            <TournamentParticipants 
              tournamentId={tournamentId}
            />
          )}
          
          {activeTab === 2 && (
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Tournament Results
              </Typography>
              <Alert severity="info">
                Results will be available after the tournament is completed.
              </Alert>
            </Box>
          )}
          
          {activeTab === 3 && (
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Tournament Settings
              </Typography>
              <Alert severity="info">
                Tournament settings and configuration options.
              </Alert>
            </Box>
          )}
        </Box>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>
          {newStatus === 'completed' ? 'Complete Tournament' : 'Reactivate Tournament'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {newStatus === 'completed' 
              ? 'Are you sure you want to mark this tournament as completed? This will move it to the completed section.'
              : 'Are you sure you want to reactivate this tournament? This will move it back to the active tournaments list.'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusUpdate} 
            color={newStatus === 'completed' ? 'success' : 'primary'}
            variant="contained"
          >
            {newStatus === 'completed' ? 'Complete Tournament' : 'Reactivate Tournament'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentDetails;