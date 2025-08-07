import React from 'react';
import {
  Button,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  ViewCarousel as SlotIcon,
  Login as JoinIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useTournamentParticipation } from '../../hooks/useTournamentParticipation';

const TournamentJoinButton = ({
  tournament,
  onJoin,
  isLoading: externalLoading,
  openSlotModal
}) => {
  const {
    loading,
    hasJoined,
    participationDetails,
    paymentStatus,
    hasPendingPayment,
    joinButtonState,
    canJoin
  } = useTournamentParticipation(tournament?._id);


  if (!tournament) return null;

  const isLoading = loading || externalLoading;
  const buttonState = joinButtonState;

  if (isLoading) {
    return <CircularProgress size={24} />;
  }

  // User has already joined
  if (hasJoined) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Chip 
          label={paymentStatus === 'completed' ? "Already Registered" : "Payment Pending"}
          color={paymentStatus === 'completed' ? "success" : "warning"}
          size="small"
          icon={paymentStatus === 'completed' ? <CheckIcon /> : <WarningIcon />}
          sx={{ 
            borderRadius: 1,
            cursor: 'default',
            '&:hover': {
              backgroundColor: paymentStatus === 'completed' ? 'success.main' : 'warning.main'
            }
          }}
          disabled
        />
        {paymentStatus === 'completed' && openSlotModal && (
          <Tooltip title="Edit Slot Position">
            <IconButton
              color="primary"
              size="small"
              onClick={openSlotModal}
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              <SlotIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Check if user has pending payments that prevent joining
  if (hasPendingPayment) {
    return (
      <Button
        startIcon={<PaymentIcon />}
        variant="outlined"
        color="warning"
        disabled
        size="small"
      >
        Payment Pending
      </Button>
    );
  }

  // Tournament is full
  if (tournament.currentParticipants >= tournament.maxParticipants) {
    return (
      <Button
        startIcon={<BlockIcon />}
        variant="outlined"
        color="error"
        disabled
        size="small"
      >
        Tournament Full
      </Button>
    );
  }

  // Tournament is closed/completed
  if (['completed', 'cancelled'].includes(tournament.status)) {
    return (
      <Button
        startIcon={<BlockIcon />}
        variant="outlined"
        color="error"
        disabled
        size="small"
      >
        Registration Closed
      </Button>
    );
  }

  // Can join
  return (
    <Button
      onClick={onJoin}
      disabled={isLoading}
      variant="contained"
      color="primary"
      startIcon={isLoading ? <CircularProgress size={20} /> : <JoinIcon />}
      size="small"
    >
      {isLoading ? 'Processing...' : 'Join Now'}
    </Button>
  );
};

export default TournamentJoinButton;
