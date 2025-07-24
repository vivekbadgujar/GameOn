import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AnnouncementIcon from '@mui/icons-material/Announcement';

const drawerWidth = 220;

const Sidebar = ({ onSelect, selected }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
    }}
  >
    <Toolbar />
    <Box sx={{ overflow: 'auto' }}>
      <List>
        <ListItem button selected={selected === 'dashboard'} onClick={() => onSelect('dashboard')}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button selected={selected === 'tournaments'} onClick={() => onSelect('tournaments')}>
          <ListItemIcon><SportsEsportsIcon /></ListItemIcon>
          <ListItemText primary="Tournaments" />
        </ListItem>
        <ListItem button selected={selected === 'notifications'} onClick={() => onSelect('notifications')}>
          <ListItemIcon><NotificationsIcon /></ListItemIcon>
          <ListItemText primary="Notifications" />
        </ListItem>
        <ListItem button selected={selected === 'wallet'} onClick={() => onSelect('wallet')}>
          <ListItemIcon><AccountBalanceWalletIcon /></ListItemIcon>
          <ListItemText primary="Wallet" />
        </ListItem>
        <ListItem button selected={selected === 'results'} onClick={() => onSelect('results')}>
          <ListItemIcon><AnnouncementIcon /></ListItemIcon>
          <ListItemText primary="Results" />
        </ListItem>
      </List>
    </Box>
  </Drawer>
);

export default Sidebar;
