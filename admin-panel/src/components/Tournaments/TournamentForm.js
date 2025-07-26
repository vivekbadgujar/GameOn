import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  FormHelperText,
  Alert,
  LinearProgress,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Save,
  Cancel,
  CloudUpload,
  Delete,
} from '@mui/icons-material';
import { tournamentAPI } from '../../services/api';
import dayjs from 'dayjs';

const TournamentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    map: '',
    teamType: '',
    entryFee: '',
    prizePool: '',
    maxParticipants: '',
    scheduledAt: dayjs(),
    rules: '',
    status: 'upcoming',
  });

  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Fetch tournament data if editing
  const { data: tournament, isLoading: isLoadingTournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id),
    enabled: isEditing,
  });

  const createMutation = useMutation({
    mutationFn: tournamentAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments']);
      navigate('/tournaments');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tournamentAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments']);
      navigate('/tournaments');
    },
  });

  useEffect(() => {
    if (tournament) {
      setFormData({
        title: tournament.title || '',
        description: tournament.description || '',
        map: tournament.map || '',
        teamType: tournament.teamType || '',
        entryFee: tournament.entryFee || '',
        prizePool: tournament.prizePool || '',
        maxParticipants: tournament.maxParticipants || '',
        scheduledAt: tournament.scheduledAt ? dayjs(tournament.scheduledAt) : dayjs(),
        rules: tournament.rules || '',
        status: tournament.status || 'upcoming',
      });
      if (tournament.image) {
        setImagePreview(tournament.image);
      }
    }
  }, [tournament]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.map) newErrors.map = 'Map is required';
    if (!formData.teamType) newErrors.teamType = 'Team type is required';
    if (!formData.entryFee || formData.entryFee <= 0) newErrors.entryFee = 'Valid entry fee is required';
    if (!formData.prizePool || formData.prizePool <= 0) newErrors.prizePool = 'Valid prize pool is required';
    if (!formData.maxParticipants || formData.maxParticipants <= 0) newErrors.maxParticipants = 'Valid participant limit is required';
    if (!formData.scheduledAt) newErrors.scheduledAt = 'Scheduled date is required';
    if (formData.scheduledAt && formData.scheduledAt.isBefore(dayjs())) {
      newErrors.scheduledAt = 'Scheduled date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      scheduledAt: formData.scheduledAt.toISOString(),
    };

    if (imageFile) {
      // Handle image upload here
      // submitData.image = imageFile;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const isLoading = isLoadingTournament || createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {isEditing ? 'Edit Tournament' : 'Create Tournament'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/tournaments')}
        >
          Cancel
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Tournament Title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description}
                  multiline
                  rows={4}
                  required
                />
              </Grid>

              {/* Tournament Details */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Tournament Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.map}>
                  <InputLabel>Map</InputLabel>
                  <Select
                    value={formData.map}
                    onChange={(e) => handleChange('map', e.target.value)}
                    label="Map"
                    required
                  >
                    <MenuItem value="Erangel">Erangel</MenuItem>
                    <MenuItem value="Miramar">Miramar</MenuItem>
                    <MenuItem value="Sanhok">Sanhok</MenuItem>
                    <MenuItem value="Vikendi">Vikendi</MenuItem>
                    <MenuItem value="Karakin">Karakin</MenuItem>
                    <MenuItem value="Paramo">Paramo</MenuItem>
                  </Select>
                  {errors.map && <FormHelperText>{errors.map}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.teamType}>
                  <InputLabel>Team Type</InputLabel>
                  <Select
                    value={formData.teamType}
                    onChange={(e) => handleChange('teamType', e.target.value)}
                    label="Team Type"
                    required
                  >
                    <MenuItem value="Solo">Solo</MenuItem>
                    <MenuItem value="Duo">Duo</MenuItem>
                    <MenuItem value="Squad">Squad</MenuItem>
                  </Select>
                  {errors.teamType && <FormHelperText>{errors.teamType}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Entry Fee (₹)"
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) => handleChange('entryFee', Number(e.target.value))}
                  error={!!errors.entryFee}
                  helperText={errors.entryFee}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Prize Pool (₹)"
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) => handleChange('prizePool', Number(e.target.value))}
                  error={!!errors.prizePool}
                  helperText={errors.prizePool}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Participants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', Number(e.target.value))}
                  error={!!errors.maxParticipants}
                  helperText={errors.maxParticipants}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Scheduled Date & Time"
                  value={formData.scheduledAt}
                  onChange={(value) => handleChange('scheduledAt', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.scheduledAt,
                      helperText: errors.scheduledAt,
                      required: true,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Tournament Image
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mr: 1 }}
                    >
                      Upload Image
                    </Button>
                  </label>
                  {imagePreview && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <img
                        src={imagePreview}
                        alt="Tournament"
                        style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tournament Rules"
                  value={formData.rules}
                  onChange={(e) => handleChange('rules', e.target.value)}
                  multiline
                  rows={6}
                  placeholder="Enter tournament rules and guidelines..."
                />
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/tournaments')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={isLoading}
                    sx={{ textTransform: 'none' }}
                  >
                    {isLoading ? 'Saving...' : (isEditing ? 'Update Tournament' : 'Create Tournament')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TournamentForm; 