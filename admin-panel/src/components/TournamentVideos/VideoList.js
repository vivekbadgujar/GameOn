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
  Grid,
  Switch,
  FormControlLabel
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
  Visibility,
  VisibilityOff,
  MoreVert,
  Refresh,
  VideoLibrary,
  YouTube
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tournamentVideoAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const VideoList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lastMessage } = useSocket();

  // Fetch videos
  const { data: videos, isLoading, error, refetch } = useQuery({
    queryKey: ['tournament-videos', searchTerm, gameFilter, categoryFilter, visibilityFilter],
    queryFn: () => tournamentVideoAPI.getAll({ 
      search: searchTerm, 
      game: gameFilter, 
      category: categoryFilter,
      visibility: visibilityFilter
    }),
  });

  // Real-time socket updates
  React.useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Admin Panel Videos - Received socket message:', lastMessage);
    
    if (lastMessage.type === 'videoAdded' || 
        lastMessage.type === 'videoUpdated' || 
        lastMessage.type === 'videoDeleted') {
      console.log('Admin Panel Videos - Refreshing video list due to socket event');
      queryClient.invalidateQueries(['tournament-videos']);
      refetch();
    }
  }, [lastMessage, queryClient, refetch]);

  // Auto-refresh videos every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log('Admin Panel Videos - Auto-refreshing videos...');
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => tournamentVideoAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-videos']);
      setDeleteDialogOpen(false);
      setSelectedVideo(null);
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }) => tournamentVideoAPI.toggleVisibility(id, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-videos']);
    },
  });

  const handleDelete = (video) => {
    setSelectedVideo(video);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedVideo) {
      deleteMutation.mutate(selectedVideo._id);
    }
  };

  const handleToggleVisibility = (id, currentVisibility) => {
    toggleVisibilityMutation.mutate({ id, isVisible: !currentVisibility });
  };

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const getGameIcon = (game) => {
    switch (game?.toLowerCase()) {
      case 'pubg':
      case 'bgmi':
        return '🎮';
      case 'free fire':
        return '🔥';
      case 'cod':
        return '⚔️';
      default:
        return '🎯';
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Video Title',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoLibrary sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={600}>
            {params.row.title}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'game',
      headerName: 'Game',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>{getGameIcon(params.value)}</span>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value || 'General'}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: 'tournament',
      headerName: 'Tournament',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.tournament?.title || 'No Tournament'}
        </Typography>
      ),
    },
    {
      field: 'isVisible',
      headerName: 'Visibility',
      width: 120,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={params.value}
              onChange={() => handleToggleVisibility(params.row._id, params.value)}
              size="small"
            />
          }
          label={params.value ? 'Visible' : 'Hidden'}
          sx={{ margin: 0 }}
        />
      ),
    },
    {
      field: 'youtubeUrl',
      headerName: 'YouTube',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Open in YouTube">
          <IconButton
            size="small"
            onClick={() => window.open(params.value, '_blank')}
            color="error"
          >
            <YouTube />
          </IconButton>
        </Tooltip>
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
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => navigate(`/tournament-videos/${params.row._id}/edit`)}
          color="primary"
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDelete(params.row)}
          color="error"
        />,
        <GridActionsCellItem
          icon={<MoreVert />}
          label="More"
          onClick={(event) => handleMenuOpen(event, params.row)}
          color="primary"
        />,
      ],
    },
  ];

  const filteredData = Array.isArray(videos?.data?.data) ? videos.data.data : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Tournament Videos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage YouTube videos for tournaments and highlights
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/tournament-videos/new')}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            },
          }}
        >
          Add Video
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search videos..."
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
                <InputLabel>Game</InputLabel>
                <Select
                  value={gameFilter}
                  label="Game"
                  onChange={(e) => setGameFilter(e.target.value)}
                >
                  <MenuItem value="all">All Games</MenuItem>
                  <MenuItem value="PUBG">PUBG</MenuItem>
                  <MenuItem value="BGMI">BGMI</MenuItem>
                  <MenuItem value="Free Fire">Free Fire</MenuItem>
                  <MenuItem value="COD">COD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="highlights">Highlights</MenuItem>
                  <MenuItem value="tutorials">Tutorials</MenuItem>
                  <MenuItem value="live">Live Streams</MenuItem>
                  <MenuItem value="interviews">Interviews</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={visibilityFilter}
                  label="Visibility"
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="visible">Visible</MenuItem>
                  <MenuItem value="hidden">Hidden</MenuItem>
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
        <DialogTitle>Delete Video</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedVideo?.title}"? This action cannot be undone.
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

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          window.open(selectedRow?.youtubeUrl, '_blank');
          handleMenuClose();
        }}>
          <YouTube sx={{ mr: 1 }} />
          Open in YouTube
        </MenuItem>
        <MenuItem onClick={() => {
          navigator.clipboard.writeText(selectedRow?.youtubeUrl);
          handleMenuClose();
        }}>
          Copy YouTube URL
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default VideoList;