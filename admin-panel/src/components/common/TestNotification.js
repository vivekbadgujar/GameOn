import React from 'react';
import { Button, Box } from '@mui/material';
import { useNotification } from '../../contexts/NotificationContext';

const TestNotification = () => {
  const { showNotification } = useNotification();

  const testNotifications = () => {
    showNotification('Success notification test!', 'success');
    setTimeout(() => showNotification('Error notification test!', 'error'), 1000);
    setTimeout(() => showNotification('Warning notification test!', 'warning'), 2000);
    setTimeout(() => showNotification('Info notification test!', 'info'), 3000);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button 
        variant="contained" 
        onClick={testNotifications}
        color="primary"
      >
        Test Notifications
      </Button>
    </Box>
  );
};

export default TestNotification;