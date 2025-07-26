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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  AccountBalanceWallet,
  CheckCircle,
  Cancel,
  Schedule,
  Error,
  Visibility,
  Payment,
  History,
} from '@mui/icons-material';
import { payoutAPI } from '../../services/api';
import dayjs from 'dayjs';

const PrizePayouts = () => {
  const queryClient = useQueryClient();
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [processDialog, setProcessDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: payoutsResponse, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: payoutAPI.getAll,
    refetchInterval: 30000,
  });

  // Ensure data is always an array
  const data = Array.isArray(payoutsResponse?.data) ? payoutsResponse.data : [];

  const processMutation = useMutation({
    mutationFn: payoutAPI.processPayout,
    onSuccess: () => {
      queryClient.invalidateQueries(['payouts']);
      setProcessDialog(false);
      setSelectedPayout(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => payoutAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['payouts']);
      setStatusDialog(false);
      setSelectedPayout(null);
      setNewStatus('');
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'processing': return <Payment />;
      case 'completed': return <CheckCircle />;
      case 'failed': return <Error />;
      default: return <AccountBalanceWallet />;
    }
  };

  const handleProcessPayout = () => {
    if (selectedPayout) {
      processMutation.mutate(selectedPayout.id);
    }
  };

  const handleStatusUpdate = () => {
    if (selectedPayout && newStatus) {
      updateStatusMutation.mutate({ id: selectedPayout.id, status: newStatus });
    }
  };

  const columns = [
    {
      field: 'tournament',
      headerName: 'Tournament',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.position} place
          </Typography>
        </Box>
      ),
    },
    {
      field: 'player',
      headerName: 'Player',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
            {params.value.charAt(0)}
          </Avatar>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
          ₹{params.value?.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'requestedAt',
      headerName: 'Requested',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {dayjs(params.value).format('MMM DD, HH:mm')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Visibility />}
          label="View Details"
          onClick={() => {
            setSelectedPayout(params.row);
            setProcessDialog(true);
          }}
        />,
      ],
    },
  ];

  // Mock data for demonstration
  const mockPayouts = [
    {
      id: 1,
      tournament: 'BGMI Pro League',
      player: 'ProGamer123',
      position: '1st',
      amount: 5000,
      status: 'pending',
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
      transactionId: null,
    },
    {
      id: 2,
      tournament: 'Weekend Warriors',
      player: 'SquadLeader',
      position: '2nd',
      amount: 3000,
      status: 'processing',
      requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN123456',
    },
    {
      id: 3,
      tournament: 'Solo Masters',
      player: 'LoneWolf',
      position: '1st',
      amount: 2500,
      status: 'completed',
      requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
      transactionId: 'TXN789012',
    },
    {
      id: 4,
      tournament: 'Duo Championship',
      player: 'TeamPlayer',
      position: '3rd',
      amount: 1500,
      status: 'failed',
      requestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
      transactionId: null,
    },
  ];

  const pendingPayouts = data.filter(p => p.status === 'pending');
  const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        Prize Payouts
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {pendingPayouts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payouts
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
                    ₹{totalPendingAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Pending Amount
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
                  <Payment />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {data.filter(p => p.status === 'processing').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processing
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
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Error />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {data.filter(p => p.status === 'failed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed Payouts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payouts Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={Array.isArray(data) ? data : []}
            columns={columns}
            loading={isLoading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'requestedAt', sort: 'desc' }] },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Process Payout Dialog */}
      <Dialog open={processDialog} onClose={() => setProcessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payout Details</DialogTitle>
        <DialogContent>
          {selectedPayout && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedPayout.tournament}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Player</Typography>
                  <Typography variant="body1">{selectedPayout.player}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Position</Typography>
                  <Typography variant="body1">{selectedPayout.position}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Amount</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                    ₹{selectedPayout.amount?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    icon={getStatusIcon(selectedPayout.status)}
                    label={selectedPayout.status}
                    color={getStatusColor(selectedPayout.status)}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                  <Typography variant="body1">{selectedPayout.paymentMethod}</Typography>
                </Grid>
                {selectedPayout.transactionId && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {selectedPayout.transactionId}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialog(false)}>Close</Button>
          {selectedPayout?.status === 'pending' && (
            <Button
              onClick={() => {
                setProcessDialog(false);
                setStatusDialog(true);
              }}
              variant="contained"
            >
              Update Status
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Update Payout Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="New Status"
            >
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus || updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrizePayouts; 