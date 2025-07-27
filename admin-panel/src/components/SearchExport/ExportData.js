import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  FileDownload,
  History,
  ExpandMore,
  CheckCircle,
  Schedule,
  Error,
  CloudDownload,
  Description,
} from '@mui/icons-material';
import { searchExportAPI } from '../../services/api';
import dayjs from 'dayjs';

const ExportData = () => {
  const [exportDialog, setExportDialog] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    dataType: 'tournaments',
    format: 'csv',
    dateRange: [dayjs().subtract(30, 'day'), dayjs()],
    includeHeaders: true,
    filters: {},
  });

  const { data: exportHistoryData, isLoading } = useQuery({
    queryKey: ['export-history'],
    queryFn: searchExportAPI.getExportHistory,
    refetchInterval: 30000,
  });

  const exportHistory = exportHistoryData?.data || [];

  const exportMutation = useMutation({
    mutationFn: ({ type, format, filters }) => searchExportAPI.exportData(type, format, filters),
    onSuccess: (data) => {
      if (data.data && data.data.downloadUrl) {
        // Download the file using the provided URL
        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}${data.data.downloadUrl}`, '_blank');
      }
      setExportDialog(false);
    },
    onError: (error) => {
      console.error('Export failed:', error);
      // You might want to show a toast notification here
    },
  });

  const handleExport = async () => {
    await exportMutation.mutateAsync({
      type: exportConfig.dataType,
      format: exportConfig.format,
      filters: {
        dateRange: exportConfig.dateRange.map(date => date.toISOString()),
        includeHeaders: exportConfig.includeHeaders,
        ...exportConfig.filters,
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'processing': return <Schedule />;
      case 'failed': return <Error />;
      default: return <Description />;
    }
  };

  const getDataTypeIcon = (type) => {
    switch (type) {
      case 'tournaments': return <Description />;
      case 'users': return <Description />;
      case 'payouts': return <Description />;
      case 'analytics': return <Description />;
      default: return <Description />;
    }
  };

  const history = exportHistory;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
        Data Export
      </Typography>

      <Grid container spacing={3}>
        {/* Export Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Export Configuration
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Data Type</InputLabel>
                    <Select
                      value={exportConfig.dataType}
                      onChange={(e) => setExportConfig(prev => ({ ...prev, dataType: e.target.value }))}
                      label="Data Type"
                    >
                      <MenuItem value="tournaments">Tournaments</MenuItem>
                      <MenuItem value="users">Users</MenuItem>
                      <MenuItem value="payouts">Payouts</MenuItem>
                      <MenuItem value="analytics">Analytics</MenuItem>
                      <MenuItem value="reports">Reports</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={exportConfig.format}
                      onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                      label="Format"
                    >
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="pdf">PDF</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportConfig.includeHeaders}
                        onChange={(e) => setExportConfig(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                      />
                    }
                    label="Include Headers"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Date Range
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <DateTimePicker
                        label="From"
                        value={exportConfig.dateRange[0]}
                        onChange={(value) => setExportConfig(prev => ({
                          ...prev,
                          dateRange: [value, prev.dateRange[1]]
                        }))}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <DateTimePicker
                        label="To"
                        value={exportConfig.dateRange[1]}
                        onChange={(value) => setExportConfig(prev => ({
                          ...prev,
                          dateRange: [prev.dateRange[0], value]
                        }))}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<FileDownload />}
                    onClick={() => setExportDialog(true)}
                    sx={{ mt: 2 }}
                  >
                    Configure Export
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Quick Export Options */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Quick Export
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={() => {
                      setExportConfig({
                        dataType: 'tournaments',
                        format: 'csv',
                        dateRange: [dayjs().subtract(7, 'day'), dayjs()],
                        includeHeaders: true,
                        filters: {},
                      });
                      setExportDialog(true);
                    }}
                  >
                    Recent Tournaments
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={() => {
                      setExportConfig({
                        dataType: 'users',
                        format: 'excel',
                        dateRange: [dayjs().subtract(30, 'day'), dayjs()],
                        includeHeaders: true,
                        filters: {},
                      });
                      setExportDialog(true);
                    }}
                  >
                    User Analytics
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={() => {
                      setExportConfig({
                        dataType: 'payouts',
                        format: 'csv',
                        dateRange: [dayjs().subtract(90, 'day'), dayjs()],
                        includeHeaders: true,
                        filters: {},
                      });
                      setExportDialog(true);
                    }}
                  >
                    Payout Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={() => {
                      setExportConfig({
                        dataType: 'analytics',
                        format: 'pdf',
                        dateRange: [dayjs().subtract(30, 'day'), dayjs()],
                        includeHeaders: true,
                        filters: {},
                      });
                      setExportDialog(true);
                    }}
                  >
                    Monthly Report
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Export History */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Export History
              </Typography>

              {isLoading ? (
                <LinearProgress />
              ) : (
                <List>
                  {history.map((exportItem, index) => (
                    <React.Fragment key={exportItem.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getStatusColor(exportItem.status) }}>
                            {getStatusIcon(exportItem.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {exportItem.type.charAt(0).toUpperCase() + exportItem.type.slice(1)}
                              </Typography>
                              <Chip
                                label={exportItem.format.toUpperCase()}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={exportItem.status}
                                color={getStatusColor(exportItem.status)}
                                size="small"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {dayjs(exportItem.requestedAt).format('MMM DD, YYYY HH:mm')}
                              </Typography>
                              {exportItem.fileSize && (
                                <Typography variant="body2" color="text.secondary">
                                  {exportItem.fileSize} • {exportItem.recordCount} records
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        {exportItem.status === 'completed' && exportItem.downloadUrl && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CloudDownload />}
                            onClick={() => {
                              window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}${exportItem.downloadUrl}`, '_blank');
                            }}
                          >
                            Download
                          </Button>
                        )}
                      </ListItem>
                      {index < history.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Data</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Export {exportConfig.dataType} data in {exportConfig.format.toUpperCase()} format
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Date Range: {exportConfig.dateRange[0]?.format('MMM DD, YYYY')} - {exportConfig.dateRange[1]?.format('MMM DD, YYYY')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Format: {exportConfig.format.toUpperCase()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Include Headers: {exportConfig.includeHeaders ? 'Yes' : 'No'}
                </Typography>
              </Grid>
            </Grid>

            {exportMutation.isPending && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Preparing export...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={<FileDownload />}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExportData; 