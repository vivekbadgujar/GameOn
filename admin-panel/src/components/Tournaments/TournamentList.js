import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  SportsEsports,
  Schedule,
  People,
  AccountBalanceWallet,
  CheckCircle,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { tournamentAPI } from '../../services/api';
import dayjs from 'dayjs';

const TournamentList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: tournaments = [], isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentAPI.getAll,
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: tournamentAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments']);
      setDeleteDialogOpen(false);
      setSelectedTournament(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => tournamentAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments']);
      setStatusDialogOpen(false);
      setSelectedTournament(null);
      setNewStatus('');
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'info';
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return <Schedule />;
      case 'active': return <SportsEsports />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return <Warning />;
    }
  };

  const handleDelete = () => {
    if (selectedTournament) {
      deleteMutation.mutate(selectedTournament.id);
    }
  };

  const handleStatusUpdate = () => {
    if (selectedTournament && newStatus) {
      updateStatusMutation.mutate({ id: selectedTournament.id, status: newStatus });
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Tournament Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsEsports color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'map',
      headerName: 'Map',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'teamType',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'Squad' ? 'primary' : params.value === 'Duo' ? 'secondary' : 'default'}
        />
      ),
    },
    {
      field: 'entryFee',
      headerName: 'Entry Fee',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          ₹{params.value}
        </Typography>
      ),
    },
    {
      field: 'prizePool',
      headerName: 'Prize Pool',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
          ₹{params.value?.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'maxParticipants',
      headerName: 'Participants',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <People fontSize="small" />
          <Typography variant="body2">
            {params.row.currentParticipants || 0}/{params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'scheduledAt',
      headerName: 'Scheduled',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {dayjs(params.value).format('MMM DD, HH:mm')}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<MoreVert />}
          label="More"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedTournament(params.row);
          }}
        />,
      ],
    },
  ];

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load tournaments: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Tournaments
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/tournaments/new')}
          sx={{ textTransform: 'none' }}
        >
          Create Tournament
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={tournaments}
            columns={columns}
            loading={isLoading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'scheduledAt', sort: 'desc' }] },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={selectedTournament ? document.querySelector(`[data-id="${selectedTournament.id}"]`) : null}
        open={Boolean(selectedTournament)}
        onClose={() => setSelectedTournament(null)}
      >
        <MenuItem onClick={() => navigate(`/tournaments/${selectedTournament?.id}/edit`)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Tournament</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => navigate(`/tournaments/${selectedTournament?.id}/results`)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Results</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setStatusDialogOpen(true);
          setSelectedTournament(selectedTournament);
        }}>
          <ListItemIcon>
            <Schedule fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Tournament</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tournament</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTournament?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Tournament Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="New Status"
            >
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusUpdate} 
            variant="contained"
            disabled={!newStatus || updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentList; 