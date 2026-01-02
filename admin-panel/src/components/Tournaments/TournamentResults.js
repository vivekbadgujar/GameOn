import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  EmojiEvents,
  Save,
  Cancel,
  Person,
  Group,
} from '@mui/icons-material';
import { tournamentAPI } from '../../services/api';

const TournamentResults = ({ tournamentId, embedded = false, onSuccess }) => {
  const { id: routeId } = useParams();
  const id = tournamentId || routeId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [results, setResults] = useState([]);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id),
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['tournament-participants', id],
    queryFn: () => tournamentAPI.getParticipants(id),
  });

  const tournamentData = tournament?.data?.data || tournament?.data;
  const participantsData = participants?.data?.data || participants?.data || [];

  const postResultMutation = useMutation({
    mutationFn: ({ id, result }) => tournamentAPI.postResult(id, result),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament', id]);
      if (typeof onSuccess === 'function') {
        onSuccess();
        return;
      }
      if (!embedded) {
        navigate('/tournaments');
      }
    },
  });

  const handleSubmit = async () => {
    if (tournamentData?.status !== 'completed') return;
    const winners = results.filter(Boolean);
    if (winners.length > 0) {
      await postResultMutation.mutateAsync({ id, result: { winners } });
    }
  };

  if (isLoading) return <LinearProgress />;

  if (tournamentData?.status !== 'completed') {
    return (
      <Box>
        <Alert severity="info">
          Results can be declared only after the tournament is marked as completed.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {!embedded && (
        <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
          Post Tournament Results
        </Typography>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Tournament: {tournamentData?.title}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Select winners and their positions
                </Typography>
              </Box>

              {[1, 2, 3].map((position) => (
                <Box key={position} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {position === 1 ? '🥇 1st Place' : position === 2 ? '🥈 2nd Place' : '🥉 3rd Place'}
                  </Typography>
                  <Autocomplete
                    options={participantsData}
                    getOptionLabel={(option) => option?.name || ''}
                    value={participantsData.find((p) => p.id === results[position - 1]?.participantId) || null}
                    onChange={(_, value) => {
                      const newResults = [...results];
                      newResults[position - 1] = value ? {
                        position,
                        participantId: value.id,
                        participant: value
                      } : undefined;
                      setResults(newResults);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search player (in-game name)"
                        placeholder="Type to search..."
                      />
                    )}
                  />
                </Box>
              ))}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {!embedded && (
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/tournaments')}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSubmit}
                  disabled={results.filter(Boolean).length === 0 || postResultMutation.isPending}
                >
                  {postResultMutation.isPending ? 'Posting...' : 'Post Results'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Participants ({participantsData.length})
              </Typography>
              <List>
                {participantsData.map((participant) => (
                  <ListItem key={participant.id}>
                    <ListItemAvatar>
                      <Avatar>{participant.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={participant.name}
                      secondary={`Joined ${new Date(participant.joinedAt).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TournamentResults; 