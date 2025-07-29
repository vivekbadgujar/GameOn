import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Switch,
  FormControlLabel,
  Avatar,
  Link as MuiLink,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  VideoLibrary,
  YouTube,
  Launch,
  Refresh
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const TournamentVideoManager = () => {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    tournament: '',
    game: '',
    category: 'highlights',
    tags: [],
    isVisible: false,
    displayOrder: 0
  });
  
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [fetchingYouTubeData, setFetchingYouTubeData] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Fetch videos
  const { data: videos, isLoading } = useQuery({
    queryKey: ['tournament-videos'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tournament-videos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch videos');
      return response.json();
    }
  });

  // Fetch tournaments for selection
  const { data: tournaments } = useQuery({
    queryKey: ['tournaments-list'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tournaments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    }
  });

  // Create/Update video mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const url = editingVideo 
        ? `/api/admin/tournament-videos/${editingVideo._id}`
        : '/api/admin/tournament-videos';
      
      const response = await fetch(url, {
        method: editingVideo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to save video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-videos']);
      handleCloseDialog();
    }
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ videoId, isVisible }) => {
      const response = await fetch(`/api/admin/tournament-videos/${videoId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ isVisible })
      });
      
      if (!response.ok) throw new Error('Failed to update visibility');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-videos']);
    }
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId) => {
      const response = await fetch(`/api/admin/tournament-videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-videos']);
    }
  });

  const extractYouTubeId = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Add protocol if missing
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http')) {
      processedUrl = 'https://' + processedUrl;
    }
    
    console.log('Extracting YouTube ID from URL:', processedUrl);
    
    // More comprehensive YouTube URL patterns
    const patterns = [
      // Standard YouTube URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
      // Shortened URLs
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      // Embed URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      // Mobile URLs
      /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      // YouTube Shorts
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      // Legacy patterns
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      // General query param
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = processedUrl.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        console.log('Extracted YouTube ID:', match[1]);
        return match[1];
      }
    }
    
    // Fallback: last 11-char segment
    const fallback = processedUrl.split(/[/?=&]+/).find(s => s.length === 11 && /^[a-zA-Z0-9_-]+$/.test(s));
    console.log('Fallback YouTube ID:', fallback);
    return fallback || null;
  };

  const fetchYouTubeData = async (url) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setErrors(prev => ({ ...prev, youtubeUrl: 'Invalid YouTube URL' }));
      return;
    }

    setFetchingYouTubeData(true);
    try {
      // In a real implementation, you would use YouTube API
      // For now, we'll extract basic info from the URL
      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      
      setFormData(prev => ({
        ...prev,
        title: prev.title || `YouTube Video ${videoId}`,
        thumbnail
      }));
      
      setErrors(prev => ({ ...prev, youtubeUrl: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, youtubeUrl: 'Failed to fetch video data' }));
    } finally {
      setFetchingYouTubeData(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const normalizeYouTubeUrl = (url) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) return url;
    
    // Convert to standard watch URL format for consistency
    return `https://www.youtube.com/watch?v=${videoId}`;
  };

  const handleYouTubeUrlChange = (url) => {
    // Normalize the URL before storing
    const normalizedUrl = url ? normalizeYouTubeUrl(url) : url;
    handleChange('youtubeUrl', normalizedUrl);
    
    if (url && extractYouTubeId(url)) {
      fetchYouTubeData(url);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.youtubeUrl.trim()) {
      newErrors.youtubeUrl = 'YouTube URL is required';
    } else if (!extractYouTubeId(formData.youtubeUrl)) {
      newErrors.youtubeUrl = 'Invalid YouTube URL';
    }
    if (!formData.game.trim()) {
      newErrors.game = 'Game is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const submitData = {
      ...formData,
      createdBy: admin._id,
      youtubeId: extractYouTubeId(formData.youtubeUrl)
    };
    
    createMutation.mutate(submitData);
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      youtubeUrl: video.youtubeUrl,
      tournament: video.tournament?._id || '',
      game: video.game,
      category: video.category,
      tags: video.tags || [],
      isVisible: video.isVisible,
      displayOrder: video.displayOrder || 0
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVideo(null);
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      tournament: '',
      game: '',
      category: 'highlights',
      tags: [],
      isVisible: false,
      displayOrder: 0
    });
    setErrors({});
    setTagInput('');
  };

  const games = ['PUBG', 'BGMI', 'Free Fire', 'COD', 'Valorant', 'CS:GO', 'Others'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Tournament Videos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsDialogOpen(true)}
        >
          Add Video
        </Button>
      </Box>

      {/* Videos Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Video</TableCell>
                  <TableCell>Game</TableCell>
                  <TableCell>Tournament</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Visibility</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {videos?.data?.map((video) => (
                  <TableRow key={video._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={video.thumbnail}
                          variant="rounded"
                          sx={{ width: 60, height: 40 }}
                        >
                          <VideoLibrary />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {video.title}
                          </Typography>
                          <MuiLink
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noopener"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <YouTube fontSize="small" />
                            <Typography variant="caption">
                              View on YouTube
                            </Typography>
                            <Launch fontSize="small" />
                          </MuiLink>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={video.game} size="small" />
                    </TableCell>
                    <TableCell>
                      {video.tournament ? (
                        <Typography variant="body2">
                          {video.tournament.title}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          General
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={video.category} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={video.isVisible}
                        onChange={(e) => toggleVisibilityMutation.mutate({
                          videoId: video._id,
                          isVisible: e.target.checked
                        })}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{video.displayOrder}</TableCell>
                    <TableCell>
                      {dayjs(video.createdAt).format('MMM DD, YYYY')}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(video)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => deleteMutation.mutate(video._id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVideo ? 'Edit Video' : 'Add New Video'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="YouTube URL"
                value={formData.youtubeUrl}
                onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                error={!!errors.youtubeUrl}
                helperText={errors.youtubeUrl || 'Paste YouTube video URL here'}
                required
                InputProps={{
                  endAdornment: fetchingYouTubeData && <CircularProgress size={20} />
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.game} required>
                <InputLabel>Game</InputLabel>
                <Select
                  value={formData.game}
                  label="Game"
                  onChange={(e) => handleChange('game', e.target.value)}
                >
                  {games.map((game) => (
                    <MenuItem key={game} value={game}>{game}</MenuItem>
                  ))}
                </Select>
                {errors.game && <FormHelperText>{errors.game}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tournament (Optional)</InputLabel>
                <Select
                  value={formData.tournament}
                  label="Tournament (Optional)"
                  onChange={(e) => handleChange('tournament', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {tournaments?.data?.map((tournament) => (
                    <MenuItem key={tournament._id} value={tournament._id}>
                      {tournament.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <MenuItem value="highlights">Highlights</MenuItem>
                  <MenuItem value="tutorial">Tutorial</MenuItem>
                  <MenuItem value="announcement">Announcement</MenuItem>
                  <MenuItem value="live_stream">Live Stream</MenuItem>
                  <MenuItem value="recap">Recap</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => handleChange('displayOrder', parseInt(e.target.value) || 0)}
                helperText="Lower numbers appear first"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <TextField
                  label="Add Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  size="small"
                />
                <Button onClick={handleAddTag} variant="outlined" size="small">
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isVisible}
                    onChange={(e) => handleChange('isVisible', e.target.checked)}
                  />
                }
                label="Visible on Frontend"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={createMutation.isLoading}
          >
            {editingVideo ? 'Update' : 'Add Video'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentVideoManager;