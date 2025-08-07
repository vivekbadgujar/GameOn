import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Chip,
  Grid,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Timer as TimerIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  PhoneAndroid as GameIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  ViewCarousel as SlotIcon,
  Login as JoinIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import TournamentJoinButton from './TournamentJoinButton';
import BGMIRoomLobby from './BGMIRoomLobby';

const TournamentList = ({ tournaments, user, onJoinTournament, showSuccess, showError, showInfo }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [slotModal, setSlotModal] = useState({ open: false, tournament: null });

  const handleTournamentClick = (tournamentId) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  const isUserParticipant = (tournament) => {
    return tournament.participants?.some(p => p.user === user?._id || p.user?._id === user?._id);
  };

  const formatTimeUntilStart = (startDate) => {
    const now = dayjs();
    const start = dayjs(startDate);
    const diff = start.diff(now, 'minute');

    if (diff < 0) return 'Started';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    return `${Math.floor(diff / 1440)}d ${Math.floor((diff % 1440) / 60)}h`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return theme.palette.info.main;
      case 'live': return theme.palette.error.main;
      case 'completed': return theme.palette.success.main;
      case 'cancelled': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  const openSlotModal = (tournament) => {
    setSlotModal({ open: true, tournament });
  };

  const closeSlotModal = () => {
    setSlotModal({ open: false, tournament: null });
  };

  const getDefaultThumbnail = (game) => {
    // Return a default thumbnail based on game type
    const thumbnails = {
      'BGMI': '/images/bgmi-thumbnail.jpg',
      'Free Fire': '/images/freefire-thumbnail.jpg',
      'PUBG': '/images/pubg-thumbnail.jpg'
    };
    return thumbnails[game] || '/images/default-tournament.jpg';
  };

  return (
    <>
      <Grid container spacing={3}>
        {tournaments.map((tournament) => {
          const hasJoined = isUserParticipant(tournament);
          const timeToStart = formatTimeUntilStart(tournament.startDate);

          return (
            <Grid item xs={12} sm={6} md={4} key={tournament._id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                  border: hasJoined ? `2px solid ${theme.palette.primary.main}` : 'none',
                }}
              >
                {/* Tournament Thumbnail */}
                <CardMedia
                  component="img"
                  height="160"
                  image={tournament.poster || tournament.posterUrl || getDefaultThumbnail(tournament.game)}
                  alt={tournament.title}
                  sx={{
                    objectFit: 'cover',
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }}
                  onError={(e) => {
                    e.target.src = getDefaultThumbnail(tournament.game);
                  }}
                />

                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  {/* Title and Status */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ 
                        fontWeight: 'bold',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {tournament.title}
                    </Typography>
                    <Chip
                      label={tournament.status.toUpperCase()}
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: alpha(getStatusColor(tournament.status), 0.1),
                        color: getStatusColor(tournament.status),
                        fontWeight: 'bold',
                        minWidth: 'fit-content'
                      }}
                    />
                  </Box>

                  {/* Tournament Info Grid */}
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(tournament.startDate).format('MMM DD, HH:mm')}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {tournament.currentParticipants}/{tournament.maxParticipants}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <MoneyIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          ₹{tournament.entryFee}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <TrophyIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          ₹{tournament.prizePool?.toLocaleString('en-IN') || 0}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Game Type */}
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <GameIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="primary" fontWeight="medium">
                      {tournament.game} • {tournament.tournamentType?.toUpperCase()}
                    </Typography>
                  </Box>

                  {/* Time until start */}
                  <Box 
                    sx={{ 
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      borderRadius: 1,
                      p: 1,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" color="info.main" fontWeight="medium">
                      {tournament.status === 'upcoming' ? `Starts in ${timeToStart}` : 
                       tournament.status === 'live' ? 'Live Now!' : 
                       tournament.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                  <TournamentJoinButton
                    tournament={tournament}
                    onJoin={() => onJoinTournament(tournament)}
                    openSlotModal={() => openSlotModal(tournament)}
                  />
                  
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleTournamentClick(tournament._id)}
                    sx={{ minWidth: 'auto' }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* BGMI Room Lobby Modal */}
      {slotModal.open && slotModal.tournament && (
        <BGMIRoomLobby
          tournament={slotModal.tournament}
          onClose={closeSlotModal}
        />
      )}
    </>
  );
};

export default TournamentList;
