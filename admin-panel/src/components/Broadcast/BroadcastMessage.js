import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Send,
  Schedule,
  Notifications,
  History,
  Delete,
  Visibility,
  ScheduleSend,
  Cancel,
} from '@mui/icons-material';
import { broadcastAPI } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSocket } from '../../contexts/SocketContext';

dayjs.extend(relativeTime);

const BroadcastMessage = () => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'general_update', priority: 'normal', targetAudience: 'all_users' });
  const [error, setError] = useState(null);

  useEffect(() => {
    broadcastAPI.getHistory().then(res => setMessages(res.data?.data || []));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleBroadcast = (msg) => setMessages(prev => [msg, ...prev]);
    socket.on('broadcastSent', handleBroadcast);
    return () => socket.off('broadcastSent', handleBroadcast);
  }, [socket]);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await broadcastAPI.sendMessage(form);
      setForm({ title: '', message: '', type: 'general_update', priority: 'normal', targetAudience: 'all_users' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send broadcast');
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'normal': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement': return <Notifications />;
      case 'tournament': return <Schedule />;
      case 'maintenance': return <Cancel />;
      default: return <Notifications />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'announcement': return 'primary.main';
      case 'tournament': return 'success.main';
      case 'maintenance': return 'warning.main';
      default: return 'grey.500';
    }
  };

  const mockHistory = [
    {
      id: 1,
      title: 'New Tournament Alert!',
      message: 'Join our weekend BGMI tournament with ₹10,000 prize pool!',
      type: 'tournament',
      priority: 'high',
      status: 'sent',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      recipients: 1247,
    },
    {
      id: 2,
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday 2-4 AM. Services will be temporarily unavailable.',
      type: 'maintenance',
      priority: 'medium',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      recipients: 0,
    },
    {
      id: 3,
      title: 'Welcome to GameOn!',
      message: 'Thank you for joining our gaming community. Check out our latest tournaments!',
      type: 'announcement',
      priority: 'normal',
      status: 'sent',
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      recipients: 2847,
    },
  ];

  const history = broadcastHistory.length > 0 ? broadcastHistory : mockHistory;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        Broadcast Messages
      </Typography>

      <Grid container spacing={3}>
        {/* Send Message Form */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                Send New Message
              </Typography>
              
              <Box component="form" onSubmit={handleSend}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message Title"
                      value={form.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Message Type</InputLabel>
                      <Select
                        value={form.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        label="Message Type"
                      >
                        <MenuItem value="announcement">Announcement</MenuItem>
                        <MenuItem value="tournament">Tournament</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={form.priority}
                        onChange={(e) => handleChange('priority', e.target.value)}
                        label="Priority"
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
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      multiline
                      rows={4}
                      required
                      placeholder="Enter your message here..."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.isScheduled}
                          onChange={(e) => handleChange('isScheduled', e.target.checked)}
                        />
                      }
                      label="Schedule for later"
                    />
                  </Grid>

                  {form.isScheduled && (
                    <Grid item xs={12}>
                      <DateTimePicker
                        label="Schedule Date & Time"
                        value={form.scheduledAt}
                        onChange={(value) => handleChange('scheduledAt', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                          },
                        }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setPreviewDialog(true)}
                        disabled={!form.title || !form.message}
                      >
                        Preview
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={form.isScheduled ? <ScheduleSend /> : <Send />}
                        disabled={loading}
                        sx={{ flex: 1 }}
                      >
                        {loading
                          ? 'Sending...'
                          : form.isScheduled
                          ? 'Schedule Message'
                          : 'Send Now'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Broadcast History */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                Message History
              </Typography>
              
              {loading ? (
                <LinearProgress />
              ) : (
                <List>
                  {messages.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getTypeColor(item.type) }}>
                            {getTypeIcon(item.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {item.title}
                              </Typography>
                              <Chip
                                label={item.priority}
                                size="small"
                                color={getPriorityColor(item.priority)}
                                sx={{ textTransform: 'capitalize' }}
                              />
                              <Chip
                                label={item.status}
                                size="small"
                                color={item.status === 'sent' ? 'success' : 'warning'}
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {item.message}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {item.status === 'sent' 
                                    ? `Sent ${dayjs(item.sentAt).fromNow()}`
                                    : `Scheduled for ${dayjs(item.scheduledAt).format('MMM DD, HH:mm')}`
                                  }
                                </Typography>
                                {item.recipients > 0 && (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.recipients} recipients
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < messages.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Message Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: getTypeColor(form.type) }}>
                {getTypeIcon(form.type)}
              </Avatar>
              <Box>
                <Typography variant="h6">{form.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={form.type}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Chip
                    label={form.priority}
                    size="small"
                    color={getPriorityColor(form.priority)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
            </Box>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {form.message}
            </Typography>
            {form.isScheduled && form.scheduledAt && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="caption" color="warning.dark">
                  Scheduled for: {form.scheduledAt.format('MMM DD, YYYY HH:mm')}
                </Typography>
              </Box>
            )}
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