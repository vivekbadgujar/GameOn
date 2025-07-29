import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Send,
  Add,
  Edit,
  Delete,
  Visibility,
  NotificationsActive,
  People,
  EmojiEvents,
  Person,
  Schedule,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import dayjs from 'dayjs';

const NotificationManager = () => {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general_update',
    targetAudience: 'all_users',
    targetUsers: [],
    targetTournament: '',
    priority: 'normal',
    scheduledAt: '',
    expiresAt: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    }
  });

  // Fetch tournaments for targeting
  const { data: tournaments } = useQuery({
    queryKey: ['tournaments-list'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tournaments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    }
  });

  // Create/Update notification mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const url = editingNotification 
        ? `/api/admin/notifications/${editingNotification._id}`
        : '/api/admin/notifications';
      
      const response = await fetch(url, {
        method: editingNotification ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to save notification');
      return response.json();
    },
    onSuccess: () => {
      const action = editingNotification ? 'updated' : 'created';
      showSuccess(`Notification ${action} successfully`);
      queryClient.invalidateQueries(['notifications']);
      handleCloseDialog();
    },
    onError: (error) => {
      const action = editingNotification ? 'update' : 'create';
      showError(`Failed to ${action} notification: ${error.message}`);
    }
  });

  // Send notification mutation
  const sendMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await fetch(`/api/admin/notifications/${notificationId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: (response) => {
      showSuccess(`📢 Notification sent to ${response.data?.totalRecipients || 'all'} users successfully!`);
      queryClient.invalidateQueries(['notifications']);
    },
    onError: (error) => {
      showError(`Failed to send notification: ${error.message}`);
    }
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Notification deleted successfully');
      queryClient.invalidateQueries(['notifications']);
    },
    onError: (error) => {
      showError(`Failed to delete notification: ${error.message}`);
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (formData.targetAudience === 'tournament_participants' && !formData.targetTournament) {
      newErrors.targetTournament = 'Tournament selection is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const submitData = {
      ...formData,
      createdBy: admin._id,
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
    };
    
    createMutation.mutate(submitData);
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetAudience: notification.targetAudience,
      targetUsers: notification.targetUsers || [],
      targetTournament: notification.targetTournament || '',
      priority: notification.priority,
      scheduledAt: notification.scheduledAt ? dayjs(notification.scheduledAt).format('YYYY-MM-DDTHH:mm') : '',
      expiresAt: notification.expiresAt ? dayjs(notification.expiresAt).format('YYYY-MM-DDTHH:mm') : ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingNotification(null);
    setFormData({
      title: '',
      message: '',
      type: 'general_update',
      targetAudience: 'all_users',
      targetUsers: [],
      targetTournament: '',
      priority: 'normal',
      scheduledAt: '',
      expiresAt: ''
    });
    setErrors({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'scheduled': return 'warning';
      case 'draft': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Notification Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsDialogOpen(true)}
        >
          Create Notification
        </Button>
      </Box>

      {/* Notifications Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications?.data?.map((notification) => (
                  <TableRow key={notification._id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.message.substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={notification.type.replace('_', ' ')} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={notification.targetAudience.replace('_', ' ')} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={notification.priority} 
                        size="small" 
                        color={getPriorityColor(notification.priority)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={notification.status} 
                        size="small" 
                        color={getStatusColor(notification.status)}
                      />
                    </TableCell>
                    <TableCell>{notification.totalRecipients || 0}</TableCell>
                    <TableCell>
                      {dayjs(notification.createdAt).format('MMM DD, YYYY')}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(notification)}
                        disabled={notification.status === 'sent'}
                      >
                        <Edit />
                      </IconButton>
                      {notification.status === 'draft' && (
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => sendMutation.mutate(notification._id)}
                        >
                          <Send />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => deleteMutation.mutate(notification._id)}
                      >
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNotification ? 'Edit Notification' : 'Create New Notification'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                error={!!errors.message}
                helperText={errors.message}
                multiline
                rows={4}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <MenuItem value="tournament_announcement">Tournament Announcement</MenuItem>
                  <MenuItem value="system_maintenance">System Maintenance</MenuItem>
                  <MenuItem value="reward_distributed">Reward Distributed</MenuItem>
                  <MenuItem value="tournament_result">Tournament Result</MenuItem>
                  <MenuItem value="general_update">General Update</MenuItem>
                  <MenuItem value="promotional">Promotional</MenuItem>
                  <MenuItem value="security_alert">Security Alert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={formData.targetAudience}
                  label="Target Audience"
                  onChange={(e) => handleChange('targetAudience', e.target.value)}
                >
                  <MenuItem value="all_users">All Users</MenuItem>
                  <MenuItem value="tournament_participants">Tournament Participants</MenuItem>
                  <MenuItem value="specific_users">Specific Users</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.targetAudience === 'tournament_participants' && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.targetTournament}>
                  <InputLabel>Tournament</InputLabel>
                  <Select
                    value={formData.targetTournament}
                    label="Tournament"
                    onChange={(e) => handleChange('targetTournament', e.target.value)}
                  >
                    {tournaments?.data?.map((tournament) => (
                      <MenuItem key={tournament._id} value={tournament._id}>
                        {tournament.title}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.targetTournament && (
                    <FormHelperText>{errors.targetTournament}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Schedule For"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => handleChange('scheduledAt', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty to send immediately"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expires At"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Optional: When notification should expire"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={createMutation.isLoading}
          >
            {editingNotification ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationManager;