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
  LinearProgress,
  InputAdornment,
  FormHelperText,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save,
  Cancel,
  CloudUpload,
  Delete,
  Add,
  Remove,
  Schedule,
  EmojiEvents,
  Payment,
  People
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { tournamentAPI, mediaAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import dayjs from 'dayjs';

const TournamentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { showTournamentSuccess, showTournamentError } = useNotification();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    game: '',
    map: '',
    tournamentType: 'squad',
    entryFee: '100',
    prizePool: '1000',
    maxParticipants: '16',
    startDate: dayjs().add(1, 'day'),
    endDate: dayjs().add(1, 'day').add(2, 'hour'),
    rules: [
      'No cheating or use of hacks',
      'Respect all players and moderators'
    ],
    terms: '',
    isPublic: true,
    allowSpectators: true,
    requireScreenshots: true,
    autoStart: false,
    prizeDistribution: [
      { position: 1, percentage: 50, amount: 0 },
      { position: 2, percentage: 30, amount: 0 },
      { position: 3, percentage: 20, amount: 0 }
    ],
    // Room Credentials
    roomId: '',
    roomPassword: '',
    manualRelease: false
  });

  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');

  // Fetch tournament data if editing
  const { data: tournament, isLoading: isLoadingTournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id),
    enabled: isEditing && !!id,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting tournament data:', data);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 seconds
      });
      
      const apiPromise = isEditing ? tournamentAPI.update(id, data) : tournamentAPI.create(data);
      
      return Promise.race([apiPromise, timeoutPromise]);
    },
    onSuccess: (response) => {
      console.log('Tournament created/updated successfully:', response);
      
      const tournamentName = formData.title || 'Tournament';
      const action = isEditing ? 'update' : 'create';
      
      // Show success notification
      showTournamentSuccess(action, tournamentName);
      
      // Invalidate and refetch tournament queries immediately
      queryClient.invalidateQueries(['tournaments']);
      queryClient.refetchQueries(['tournaments']);
      
      // Force multiple refreshes to ensure data consistency
      setTimeout(() => {
        queryClient.invalidateQueries(['tournaments']);
        queryClient.refetchQueries(['tournaments']);
      }, 500);
      
      setTimeout(() => {
        queryClient.invalidateQueries(['tournaments']);
        queryClient.refetchQueries(['tournaments']);
      }, 1500);
      
      // Navigate after ensuring data is refreshed
      setTimeout(() => {
        navigate('/tournaments');
      }, 2000);
    },
    onError: (error) => {
      console.error('Tournament creation/update failed:', error);
      console.error('Error response:', error.response?.data);
      
      const action = isEditing ? 'update' : 'create';
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      
      // Show error notification
      showTournamentError(action, errorMessage);
      
      if (error.message === 'Request timeout') {
        console.error('Request timed out after 30 seconds');
      }
    },
  });

  useEffect(() => {
    if (tournament?.data && isEditing) {
      const data = tournament.data;
      setFormData({
        title: data.title || '',
        description: data.description || '',
        game: data.game || '',
        map: data.map || '',
        tournamentType: data.tournamentType || 'squad',
        entryFee: data.entryFee || '',
        prizePool: data.prizePool || '',
        maxParticipants: data.maxParticipants || '',
        startDate: data.startDate ? dayjs(data.startDate) : dayjs(),
        endDate: data.endDate ? dayjs(data.endDate) : dayjs().add(2, 'hour'),
        rules: data.rules || [
          'No cheating or use of hacks',
          'Respect all players and moderators'
        ],
        terms: data.terms || '',
        isPublic: data.isPublic ?? true,
        allowSpectators: data.allowSpectators ?? true,
        requireScreenshots: data.requireScreenshots ?? true,
        autoStart: data.autoStart ?? false,
        prizeDistribution: data.prizeDistribution || [
          { position: 1, percentage: 50, amount: 0 },
          { position: 2, percentage: 30, amount: 0 },
          { position: 3, percentage: 20, amount: 0 }
        ],
        // Room Credentials
        roomId: data.roomDetails?.roomId || '',
        roomPassword: data.roomDetails?.password || '',
        manualRelease: data.roomDetails?.manualRelease || false
      });
      if (data.image) {
        setImagePreview(data.image);
      }
    }
  }, [tournament, isEditing]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePrizeDistributionChange = (index, field, value) => {
    const newDistribution = [...formData.prizeDistribution];
    newDistribution[index] = { ...newDistribution[index], [field]: value };
    
    // Recalculate amounts based on percentages
    if (field === 'percentage') {
      const totalPrizePool = parseFloat(formData.prizePool) || 0;
      newDistribution[index].amount = (totalPrizePool * value) / 100;
    }
    
    setFormData(prev => ({ ...prev, prizeDistribution: newDistribution }));
  };

  const addPrizePosition = () => {
    const newPosition = formData.prizeDistribution.length + 1;
    setFormData(prev => ({
      ...prev,
      prizeDistribution: [
        ...prev.prizeDistribution,
        { position: newPosition, percentage: 0, amount: 0 }
      ]
    }));
  };

  const removePrizePosition = (index) => {
    if (formData.prizeDistribution.length > 1) {
      const newDistribution = formData.prizeDistribution.filter((_, i) => i !== index);
      // Reorder positions
      newDistribution.forEach((item, i) => {
        item.position = i + 1;
      });
      setFormData(prev => ({ ...prev, prizeDistribution: newDistribution }));
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setImageError('');
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Invalid file type. Please upload JPEG, PNG, or WebP images only.');
      setImageFile(null);
      setImagePreview('');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError(`File size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      setImageFile(null);
      setImagePreview('');
      return;
    }

    setImageError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    console.log('Validating form data:', formData);
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      console.log('Title validation failed');
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      console.log('Description validation failed');
    }
    if (!formData.game) {
      newErrors.game = 'Game is required';
      console.log('Game validation failed');
    }
    if (!formData.map) {
      newErrors.map = 'Map is required';
      console.log('Map validation failed');
    }
    const entryFeeValue = Number(formData.entryFee);
    if (formData.entryFee === '' || formData.entryFee === null || Number.isNaN(entryFeeValue) || entryFeeValue < 0) {
      newErrors.entryFee = 'Valid entry fee is required';
      console.log('Entry fee validation failed:', formData.entryFee);
    }
    if (!formData.prizePool || formData.prizePool <= 0) {
      newErrors.prizePool = 'Valid prize pool is required';
      console.log('Prize pool validation failed:', formData.prizePool);
    }
    if (!formData.maxParticipants || formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Minimum 2 participants required';
      console.log('Max participants validation failed:', formData.maxParticipants);
    }
    
    // Validate maxParticipants is one of the allowed values
    const validSizes = [2, 4, 8, 16, 32, 64, 100];
    if (!validSizes.includes(parseInt(formData.maxParticipants))) {
      newErrors.maxParticipants = 'Invalid participant count. Must be one of: 2, 4, 8, 16, 32, 64, 100';
      console.log('Max participants size validation failed:', formData.maxParticipants);
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
      console.log('Start date validation failed');
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
      console.log('End date validation failed');
    }
    
    // Validate dates
    if (formData.startDate && formData.endDate && formData.startDate.isAfter(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
      console.log('Date range validation failed');
    }
    
    if (formData.startDate && formData.startDate.isBefore(dayjs())) {
      newErrors.startDate = 'Start date must be in the future';
      console.log('Start date future validation failed');
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form validation result:', isValid);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted, checking authentication...');
    
    if (!isAuthenticated) {
      console.error('User not authenticated');
      alert('Please log in to create a tournament');
      return;
    }
    
    console.log('User authenticated, validating form...');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, preparing data...');

    // Only include fields that match the backend schema
    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      game: formData.game,
      map: formData.map,
      tournamentType: formData.tournamentType,
      entryFee: parseFloat(formData.entryFee),
      prizePool: parseFloat(formData.prizePool),
      maxParticipants: parseInt(formData.maxParticipants),
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      rules: Array.isArray(formData.rules) ? formData.rules.filter(rule => rule.trim()) : [],
      status: 'upcoming',
      isVisible: true,
      isPublic: true,
      roomDetails: {
        roomId: formData.roomId.trim(),
        password: formData.roomPassword.trim(),
        manualRelease: formData.manualRelease,
        releaseTime: formData.manualRelease ? null : new Date(formData.startDate.valueOf() - 30 * 60 * 1000).toISOString()
      }
    };

    console.log('Submit data prepared:', submitData);

    // Handle image upload if there's a new image
    if (imageFile) {
      try {
        console.log('Uploading tournament image...');
        const formDataImage = new FormData();
        formDataImage.append('file', imageFile);
        formDataImage.append('type', 'tournament');
        
        // Upload image and get URL
        const uploadResponse = await mediaAPI.upload(imageFile, 'tournament');
        if (uploadResponse.data.success) {
          submitData.poster = uploadResponse.data.url;
          submitData.posterUrl = uploadResponse.data.url;
          console.log('Image uploaded successfully:', uploadResponse.data.url);
        }
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        // Continue with tournament creation even if image upload fails
      }
    }
    
    // Add image preview URL if available
    if (imagePreview && !submitData.poster) {
      submitData.poster = imagePreview;
      submitData.posterUrl = imagePreview;
    }

    console.log('Calling mutation.mutate...');
    mutation.mutate(submitData);
  };

  const games = ['PUBG', 'BGMI', 'Free Fire', 'COD', 'Valorant', 'CS:GO', 'Others'];
  const maps = {
    'PUBG': ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
    'BGMI': ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
    'Free Fire': ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
    'COD': ['Verdansk', 'Rebirth Island', 'Caldera', 'Ashika Island'],
    'Valorant': ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Pearl'],
    'CS:GO': ['Dust 2', 'Mirage', 'Inferno', 'Overpass', 'Nuke', 'Ancient', 'Anubis'],
    'Others': ['Custom Map']
  };

  console.log('TournamentForm render:', { isEditing, isLoadingTournament, id });

  if (isEditing && isLoadingTournament) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            {isEditing ? 'Edit Tournament' : 'Create Tournament'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isEditing ? 'Update tournament details and settings' : 'Set up a new tournament with all required information'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/tournaments')}
        >
          Cancel
        </Button>
      </Box>

      {mutation.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            {mutation.error.response?.data?.message || 'Failed to save tournament'}
          </Typography>
          {mutation.error.response?.data?.errors && (
            <Box sx={{ mt: 1 }}>
              {mutation.error.response.data.errors.map((error, index) => (
                <Typography key={index} variant="body2" color="error">
                  • {error.msg}
                </Typography>
              ))}
            </Box>
          )}
        </Alert>
      )}

      {mutation.isLoading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            Creating tournament... Please wait.
          </Typography>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Basic Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
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
                    <FormControl fullWidth error={!!errors.map} required>
                      <InputLabel>Map</InputLabel>
                      <Select
                        value={formData.map}
                        label="Map"
                        onChange={(e) => handleChange('map', e.target.value)}
                        disabled={!formData.game}
                      >
                        {formData.game && maps[formData.game]?.map((map) => (
                          <MenuItem key={map} value={map}>{map}</MenuItem>
                        ))}
                      </Select>
                      {errors.map && <FormHelperText>{errors.map}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Tournament Type</InputLabel>
                      <Select
                        value={formData.tournamentType}
                        label="Tournament Type"
                        onChange={(e) => handleChange('tournamentType', e.target.value)}
                      >
                        <MenuItem value="solo">Solo</MenuItem>
                        <MenuItem value="duo">Duo</MenuItem>
                        <MenuItem value="squad">Squad</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Entry Fee (₹)"
                      type="number"
                      value={formData.entryFee}
                      onChange={(e) => handleChange('entryFee', e.target.value)}
                      error={!!errors.entryFee}
                      helperText={errors.entryFee || '₹0 = Free Tournament'}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Schedule
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={formData.startDate}
                      onChange={(value) => handleChange('startDate', value)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.startDate,
                          helperText: errors.startDate,
                          required: true
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={formData.endDate}
                      onChange={(value) => handleChange('endDate', value)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.endDate,
                          helperText: errors.endDate,
                          required: true
                        }
                      }}
                    />
                  </Grid>
                  

                </Grid>
              </CardContent>
            </Card>

            {/* Prize Distribution */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Prize Distribution
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={addPrizePosition}
                    size="small"
                  >
                    Add Position
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Total Prize Pool (₹)"
                      type="number"
                      value={formData.prizePool}
                      onChange={(e) => handleChange('prizePool', e.target.value)}
                      error={!!errors.prizePool}
                      helperText={errors.prizePool}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>
                  
                  {formData.prizeDistribution.map((prize, index) => (
                    <Grid item xs={12} key={index}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Chip label={`${prize.position}${prize.position === 1 ? 'st' : prize.position === 2 ? 'nd' : prize.position === 3 ? 'rd' : 'th'}`} />
                        <TextField
                          label="Percentage"
                          type="number"
                          value={prize.percentage}
                          onChange={(e) => handlePrizeDistributionChange(index, 'percentage', parseFloat(e.target.value))}
                          sx={{ width: 120 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                        />
                        <TextField
                          label="Amount"
                          type="number"
                          value={prize.amount.toFixed(0)}
                          disabled
                          sx={{ width: 150 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                        />
                        {formData.prizeDistribution.length > 1 && (
                          <IconButton
                            onClick={() => removePrizePosition(index)}
                            color="error"
                            size="small"
                          >
                            <Remove />
                          </IconButton>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Participants */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Participants
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Participants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange('maxParticipants', e.target.value)}
                      error={!!errors.maxParticipants}
                      helperText={errors.maxParticipants}
                      required
                    />
                  </Grid>
                  

                </Grid>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPublic}
                      onChange={(e) => handleChange('isPublic', e.target.checked)}
                    />
                  }
                  label="Public Tournament"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowSpectators}
                      onChange={(e) => handleChange('allowSpectators', e.target.checked)}
                    />
                  }
                  label="Allow Spectators"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.requireScreenshots}
                      onChange={(e) => handleChange('requireScreenshots', e.target.checked)}
                    />
                  }
                  label="Require Screenshots"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.autoStart}
                      onChange={(e) => handleChange('autoStart', e.target.checked)}
                    />
                  }
                  label="Auto Start"
                />
              </CardContent>
            </Card>

            {/* Room Credentials */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Room Credentials
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Room ID"
                      value={formData.roomId}
                      onChange={(e) => handleChange('roomId', e.target.value)}
                      placeholder="Enter room ID"
                      helperText="Room ID for tournament match"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Room Password"
                      value={formData.roomPassword}
                      onChange={(e) => handleChange('roomPassword', e.target.value)}
                      placeholder="Enter room password"
                      helperText="Password for tournament room"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.manualRelease}
                          onChange={(e) => handleChange('manualRelease', e.target.checked)}
                        />
                      }
                      label="Manual Release Override"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      When enabled, credentials won't auto-release 30 minutes before start
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Tournament Image */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Tournament Image
                </Typography>
                
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="tournament-image"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="tournament-image">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    Upload Image
                  </Button>
                </label>
                
                {imagePreview && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img
                      src={imagePreview}
                      alt="Tournament"
                      style={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'cover',
                        borderRadius: 8
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Rules and Terms */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Rules & Terms
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tournament Rules"
                      value={Array.isArray(formData.rules) ? formData.rules.join('\n') : formData.rules}
                      onChange={(e) => handleChange('rules', e.target.value.split('\n').filter(rule => rule.trim()))}
                      multiline
                      rows={6}
                      placeholder="Enter tournament rules (one per line)..."
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Terms & Conditions"
                      value={formData.terms}
                      onChange={(e) => handleChange('terms', e.target.value)}
                      multiline
                      rows={6}
                      placeholder="Enter terms and conditions..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/tournaments')}
          >
            Cancel
          </Button>
          
          {/* Test API Connection */}
          <Button
            variant="outlined"
            color="secondary"
            onClick={async () => {
              try {
                console.log('Testing API connection...');
                const response = await tournamentAPI.getAll();
                console.log('API test successful:', response);
                alert('API connection working!');
              } catch (error) {
                console.error('API test failed:', error);
                alert('API connection failed: ' + error.message);
              }
            }}
          >
            Test API
          </Button>
          
          {/* Test Form Data */}
          <Button
            variant="outlined"
            color="info"
            onClick={() => {
              console.log('Current form data:', formData);
              console.log('Form errors:', errors);
              console.log('Is authenticated:', isAuthenticated);
              console.log('Mutation loading:', mutation.isLoading);
              alert('Check console for form data');
            }}
          >
            Debug Form
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={mutation.isLoading}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              },
            }}
          >
            {mutation.isLoading ? 'Saving...' : (isEditing ? 'Update Tournament' : 'Create Tournament')}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default TournamentForm; 