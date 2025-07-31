import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Edit,
  Visibility,
  Download,
  PhotoLibrary,
  VideoLibrary,
  Description,
  Add,
  Refresh,
  FilterList,
  Sort,
  Search
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaAPI } from '../../services/api';
import dayjs from 'dayjs';

const MediaUpload = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    type: 'poster',
    tournament: '',
    tags: ''
  });
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const queryClient = useQueryClient();

  // Fetch media files
  const { data: mediaFiles, isLoading, error, refetch } = useQuery({
    queryKey: ['media-files'],
    queryFn: () => mediaAPI.getAll(),
  });

  // Upload media mutation
  const uploadMutation = useMutation({
    mutationFn: (data) => mediaAPI.upload(data.file, data.type),
    onSuccess: () => {
      queryClient.invalidateQueries(['media-files']);
      setUploadDialog(false);
      setUploadData({
        title: '',
        description: '',
        type: 'poster',
        tournament: '',
        tags: ''
      });
      setUploadingFile(null);
      setUploadProgress(0);
    },
  });

  // Update media mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => mediaAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['media-files']);
      setEditDialog(false);
      setSelectedMedia(null);
      setEditData({
        title: '',
        description: '',
        tags: ''
      });
    },
  });

  // Delete media mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => mediaAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['media-files']);
      setDeleteDialog(false);
      setSelectedMedia(null);
    },
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadingFile(file);
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleUpload = () => {
    if (uploadingFile && uploadData.title) {
      uploadMutation.mutate({
        file: uploadingFile,
        type: uploadData.type,
        metadata: {
          title: uploadData.title,
          description: uploadData.description,
          tournament: uploadData.tournament,
          tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }
      });
    }
  };

  const handleEdit = (media) => {
    setSelectedMedia(media);
    setEditData({
      title: media.title || '',
      description: media.description || '',
      tags: media.tags?.join(', ') || ''
    });
    setEditDialog(true);
  };

  const handleUpdate = () => {
    if (selectedMedia && editData.title) {
      updateMutation.mutate({
        id: selectedMedia._id,
        data: {
          title: editData.title,
          description: editData.description,
          tags: editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }
      });
    }
  };

  const handleDelete = (media) => {
    setSelectedMedia(media);
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedMedia) {
      deleteMutation.mutate(selectedMedia._id);
    }
  };

  const handlePreview = (media) => {
    setSelectedMedia(media);
    setPreviewDialog(true);
  };

  const getMediaTypeIcon = (type) => {
    switch (type) {
      case 'poster': return <PhotoLibrary />;
      case 'highlight': return <VideoLibrary />;
      case 'document': return <Description />;
      default: return <PhotoLibrary />;
    }
  };

  const getMediaTypeColor = (type) => {
    switch (type) {
      case 'poster': return 'primary';
      case 'highlight': return 'secondary';
      case 'document': return 'info';
      default: return 'default';
    }
  };

  const mediaTypes = [
    { value: 'poster', label: 'Tournament Poster', icon: <PhotoLibrary /> },
    { value: 'highlight', label: 'Match Highlights', icon: <VideoLibrary /> },
    { value: 'document', label: 'Document', icon: <Description /> }
  ];

  // Ensure mediaData is always an array
  const mediaData = Array.isArray(mediaFiles?.data) 
    ? mediaFiles.data 
    : Array.isArray(mediaFiles) 
      ? mediaFiles 
      : [];

  // Filter media by type based on active tab
  const filteredMedia = activeTab === 0 
    ? mediaData 
    : Array.isArray(mediaData) 
      ? mediaData.filter(media => {
          const tabTypes = ['poster', 'highlight', 'document'];
          return media.type === tabTypes[activeTab - 1];
        })
      : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Media Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload and manage tournament posters, highlights, and documents
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
            variant="contained"
            startIcon={<Add />}
            onClick={() => setUploadDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              },
            }}
          >
            Upload Media
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Files
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {Array.isArray(mediaData) ? mediaData.length : 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <PhotoLibrary />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Posters
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="primary.main">
                    {Array.isArray(mediaData) ? mediaData.filter(m => m.type === 'poster').length : 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <PhotoLibrary />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Highlights
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="secondary.main">
                    {Array.isArray(mediaData) ? mediaData.filter(m => m.type === 'highlight').length : 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                  <VideoLibrary />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Documents
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="info.main">
                    {Array.isArray(mediaData) ? mediaData.filter(m => m.type === 'document').length : 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                  <Description />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="All Media" />
          <Tab label="Posters" />
          <Tab label="Highlights" />
          <Tab label="Documents" />
        </Tabs>
      </Box>

      {/* Media Grid */}
      <Card>
        <CardContent>
          {filteredMedia.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PhotoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No media files found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload your first media file to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setUploadDialog(true)}
              >
                Upload Media
              </Button>
            </Box>
          ) : (
            <ImageList cols={4} gap={16}>
              {filteredMedia.map((media, index) => (
                <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Box
                    component="img"
                    src={media.url || 'https://via.placeholder.com/300x200?text=Media'}
                    alt={media.title}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => handlePreview(media)}
                  />
                  <ImageListItemBar
                    title={media.title}
                    subtitle={
                      <Box>
                        <Typography variant="caption" display="block">
                          {dayjs(media.createdAt).format('MMM DD, YYYY')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          <Chip
                            icon={getMediaTypeIcon(media.type)}
                            label={media.type}
                            size="small"
                            color={getMediaTypeColor(media.type)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                    actionIcon={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            onClick={() => handlePreview(media)}
                            sx={{ color: 'white' }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(media)}
                            sx={{ color: 'white' }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(media)}
                            sx={{ color: 'white' }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Media</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.light',
                    opacity: 0.1
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Click to upload or drag and drop
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports: JPG, PNG, GIF, MP4, PDF (Max 10MB)
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </Box>
            </Grid>

            {uploadingFile && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    {uploadingFile.name}
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {(uploadingFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Media Type</InputLabel>
                <Select
                  value={uploadData.type}
                  label="Media Type"
                  onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                >
                  {mediaTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tournament (Optional)"
                value={uploadData.tournament}
                onChange={(e) => setUploadData(prev => ({ ...prev, tournament: e.target.value }))}
                placeholder="Associated tournament name"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tags"
                value={uploadData.tags}
                onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
                helperText="Separate tags with commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!uploadingFile || !uploadData.title || uploadMutation.isLoading}
          >
            {uploadMutation.isLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Media</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                value={editData.tags}
                onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
                helperText="Separate tags with commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={!editData.title || updateMutation.isLoading}
          >
            {updateMutation.isLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedMedia?.title}
          <Chip
            icon={getMediaTypeIcon(selectedMedia?.type)}
            label={selectedMedia?.type}
            size="small"
            color={getMediaTypeColor(selectedMedia?.type)}
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedMedia && (
            <Box>
              <Box
                component="img"
                src={selectedMedia.url || 'https://via.placeholder.com/800x600?text=Media'}
                alt={selectedMedia.title}
                sx={{
                  width: '100%',
                  maxHeight: 500,
                  objectFit: 'contain',
                  borderRadius: 1,
                  mb: 2
                }}
              />
              <Typography variant="body1" gutterBottom>
                {selectedMedia.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {selectedMedia.tags?.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                Uploaded: {dayjs(selectedMedia.createdAt).format('MMM DD, YYYY HH:mm')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          <Button startIcon={<Download />}>Download</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Media</DialogTitle>
        <DialogContent>
          {selectedMedia && (
            <Typography>
              Are you sure you want to delete "{selectedMedia.title}"? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
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

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load media files. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default MediaUpload; 