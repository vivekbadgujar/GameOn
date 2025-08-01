import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  EmojiEvents,
  Payment,
  Security,
  Notifications,
  Refresh,
  Visibility,
  Warning,
  CheckCircle,
  Schedule,
  Campaign
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../services/api';

const StatCard = ({ title, value, change, icon, color, subtitle }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
            {value}
          </Typography>
          {change && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {change > 0 ? (
                <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
              )}
              <Typography
                variant="body2"
                color={change > 0 ? 'success.main' : 'error.main'}
                fontWeight={600}
              >
                {Math.abs(change)}%
              </Typography>
            </Box>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={(theme) => ({
            bgcolor: color && theme.palette[color] ? theme.palette[color].light : theme.palette.primary.light,
            color: color && theme.palette[color] ? theme.palette[color].main : theme.palette.primary.main,
            width: 56,
            height: 56,
          })}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', refreshKey],
    queryFn: analyticsAPI.getDashboard,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  // Real data from API
  const userGrowthData = dashboardData?.data?.userGrowth || [];
  const tournamentStats = dashboardData?.data?.gameDistribution || [];
  const revenueData = dashboardData?.data?.revenueData || [];
  const recentActivities = dashboardData?.data?.recentActivities || [];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'tournament': return <EmojiEvents />;
      case 'payment': return <Payment />;
      case 'security': return <Security />;
      case 'user': return <People />;
      default: return <Notifications />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load dashboard data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with your platform.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: isLoading ? 'warning.main' : 'success.main',
                mr: 1,
                animation: isLoading ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
            {isLoading ? 'Updating...' : 'Live data • Auto-refresh every 30s'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={isLoading ? "..." : (dashboardData?.data?.totalUsers || "0")}
            change={null}
            icon={<People />}
            color="primary"
            subtitle="Registered users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tournaments"
            value={isLoading ? "..." : (dashboardData?.data?.activeTournaments || "0")}
            change={null}
            icon={<EmojiEvents />}
            color="secondary"
            subtitle="Currently running"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={isLoading ? "..." : `₹${(dashboardData?.data?.totalRevenue || 0).toLocaleString()}`}
            change={null}
            icon={<Payment />}
            color="success"
            subtitle="Tournament entries"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tournaments"
            value={isLoading ? "..." : (dashboardData?.data?.totalTournaments || "0")}
            change={null}
            icon={<EmojiEvents />}
            color="info"
            subtitle="All time"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* User Growth Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  User Growth
                </Typography>
                <Chip label="Last 6 months" size="small" />
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Game Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Game Distribution
              </Typography>
              {tournamentStats.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tournamentStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {tournamentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value, name, props) => [
                          `${value}% (${props.payload.count} tournaments)`,
                          props.payload.name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2 }}>
                    {tournamentStats.map((stat, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: stat.color,
                            mr: 1
                          }}
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {stat.name}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {stat.value}% ({stat.count})
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {isLoading ? "Loading game distribution..." : "No tournament data available"}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Chart and Recent Activities */}
      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Monthly Revenue
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Activities
                </Typography>
                <Tooltip title="View all activities">
                  <IconButton size="small">
                    <Visibility />
                  </IconButton>
                </Tooltip>
              </Box>
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: `${getStatusColor(activity.status)}.light`,
                            color: `${getStatusColor(activity.status)}.main`,
                            width: 32,
                            height: 32
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500}>
                            {activity.message}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" startIcon={<EmojiEvents />}>
                  Create Tournament
                </Button>
                <Button variant="outlined" startIcon={<Campaign />}>
                  Send Broadcast
                </Button>
                <Button variant="outlined" startIcon={<Payment />}>
                  Process Payouts
                </Button>
                <Button variant="outlined" startIcon={<Schedule />}>
                  View Schedule
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 