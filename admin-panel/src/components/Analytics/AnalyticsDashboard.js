import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  LinearProgress,
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
  TrendingUp,
  TrendingDown,
  People,
  EmojiEvents,
  Payment,
  Security,
  Download,
  Refresh,
  Visibility,
  CalendarToday,
  AttachMoney,
  Group
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../services/api';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState(0);

  // Fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => analyticsAPI.getDashboard({ timeRange }),
    refetchInterval: 60000, // Refresh every minute
  });

  // Real data from API
  const userGrowthData = analyticsData?.data?.userGrowth || [];

  const gameDistribution = [
    { name: 'PUBG', value: 35, color: '#8884d8' },
    { name: 'Free Fire', value: 25, color: '#82ca9d' },
    { name: 'BGMI', value: 20, color: '#ffc658' },
    { name: 'COD', value: 15, color: '#ff7300' },
    { name: 'Others', value: 5, color: '#8dd1e1' },
  ];

  const revenueData = analyticsData?.data?.revenueData || [];

  const participationData = [
    { game: 'PUBG', participants: 1200, tournaments: 45, avgPrize: 2500 },
    { game: 'Free Fire', participants: 800, tournaments: 32, avgPrize: 1800 },
    { game: 'BGMI', participants: 950, tournaments: 38, avgPrize: 2200 },
    { game: 'COD', participants: 600, tournaments: 25, avgPrize: 1500 },
    { game: 'Valorant', participants: 400, tournaments: 18, avgPrize: 3000 },
  ];

  const securityData = [
    { category: 'Suspicious Activity', value: 85 },
    { category: 'Hacking Attempts', value: 65 },
    { category: 'Rule Violations', value: 90 },
    { category: 'Account Sharing', value: 45 },
    { category: 'Multiple Accounts', value: 70 },
  ];

  const topTournaments = [
    { name: 'PUBG Championship 2024', participants: 256, prizePool: 50000, status: 'Completed' },
    { name: 'Free Fire Pro League', participants: 128, prizePool: 30000, status: 'Active' },
    { name: 'BGMI Masters', participants: 512, prizePool: 75000, status: 'Upcoming' },
    { name: 'COD Warzone Cup', participants: 64, prizePool: 20000, status: 'Completed' },
    { name: 'Valorant Tournament', participants: 32, prizePool: 15000, status: 'Active' },
  ];

  const StatCard = ({ title, value, change, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
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
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load analytics data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into platform performance and user engagement
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
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
          <StatCard
            title="Total Users"
            value={analyticsData?.data?.totalUsers || "4,234"}
            change={12.5}
            icon={<People />}
            color="primary"
            subtitle="+234 this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tournaments"
            value={analyticsData?.data?.activeTournaments || "23"}
            change={-2.1}
            icon={<EmojiEvents />}
            color="secondary"
            subtitle="5 ending today"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`₹${analyticsData?.data?.totalRevenue || "2.4M"}`}
            change={8.7}
            icon={<Payment />}
            sx={{ color: 'success.main' }}
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Security Alerts"
            value={analyticsData?.data?.securityAlerts || "7"}
            change={-15.3}
            icon={<Security />}
            color="warning"
            subtitle="3 high priority"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Revenue" />
          <Tab label="Participation" />
          <Tab label="Security" />
          <Tab label="Tournaments" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* User Growth Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Platform Growth
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="users"
                      stroke="#6366f1"
                      strokeWidth={3}
                      name="Users"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="tournaments"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Tournaments"
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gameDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {gameDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2 }}>
                  {gameDistribution.map((game, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: game.color,
                          mr: 1
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {game.name}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {game.value}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Revenue Chart */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Revenue & Profit Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Participation Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Game Participation Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={participationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="participants" fill="#6366f1" name="Participants" />
                    <Bar yAxisId="right" dataKey="tournaments" fill="#10b981" name="Tournaments" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Participation Stats */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Participation Stats
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {participationData.map((game, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {game.game}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Participants:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {game.participants.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tournaments:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {game.tournaments}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Avg Prize:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ₹{game.avgPrize.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* Security Radar Chart */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Security Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={securityData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Security Score"
                      dataKey="value"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Stats */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Security Overview
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {securityData.map((item, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{item.category}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {item.value}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 8,
                          bgcolor: 'grey.200',
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            width: `${item.value}%`,
                            height: '100%',
                            bgcolor: item.value > 70 ? 'error.main' : item.value > 40 ? 'warning.main' : 'success.main',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          {/* Top Tournaments Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top Tournaments
                </Typography>
                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tournament Name</TableCell>
                        <TableCell align="right">Participants</TableCell>
                        <TableCell align="right">Prize Pool</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topTournaments.map((tournament, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {tournament.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {tournament.participants.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              ₹{tournament.prizePool.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={tournament.status}
                              color={
                                tournament.status === 'Active' ? 'success' :
                                tournament.status === 'Completed' ? 'default' : 'info'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button size="small" startIcon={<Visibility />}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsDashboard; 