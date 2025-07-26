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
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Security,
  Warning,
  Block,
  CheckCircle,
  Visibility,
  Flag,
  Psychology,
  TrendingUp,
} from '@mui/icons-material';
import { aiReportsAPI } from '../../services/api';

const SuspiciousLogs = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);

  const { data: suspiciousActivity = [], isLoading } = useQuery({
    queryKey: ['suspicious-activity'],
    queryFn: aiReportsAPI.getSuspiciousActivity,
    refetchInterval: 30000,
  });

  const { data: hackerDetection = [] } = useQuery({
    queryKey: ['hacker-detection'],
    queryFn: aiReportsAPI.getHackerDetection,
    refetchInterval: 30000,
  });

  const { data: violations = [] } = useQuery({
    queryKey: ['violations'],
    queryFn: aiReportsAPI.getViolations,
    refetchInterval: 30000,
  });

  const flagUserMutation = useMutation({
    mutationFn: ({ userId, reason }) => aiReportsAPI.flagUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['suspicious-activity']);
      queryClient.invalidateQueries(['hacker-detection']);
      queryClient.invalidateQueries(['violations']);
    },
  });

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'cheating': return <Block />;
      case 'suspicious': return <Warning />;
      case 'anomaly': return <TrendingUp />;
      default: return <Security />;
    }
  };

  // Mock data for demonstration
  const mockSuspiciousActivity = [
    {
      id: 1,
      userId: 'user123',
      userName: 'SuspiciousPlayer',
      type: 'cheating',
      description: 'Unusual accuracy patterns detected - 95% headshot rate',
      riskLevel: 'high',
      confidence: 87,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      evidence: 'Gameplay analysis shows impossible accuracy',
      tournament: 'BGMI Pro League',
    },
    {
      id: 2,
      userId: 'user456',
      userName: 'AnomalyUser',
      type: 'anomaly',
      description: 'Rapid movement patterns inconsistent with human reaction time',
      riskLevel: 'medium',
      confidence: 72,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      evidence: 'Movement analysis indicates potential speed hacks',
      tournament: 'Weekend Warriors',
    },
  ];

  const mockHackerDetection = [
    {
      id: 1,
      userId: 'hacker123',
      userName: 'HackMaster',
      detectionType: 'aimbot',
      confidence: 94,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      evidence: 'Perfect tracking through walls detected',
      status: 'confirmed',
    },
  ];

  const mockViolations = [
    {
      id: 1,
      userId: 'violator123',
      userName: 'RuleBreaker',
      violationType: 'team_killing',
      description: 'Intentionally killing teammates in tournament',
      severity: 'high',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'pending',
    },
  ];

  const suspiciousData = suspiciousActivity.length > 0 ? suspiciousActivity : mockSuspiciousActivity;
  const hackerData = hackerDetection.length > 0 ? hackerDetection : mockHackerDetection;
  const violationsData = violations.length > 0 ? violations : mockViolations;

  const getCurrentData = () => {
    switch (activeTab) {
      case 0: return suspiciousData;
      case 1: return hackerData;
      case 2: return violationsData;
      default: return suspiciousData;
    }
  };

  const handleFlagUser = (userId, reason) => {
    flagUserMutation.mutate({ userId, reason });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        AI Security Reports
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {suspiciousData.filter(a => a.riskLevel === 'high').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Risk Activities
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
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Block />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {hackerData.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hacker Detections
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
                  <Flag />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {violationsData.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rule Violations
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
                  <Psychology />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {suspiciousData.length + hackerData.length + violationsData.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Alerts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Suspicious Activity (${suspiciousData.length})`} />
          <Tab label={`Hacker Detection (${hackerData.length})`} />
          <Tab label={`Rule Violations (${violationsData.length})`} />
        </Tabs>
      </Card>

      {/* Activity List */}
      <Card>
        <CardContent>
          {isLoading ? (
            <LinearProgress />
          ) : (
            <List>
              {getCurrentData().map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getRiskLevelColor(activity.riskLevel || activity.severity) }}>
                        {getActivityIcon(activity.type || activity.detectionType)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {activity.userName}
                          </Typography>
                          <Chip
                            label={activity.riskLevel || activity.severity}
                            color={getRiskLevelColor(activity.riskLevel || activity.severity)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                          {activity.confidence && (
                            <Chip
                              label={`${activity.confidence}% confidence`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {activity.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString()}
                            </Typography>
                            {activity.tournament && (
                              <Typography variant="caption" color="text.secondary">
                                Tournament: {activity.tournament}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setDetailDialog(true);
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => handleFlagUser(activity.userId, 'AI detected suspicious activity')}
                      >
                        Flag User
                      </Button>
                    </Box>
                  </ListItem>
                  {index < getCurrentData().length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Activity Details</DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    User Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">User ID</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.userId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Username</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.userName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Detection Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.type || selectedActivity.detectionType || selectedActivity.violationType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Risk Level</Typography>
                  <Chip
                    label={selectedActivity.riskLevel || selectedActivity.severity}
                    color={getRiskLevelColor(selectedActivity.riskLevel || selectedActivity.severity)}
                    sx={{ mb: 2, textTransform: 'capitalize' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.description}
                  </Typography>
                </Grid>
                {selectedActivity.evidence && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Evidence
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedActivity.evidence}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          {selectedActivity && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleFlagUser(selectedActivity.userId, 'AI detected suspicious activity');
                setDetailDialog(false);
              }}
            >
              Flag User
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuspiciousLogs; 