import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Paper
} from '@mui/material';
import {
  Payment,
  Person,
  Group,
  CheckCircle,
  Error,
  Info,
  AttachMoney,
  Schedule,
  People
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { initiateCashfreePayment } from '../../utils/cashfree';

const TournamentJoinFlow = ({ tournament, open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [joinType, setJoinType] = useState('solo'); // 'solo' or 'squad'
  const [squadMembers, setSquadMembers] = useState(['', '', '', '']);
  const [gameProfile, setGameProfile] = useState({
    bgmiName: user?.gameProfile?.bgmiName || '',
    bgmiId: user?.gameProfile?.bgmiId || ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const steps = ['Join Type', 'Game Profile', 'Payment', 'Confirmation'];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setJoinType('solo');
      setSquadMembers(['', '', '', '']);
      setGameProfile({
        bgmiName: user?.gameProfile?.bgmiName || '',
        bgmiId: user?.gameProfile?.bgmiId || ''
      });
      setAgreedToTerms(false);
      setPaymentData(null);
    }
  }, [open, user]);

  // Handle next step
  const handleNext = () => {
    if (activeStep === 0 && !validateJoinType()) return;
    if (activeStep === 1 && !validateGameProfile()) return;
    if (activeStep === 2 && !paymentData) {
      handlePayment();
      return;
    }
    
    if (activeStep === steps.length - 1) {
      handleJoinTournament();
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Validate join type
  const validateJoinType = () => {
    if (joinType === 'squad') {
      const validMembers = squadMembers.filter(member => member.trim() !== '');
      if (validMembers.length !== 4) {
        showError('Please enter all 4 squad member usernames');
        return false;
      }
    }
    return true;
  };

  // Validate game profile
  const validateGameProfile = () => {
    if (!gameProfile.bgmiName.trim()) {
      showError('Please enter your BGMI username');
      return false;
    }
    if (!gameProfile.bgmiId.trim()) {
      showError('Please enter your BGMI player ID');
      return false;
    }
    if (!agreedToTerms) {
      showError('Please agree to the tournament terms and conditions');
      return false;
    }
    return true;
  };

  // Handle payment
  const handlePayment = async () => {
    try {
      setLoading(true);

      // Prepare tournament payment data
      const tournamentData = {
        tournamentId: tournament._id,
        joinType,
        squadMembers: joinType === 'squad' ? squadMembers.filter(m => m.trim()) : undefined,
        gameProfile
      };

      // Initiate Cashfree payment
      const paymentResult = await initiateCashfreePayment(tournamentData);

      if (paymentResult.success) {
        setPaymentData(paymentResult.data);
        setActiveStep(activeStep + 1);
        showSuccess('Payment successful! You have been added to the tournament.');
        
        // Check if backend provided redirect URL for room lobby
        if (paymentResult.data.redirectTo) {
          setTimeout(() => {
            window.location.href = paymentResult.data.redirectTo;
          }, 2000);
        }
      } else {
        throw new Error(paymentResult.message || 'Payment failed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      
      // Enhanced error handling for different failure scenarios
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance. Please add funds to your wallet.';
        } else if (error.message.includes('cancelled') || error.message.includes('abort')) {
          errorMessage = 'Payment was cancelled by user.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Payment timed out. Please try again.';
        } else if (error.message.includes('verification')) {
          errorMessage = 'Payment verification failed. If amount was deducted, it will be refunded within 24 hours.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showError(errorMessage);
      
      // Log error for debugging (production-ready logging)
      if (process.env.NODE_ENV === 'production') {
        // In production, you might want to send this to a logging service
        console.error('Tournament payment error:', {
          error: error.message,
          tournamentId: tournament._id,
          userId: user?.id,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle tournament join completion
  const handleJoinTournament = () => {
    onSuccess?.(paymentData);
    onClose();
    showSuccess('Successfully joined tournament! Redirecting to room lobby...');
    
    // Redirect to room lobby
    setTimeout(() => {
      window.location.href = `/tournament/${tournament._id}/room-lobby`;
    }, 1500);
  };

  // Calculate total entry fee
  const getTotalEntryFee = () => {
    return joinType === 'squad' ? tournament.entryFee * 4 : tournament.entryFee;
  };

  // Get available slots
  const getAvailableSlots = () => {
    const required = joinType === 'squad' ? 4 : 1;
    const available = tournament.maxParticipants - tournament.currentParticipants;
    return Math.floor(available / required) * required;
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              How would you like to join?
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: joinType === 'solo' ? '2px solid' : '1px solid',
                    borderColor: joinType === 'solo' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setJoinType('solo')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Person sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>Solo Entry</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Join individually and get matched with other players
                    </Typography>
                    <Chip 
                      label={`₹${tournament.entryFee}`} 
                      color="primary" 
                      sx={{ mt: 1 }} 
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: joinType === 'squad' ? '2px solid' : '1px solid',
                    borderColor: joinType === 'squad' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setJoinType('squad')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Group sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>Squad Entry</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Join with your complete 4-member squad
                    </Typography>
                    <Chip 
                      label={`₹${tournament.entryFee * 4}`} 
                      color="primary" 
                      sx={{ mt: 1 }} 
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {joinType === 'squad' && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Enter Squad Member Usernames:
                </Typography>
                <Grid container spacing={2}>
                  {squadMembers.map((member, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <TextField
                        fullWidth
                        label={`Player ${index + 1} Username`}
                        value={member}
                        onChange={(e) => {
                          const newMembers = [...squadMembers];
                          newMembers[index] = e.target.value;
                          setSquadMembers(newMembers);
                        }}
                        placeholder="Enter username"
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Available slots: {getAvailableSlots()} | 
                Required slots: {joinType === 'squad' ? 4 : 1}
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Update Your Game Profile
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="BGMI Username (IGN)"
                  value={gameProfile.bgmiName}
                  onChange={(e) => setGameProfile({ ...gameProfile, bgmiName: e.target.value })}
                  placeholder="Enter your in-game name"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="BGMI Player ID"
                  value={gameProfile.bgmiId}
                  onChange={(e) => setGameProfile({ ...gameProfile, bgmiId: e.target.value })}
                  placeholder="Enter your BGMI player ID"
                  required
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
              }
              label="I agree to the tournament terms and conditions"
              sx={{ mt: 2 }}
            />

            <Alert severity="warning" sx={{ mt: 2 }}>
              Make sure your game profile information is correct. 
              This will be used for tournament organization and room assignments.
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Summary
            </Typography>
            
            <Paper sx={{ p: 3, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Tournament:</Typography>
                    <Typography fontWeight="bold">{tournament.title}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Join Type:</Typography>
                    <Typography fontWeight="bold">
                      {joinType === 'squad' ? 'Squad (4 players)' : 'Solo'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Entry Fee:</Typography>
                    <Typography fontWeight="bold">₹{tournament.entryFee}</Typography>
                  </Box>
                </Grid>
                
                {joinType === 'squad' && (
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Players:</Typography>
                      <Typography fontWeight="bold">4</Typography>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">Total Amount:</Typography>
                    <Typography variant="h6" color="primary">
                      ₹{getTotalEntryFee()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="info" sx={{ mt: 2 }}>
              Click "Proceed to Payment" to open the secure Cashfree payment gateway. 
              Your tournament slot will be confirmed immediately after successful payment.
            </Alert>

            <Alert severity="success" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Secure Payment:</strong> All payments are processed through Cashfree's secure gateway. 
                We support UPI, Net Banking, Credit/Debit Cards, and Digital Wallets.
              </Typography>
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box textAlign="center">
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Payment Successful!
            </Typography>
            <Typography variant="body1" gutterBottom>
              You have successfully joined the tournament.
            </Typography>
            
            {paymentData && (
              <Paper sx={{ p: 2, mt: 2, textAlign: 'left' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Tournament Details:
                </Typography>
                <Typography variant="body2">
                  Slot Number: #{paymentData.slotNumber || 'Assigned'}
                </Typography>
                <Typography variant="body2">
                  Status: Confirmed
                </Typography>
                <Typography variant="body2">
                  Payment ID: {paymentData.paymentId || paymentData.orderId}
                </Typography>
                {paymentData.transactionId && (
                  <Typography variant="body2">
                    Transaction ID: {paymentData.transactionId}
                  </Typography>
                )}
              </Paper>
            )}

            <Alert severity="success" sx={{ mt: 2 }}>
              You will be redirected to the tournament room lobby where you can see other players 
              and change your slot position if needed. The tournament details have been sent to your registered email.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: 500 } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Payment color="primary" />
          Join Tournament - {tournament?.title}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={loading || (activeStep === 0 && getAvailableSlots() < (joinType === 'squad' ? 4 : 1))}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {activeStep === steps.length - 1 
            ? 'Join Tournament' 
            : activeStep === 2 
              ? 'Proceed to Payment' 
              : 'Next'
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TournamentJoinFlow;