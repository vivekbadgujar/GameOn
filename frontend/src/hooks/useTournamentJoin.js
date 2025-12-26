import axios from 'axios';
import { useCallback, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

export const useTournamentJoin = (tournament, onSuccess) => {
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { walletBalance, deductFromWallet, fetchWalletBalance } = useAuth();

  const handleJoin = useCallback(async () => {
    if (!tournament?._id) return;

    setIsLoading(true);
    try {
      // First verify if user can join
      const verifyResponse = await axios.post(`/api/tournaments/${tournament._id}/verify-join`);
      
      // Check if user has already joined
      if (verifyResponse.data.alreadyJoined) {
        enqueueSnackbar(verifyResponse.data.message || 'You have already joined this tournament', { variant: 'info' });
        
        // Redirect to room lobby if redirectTo is provided
        if (verifyResponse.data.redirectTo) {
          window.location.href = verifyResponse.data.redirectTo;
        }
        return;
      }
      
      if (!verifyResponse.data.canJoin) {
        throw new Error(verifyResponse.data.message || 'Cannot join tournament');
      }

      // Check wallet balance and process payment if required
      if (tournament.entryFee > 0) {
        // Check if user has sufficient balance
        if (walletBalance < tournament.entryFee) {
          throw new Error(`Insufficient wallet balance. You need ₹${tournament.entryFee.toLocaleString('en-IN')} but have ₹${walletBalance.toLocaleString('en-IN')}`);
        }

        // Deduct from wallet immediately for better UX
        deductFromWallet(tournament.entryFee);

        try {
          // Process wallet deduction on backend
          const walletResponse = await axios.post(`/api/wallet/deduct`, {
            amount: tournament.entryFee,
            description: `Tournament entry fee - ${tournament.title}`,
            tournamentId: tournament._id
          });

          if (!walletResponse.data.success) {
            // Refund the amount if wallet deduction failed
            deductFromWallet(-tournament.entryFee);
            throw new Error(walletResponse.data.message || 'Wallet deduction failed');
          }

          // Update wallet balance with the actual balance from backend
          if (walletResponse.data.newBalance !== undefined) {
            deductFromWallet(walletBalance - walletResponse.data.newBalance);
          }

        } catch (walletError) {
          // Refund the amount if wallet deduction failed
          deductFromWallet(-tournament.entryFee);
          throw new Error(walletError.response?.data?.message || 'Payment processing failed');
        }
      }

      // Join tournament
      const joinResponse = await axios.post(`/api/tournaments/${tournament._id}/join`);

      if (joinResponse.data.success) {
        // Check if user has already joined
        if (joinResponse.data.alreadyJoined) {
          enqueueSnackbar('You have already joined this tournament', { variant: 'info' });
          
          // If there's a redirectTo URL, navigate to it
          if (joinResponse.data.redirectTo) {
            setTimeout(() => {
              window.location.href = joinResponse.data.redirectTo;
            }, 1500);
          }
        } else {
          enqueueSnackbar('Successfully joined tournament! Redirecting to room lobby...', { variant: 'success' });
          
          // Redirect to room lobby using the URL provided by backend
          const roomLobbyUrl = joinResponse.data.data?.roomLobbyUrl || `/tournaments/${tournament._id}/room-lobby`;
          setTimeout(() => {
            window.location.href = roomLobbyUrl;
          }, 2000);
        }
        
        // Refresh wallet balance to ensure accuracy
        fetchWalletBalance();
        
        if (onSuccess) onSuccess(joinResponse.data);
      }

    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to join tournament';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [tournament, enqueueSnackbar, onSuccess, walletBalance, deductFromWallet, fetchWalletBalance]);

  return {
    handleJoin,
    isLoading
  };
};
