

import React, { useState } from 'react';
import AdminLogin from './AdminLogin';
import Sidebar from './Sidebar';
import { CssBaseline, AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [selected, setSelected] = useState('dashboard');

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GameOn Admin Panel
          </Typography>
          <Button color="inherit" onClick={() => setLoggedIn(false)}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Sidebar onSelect={setSelected} selected={selected} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {selected === 'dashboard' && (
          <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
              Welcome, Admin!
            </Typography>
            <Typography variant="body1">
              Use the sidebar to manage tournaments, users, payments, and more.
            </Typography>
          </Container>
        )}
        {/* Tournament management, notifications, wallet, results, etc. will be added here */}
      </Box>
    </Box>
  );
}

export default App;
