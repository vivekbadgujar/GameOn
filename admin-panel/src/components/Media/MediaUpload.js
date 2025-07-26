import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  IconButton,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  Image,
  VideoLibrary,
  Link,
  Delete,
  Edit,
  Visibility,
  Download,
} from '@mui/icons-material';
import { mediaAPI } from '../../services/api';

const MediaUpload = () => {
  const queryClient = useQueryClient();
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    type: 'image',
    file: null,
    url: '',
    tournament: '',
  });

  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: mediaAPI.getAll,
    refetchInterval: 30000,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }) => mediaAPI.upload(file, type),
    onSuccess: () => {
      queryClient.invalidateQueries(['media']);
      setUploadDialog(false);
      setUploadData({
        title: '',
        description: '',
        type: 'image',
        file: null,
        url: '',
        tournament: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: mediaAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['media']);
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadData(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (uploadData.file) {
      await uploadMutation.mutateAsync({
        file: uploadData.file,
        type: uploadData.type,
      });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return <Image />;
      case 'video': return <VideoLibrary />;
      case 'link': return <Link />;
      default: return <CloudUpload />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'image': return 'primary.main';
      case 'video': return 'secondary.main';
      case 'link': return 'success.main';
      default: return 'grey.500';
    }
  };

  // Mock data for demonstration
  const mockMedia = [
    {
      id: 1,
      title: 'BGMI Pro League Poster',
      description: 'Official tournament poster for BGMI Pro League',
      type: 'image',
      url: 'https://via.placeholder.com/300x200',
      tournament: 'BGMI Pro League',
      uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      size: '2.5 MB',
    },
    {
      id: 2,
      title: 'Weekend Warriors Stream',
      description: 'Live stream link for Weekend Warriors tournament',
      type: 'link',
      url: 'https://youtube.com/watch?v=abc123',
      tournament: 'Weekend Warriors',
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      size: 'N/A',
    },
    {
      id: 3,
      title: 'Tournament Highlights',
      description: 'Best moments from last week tournaments',
      type: 'video',
      url: 'https://via.placeholder.com/300x200',
      tournament: 'Various',
      uploadedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      size: '15.2 MB',
    },
  ];

  const data = mediaFiles.length > 0 ? mediaFiles : mockMedia;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Media Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setUploadDialog(true)}
        >
          Upload Media
        </Button>
      </Box>

      {/* Media Grid */}
      <Grid container spacing={3}>
        {data.map((media) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={media.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ position: 'relative' }}>
                {media.type === 'image' || media.type === 'video' ? (
                  <img
                    src={media.url}
                    alt={media.title}
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                    }}
                  >
                    <Link sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Box>
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                    onClick={() => setSelectedMedia(media)}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                    onClick={() => deleteMutation.mutate(media.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
                <Chip
                  icon={getTypeIcon(media.type)}
                  label={media.type}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: 'rgba(255,255,255,0.9)',
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {media.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {media.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {media.size}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(media.uploadedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Media</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Media Type</InputLabel>
                <Select
                  value={uploadData.type}
                  onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                  label="Media Type"
                >
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="link">Link</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
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

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tournament (Optional)"
                value={uploadData.tournament}
                onChange={(e) => setUploadData(prev => ({ ...prev, tournament: e.target.value }))}
                placeholder="Associated tournament"
              />
            </Grid>

            {uploadData.type === 'link' ? (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL"
                  value={uploadData.url}
                  onChange={(e) => setUploadData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  required
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept={uploadData.type === 'image' ? 'image/*' : 'video/*'}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Click to upload {uploadData.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {uploadData.file ? uploadData.file.name : `Select a ${uploadData.type} file`}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploadMutation.isPending || (!uploadData.file && !uploadData.url)}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Preview Dialog */}
      <Dialog
        open={Boolean(selectedMedia)}
        onClose={() => setSelectedMedia(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedMedia && getTypeIcon(selectedMedia.type)}
            {selectedMedia?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMedia && (
            <Box>
              {selectedMedia.type === 'image' && (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title}
                  style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
                />
              )}
              {selectedMedia.type === 'video' && (
                <video
                  src={selectedMedia.url}
                  controls
                  style={{ width: '100%', maxHeight: 400 }}
                />
              )}
              {selectedMedia.type === 'link' && (
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Link: {selectedMedia.url}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Link />}
                    onClick={() => window.open(selectedMedia.url, '_blank')}
                  >
                    Open Link
                  </Button>
                </Box>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedMedia.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={selectedMedia.type} size="small" />
                  <Chip label={selectedMedia.size} size="small" />
                  {selectedMedia.tournament && (
                    <Chip label={selectedMedia.tournament} size="small" color="primary" />
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMedia(null)}>Close</Button>
          <Button
            startIcon={<Download />}
            onClick={() => {
              if (selectedMedia) {
                window.open(selectedMedia.url, '_blank');
              }
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaUpload; 