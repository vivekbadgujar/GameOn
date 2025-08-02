import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Send,
  Schedule,
  History,
  Delete,
  Visibility,
  Edit,
  Campaign,
  Notifications,
  People,
  EmojiEvents,
  Payment,
  Security,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { broadcastAPI } from '../../services/api';
import dayjs from 'dayjs';

const BroadcastMessage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [messageData, setMessageData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'normal',
    targetAudience: 'all',
    scheduledFor: null,
    isScheduled: false,
    includePush: true,
    includeEmail: false,
    includeSMS: false
  });
  const [previewDialog, setPreviewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const queryClient = useQueryClient();

  // Fetch broadcast history
  const { data: broadcastHistory, isLoading, error } = useQuery({
    queryKey: ['broadcast-history'],
    queryFn: () => broadcastAPI.getHistory(),
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (data) => broadcastAPI.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['broadcast-history']);
      setMessageData({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'normal',
        targetAudience: 'all',
        scheduledFor: null,
        isScheduled: false,
        includePush: true,
        includeEmail: false,
        includeSMS: false
      });
    },
  });

  // Schedule message mutation
  const scheduleMutation = useMutation({
    mutationFn: (data) => broadcastAPI.scheduleMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['broadcast-history']);
      setMessageData({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'normal',
        targetAudience: 'all',
        scheduledFor: null,
        isScheduled: false,
        includePush: true,
        includeEmail: false,
        includeSMS: false
      });
    },
  });

  const handleChange = (field, value) => {
    setMessageData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!messageData.title.trim() || !messageData.content.trim()) {
      return;
    }

    const submitData = {
      ...messageData,
      message: messageData.content, // Backend expects 'message' field
      scheduledFor: messageData.scheduledFor ? messageData.scheduledFor.toISOString() : null
    };

    if (messageData.isScheduled && messageData.scheduledFor) {
      scheduleMutation.mutate(submitData);
    } else {
      sendMutation.mutate(submitData);
    }
  };

  const handlePreview = () => {
    setPreviewDialog(true);
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'announcement': return <Campaign />;
      case 'tournament': return <EmojiEvents />;
      case 'payment': return <Payment />;
      case 'security': return <Security />;
      default: return <Notifications />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'normal': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle color="success" />;
      case 'scheduled': return <Schedule color="info" />;
      case 'failed': return <Error color="error" />;
      default: return <Warning color="warning" />;
    }
  };

  const messageTypes = [
    { value: 'announcement', label: 'Announcement', icon: <Campaign /> },
    { value: 'tournament', label: 'Tournament Update', icon: <EmojiEvents /> },
    { value: 'payment', label: 'Payment Notice', icon: <Payment /> },
    { value: 'security', label: 'Security Alert', icon: <Security /> },
    { value: 'maintenance', label: 'Maintenance Notice', icon: <Warning /> }
  ];

  const targetAudiences = [
    { value: 'all', label: 'All Users', count: '4,234' },
    { value: 'active', label: 'Active Users', count: '2,156' },
    { value: 'premium', label: 'Premium Users', count: '856' },
    { value: 'tournament_participants', label: 'Tournament Participants', count: '1,234' },
    { value: 'new_users', label: 'New Users (Last 30 days)', count: '567' }
  ];

  const broadcastHistoryData = broadcastHistory?.data || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Broadcast Messages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Send announcements and notifications to platform users
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Compose Message" />
          <Tab label="Message History" />
          <Tab label="Scheduled Messages" />
        </Tabs>
      </Box>

      {/* Compose Message Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Compose Message
                </Typography>

                {sendMutation.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {sendMutation.error.response?.data?.message || 'Failed to send message'}
                  </Alert>
                )}

                {sendMutation.isSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Message sent successfully!
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Message Title"
                        value={messageData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        required
                        placeholder="Enter a compelling title for your message"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Message Type</InputLabel>
                        <Select
                          value={messageData.type}
                          label="Message Type"
                          onChange={(e) => handleChange('type', e.target.value)}
                        >
                          {messageTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {type.icon}
                                {type.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={messageData.priority}
                          label="Priority"
                          onChange={(e) => handleChange('priority', e.target.value)}
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Message Content"
                        value={messageData.content}
                        onChange={(e) => handleChange('content', e.target.value)}
                        multiline
                        rows={6}
                        required
                        placeholder="Write your message here. You can use markdown formatting."
                        helperText="Use markdown for formatting. **bold**, *italic*, [links](url)"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Target Audience</InputLabel>
                        <Select
                          value={messageData.targetAudience}
                          label="Target Audience"
                          onChange={(e) => handleChange('targetAudience', e.target.value)}
                        >
                          {targetAudiences.map((audience) => (
                            <MenuItem key={audience.value} value={audience.value}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span>{audience.label}</span>
                                <Chip label={audience.count} size="small" />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={messageData.isScheduled}
                            onChange={(e) => handleChange('isScheduled', e.target.checked)}
                          />
                        }
                        label="Schedule for later"
                      />
                    </Grid>

                    {messageData.isScheduled && (
                      <Grid item xs={12} md={6}>
                        <DateTimePicker
                          label="Schedule Date & Time"
                          value={messageData.scheduledFor}
                          onChange={(value) => handleChange('scheduledFor', value)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true
                            }
                          }}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Delivery Channels
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={messageData.includePush}
                                onChange={(e) => handleChange('includePush', e.target.checked)}
                              />
                            }
                            label="Push Notifications"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={messageData.includeEmail}
                                onChange={(e) => handleChange('includeEmail', e.target.checked)}
                              />
                            }
                            label="Email"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={messageData.includeSMS}
                                onChange={(e) => handleChange('includeSMS', e.target.checked)}
                              />
                            }
                            label="SMS"
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          onClick={handlePreview}
                          disabled={!messageData.title || !messageData.content}
                        >
                          Preview
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={messageData.isScheduled ? <Schedule /> : <Send />}
                          disabled={sendMutation.isLoading || scheduleMutation.isLoading}
                          sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                            },
                          }}
                        >
                          {sendMutation.isLoading || scheduleMutation.isLoading
                            ? 'Sending...'
                            : messageData.isScheduled
                            ? 'Schedule Message'
                            : 'Send Message'
                          }
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Message Stats */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Message Statistics
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Messages Sent
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    1,234
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Open Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    78.5%
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Active Subscribers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    3,456
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Recent Activity
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                        <CheckCircle />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Tournament Update"
                      secondary="Sent to 1,234 users • 2 hours ago"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                        <Schedule />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Maintenance Notice"
                      secondary="Scheduled for tomorrow • 8:00 AM"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Message History Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Message History
            </Typography>
            
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Message</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sent At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {broadcastHistoryData.map((message, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {message.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {message.content.substring(0, 50)}...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getMessageTypeIcon(message.type)}
                          label={message.type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {message.targetAudience}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(message.status)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {message.status}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(message.sentAt).format('MMM DD, HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Messages Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Scheduled Messages
            </Typography>
            
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Message</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Scheduled For</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {broadcastHistoryData
                    .filter(msg => msg.status === 'scheduled')
                    .map((message, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {message.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {message.content.substring(0, 50)}...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getMessageTypeIcon(message.type)}
                          label={message.type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(message.scheduledFor).format('MMM DD, HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {message.targetAudience}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Message Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {messageData.title}
            </Typography>
            <Chip
              icon={getMessageTypeIcon(messageData.type)}
              label={messageData.type}
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {messageData.content}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {messageData.includePush && <Chip label="Push" size="small" />}
              {messageData.includeEmail && <Chip label="Email" size="small" />}
              {messageData.includeSMS && <Chip label="SMS" size="small" />}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BroadcastMessage; 