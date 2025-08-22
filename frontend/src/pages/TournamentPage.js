import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Schedule,
  AttachMoney,
  People,
  EmojiEvents,
  PlayArrow,
  Person,
  Group,
  CheckCircle,
  Timer,
  SportsMma,
  Star,
  TrendingUp
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import TournamentJoinFlow from '../components/Tournament/TournamentJoinFlow';
import BGMIWaitingRoom from '../components/Tournament/BGMIWaitingRoom';
import dayjs from 'dayjs';

const TournamentPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  // State management
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [userParticipation, setUserParticipation] = useState(null);

  // Fetch tournament details
  const { data: tournament, isLoading, refetch } = useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${id}`);
      if (!response.ok) throw new Error('Tournament not found');
      return response.json();
    },
    enabled: !!id
  });

  // Check user participation
  useEffect(() => {
    if (tournament?.data && user) {
      const participation = tournament.data.participants?.find(
        p => p.user._id === user._id || p.user === user._id
      );
      setUserParticipation(participation);
    }
  }, [tournament, user]);

  // Handle successful join
  const handleJoinSuccess = (paymentData) => {
    setJoinDialogOpen(false);
    refetch();
    showSuccess('Successfully joined tournament!');
    
    // Switch to waiting room tab
    setTimeout(() => {
      setActiveTab(1);
    }, 1000);
  };

  // Handle leave tournament
  const handleLeaveTournament = () => {
    setUserParticipation(null);
    refetch();
    setActiveTab(0); // Switch back to overview
  };

  // Get tournament status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'upcoming':
        return { color: 'success', label: 'Open for Registration', icon: <Schedule /> };
      case 'live':
        return { color: 'warning', label: 'Live Now', icon: <PlayArrow /> };
      case 'completed':
        return { color: 'info', label: 'Completed', icon: <EmojiEvents /> };
      default:
        return { color: 'default', label: 'Unknown', icon: <Schedule /> };
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!tournament?.data?.startDate) return null;
    
    const now = dayjs();
    const startTime = dayjs(tournament.data.startDate);
    const diff = startTime.diff(now);
    
    if (diff <= 0) return 'Started';
    
    const duration = dayjs.duration(diff);
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (!tournament?.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Tournament not found or has been removed.
        </Alert>
      </Container>
    );
  }

  const tournamentData = tournament.data;
  const statusInfo = getStatusInfo(tournamentData.status);
  const timeRemaining = getTimeRemaining();
  const canJoin = tournamentData.status === 'upcoming' && 
                  tournamentData.currentParticipants < tournamentData.maxParticipants &&
                  !userParticipation;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Tournament Header */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                  <SportsMma sx={{ fontSize: 30 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    {tournamentData.title}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      icon={statusInfo.icon}
                      label={statusInfo.label}
                      color={statusInfo.color}
                    />
                    <Chip
                      label={tournamentData.game}
                      variant="outlined"
                    />
                    <Chip
                      label={tournamentData.tournamentType}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box textAlign={{ xs: 'left', md: 'right' }}>
                {timeRemaining && timeRemaining !== 'Started' && (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Starts in
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {timeRemaining}
                    </Typography>
                  </Box>
                )}
                
                {canJoin && isAuthenticated && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Person />}
                    onClick={() => setJoinDialogOpen(true)}
                    sx={{ mb: 1 }}
                  >
                    Join Tournament
                  </Button>
                )}
                
                {!isAuthenticated && canJoin && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => router.push('/login')}
                    sx={{ mb: 1 }}
                  >
                    Login to Join
                  </Button>
                )}
                
                {userParticipation && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      ✅ You're registered! Slot #{userParticipation.slotNumber}
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tournament Tabs */}
      <Card sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            label="Overview"
            icon={<SportsMma />}
          />
          {userParticipation && (
            <Tab
              label={
                <Badge badgeContent={tournamentData.currentParticipants} color="primary">
                  Waiting Room
                </Badge>
              }
              icon={<Group />}
            />
          )}
          <Tab
            label="Participants"
            icon={<People />}
          />
          <Tab
            label="Rules & Info"
            icon={<Star />}
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Box>
        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={4}>
            {/* Tournament Info */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tournament Details
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Schedule color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Start Date
                          </Typography>
                          <Typography variant="body1">
                            {dayjs(tournamentData.startDate).format('MMM DD, YYYY HH:mm')}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <AttachMoney color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Entry Fee
                          </Typography>
                          <Typography variant="body1">
                            ₹{tournamentData.entryFee}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <People color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Participants
                          </Typography>
                          <Typography variant="body1">
                            {tournamentData.currentParticipants}/{tournamentData.maxParticipants}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <EmojiEvents color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Prize Pool
                          </Typography>
                          <Typography variant="body1">
                            ₹{tournamentData.prizePool}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {tournamentData.description && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <Typography variant="h6" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {tournamentData.description}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Prize Distribution */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Prize Distribution
                  </Typography>
                  
                  {tournamentData.prizeDistribution?.map((prize, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">
                        {prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : prize.position === 3 ? '🥉' : `#${prize.position}`} 
                        {' '}Position {prize.position}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{prize.amount}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" fontWeight="bold">
                      Total Prize Pool
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      ₹{tournamentData.prizePool}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Waiting Room Tab */}
        {activeTab === 1 && userParticipation && (
          <BGMIWaitingRoom 
            tournament={tournamentData}
            onLeave={handleLeaveTournament}
          />
        )}

        {/* Participants Tab */}
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registered Participants ({tournamentData.currentParticipants})
              </Typography>
              
              <Grid container spacing={2}>
                {tournamentData.participants
                  ?.filter(p => p.status !== 'kicked')
                  ?.map((participant, index) => (
                    <Grid item xs={12} sm={6} md={4} key={participant._id}>
                      <Paper sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar>
                            {participant.user?.username?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {participant.user?.gameProfile?.bgmiName || 
                               participant.user?.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Slot #{participant.slotNumber}
                            </Typography>
                            <Box>
                              <Chip
                                label={participant.status}
                                size="small"
                                color={participant.status === 'confirmed' ? 'success' : 'default'}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
              </Grid>
              
              {tournamentData.currentParticipants === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No participants yet. Be the first to join!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rules Tab */}
        {activeTab === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tournament Rules & Information
              </Typography>
              
              {tournamentData.rules ? (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {tournamentData.rules}
                </Typography>
              ) : (
                <Alert severity="info">
                  Tournament rules will be updated soon. Please check back later.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Join Tournament Dialog */}
      <TournamentJoinFlow
        tournament={tournamentData}
        open={joinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        onSuccess={handleJoinSuccess}
      />
    </Container>
  );
};

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}

export default TournamentPage;