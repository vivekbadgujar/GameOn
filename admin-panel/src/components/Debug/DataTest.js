import React from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { tournamentAPI, userAPI } from '../../services/api';

const DataTest = () => {
  const { data: tournamentsData, isLoading: tournamentsLoading, error: tournamentsError } = useQuery({
    queryKey: ['debug-tournaments'],
    queryFn: async () => {
      console.log('DataTest: Fetching tournaments...');
      const response = await tournamentAPI.getAll({ page: 1, limit: 10, status: 'all' });
      console.log('DataTest: Tournaments response:', response);
      return response.data;
    }
  });

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['debug-users'],
    queryFn: async () => {
      console.log('DataTest: Fetching users...');
      const response = await userAPI.getAll({ page: 1, limit: 10 });
      console.log('DataTest: Users response:', response);
      return response.data;
    }
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Test Component
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournaments Test
          </Typography>
          {tournamentsLoading && <Typography>Loading tournaments...</Typography>}
          {tournamentsError && (
            <Alert severity="error">
              Error loading tournaments: {tournamentsError.message}
            </Alert>
          )}
          {tournamentsData && (
            <Box>
              <Typography>Response structure: {JSON.stringify(Object.keys(tournamentsData))}</Typography>
              <Typography>Tournaments count (path 1): {tournamentsData.tournaments?.length || 'Not found'}</Typography>
              <Typography>Tournaments count (path 2): {tournamentsData.data?.tournaments?.length || 'Not found'}</Typography>
              <Typography>Tournaments count (path 3): {Array.isArray(tournamentsData.data) ? tournamentsData.data.length : 'Not array'}</Typography>
              {tournamentsData.tournaments?.[0] && (
                <Typography>Sample tournament: {tournamentsData.tournaments[0].title}</Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Users Test
          </Typography>
          {usersLoading && <Typography>Loading users...</Typography>}
          {usersError && (
            <Alert severity="error">
              Error loading users: {usersError.message}
            </Alert>
          )}
          {usersData && (
            <Box>
              <Typography>Response structure: {JSON.stringify(Object.keys(usersData))}</Typography>
              <Typography>Users count (path 1): {usersData.data?.users?.length || 'Not found'}</Typography>
              <Typography>Users count (path 2): {usersData.users?.length || 'Not found'}</Typography>
              <Typography>Total users: {usersData.data?.total || 'Not found'}</Typography>
              {usersData.data?.users?.[0] && (
                <Typography>Sample user: {usersData.data.users[0].email}</Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DataTest;