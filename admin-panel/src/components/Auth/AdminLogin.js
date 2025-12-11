import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
  Container
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  Email
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', { 
        email: formData.email, 
        apiUrl: process.env.REACT_APP_API_URL 
      });
      
      const result = await login(formData);
      console.log('Login result:', result);
      
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        // Redirect after a short delay so the success state is visible
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        console.error('Login failed:', result);
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // More detailed error messages
      if (error.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (error.response?.status === 423) {
        setError('Account is temporarily locked. Please try again later.');
      } else if (error.response?.status === 403) {
        setError('Account not verified. Please contact administrator.');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4
        }}
      >
        <Paper
          elevation={24}
          sx={{
            width: '100%',
            maxWidth: 450,
            borderRadius: 3,
            overflow: 'hidden',
            background: 'rgba(20, 17, 17, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              textAlign: 'center',
              py: 4,
              px: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Logo 
              size="large" 
              showText={true} 
              variant="white"
              sx={{ mb: 2 }}
              textSx={{ color: 'white' }}
            />
            <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
              Admin Panel
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Secure access to GameOn Platform administration
            </Typography>
          </Box>

          {/* Login Form */}
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-input': {
                    color: '#000000',
                    fontSize: '1rem',
                    '&::placeholder': {
                      color: '#666666',
                      opacity: 1,
                    },
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#000000',
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-input': {
                    color: '#000000',
                    fontSize: '1rem',
                    '&::placeholder': {
                      color: '#666666',
                      opacity: 1,
                    },
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#000000',
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                  },
                  '&:disabled': {
                    background: 'rgba(99, 102, 241, 0.5)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ mt: 2 }}
              >
                Secure admin access only. Contact system administrator for credentials.
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin; 