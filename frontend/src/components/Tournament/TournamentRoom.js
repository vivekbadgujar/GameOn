import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { RoomLobby } from './Room';
import { useSnackbar } from 'notistack';

const TournamentRoom = () => {
  const router = useRouter();
  const tournamentId = router.query.tournamentId;
  const { enqueueSnackbar } = useSnackbar();
  const [savedSlot, setSavedSlot] = useState(null);
  
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

  // Get saved slot number from localStorage if available (client-only)
  useEffect(() => {
    if (!tournamentId) return;
    try {
      setSavedSlot(localStorage.getItem(`tournament_${tournamentId}_slot`));
    } catch {
      setSavedSlot(null);
    }
  }, [tournamentId]);
  
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
