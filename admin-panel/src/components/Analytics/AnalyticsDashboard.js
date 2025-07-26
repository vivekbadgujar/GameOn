import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  SportsEsports,
  AccountBalanceWallet,
  EmojiEvents,
  Schedule,
  Visibility,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { analyticsAPI } from '../../services/api';
import dayjs from 'dayjs';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [tournamentType, setTournamentType] = useState('all');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', timeRange, tournamentType],
    queryFn: () => analyticsAPI.getTournamentStats({ timeRange, tournamentType }),
    refetchInterval: 60000, // Refetch every minute
  });

  // Mock data for demonstration
  const mockData = {
    overview: {
      totalTournaments: 156,
      totalParticipants: 2847,
      totalRevenue: 125000,
      avgPrizePool: 8500,
      completionRate: 94.2,
      avgParticipants: 18.2,
    },
    trends: {
      tournaments: '+15.3%',
      participants: '+22.1%',
      revenue: '+8.7%',
      completionRate: '+2.1%',
    },
    chartData: [
      { date: '2024-01', tournaments: 12, participants: 180, revenue: 8500 },
      { date: '2024-02', tournaments: 15, participants: 220, revenue: 10200 },
      { date: '2024-03', tournaments: 18, participants: 280, revenue: 12500 },
      { date: '2024-04', tournaments: 22, participants: 320, revenue: 14800 },
      { date: '2024-05', tournaments: 25, participants: 380, revenue: 17200 },
      { date: '2024-06', tournaments: 28, participants: 420, revenue: 19500 },
    ],
    participationByType: [
      { name: 'Solo', value: 45, color: '#6366f1' },
      { name: 'Duo', value: 30, color: '#10b981' },
      { name: 'Squad', value: 25, color: '#f59e0b' },
    ],
    topTournaments: [
      { id: 1, title: 'BGMI Pro League', participants: 100, revenue: 15000, completionRate: 98 },
      { id: 2, title: 'Weekend Warriors', participants: 85, revenue: 12000, completionRate: 95 },
      { id: 3, title: 'Squad Showdown', participants: 72, revenue: 10500, completionRate: 92 },
      { id: 4, title: 'Duo Championship', participants: 64, revenue: 9500, completionRate: 89 },
      { id: 5, title: 'Solo Masters', participants: 58, revenue: 8500, completionRate: 87 },
    ],
    revenueBreakdown: [
      { month: 'Jan', entryFees: 4500, prizes: 4000 },
      { month: 'Feb', entryFees: 5200, prizes: 5000 },
      { month: 'Mar', entryFees: 6500, prizes: 6000 },
      { month: 'Apr', entryFees: 7400, prizes: 7400 },
      { month: 'May', entryFees: 8600, prizes: 8600 },
      { month: 'Jun', entryFees: 9500, prizes: 10000 },
    ],
  };

  const data = analyticsData?.data || mockData;

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          {trend && (
            <Chip
              icon={trend.includes('+') ? <TrendingUp /> : <TrendingDown />}
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

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tournament Type</InputLabel>
            <Select
              value={tournamentType}
              onChange={(e) => setTournamentType(e.target.value)}
              label="Tournament Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="solo">Solo</MenuItem>
              <MenuItem value="duo">Duo</MenuItem>
              <MenuItem value="squad">Squad</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tournaments"
            value={data.overview.totalTournaments}
            icon={<SportsEsports />}
            color="primary.main"
            trend={data.trends.tournaments}
            subtitle="Organized"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Participants"
            value={data.overview.totalParticipants.toLocaleString()}
            icon={<People />}
            color="success.main"
            trend={data.trends.participants}
            subtitle="Players joined"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`₹${data.overview.totalRevenue.toLocaleString()}`}
            icon={<AccountBalanceWallet />}
            color="warning.main"
            trend={data.trends.revenue}
            subtitle="Generated"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${data.overview.completionRate}%`}
            icon={<EmojiEvents />}
            color="info.main"
            trend={data.trends.completionRate}
            subtitle="Success rate"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Tournament Performance Trends
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="tournaments" stroke="#6366f1" strokeWidth={2} name="Tournaments" />
                  <Line yAxisId="left" type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={2} name="Participants" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Participation by Type
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={data.participationByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.participationByType.map((entry, index) => (
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

      {/* Revenue Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Revenue Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.revenueBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="entryFees" stackId="1" stroke="#6366f1" fill="#6366f1" name="Entry Fees" />
                  <Area type="monotone" dataKey="prizes" stackId="1" stroke="#10b981" fill="#10b981" name="Prizes" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Tournaments */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Top Performing Tournaments
              </Typography>
              <List>
                {data.topTournaments.map((tournament, index) => (
                  <React.Fragment key={tournament.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index < 3 ? 'primary.main' : 'grey.500' }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={tournament.title}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Chip size="small" label={`${tournament.participants} players`} />
                            <Chip size="small" label={`₹${tournament.revenue}`} color="success" />
                            <Chip size="small" label={`${tournament.completionRate}%`} color="info" />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < data.topTournaments.length - 1 && <Divider />}
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
                Key Metrics
              </Typography>
              <Box sx={{ space: 2 }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Average Prize Pool</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{data.overview.avgPrizePool.toLocaleString()}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Average Participants</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {data.overview.avgParticipants}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={72} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tournament Success Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {data.overview.completionRate}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={data.overview.completionRate} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 