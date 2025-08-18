

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, LinearProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { theme } from './theme/theme';
import AdminLogin from './components/Auth/AdminLogin';
import ProtectedRoute from './components/Auth/ProtectedRoute';
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
import DataTest from './components/Debug/DataTest';
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
  return (
    <Routes future={{ v7_relativeSplatPath: true }}>
      {/* Public routes */}
      <Route path="/login" element={<AdminLogin />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tournaments" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <TournamentList />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tournaments/new" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <TournamentForm />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tournaments/create" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <TournamentForm />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tournaments/:id" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <TournamentDetails />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tournaments/:id/edit" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <TournamentForm />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tournaments/:id/results" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <TournamentResults />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/notifications" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <NotificationManager />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tournament-videos" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <TournamentVideoManager />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <AnalyticsDashboard />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/ai-reports" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <SuspiciousLogs />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/broadcast" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <BroadcastMessage />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/payouts" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <PrizePayouts />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/media" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <MediaUpload />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <UserManagement />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/user-reports" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <UserReports />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/scheduling" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <ScheduleManager />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/ai-suggestions" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <SuggestionsPanel />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/search" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <SearchFilter />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/export" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <ExportData />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/debug" element={
        <ProtectedRoute>
          <AdminLayout>
            <ErrorBoundary>
              <DataTest />
            </ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
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
