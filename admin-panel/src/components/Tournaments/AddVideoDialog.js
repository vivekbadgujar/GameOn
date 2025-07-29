import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { YouTube, VideoLibrary } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const AddVideoDialog = ({ open, onClose, tournament }) => {
  const queryClient = useQueryClient();
  const { showVideoSuccess, showVideoError } = useNotification();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    category: 'highlights',
    tags: [],
    isVisible: false,
    displayOrder: 0
  });
  
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  // Create video mutation
  const createMutation = useMutation({
    mutationFn: (data) => {
      if (tournament?._id) {
        // Add video to specific tournament
        return videoAPI.addToTournament(tournament._id, data);
      } else {
        // Create general video
        return videoAPI.create(data);
      }
    },
    onSuccess: (response) => {
      const videoTitle = formData.title || 'Video';
      showVideoSuccess('add', videoTitle);
      
      queryClient.invalidateQueries(['tournament-videos']);
      queryClient.invalidateQueries(['tournaments']);
      handleClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      showVideoError('add', errorMessage);
    }
  });

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      category: 'highlights',
      tags: [],
      isVisible: false,
      displayOrder: 0
    });
    setErrors({});
    setTagInput('');
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
    } else {
      // Basic YouTube URL validation
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(formData.youtubeUrl)) {
        newErrors.youtubeUrl = 'Please enter a valid YouTube URL';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const submitData = {
      ...formData,
      tournament: tournament?._id || null,
      game: tournament?.game || 'General'
    };
    
    createMutation.mutate(submitData);
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const youtubeId = extractYouTubeId(formData.youtubeUrl);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        color: 'white',
        mb: 2
      }}>
        <VideoLibrary />
        <Typography variant="h6" fontWeight="bold">
          {tournament ? `Add Video to "${tournament.title}"` : 'Add Tournament Video'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {tournament && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}
          >
            Adding video to tournament: <strong>{tournament.title}</strong> ({tournament.game})
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Title */}
          <TextField
            fullWidth
            label="Video Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.05)',
              }
            }}
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.05)',
              }
            }}
          />

          {/* YouTube URL */}
          <TextField
            fullWidth
            label="YouTube URL"
            value={formData.youtubeUrl}
            onChange={(e) => handleChange('youtubeUrl', e.target.value)}
            error={!!errors.youtubeUrl}
            helperText={errors.youtubeUrl || 'Supports youtube.com/watch?v=... and youtu.be/... formats'}
            required
            InputProps={{
              startAdornment: <YouTube sx={{ mr: 1, color: '#ff0000' }} />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.05)',
              }
            }}
          />

          {/* YouTube Preview */}
          {youtubeId && (
            <Box sx={{ 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 1, 
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.02)'
            }}>
              <Typography variant="subtitle2" sx={{ p: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                Preview:
              </Typography>
              <Box sx={{ aspectRatio: '16/9', position: 'relative' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Video Preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </Box>
            </Box>
          )}

          {/* Category */}
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) => handleChange('category', e.target.value)}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <MenuItem value="highlights">Highlights</MenuItem>
              <MenuItem value="tutorial">Tutorial</MenuItem>
              <MenuItem value="announcement">Announcement</MenuItem>
              <MenuItem value="live_stream">Live Stream</MenuItem>
              <MenuItem value="recap">Recap</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Tags */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>Tags</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              {formData.tags.map((tag, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#6366f1',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.3)',
                    }
                  }}
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                  }
                }}
              />
              <Button 
                variant="outlined" 
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* Settings */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isVisible}
                  onChange={(e) => handleChange('isVisible', e.target.checked)}
                  color="primary"
                />
              }
              label="Make video visible to users"
            />
            
            <TextField
              type="number"
              label="Display Order"
              value={formData.displayOrder}
              onChange={(e) => handleChange('displayOrder', parseInt(e.target.value) || 0)}
              size="small"
              sx={{ width: 150 }}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          disabled={createMutation.isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={createMutation.isLoading}
          startIcon={createMutation.isLoading ? <CircularProgress size={20} /> : <VideoLibrary />}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            },
          }}
        >
          {createMutation.isLoading ? 'Adding Video...' : 'Add Video'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVideoDialog;