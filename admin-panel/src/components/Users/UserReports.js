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
  Tabs,
  Tab,
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  Report,
  Warning,
  Block,
  CheckCircle,
  Visibility,
  Person,
  Flag,
  Security,
} from '@mui/icons-material';
import { userAPI } from '../../services/api';
import dayjs from 'dayjs';

const UserReports = () => {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['user-reports'],
    queryFn: userAPI.getReports,
    refetchInterval: 30000,
  });

  const handleReportMutation = useMutation({
    mutationFn: ({ reportId, action }) => userAPI.handleReport(reportId, action),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-reports']);
      setActionDialog(false);
      setSelectedReport(null);
      setSelectedAction('');
      setActionReason('');
    },
  });

  const banUserMutation = useMutation({
    mutationFn: ({ userId, reason }) => userAPI.ban(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-reports']);
      setActionDialog(false);
      setSelectedReport(null);
    },
  });

  const getReportStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'investigating': return 'info';
      case 'resolved': return 'success';
      case 'dismissed': return 'default';
      default: return 'default';
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'cheating': return 'error';
      case 'harassment': return 'error';
      case 'spam': return 'warning';
      case 'inappropriate': return 'warning';
      default: return 'default';
    }
  };

  const handleAction = () => {
    if (selectedReport && selectedAction) {
      if (selectedAction === 'ban') {
        banUserMutation.mutate({
          userId: selectedReport.reportedUser.id,
          reason: actionReason,
        });
      } else {
        handleReportMutation.mutate({
          reportId: selectedReport.id,
          action: { type: selectedAction, reason: actionReason },
        });
      }
    }
  };

  const columns = [
    {
      field: 'reportedUser',
      headerName: 'Reported User',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
            {params.value.name.charAt(0)}
          </Avatar>
          <Typography variant="body2">{params.value.name}</Typography>
        </Box>
      ),
    },
    {
      field: 'reporter',
      headerName: 'Reporter',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
            {params.value.name.charAt(0)}
          </Avatar>
          <Typography variant="body2">{params.value.name}</Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getReportTypeColor(params.value)}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 200
        }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getReportStatusColor(params.value)}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Reported',
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
            setSelectedReport(params.row);
            setActionDialog(true);
          }}
        />,
      ],
    },
  ];

  // Mock data for demonstration
  const mockReports = [
    {
      id: 1,
      reportedUser: { id: 1, name: 'Cheater123', email: 'cheater@example.com' },
      reporter: { id: 2, name: 'FairPlayer', email: 'fair@example.com' },
      type: 'cheating',
      description: 'User is using aimbot and wallhacks in tournaments',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      evidence: 'Screenshot attached',
      tournament: 'BGMI Pro League',
    },
    {
      id: 2,
      reportedUser: { id: 3, name: 'ToxicUser', email: 'toxic@example.com' },
      reporter: { id: 4, name: 'NiceGuy', email: 'nice@example.com' },
      type: 'harassment',
      description: 'User is sending abusive messages and threats',
      status: 'investigating',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      evidence: 'Chat logs provided',
      tournament: 'Weekend Warriors',
    },
    {
      id: 3,
      reportedUser: { id: 5, name: 'Spammer', email: 'spam@example.com' },
      reporter: { id: 6, name: 'Moderator', email: 'mod@example.com' },
      type: 'spam',
      description: 'User is posting promotional links repeatedly',
      status: 'resolved',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      evidence: 'Multiple posts documented',
      tournament: 'General',
    },
  ];

  const data = reports.length > 0 ? reports : mockReports;

  const pendingReports = data.filter(r => r.status === 'pending');
  const investigatingReports = data.filter(r => r.status === 'investigating');
  const resolvedReports = data.filter(r => r.status === 'resolved');

  const getFilteredData = () => {
    switch (activeTab) {
      case 0: return data;
      case 1: return pendingReports;
      case 2: return investigatingReports;
      case 3: return resolvedReports;
      default: return data;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        User Reports
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Report />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {pendingReports.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Reports
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
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {investigatingReports.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Under Investigation
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
                    {resolvedReports.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved Reports
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
                  <Block />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {data.filter(r => r.type === 'cheating' || r.type === 'harassment').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Serious Violations
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
          <Tab label={`All Reports (${data.length})`} />
          <Tab label={`Pending (${pendingReports.length})`} />
          <Tab label={`Investigating (${investigatingReports.length})`} />
          <Tab label={`Resolved (${resolvedReports.length})`} />
        </Tabs>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={getFilteredData()}
            columns={columns}
            loading={isLoading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
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

      {/* Action Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Report Details & Actions</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Report Information
                  </Typography>
                  <Box sx={{ space: 2 }}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Chip
                      label={selectedReport.type}
                      color={getReportTypeColor(selectedReport.type)}
                      sx={{ mb: 2, textTransform: 'capitalize' }}
                    />
                    
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={selectedReport.status}
                      color={getReportStatusColor(selectedReport.status)}
                      sx={{ mb: 2, textTransform: 'capitalize' }}
                    />
                    
                    <Typography variant="body2" color="text.secondary">Description</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedReport.description}
                    </Typography>
                    
                    {selectedReport.evidence && (
                      <>
                        <Typography variant="body2" color="text.secondary">Evidence</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {selectedReport.evidence}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    User Information
                  </Typography>
                  <Box sx={{ space: 2 }}>
                    <Typography variant="body2" color="text.secondary">Reported User</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar>{selectedReport.reportedUser.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body1">{selectedReport.reportedUser.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedReport.reportedUser.email}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">Reporter</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar>{selectedReport.reporter.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body1">{selectedReport.reporter.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedReport.reporter.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Take Action
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Action</InputLabel>
                        <Select
                          value={selectedAction}
                          onChange={(e) => setSelectedAction(e.target.value)}
                          label="Action"
                        >
                          <MenuItem value="warn">Send Warning</MenuItem>
                          <MenuItem value="investigate">Mark as Investigating</MenuItem>
                          <MenuItem value="resolve">Mark as Resolved</MenuItem>
                          <MenuItem value="dismiss">Dismiss Report</MenuItem>
                          <MenuItem value="ban">Ban User</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Reason"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        multiline
                        rows={2}
                        placeholder="Enter reason for action..."
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAction}
            variant="contained"
            disabled={!selectedAction || handleReportMutation.isPending || banUserMutation.isPending}
          >
            {handleReportMutation.isPending || banUserMutation.isPending ? 'Processing...' : 'Take Action'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserReports; 