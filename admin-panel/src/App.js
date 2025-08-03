

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, LinearProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { theme } from './theme/theme';
import AdminLogin from './AdminLogin';
import AdminLayout from './components/Layout/AdminLayout';
import Dashboard from './components/Dashboard/Dashboard';
import TournamentList from './components/Tournaments/TournamentList';
import TournamentForm from './components/Tournaments/TournamentForm';
import TournamentResults from './components/Tournaments/TournamentResults';
import TournamentDetails from './components/Tournaments/TournamentDetails';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import SuspiciousLogs from './components/AIReports/SuspiciousLogs';
import BroadcastMessage from './components/Broadcast/BroadcastMessage';
import PrizePayouts from './components/Payouts/PrizePayouts';
import MediaUpload from './components/Media/MediaUpload';
import UserReports from './components/Users/UserReports';
import UserManagement from './components/Users/UserManagement';
import ScheduleManager from './components/Scheduling/ScheduleManager';
import SuggestionsPanel from './components/AISuggestions/SuggestionsPanel';
import SearchFilter from './components/SearchExport/SearchFilter';
import ExportData from './components/SearchExport/ExportData';
import NotificationManager from './components/Notifications/NotificationManager';
import TournamentVideoManager from './components/Videos/TournamentVideoManager';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <AdminLayout>
      <ErrorBoundary>
        <Routes future={{ v7_relativeSplatPath: true }}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tournaments" element={<TournamentList />} />
          <Route path="/tournaments/new" element={<TournamentForm />} />
          <Route path="/tournaments/create" element={<TournamentForm />} />
          <Route path="/tournaments/:id" element={<TournamentDetails />} />
          <Route path="/tournaments/:id/edit" element={<TournamentForm />} />
          <Route path="/tournaments/:id/results" element={<TournamentResults />} />
          <Route path="/notifications" element={<NotificationManager />} />
          <Route path="/tournament-videos" element={<TournamentVideoManager />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/ai-reports" element={<SuspiciousLogs />} />
          <Route path="/broadcast" element={<BroadcastMessage />} />
          <Route path="/payouts" element={<PrizePayouts />} />
          <Route path="/media" element={<MediaUpload />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/user-reports" element={<UserReports />} />
          <Route path="/scheduling" element={<ScheduleManager />} />
          <Route path="/ai-suggestions" element={<SuggestionsPanel />} />
          <Route path="/search" element={<SearchFilter />} />
          <Route path="/export" element={<ExportData />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </AdminLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AuthProvider>
              <NotificationProvider>
                <SocketProvider>
                  <Router>
                    <AppRoutes />
                  </Router>
                </SocketProvider>
              </NotificationProvider>
            </AuthProvider>
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
