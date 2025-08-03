import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination
} from '@mui/material';
import {
  People,
  PersonAdd,
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  Block,
  CheckCircle,
  Cancel,
  TrendingUp,
  TrendingDown,
  Gamepad,
  AccountBalanceWallet,
  EmojiEvents,
  Calendar,
  Download,
  Refresh
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../../services/api';
import dayjs from 'dayjs';

// Helper functions for BGMI ID validation status
const getBgmiIdStatus = (bgmiId) => {
  if (!bgmiId) return 'Not Set';
  
  // Basic format validation
  if (!/^\d{10,12}$/.test(bgmiId)) return 'Invalid Format';
  
  // Simulate validation status (in real implementation, check against database or API)
  // For demo: IDs starting with 5 or 1 are considered valid
  if (bgmiId.startsWith('5') || bgmiId.startsWith('1')) {
    return 'Verified';
  } else if (bgmiId.startsWith('9')) {
    return 'Suspicious';
  } else {
    return 'Unverified';
  }
};

const getBgmiIdStatusColor = (bgmiId) => {
  const status = getBgmiIdStatus(bgmiId);
  switch (status) {
    case 'Verified': return 'success';
    case 'Unverified': return 'warning';
    case 'Suspicious': return 'error';
    case 'Invalid Format': return 'error';
    default: return 'default';
  }
};

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bgmiFilter, setBgmiFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsDialog, setUserDetailsDialog] = useState(false);
  const [banDialog, setBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);

  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['users', { page, search: searchQuery, status: filterStatus }],
    queryFn: () => userAPI.getAll({
      page,
      limit: rowsPerPage,
      search: searchQuery,
      status: filterStatus
    }),
  });

  // Ban user mutation
  const banMutation = useMutation({
    mutationFn: ({ userId, reason }) => userAPI.ban(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setBanDialog(false);
      setBanReason('');
      setSelectedUser(null);
    },
  });

  // Unban user mutation
  const unbanMutation = useMutation({
    mutationFn: (userId) => userAPI.unban(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });

  const users = usersData?.data?.users || [];
  const totalUsers = usersData?.data?.total || 0;
  const stats = usersData?.data?.stats || {};

  const handleMenuOpen = (event, userId) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setUserDetailsDialog(true);
    handleMenuClose();
  };

  const handleBanUser = (user) => {
    setSelectedUser(user);
    setBanDialog(true);
    handleMenuClose();
  };

  const handleUnbanUser = (userId) => {
    unbanMutation.mutate(userId);
    handleMenuClose();
  };

  const confirmBan = () => {
    if (selectedUser && banReason.trim()) {
      banMutation.mutate({
        userId: selectedUser._id,
        reason: banReason.trim()
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'banned': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'banned': return <Block />;
      case 'suspended': return <Cancel />;
      default: return null;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.gameProfile?.bgmiName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.gameProfile?.bgmiId?.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    const matchesBgmiFilter = bgmiFilter === 'all' || 
      getBgmiIdStatus(user.gameProfile?.bgmiId) === bgmiFilter;
    
    return matchesSearch && matchesStatus && matchesBgmiFilter;
  });

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || totalUsers,
      icon: People,
      color: 'primary',
      trend: stats.userGrowth || 0
    },
    {
      title: 'Active Users',
      value: stats.activeUsers || users.filter(u => u.status === 'active').length,
      icon: CheckCircle,
      color: 'success',
      trend: stats.activeGrowth || 0
    },
    {
      title: 'New This Month',
      value: stats.newThisMonth || users.filter(u => 
        dayjs(u.createdAt).isAfter(dayjs().subtract(1, 'month'))
      ).length,
      icon: PersonAdd,
      color: 'info',
      trend: stats.newUserGrowth || 0
    },
    {
      title: 'Banned Users',
      value: stats.bannedUsers || users.filter(u => u.status === 'banned').length,
      icon: Block,
      color: 'error',
      trend: stats.bannedGrowth || 0
    }
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load users: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and monitor all platform users
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
            onClick={() => {/* TODO: Export users */}}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stat.value.toLocaleString()}
                    </Typography>
                    {stat.trend !== 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {stat.trend > 0 ? (
                          <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                        ) : (
                          <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                        )}
                        <Typography 
                          variant="body2" 
                          color={stat.trend > 0 ? 'success.main' : 'error.main'}
                        >
                          {Math.abs(stat.trend)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Avatar sx={{ bgcolor: `${stat.color}.light`, color: `${stat.color}.main` }}>
                    <stat.icon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by username, email, BGMI name, or Player ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status Filter"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>BGMI Status</InputLabel>
                <Select
                  value={bgmiFilter}
                  label="BGMI Status"
                  onChange={(e) => setBgmiFilter(e.target.value)}
                >
                  <MenuItem value="all">All BGMI Status</MenuItem>
                  <MenuItem value="Verified">Verified</MenuItem>
                  <MenuItem value="Unverified">Unverified</MenuItem>
                  <MenuItem value="Suspicious">Suspicious</MenuItem>
                  <MenuItem value="Invalid Format">Invalid Format</MenuItem>
                  <MenuItem value="Not Set">Not Set</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredUsers.length} of {totalUsers} users
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <LinearProgress />
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>BGMI Profile</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Wallet</TableCell>
                      <TableCell>Tournaments</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={user.avatar}>
                              {user.username?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="medium">
                                {user.username}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.gameProfile?.bgmiName || 'Not set'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                ID: {user.gameProfile?.bgmiId || 'Not set'}
                              </Typography>
                              {user.gameProfile?.bgmiId && (
                                <Chip
                                  size="small"
                                  label={getBgmiIdStatus(user.gameProfile.bgmiId)}
                                  color={getBgmiIdStatusColor(user.gameProfile.bgmiId)}
                                  sx={{ fontSize: '0.7rem', height: '20px' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(user.status)}
                            label={user.status?.toUpperCase() || 'UNKNOWN'}
                            color={getStatusColor(user.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountBalanceWallet sx={{ fontSize: 16, color: 'success.main' }} />
                            <Typography variant="body2">
                              ₹{(user.wallet?.balance || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmojiEvents sx={{ fontSize: 16, color: 'warning.main' }} />
                            <Typography variant="body2">
                              {user.stats?.totalTournaments || 0}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {dayjs(user.createdAt).format('MMM DD, YYYY')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, user._id)}
                            size="small"
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.ceil(totalUsers / rowsPerPage)}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewUser(users.find(u => u._id === menuUserId))}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleBanUser(users.find(u => u._id === menuUserId))}>
          <Block sx={{ mr: 1 }} />
          Ban User
        </MenuItem>
        {users.find(u => u._id === menuUserId)?.status === 'banned' && (
          <MenuItem onClick={() => handleUnbanUser(menuUserId)}>
            <CheckCircle sx={{ mr: 1 }} />
            Unban User
          </MenuItem>
        )}
      </Menu>

      {/* User Details Dialog */}
      <Dialog
        open={userDetailsDialog}
        onClose={() => setUserDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Username</Typography>
                  <Typography variant="body1">{selectedUser.username}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedUser.email}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{selectedUser.phone || 'Not provided'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    icon={getStatusIcon(selectedUser.status)}
                    label={selectedUser.status?.toUpperCase()}
                    color={getStatusColor(selectedUser.status)}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Gaming Profile</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">BGMI Name</Typography>
                  <Typography variant="body1">{selectedUser.gameProfile?.bgmiName || 'Not set'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">BGMI Player ID</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{selectedUser.gameProfile?.bgmiId || 'Not set'}</Typography>
                    {selectedUser.gameProfile?.bgmiId && (
                      <Chip
                        size="small"
                        label={getBgmiIdStatus(selectedUser.gameProfile.bgmiId)}
                        color={getBgmiIdStatusColor(selectedUser.gameProfile.bgmiId)}
                      />
                    )}
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Wallet Balance</Typography>
                  <Typography variant="body1">₹{(selectedUser.wallet?.balance || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Total Tournaments</Typography>
                  <Typography variant="body1">{selectedUser.stats?.totalTournaments || 0}</Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog
        open={banDialog}
        onClose={() => setBanDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ban User</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to ban {selectedUser?.username}?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Ban Reason"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Enter reason for banning this user..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmBan}
            color="error"
            variant="contained"
            disabled={!banReason.trim() || banMutation.isLoading}
          >
            {banMutation.isLoading ? 'Banning...' : 'Ban User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;