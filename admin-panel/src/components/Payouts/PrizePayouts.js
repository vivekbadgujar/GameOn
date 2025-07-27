import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  Payment,
  CheckCircle,
  Pending,
  Error,
  Visibility,
  Edit,
  Delete,
  Download,
  Refresh,
  FilterList,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Schedule,
  Warning
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutAPI } from '../../services/api';
import dayjs from 'dayjs';

const PrizePayouts = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [processDialog, setProcessDialog] = useState(false);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch payouts
  const { data: payouts, isLoading, error, refetch } = useQuery({
    queryKey: ['payouts', statusFilter],
    queryFn: () => payoutAPI.getAll({ status: statusFilter }),
  });

  // Fetch pending payouts
  const { data: pendingPayouts } = useQuery({
    queryKey: ['pending-payouts'],
    queryFn: () => payoutAPI.getPending(),
  });

  // Process payout mutation
  const processMutation = useMutation({
    mutationFn: (id) => payoutAPI.processPayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payouts']);
      queryClient.invalidateQueries(['pending-payouts']);
      setProcessDialog(false);
      setSelectedPayout(null);
    },
  });

  // Update payout status mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => payoutAPI.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payouts']);
      queryClient.invalidateQueries(['pending-payouts']);
      setUpdateDialog(false);
      setSelectedPayout(null);
      setUpdateData({ status: '', notes: '' });
    },
  });

  const handleProcessPayout = (payout) => {
    setSelectedPayout(payout);
    setProcessDialog(true);
  };

  const confirmProcessPayout = () => {
    if (selectedPayout) {
      processMutation.mutate(selectedPayout._id);
    }
  };

  const handleUpdateStatus = (payout) => {
    setSelectedPayout(payout);
    setUpdateData({ status: payout.status, notes: payout.notes || '' });
    setUpdateDialog(true);
  };

  const confirmUpdateStatus = () => {
    if (selectedPayout && updateData.status) {
      updateMutation.mutate({
        id: selectedPayout._id,
        data: updateData
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'processing': return <Schedule />;
      case 'completed': return <CheckCircle />;
      case 'failed': return <Error />;
      case 'cancelled': return <Warning />;
      default: return <Pending />;
    }
  };

  const getPositionBadge = (position) => {
    const colors = {
      1: 'success',
      2: 'info',
      3: 'warning'
    };
    return (
      <Chip
        label={`${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}`}
        color={colors[position] || 'default'}
        size="small"
      />
    );
  };

  const payoutData = Array.isArray(payouts?.data) ? payouts.data : [];
  const pendingData = Array.isArray(pendingPayouts?.data) ? pendingPayouts.data : [];

  // Calculate statistics
  const totalPayouts = payoutData.length;
  const totalAmount = payoutData.reduce((sum, payout) => sum + (payout.amount || 0), 0);
  const pendingAmount = pendingData.reduce((sum, payout) => sum + (payout.amount || 0), 0);
  const completedPayouts = payoutData.filter(p => p.status === 'completed').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Prize Payouts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage tournament prize distributions and payment processing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Payouts
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {totalPayouts}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <Payment />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                    ₹{totalAmount.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <AccountBalance />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Pending Amount
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="warning.main">
                    ₹{pendingAmount.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                  <Pending />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="info.main">
                    {completedPayouts}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="All Payouts" />
          <Tab label="Pending" />
          <Tab label="Processing" />
          <Tab label="Completed" />
        </Tabs>
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Payouts Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Winner</TableCell>
                  <TableCell>Tournament</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payoutData.map((payout, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {payout.user?.username?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {payout.user?.username || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {payout.user?.email || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {payout.tournament?.title || 'Unknown Tournament'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payout.tournament?.game || 'Unknown Game'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getPositionBadge(payout.position)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ₹{payout.amount?.toLocaleString() || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(payout.status)}
                        <Chip
                          label={payout.status}
                          color={getStatusColor(payout.status)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(payout.createdAt).format('MMM DD, HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {payout.status === 'pending' && (
                          <Tooltip title="Process Payout">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleProcessPayout(payout)}
                            >
                              <Payment />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Update Status">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(payout)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Process Payout Dialog */}
      <Dialog open={processDialog} onClose={() => setProcessDialog(false)}>
        <DialogTitle>Process Payout</DialogTitle>
        <DialogContent>
          {selectedPayout && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to process the payout for:
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {selectedPayout.user?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tournament: {selectedPayout.tournament?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Position: {selectedPayout.position}
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  Amount: ₹{selectedPayout.amount?.toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This will initiate the payment process and update the status to "Processing".
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmProcessPayout}
            variant="contained"
            color="success"
            disabled={processMutation.isLoading}
          >
            {processMutation.isLoading ? 'Processing...' : 'Process Payout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialog} onClose={() => setUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Payout Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateData.status}
                  label="Status"
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={updateData.notes}
                onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                placeholder="Add any notes about this status update..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmUpdateStatus}
            variant="contained"
            disabled={!updateData.status || updateMutation.isLoading}
          >
            {updateMutation.isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load payout data. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default PrizePayouts; 