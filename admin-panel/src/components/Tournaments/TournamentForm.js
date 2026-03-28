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

  const getAssetUrl = (filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('data:')) return filePath;

    // Scrub legacy localhost paths to production
    let cleanPath = filePath.replace(/https?:\/\/localhost:\d+/g, 'https://api.gameonesport.xyz');

    // Already an absolute URL — return as-is (after localhost scrub)
    if (cleanPath.startsWith('http')) return cleanPath;

    // Build base URL from API env var — strip trailing /api path (not the domain!)
    const apiUrl = (process.env.REACT_APP_API_URL || 'https://api.gameonesport.xyz/api').replace(/\/$/, '');
    const baseUrl = apiUrl.replace(/\/api$/, '');

    return baseUrl + (cleanPath.startsWith('/') ? '' : '/') + cleanPath;
  };

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
    upiId: '',
    upiQrImage: '',
    poster: '',
    posterUrl: '',
    prizeDistribution: [
      { position: 1, percentage: 50, amount: 0 },
      { position: 2, percentage: 30, amount: 0 },
      { position: 3, percentage: 20, amount: 0 }
    ],
    roomId: '',
    roomPassword: '',
    manualRelease: false
  });

  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const [upiQrFile, setUpiQrFile] = useState(null);
  const [upiQrPreview, setUpiQrPreview] = useState('');
  const [upiQrError, setUpiQrError] = useState('');

  // Fetch tournament data if editing
  const { data: tournament, isLoading: isLoadingTournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id),
    enabled: isEditing && !!id,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting tournament data:', data);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });
      const apiPromise = isEditing ? tournamentAPI.update(id, data) : tournamentAPI.create(data);
      return Promise.race([apiPromise, timeoutPromise]);
    },
    onSuccess: (response) => {
      console.log('Tournament created/updated successfully:', response);
      const tournamentName = formData.title || 'Tournament';
      const action = isEditing ? 'update' : 'create';
      showTournamentSuccess(action, tournamentName);
      queryClient.invalidateQueries(['tournaments']);
      queryClient.refetchQueries(['tournaments']);
      setTimeout(() => {
        queryClient.invalidateQueries(['tournaments']);
        queryClient.refetchQueries(['tournaments']);
      }, 500);
      setTimeout(() => {
        queryClient.invalidateQueries(['tournaments']);
        queryClient.refetchQueries(['tournaments']);
      }, 1500);
      setTimeout(() => {
        navigate('/tournaments');
      }, 2000);
    },
    onError: (error) => {
      console.error('Tournament creation/update failed:', error);
      const action = isEditing ? 'update' : 'create';
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      showTournamentError(action, errorMessage);
      if (error.message === 'Request timeout') {
        console.error('Request timed out after 30 seconds');
      }
    },
  });

  // Populate form when editing an existing tournament
  useEffect(() => {
    if (tournament?.data && isEditing) {
      const data = tournament.data?.data || tournament.data;
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
        upiId: data.upiId || '',
        upiQrImage: data.upiQrImage || '',
        poster: data.poster || data.posterUrl || '',
        posterUrl: data.posterUrl || data.poster || '',
        prizeDistribution: data.prizeDistribution || [
          { position: 1, percentage: 50, amount: 0 },
          { position: 2, percentage: 30, amount: 0 },
          { position: 3, percentage: 20, amount: 0 }
        ],
        roomId: data.roomDetails?.roomId || '',
        roomPassword: data.roomDetails?.password || '',
        manualRelease: data.roomDetails?.manualRelease || false
      });

      // Load poster/thumbnail preview from existing DB data
      const existingPoster = data.poster || data.posterUrl || '';
      if (existingPoster) {
        setImagePreview(getAssetUrl(existingPoster));
      }

      // Load UPI QR preview from existing DB data
      if (data.upiQrImage) {
        setUpiQrPreview(getAssetUrl(data.upiQrImage));
      }
    }
  }, [tournament, isEditing]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePrizeDistributionChange = (index, field, value) => {
    const newDistribution = [...formData.prizeDistribution];
    newDistribution[index] = { ...newDistribution[index], [field]: value };
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
      newDistribution.forEach((item, i) => {
        item.position = i + 1;
      });
      setFormData(prev => ({ ...prev, prizeDistribution: newDistribution }));
    }
  };

  const validateImageFile = (file) => {
    if (!file) return '';
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload JPEG, PNG, or WebP images only.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`;
    }
    return '';
  };

  const loadPreview = (file, onLoad) => {
    const reader = new FileReader();
    reader.onload = (e) => onLoad(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setImageError('');
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      setImageFile(null);
      setImagePreview('');
      return;
    }
    setImageError('');
    setImageFile(file);
    loadPreview(file, setImagePreview);
  };

  const handleUpiQrChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setUpiQrError('');
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      setUpiQrError(validationError);
      setUpiQrFile(null);
      setUpiQrPreview('');
      return;
    }
    setUpiQrError('');
    setUpiQrFile(file);
    loadPreview(file, setUpiQrPreview);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.game) newErrors.game = 'Game is required';
    if (!formData.map) newErrors.map = 'Map is required';

    const entryFeeValue = Number(formData.entryFee);
    if (formData.entryFee === '' || formData.entryFee === null || Number.isNaN(entryFeeValue) || entryFeeValue < 0) {
      newErrors.entryFee = 'Valid entry fee is required';
    }
    if (!formData.prizePool || formData.prizePool <= 0) {
      newErrors.prizePool = 'Valid prize pool is required';
    }
    if (!formData.maxParticipants || formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Minimum 2 participants required';
    }

    const validSizes = [2, 4, 8, 16, 32, 64, 100];
    if (!validSizes.includes(parseInt(formData.maxParticipants))) {
      newErrors.maxParticipants = 'Invalid participant count. Must be one of: 2, 4, 8, 16, 32, 64, 100';
    }

    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';

    if (formData.startDate && formData.endDate && formData.startDate.isAfter(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.startDate && formData.startDate.isBefore(dayjs())) {
      newErrors.startDate = 'Start date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert('Please log in to create a tournament');
      return;
    }

    if (!validateForm()) return;

    // Build submit payload — preserve existing poster/upiQrImage when no new file uploaded
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
      upiId: formData.upiId.trim(),
      upiQrImage: formData.upiQrImage || '',
      poster: formData.poster || '',
      posterUrl: formData.posterUrl || '',
      roomDetails: {
        roomId: formData.roomId.trim(),
        password: formData.roomPassword.trim(),
        manualRelease: formData.manualRelease,
        releaseTime: formData.manualRelease ? null : new Date(formData.startDate.valueOf() - 30 * 60 * 1000).toISOString()
      }
    };

    // Handle poster/thumbnail upload if user selected a new image
    if (imageFile) {
      try {
        const uploadResponse = await mediaAPI.upload(imageFile, { type: 'poster' });
        if (uploadResponse.data.success) {
          submitData.poster = uploadResponse.data.data?.url || '';
          submitData.posterUrl = uploadResponse.data.data?.url || '';
        }
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        // Continue — keep existing poster from formData
      }
    }

    // Handle UPI QR upload if user selected a new QR image
    if (upiQrFile) {
      try {
        const uploadResponse = await tournamentAPI.uploadPaymentQr(upiQrFile);
        if (uploadResponse.data?.success) {
          submitData.upiQrImage = uploadResponse.data.data?.url || '';
        }
      } catch (uploadError) {
        console.error('UPI QR upload failed:', uploadError);
        setUpiQrError(uploadError.response?.data?.message || 'Failed to upload UPI QR image');
        return;
      }
    }

    console.log('Calling mutation.mutate with data:', submitData);
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

            {/* Payment Settings */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Payment Settings
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="UPI ID"
                      value={formData.upiId}
                      onChange={(e) => handleChange('upiId', e.target.value)}
                      placeholder="gameon@upi"
                      helperText="Shown on the manual payment page"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="upi-qr-image"
                      type="file"
                      onChange={handleUpiQrChange}
                    />
                    <label htmlFor="upi-qr-image">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<Payment />}
                        fullWidth
                      >
                        {upiQrPreview ? 'Change UPI QR Code' : 'Upload UPI QR Code'}
                      </Button>
                    </label>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Stored in uploads/payment_qr and shown to players during join payment.
                    </Typography>
                    {upiQrError && (
                      <FormHelperText error sx={{ mt: 1 }}>
                        {upiQrError}
                      </FormHelperText>
                    )}
                  </Grid>

                  {upiQrPreview && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 1, textAlign: 'center' }}>
                        <img
                          src={upiQrPreview}
                          alt="UPI QR"
                          style={{
                            width: '100%',
                            maxHeight: 240,
                            objectFit: 'contain',
                            borderRadius: 8,
                            background: '#111827',
                            padding: 12
                          }}
                        />
                      </Box>
                    </Grid>
                  )}
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
                    {imagePreview ? 'Change Image' : 'Upload Image'}
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
