import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  IconButton,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  AttachMoney as MoneyIcon,
  MyLocation as KillsIcon,
  TrendingUp as RankIcon,
  Star as PointsIcon
} from '@mui/icons-material';

const TournamentResults = ({ tournament, open, onClose }) => {
  const theme = useTheme();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && tournament?._id) {
      fetchTournamentResults();
    }
  }, [open, tournament?._id]);

  const fetchTournamentResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournament._id}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data);
      }
    } catch (error) {
      console.error('Error fetching tournament results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return theme.palette.warning.main; // Gold
      case 2: return theme.palette.grey[400]; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return theme.palette.text.secondary;
    }
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) {
      return <TrophyIcon sx={{ color: getRankColor(rank) }} />;
    }
    return <RankIcon sx={{ color: 'text.secondary' }} />;
  };

  const renderWinners = () => {
    if (!results?.winners?.length) return null;

    return (
      <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="success.main">
            🏆 Tournament Winners
          </Typography>
          <Grid container spacing={2}>
            {results.winners.map((winner, index) => (
              <Grid item xs={12} sm={6} md={4} key={winner.user._id}>
                <Card sx={{ 
                  bgcolor: alpha(getRankColor(index + 1), 0.1),
                  border: `2px solid ${getRankColor(index + 1)}`
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      {getRankIcon(index + 1)}
                    </Box>
                    <Avatar
                      src={winner.user.avatar}
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        mx: 'auto', 
                        mb: 1,
                        bgcolor: getRankColor(index + 1)
                      }}
                    >
                      {winner.user.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      {winner.user.displayName || winner.user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rank #{index + 1}
                    </Typography>
                    <Chip
                      icon={<MoneyIcon />}
                      label={`₹${winner.prize?.toLocaleString('en-IN') || 0}`}
                      color="success"
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderParticipantResults = () => {
    if (!results?.participants?.length) return null;

    // Sort participants by rank (if available) or by kills
    const sortedParticipants = [...results.participants].sort((a, b) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      if (a.kills && b.kills) return b.kills - a.kills;
      return 0;
    });

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Match Results
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="center">Team</TableCell>
                  <TableCell align="center">Kills</TableCell>
                  <TableCell align="center">Points</TableCell>
                  <TableCell align="center">Prize</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedParticipants.map((participant, index) => {
                  const isWinner = results.winners?.some(w => w.user._id === participant.user._id);
                  const winnerData = results.winners?.find(w => w.user._id === participant.user._id);
                  
                  return (
                    <TableRow 
                      key={participant.user._id}
                      sx={{ 
                        bgcolor: isWinner ? alpha(theme.palette.success.main, 0.1) : 'inherit',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {participant.rank <= 3 && getRankIcon(participant.rank)}
                          <Typography variant="body2" fontWeight={participant.rank <= 3 ? 'bold' : 'normal'}>
                            #{participant.rank || index + 1}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            src={participant.user.avatar}
                            sx={{ width: 24, height: 24 }}
                          >
                            {participant.user.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {participant.user.displayName || participant.user.username}
                            </Typography>
                            {participant.user.gameProfile?.bgmiName && (
                              <Typography variant="caption" color="text.secondary">
                                {participant.user.gameProfile.bgmiName}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`Team ${participant.teamNumber || 'N/A'}`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          <KillsIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {participant.kills || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          <PointsIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {participant.points || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {winnerData?.prize ? (
                          <Chip
                            icon={<MoneyIcon />}
                            label={`₹${winnerData.prize.toLocaleString('en-IN')}`}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderMatchSummary = () => {
    if (!results?.matchSummary) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎮 Match Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {results.matchSummary.totalKills || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Kills
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {results.matchSummary.totalTeams || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Teams Participated
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  ₹{(results.matchSummary.totalPrizeDistributed || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prize Distributed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {results.matchSummary.matchDuration || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Match Duration
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (!tournament) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <TrophyIcon color="primary" />
            <Box>
              <Typography variant="h6">
                {tournament.title} - Results
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tournament completed on {new Date(tournament.endDate || tournament.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading results...</Typography>
          </Box>
        ) : results ? (
          <>
            {renderMatchSummary()}
            {renderWinners()}
            <Divider sx={{ my: 2 }} />
            {renderParticipantResults()}
          </>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No results available for this tournament
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Results will be published after the tournament is completed
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TournamentResults;