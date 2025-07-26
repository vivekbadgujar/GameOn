import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Security,
  Schedule,
  CheckCircle,
  Warning,
  AutoAwesome,
  Lightbulb,
} from '@mui/icons-material';
import { aiReportsAPI } from '../../services/api';

const SuggestionsPanel = () => {
  const queryClient = useQueryClient();
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: aiReportsAPI.getSuggestions,
    refetchInterval: 60000, // Refetch every minute
  });

  const applySuggestionMutation = useMutation({
    mutationFn: ({ suggestionId, action }) => {
      // Mock API call - in real implementation, this would call the backend
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-suggestions']);
    },
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'security': return <Security />;
      case 'performance': return <TrendingUp />;
      case 'scheduling': return <Schedule />;
      case 'optimization': return <AutoAwesome />;
      default: return <Lightbulb />;
    }
  };

  // Mock data for demonstration
  const mockSuggestions = [
    {
      id: 1,
      title: 'Increase Tournament Frequency',
      category: 'scheduling',
      priority: 'high',
      description: 'Player activity analysis shows peak engagement between 7-9 PM. Consider scheduling more tournaments during this time.',
      impact: 'Expected 25% increase in participation',
      confidence: 89,
      actions: [
        { id: 1, label: 'Schedule 3 evening tournaments', type: 'auto' },
        { id: 2, label: 'Review current schedule', type: 'manual' },
      ],
      applied: false,
    },
    {
      id: 2,
      title: 'Flag Suspicious User Activity',
      category: 'security',
      priority: 'high',
      description: 'User "ProGamer123" shows unusual patterns: 98% headshot accuracy, rapid movement through walls.',
      impact: 'Prevent potential cheating',
      confidence: 94,
      actions: [
        { id: 1, label: 'Flag user for review', type: 'auto' },
        { id: 2, label: 'Temporary suspension', type: 'manual' },
      ],
      applied: false,
    },
    {
      id: 3,
      title: 'Optimize Prize Pool Distribution',
      category: 'optimization',
      priority: 'medium',
      description: 'Current prize distribution shows 80% of prizes go to top 3 players. Consider expanding to top 5 for better engagement.',
      impact: 'Improve player retention by 15%',
      confidence: 76,
      actions: [
        { id: 1, label: 'Update prize structure', type: 'manual' },
        { id: 2, label: 'A/B test new distribution', type: 'auto' },
      ],
      applied: false,
    },
    {
      id: 4,
      title: 'System Performance Alert',
      category: 'performance',
      priority: 'medium',
      description: 'Server response times increased by 40% during peak hours. Consider scaling up infrastructure.',
      impact: 'Improve user experience',
      confidence: 82,
      actions: [
        { id: 1, label: 'Scale up servers', type: 'auto' },
        { id: 2, label: 'Optimize database queries', type: 'manual' },
      ],
      applied: false,
    },
  ];

  const data = suggestions.length > 0 ? suggestions : mockSuggestions;

  const handleApplySuggestion = async (suggestionId, actionId) => {
    await applySuggestionMutation.mutateAsync({ suggestionId, action: actionId });
  };

  const groupedSuggestions = data.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = [];
    }
    acc[suggestion.category].push(suggestion);
    return acc;
  }, {});

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        AI Suggestions
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {data.filter(s => s.priority === 'high').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Priority
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {data.filter(s => s.applied).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Applied
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Psychology />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {data.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Suggestions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <AutoAwesome />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {Math.round(data.reduce((sum, s) => sum + s.confidence, 0) / data.length)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Confidence
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Suggestions by Category */}
      {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => (
        <Card key={category} sx={{ mb: 3 }}>
          <Accordion>
            <AccordionSummary>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getCategoryIcon(category)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {category} Suggestions ({categorySuggestions.length})
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {categorySuggestions.map((suggestion, index) => (
                  <React.Fragment key={suggestion.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getPriorityColor(suggestion.priority) }}>
                          <Psychology />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {suggestion.title}
                            </Typography>
                            <Chip
                              label={suggestion.priority}
                              color={getPriorityColor(suggestion.priority)}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                            <Chip
                              label={`${suggestion.confidence}% confidence`}
                              size="small"
                              variant="outlined"
                            />
                            {suggestion.applied && (
                              <Chip
                                label="Applied"
                                color="success"
                                size="small"
                                icon={<CheckCircle />}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {suggestion.description}
                            </Typography>
                            <Typography variant="body2" color="success" sx={{ mb: 1 }}>
                              Impact: {suggestion.impact}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {suggestion.actions.map((action) => (
                                <Button
                                  key={action.id}
                                  size="small"
                                  variant={action.type === 'auto' ? 'contained' : 'outlined'}
                                  color={action.type === 'auto' ? 'primary' : 'default'}
                                  onClick={() => handleApplySuggestion(suggestion.id, action.id)}
                                  disabled={suggestion.applied || applySuggestionMutation.isPending}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedSuggestion(suggestion);
                          setDetailDialog(true);
                        }}
                      >
                        Details
                      </Button>
                    </ListItem>
                    {index < categorySuggestions.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Card>
      ))}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>AI Suggestion Details</DialogTitle>
        <DialogContent>
          {selectedSuggestion && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedSuggestion.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={selectedSuggestion.category}
                      color="primary"
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Chip
                      label={selectedSuggestion.priority}
                      color={getPriorityColor(selectedSuggestion.priority)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Chip
                      label={`${selectedSuggestion.confidence}% confidence`}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedSuggestion.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Expected Impact
                  </Typography>
                  <Typography variant="body2" color="success">
                    {selectedSuggestion.impact}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Recommended Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedSuggestion.actions.map((action) => (
                      <Button
                        key={action.id}
                        variant={action.type === 'auto' ? 'contained' : 'outlined'}
                        color={action.type === 'auto' ? 'primary' : 'default'}
                        onClick={() => handleApplySuggestion(selectedSuggestion.id, action.id)}
                        disabled={selectedSuggestion.applied || applySuggestionMutation.isPending}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuggestionsPanel; 