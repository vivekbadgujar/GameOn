import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import TournamentJoinButton from './TournamentJoinButton';
import SlotEditModal from './SlotEditModal';
import { useTournamentJoin } from '../hooks/useTournamentJoin';

const TournamentCard = ({ 
  tournament, 
  onJoinSuccess, 
  userParticipation, 
  user,
  showSuccess,
  showError,
  showInfo 
}) => {
  const [slotEditOpen, setSlotEditOpen] = useState(false);

  const handleJoinSuccess = () => {
    setSlotEditOpen(true);
    if (onJoinSuccess) onJoinSuccess();
  };

  if (!tournament) return null;

  return (
    <Card 
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {tournament.name}
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography color="textSecondary" variant="body2">
              Schedule
            </Typography>
            <Typography variant="body2">
              {format(new Date(tournament.startTime), 'MMM dd, yyyy hh:mm a')}
            </Typography>
          </Box>

          <Box>
            <Typography color="textSecondary" variant="body2">
              Entry Fee
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {tournament.entryFee ? `₹${tournament.entryFee.toLocaleString('en-IN')}` : 'Free'}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={`${tournament.currentParticipants}/${tournament.maxParticipants}`}
              size="small"
              color={tournament.currentParticipants >= tournament.maxParticipants ? 'error' : 'primary'}
            />
            <Chip 
              label={tournament.status.toUpperCase()}
              size="small"
              color={tournament.status === 'open' ? 'success' : 'default'}
            />
          </Stack>
        </Stack>
      </CardContent>

      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <TournamentJoinButton
          tournament={tournament}
          onJoin={handleJoin}
          isLoading={isLoading}
          userParticipation={userParticipation}
          openSlotModal={() => setSlotEditOpen(true)}
        />
        
        {/* Show Edit Slot button if user has joined and tournament is active */}
        {userParticipation && (tournament.status === 'upcoming' || tournament.status === 'live') && (
          <Tooltip title="Edit Slot Position">
            <IconButton 
              color="primary" 
              onClick={() => setSlotEditOpen(true)}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
      
      {/* Slot Edit Modal */}
      <SlotEditModal
        open={slotEditOpen}
        onClose={() => setSlotEditOpen(false)}
        tournamentId={tournament._id}
        user={user}
        showSuccess={showSuccess}
        showError={showError}
        showInfo={showInfo}
      />
    </Card>
  );
};

export default TournamentCard;
