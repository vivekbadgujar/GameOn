import React from 'react';
import { useParams } from 'react-router-dom';
import { RoomLobby } from './Room';
import { useSnackbar } from 'notistack';

const TournamentRoom = () => {
  const { tournamentId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  
  // You can fetch user data from your auth context/store
  const user = {
    // Add your user data here
  };

  const showSuccess = (message) => {
    enqueueSnackbar(message, { variant: 'success' });
  };

  const showError = (message) => {
    enqueueSnackbar(message, { variant: 'error' });
  };

  const showInfo = (message) => {
    enqueueSnackbar(message, { variant: 'info' });
  };

  // Get saved slot number from localStorage if available
  const savedSlot = localStorage.getItem(`tournament_${tournamentId}_slot`);
  
  return (
    <RoomLobby
      tournamentId={tournamentId}
      user={user}
      showSuccess={showSuccess}
      showError={showError}
      showInfo={showInfo}
      isEditMode={!savedSlot} // If no saved slot, this is an edit mode access
    />
  );
};

export default TournamentRoom;
