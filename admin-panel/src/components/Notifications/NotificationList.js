import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem
} from '@mui/x-data-grid';
import {
  Search,
  Add,
  Edit,
  Delete,
  Send,
  MoreVert,
  Refresh,
  Notifications,
  Schedule,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const NotificationList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lastMessage } = useSocket();

  // Fetch notifications
  const { data: notifications, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', searchTerm, statusFilter, typeFilter, priorityFilter],
    queryFn: () => notificationAPI.getAll({ 
      search: searchTerm, 
      status: statusFilter, 
      type: typeFilter,
      priority: priorityFilter
    }),
  });

  // Real-time socket updates
  React.useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Admin Panel Notifications - Received socket message:', lastMessage);
    
    if (lastMessage.type === 'notificationAdded' || 
        lastMessage.type === 'notificationUpdated' || 
        lastMessage.type === 'notificationSent' ||
        lastMessage.type === 'notificationDeleted') {
      console.log('Admin Panel Notifications - Refreshing notification list due to socket event');
      queryClient.invalidateQueries(['notifications']);
      refetch();
    }
  }, [lastMessage, queryClient, refetch]);

  // Auto-refresh notifications every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log('Admin Panel Notifications - Auto-refreshing notifications...');
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setDeleteDialogOpen(false);
      setSelectedNotification(null);
    },
  });

  // Send notification mutation
  const sendMutation = useMutation({
    mutationFn: (id) => notificationAPI.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setSendDialogOpen(false);
      setSelectedNotification(null);
    },
  });

  const handleDelete = (notification) => {
    setSelectedNotification(notification);
    setDeleteDialogOpen(true);
  };

  const handleSend = (notification) => {
    setSelectedNotification(notification);
    setSendDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedNotification) {
      deleteMutation.mutate(selectedNotification._id);
    }
  };

  const confirmSend = () => {
    if (selectedNotification) {
      sendMutation.mutate(selectedNotification._id);
    }
  };

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'scheduled': return 'info';
      case 'draft': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tournament': return '🏆';
      case 'system': return '⚙️';
      case 'promotion': return '📢';
      case 'update': return '🔄';
      default: return '📝';
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={600}>
            {params.row.title}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>{getTypeIcon(params.value)}</span>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value?.toUpperCase()}
          color={getStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value?.toUpperCase()}
          color={getPriorityColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'targetAudience',
      headerName: 'Audience',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value?.replace('_', ' ').toUpperCase()}
        </Typography>
      ),
    },
    {
      field: 'totalRecipients',
      headerName: 'Recipients',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {params.value || 0}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 150,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            icon={<Edit />}
            label="Edit"
            onClick={() => navigate(`/notifications/${params.row._id}/edit`)}
            color="primary"
            disabled={params.row.status === 'sent'}
          />,
        ];

        if (params.row.status !== 'sent') {
          actions.push(
            <GridActionsCellItem
              icon={<Send />}
              label="Send"
              onClick={() => handleSend(params.row)}
              color="success"
            />
          );
        }

        actions.push(
          <GridActionsCellItem
            icon={<Delete />}
            label="Delete"
            onClick={() => handleDelete(params.row)}
            color="error"
            disabled={params.row.status === 'sent'}
          />,
          <GridActionsCellItem
            icon={<MoreVert />}
            label="More"
            onClick={(event) => handleMenuOpen(event, params.row)}
            color="primary"
          />
        );

        return actions;
      },
    },
  ];

  const filteredData = Array.isArray(notifications?.data?.data) ? notifications.data.data : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and send notifications to users
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/notifications/new')}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            },
          }}
        >
          Create Notification
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="tournament">Tournament</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="promotion">Promotion</MenuItem>
                  <MenuItem value="update">Update</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetch()}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredData}
              columns={columns}
              getRowId={(row) => row._id}
              loading={isLoading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              slots={{
                toolbar: GridToolbar,
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderBottom: '2px solid rgba(148, 163, 184, 0.1)',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedNotification?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)}>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to send "{selectedNotification?.title}" to {selectedNotification?.targetAudience?.replace('_', ' ')}?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Once sent, this notification cannot be edited or recalled.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmSend} 
            color="success" 
            variant="contained"
            disabled={sendMutation.isLoading}
          >
            {sendMutation.isLoading ? 'Sending...' : 'Send Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/notifications/${selectedRow?._id}`);
          handleMenuClose();
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          // Copy notification content
          const content = `${selectedRow?.title}\n${selectedRow?.message}`;
          navigator.clipboard.writeText(content);
          handleMenuClose();
        }}>
          Copy Content
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NotificationList;