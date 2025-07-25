import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  People,
  SportsEsports,
  AccountBalanceWallet,
  Notifications,
  Security,
  Schedule,
  Psychology,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '../../services/api';

const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
        {trend && (
          <Chip
            label={trend}
            size="small"
            color={trend.includes('+') ? 'success' : 'error'}
            sx={{ fontSize: '0.75rem' }}
          />
        )}
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsAPI.getDashboard,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  // If error or data is missing, show a user-friendly error message
  if (isError || !dashboardData?.data) {
    return (
      <Box sx={{ width: '100%', p: 4 }}>
        <Typography color="error" variant="h6">Error loading dashboard data. Please try again later.</Typography>
      </Box>
    );
  }

  const data = dashboardData.data;

  // Defensive: If data.stats is missing, show a fallback UI
  if (!data || !data.stats) {
    return (
      <Box sx={{ width: '100%', p: 4 }}>
        <Typography color="error" variant="h6">Dashboard data is unavailable. Please try again later.</Typography>
      </Box>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'tournament': return <SportsEsports fontSize="small" />;
      case 'user': return <People fontSize="small" />;
      case 'payout': return <AccountBalanceWallet fontSize="small" />;
      case 'report': return <Security fontSize="small" />;
      default: return <Notifications fontSize="small" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'tournament': return 'primary.main';
      case 'user': return 'success.main';
      case 'payout': return 'warning.main';
      case 'report': return 'error.main';
      default: return 'info.main';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        Dashboard Overview
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={data.stats.totalUsers.toLocaleString()}
            icon={<People />}
            color="primary"
            trend={data.trends.userGrowth}
            subtitle="Active players"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tournaments"
            value={data.stats.activeTournaments}
            icon={<SportsEsports />}
            color="success"
            trend={data.trends.tournamentGrowth}
            subtitle="Live matches"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`₹${data.stats.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp />}
            color="warning"
            trend={data.trends.revenueGrowth}
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Payouts"
            value={data.stats.pendingPayouts}
            icon={<AccountBalanceWallet />}
            color="error"
            trend={data.trends.payoutGrowth}
            subtitle="Awaiting processing"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Weekly Analytics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} />
                  <Line type="monotone" dataKey="tournaments" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Tournament Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Recent Activity
              </Typography>
              <List>
                {data.recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < data.recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'white', cursor: 'pointer' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <SportsEsports sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2">Create Tournament</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'success.main', color: 'white', cursor: 'pointer' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Notifications sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2">Send Broadcast</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'warning.main', color: 'white', cursor: 'pointer' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <AccountBalanceWallet sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2">Process Payouts</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'error.main', color: 'white', cursor: 'pointer' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Security sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2">View Reports</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 