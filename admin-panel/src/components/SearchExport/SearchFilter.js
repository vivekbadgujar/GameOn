import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  Person,
  SportsEsports,
  AccountBalanceWallet,
  Schedule,
} from '@mui/icons-material';
import { searchExportAPI } from '../../services/api';

const SearchFilter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [filters, setFilters] = useState({
    dateRange: [null, null],
    status: 'all',
    type: 'all',
    minAmount: 0,
    maxAmount: 10000,
  });

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', searchQuery, searchType, filters],
    queryFn: () => searchExportAPI.search(searchQuery, searchType),
    enabled: searchQuery.length > 0,
  });

  const handleSearch = () => {
    // Search is triggered automatically by the query
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSearchType('all');
    setFilters({
      dateRange: [null, null],
      status: 'all',
      type: 'all',
      minAmount: 0,
      maxAmount: 10000,
    });
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'user': return <Person />;
      case 'tournament': return <SportsEsports />;
      case 'payout': return <AccountBalanceWallet />;
      case 'schedule': return <Schedule />;
      default: return <Person />;
    }
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'user': return 'primary.main';
      case 'tournament': return 'success.main';
      case 'payout': return 'warning.main';
      case 'schedule': return 'info.main';
      default: return 'grey.500';
    }
  };

  // Mock search results for demonstration
  const mockResults = [
    {
      id: 1,
      type: 'user',
      title: 'ProGamer123',
      description: 'User profile - Joined 3 months ago, 15 tournaments participated',
      status: 'active',
      amount: 2500,
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      type: 'tournament',
      title: 'BGMI Pro League',
      description: 'Tournament - 100 participants, ₹10,000 prize pool',
      status: 'active',
      amount: 10000,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 3,
      type: 'payout',
      title: 'Payout #12345',
      description: 'Prize payout to ProGamer123 for 1st place',
      status: 'completed',
      amount: 5000,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  const results = searchResults.length > 0 ? searchResults : mockResults;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        Search & Filter
      </Typography>

      <Grid container spacing={3}>
        {/* Search Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Search
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Search Query"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search term..."
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Search Type</InputLabel>
                <Select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  label="Search Type"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="users">Users</MenuItem>
                  <MenuItem value="tournaments">Tournaments</MenuItem>
                  <MenuItem value="payouts">Payouts</MenuItem>
                  <MenuItem value="schedules">Schedules</MenuItem>
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Filters
                </Typography>
                <Button
                  size="small"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </Box>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Status Filter</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      label="Status"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Type Filter</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      label="Type"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="solo">Solo</MenuItem>
                      <MenuItem value="duo">Duo</MenuItem>
                      <MenuItem value="squad">Squad</MenuItem>
                    </Select>
                  </FormControl>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Amount Range</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>Amount Range (₹)</Typography>
                    <Slider
                      value={[filters.minAmount, filters.maxAmount]}
                      onChange={(e, newValue) => setFilters(prev => ({
                        ...prev,
                        minAmount: newValue[0],
                        maxAmount: newValue[1],
                      }))}
                      valueLabelDisplay="auto"
                      min={0}
                      max={10000}
                      step={100}
                    />
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <TextField
                        label="Min"
                        type="number"
                        value={filters.minAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
                        size="small"
                      />
                      <TextField
                        label="Max"
                        type="number"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: Number(e.target.value) }))}
                        size="small"
                      />
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  Search Results ({results.length})
                </Typography>
                {isLoading && <LinearProgress sx={{ width: 200 }} />}
              </Box>

              {!searchQuery && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Enter a search query to find users, tournaments, payouts, and more.
                </Alert>
              )}

              {searchQuery && results.length === 0 && !isLoading && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  No results found for "{searchQuery}". Try adjusting your search terms or filters.
                </Alert>
              )}

              <List>
                {results.map((result, index) => (
                  <React.Fragment key={result.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getResultColor(result.type) }}>
                          {getResultIcon(result.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {result.title}
                            </Typography>
                            <Chip
                              label={result.type}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                            <Chip
                              label={result.status}
                              size="small"
                              color={result.status === 'active' ? 'success' : 'default'}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {result.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {result.amount && (
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  ₹{result.amount.toLocaleString()}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {new Date(result.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </React.Fragment>
                        }
                      />
                      <Button size="small" variant="outlined">
                        View Details
                      </Button>
                    </ListItem>
                    {index < results.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchFilter; 