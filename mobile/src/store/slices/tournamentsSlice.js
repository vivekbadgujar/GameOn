/**
 * Tournaments Slice
 * Manages tournament data and state
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = 'http://localhost:5000';

// Async thunks
export const fetchTournaments = createAsyncThunk(
  'tournaments/fetchTournaments',
  async ({ status = 'upcoming', limit = 10 } = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(
        `${API_BASE_URL}/api/tournaments?status=${status}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch tournaments');
      }

      return data.tournaments;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchTournamentDetails = createAsyncThunk(
  'tournaments/fetchTournamentDetails',
  async (tournamentId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch tournament details');
      }

      return data.tournament;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const joinTournament = createAsyncThunk(
  'tournaments/joinTournament',
  async ({ tournamentId, teamData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to join tournament');
      }

      return { tournamentId, participantData: data.participant };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchMyTournaments = createAsyncThunk(
  'tournaments/fetchMyTournaments',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/tournaments/my-tournaments`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch my tournaments');
      }

      return data.tournaments;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  tournaments: [],
  myTournaments: [],
  selectedTournament: null,
  isLoading: false,
  isJoining: false,
  error: null,
  filters: {
    status: 'upcoming',
    game: 'all',
    entryFee: 'all',
  },
};

const tournamentsSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedTournament: (state) => {
      state.selectedTournament = null;
    },
    updateTournamentStatus: (state, action) => {
      const { tournamentId, status } = action.payload;
      const tournament = state.tournaments.find(t => t._id === tournamentId);
      if (tournament) {
        tournament.status = status;
      }
      
      const myTournament = state.myTournaments.find(t => t._id === tournamentId);
      if (myTournament) {
        myTournament.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tournaments
      .addCase(fetchTournaments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tournaments = action.payload;
        state.error = null;
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch tournament details
      .addCase(fetchTournamentDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTournamentDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedTournament = action.payload;
        state.error = null;
      })
      .addCase(fetchTournamentDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Join tournament
      .addCase(joinTournament.pending, (state) => {
        state.isJoining = true;
        state.error = null;
      })
      .addCase(joinTournament.fulfilled, (state, action) => {
        state.isJoining = false;
        const { tournamentId } = action.payload;
        
        // Update tournament in tournaments list
        const tournament = state.tournaments.find(t => t._id === tournamentId);
        if (tournament) {
          tournament.participants = tournament.participants + 1;
          tournament.isJoined = true;
        }
        
        // Update selected tournament
        if (state.selectedTournament && state.selectedTournament._id === tournamentId) {
          state.selectedTournament.participants = state.selectedTournament.participants + 1;
          state.selectedTournament.isJoined = true;
        }
        
        state.error = null;
      })
      .addCase(joinTournament.rejected, (state, action) => {
        state.isJoining = false;
        state.error = action.payload;
      })
      // Fetch my tournaments
      .addCase(fetchMyTournaments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTournaments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTournaments = action.payload;
        state.error = null;
      })
      .addCase(fetchMyTournaments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearSelectedTournament, 
  updateTournamentStatus 
} = tournamentsSlice.actions;

export default tournamentsSlice.reducer;