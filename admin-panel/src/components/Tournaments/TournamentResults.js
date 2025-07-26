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

const TournamentResults = () => {
  const { id } = useParams();
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

  const postResultMutation = useMutation({
    mutationFn: ({ id, result }) => tournamentAPI.postResult(id, result),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament', id]);
      navigate('/tournaments');
    },
  });

  const handleSubmit = async () => {
    if (results.length > 0) {
      await postResultMutation.mutateAsync({ id, result: { winners: results } });
    }
  };

  if (isLoading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        Post Tournament Results
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Tournament: {tournament?.title}
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
                  <FormControl fullWidth>
                    <InputLabel>Select Winner</InputLabel>
                    <Select
                      value={results[position - 1]?.participantId || ''}
                      onChange={(e) => {
                        const newResults = [...results];
                        newResults[position - 1] = {
                          position,
                          participantId: e.target.value,
                          participant: participants.find(p => p.id === e.target.value),
                        };
                        setResults(newResults);
                      }}
                      label="Select Winner"
                    >
                      {participants.map((participant) => (
                        <MenuItem key={participant.id} value={participant.id}>
                          {participant.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              ))}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tournaments')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSubmit}
                  disabled={results.length === 0 || postResultMutation.isPending}
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
                Participants ({participants.length})
              </Typography>
              <List>
                {participants.map((participant, index) => (
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