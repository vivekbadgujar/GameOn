import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Chip,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  ViewCarousel as SlotIcon,
  CalendarToday,
  Groups,
  EmojiEvents,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relative from 'dayjs/plugin/relativeTime';
import SlotEditModal from './SlotEditModal';
import BGMIRoomLobby from './BGMIRoomLobby';
import TournamentResults from './TournamentResults';

dayjs.extend(relative);

const MyTournaments = ({ user, showSuccess, showError, showInfo }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotEditModal, setSlotEditModal] = useState({
    open: false,
    tournamentId: null
  });
  const [bgmiLobby, setBgmiLobby] = useState({
    open: false,
    tournament: null
  });
  const [resultsModal, setResultsModal] = useState({
    open: false,
    tournament: null
  });

  useEffect(() => {
    fetchMyTournaments();
  }, [user]);

  const fetchMyTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tournaments/my-tournaments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      
      const data = await response.json();
      setTournaments(data.data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return theme.palette.info.main;
      case 'live':
        return theme.palette.error.main;
      case 'completed':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const handleEditSlot = (tournament) => {
    setSlotEditModal({
      open: true,
      tournamentId: tournament._id
    });
  };

  const handleCloseSlotEdit = () => {
    setSlotEditModal({
      open: false,
      tournamentId: null
    });
  };

  const handleCloseBgmiLobby = () => {
    setBgmiLobby({
      open: false,
      tournament: null
    });
    // Refresh tournaments to get updated slot info
    fetchMyTournaments();
  };

  const handleOpenFullLobby = (tournament) => {
    setBgmiLobby({
      open: true,
      tournament
    });
  };

  const handleViewResults = (tournament) => {
    setResultsModal({
      open: true,
      tournament
    });
  };

  const handleCloseResults = () => {
    setResultsModal({
      open: false,
      tournament: null
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tournaments.length) {
    return (
      <Box textAlign="center" my={4}>
        <Typography color="text.secondary">
          You haven't joined any tournaments yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {tournaments.map((tournament) => (
        <Grid item xs={12} sm={6} md={4} key={tournament._id}>
          <Card 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <Box 
              position="absolute" 
              top={12} 
              right={12}
              zIndex={1}
            >
              <Chip
                label={tournament.status}
                size="small"
                sx={{
                  bgcolor: alpha(getStatusColor(tournament.status), 0.1),
                  color: getStatusColor(tournament.status),
                  fontWeight: 'bold'
                }}
              />
            </Box>

            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom>
                {tournament.title}
              </Typography>

              <Box display="flex" gap={2} mb={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {dayjs(tournament.startDate).format('MMM D, h:mm A')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Groups fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {tournament.currentParticipants}/{tournament.maxParticipants}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <EmojiEvents fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    ₹{(tournament.prizePool || 0).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>

              {/* Slot Information */}
              {tournament.userSlot && (
                <Box 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                    p: 1.5,
                    mb: 1
                  }}
                >
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    Your Slot: #{tournament.userSlot}
                  </Typography>
                  {tournament.teamNumber && (
                    <Typography variant="caption" color="text.secondary">
                      Team {tournament.teamNumber}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Room Credentials (only show when available) */}
              {tournament.roomDetails && tournament.roomDetails.credentialsReleased && (
                <Box 
                  sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    borderRadius: 1,
                    p: 1.5,
                    mb: 1
                  }}
                >
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    Room ID: {tournament.roomDetails.roomId}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Password: {tournament.roomDetails.password}
                  </Typography>
                </Box>
              )}
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
              <Box>
                <Chip
                  label={tournament.status.toUpperCase()}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: getStatusColor(tournament.status),
                    borderColor: getStatusColor(tournament.status),
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              
              <Box display="flex" gap={1}>
                {(tournament.status === 'upcoming' || tournament.status === 'live') && (
                  <>
                    <Tooltip title="Edit Slot Position">
                      <IconButton 
                        color="primary"
                        onClick={() => handleEditSlot(tournament)}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2)
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Room Lobby">
                      <IconButton 
                        color="secondary"
                        onClick={() => handleOpenFullLobby(tournament)}
                        sx={{
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.secondary.main, 0.2)
                          }
                        }}
                      >
                        <SlotIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                
                {tournament.status === 'completed' && (
                  <Tooltip title="View Results">
                    <IconButton 
                      color="success"
                      onClick={() => handleViewResults(tournament)}
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.success.main, 0.2)
                        }
                      }}
                    >
                      <EmojiEvents />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </CardActions>
          </Card>
        </Grid>
      ))}
      
      {/* Slot Edit Modal */}
      <SlotEditModal
        open={slotEditModal.open}
        onClose={handleCloseSlotEdit}
        tournamentId={slotEditModal.tournamentId}
        user={user}
        showSuccess={showSuccess}
        showError={showError}
        showInfo={showInfo}
      />

      {/* BGMI Room Lobby */}
      {bgmiLobby.open && bgmiLobby.tournament && (
        <BGMIRoomLobby
          tournament={bgmiLobby.tournament}
          onClose={handleCloseBgmiLobby}
        />
      )}

      {/* Tournament Results Modal */}
      <TournamentResults
        tournament={resultsModal.tournament}
        open={resultsModal.open}
        onClose={handleCloseResults}
      />
    </Grid>
  );
};

export default MyTournaments;
