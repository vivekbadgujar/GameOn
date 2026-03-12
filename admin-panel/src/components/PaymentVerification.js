import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Typography,
  CircularProgress,
  TextField,
  MenuItem,
  IconButton,
  Alert
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  GetApp as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// API URL configuration - Support both React and Next.js environment variables
const API_BASE_URL = (process.env.REACT_APP_API_URL ||
                     process.env.NEXT_PUBLIC_API_URL || 
                     process.env.NEXT_PUBLIC_API_BASE_URL || 
                     'https://api.gameonesport.xyz/api').replace(/\/$/, '');
const API_ASSET_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export default function PaymentVerification() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_BASE_URL}/payments/admin/payments?status=${statusFilter}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      setPayments(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (payment) => {
    setSelectedPayment(payment);
    setImageLoadError('');
    setPreviewOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;
    await performAction('approve');
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    await performAction('reject');
  };

  const performAction = async (action) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_BASE_URL}/payments/admin/payments/${selectedPayment._id}/${action}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      setPreviewOpen(false);
      setSelectedPayment(null);
      await fetchPayments();
    } catch (err) {
      setError(err.message || `Failed to ${action} payment`);
    } finally {
      setActionLoading(false);
    }
  };

  const getScreenshotUrl = (screenshotUrl) => {
    if (!screenshotUrl) return '';
    if (/^https?:\/\//i.test(screenshotUrl)) return screenshotUrl;
    return `${API_ASSET_BASE_URL}${screenshotUrl.startsWith('/') ? screenshotUrl : `/${screenshotUrl}`}`;
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" variant="outlined" color="warning" />;
      case 'approved':
        return <Chip label="Approved" variant="outlined" color="success" />;
      case 'rejected':
        return <Chip label="Rejected" variant="outlined" color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  if (loading && !payments.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: '#fff', fontWeight: 'bold' }}>
        Payment Verification
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          label="Filter by Status"
          sx={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#fff',
            '& .MuiOutlinedInput-root': { color: '#fff' },
            minWidth: { xs: '100%', sm: 200 }
          }}
        >
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255,255,255,0.05)', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <TableCell sx={{ color: '#fff' }}>Player Name</TableCell>
              <TableCell sx={{ color: '#fff' }}>Email</TableCell>
              <TableCell sx={{ color: '#fff' }}>Tournament</TableCell>
              <TableCell sx={{ color: '#fff' }}>Transaction ID</TableCell>
              <TableCell sx={{ color: '#fff' }}>Game ID</TableCell>
              <TableCell sx={{ color: '#fff' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}>
                <TableCell sx={{ color: '#fff' }}>{payment.playerName}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{payment.email}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{payment.tournament?.title}</TableCell>
                <TableCell sx={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.85em' }}>
                  {payment.transactionId.substring(0, 12)}...
                </TableCell>
                <TableCell sx={{ color: '#fff' }}>{payment.gameId}</TableCell>
                <TableCell>{getStatusChip(payment.paymentStatus)}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handlePreview(payment)}
                    sx={{ color: '#2196F3' }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {payments.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
          No payments found
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => !actionLoading && setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
          Payment Details
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
            disabled={actionLoading}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ backgroundColor: '#0f3460', color: '#fff', pt: 2 }}>
          {selectedPayment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Player Name:</strong> {selectedPayment.playerName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email:</strong> {selectedPayment.email}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Phone:</strong> {selectedPayment.phone}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Game ID:</strong> {selectedPayment.gameId}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Transaction ID:</strong> {selectedPayment.transactionId}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Status:</strong> {getStatusChip(selectedPayment.paymentStatus)}
              </Typography>

              {/* Screenshot preview */}
              {selectedPayment.screenshotUrl && (
                <Box sx={{ my: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Payment Screenshot:</strong>
                  </Typography>
                  {imageLoadError ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {imageLoadError}
                    </Alert>
                  ) : null}
                  <Box
                    component="img"
                    src={getScreenshotUrl(selectedPayment.screenshotUrl)}
                    alt="Payment screenshot"
                    onError={() => setImageLoadError('Unable to load the uploaded screenshot. Check the stored file path and public uploads configuration.')}
                    sx={{ width: '100%', maxHeight: { xs: 240, sm: 300 }, borderRadius: 1, objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.04)' }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ backgroundColor: '#1a1a2e', p: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button onClick={() => setPreviewOpen(false)} disabled={actionLoading} sx={{ color: '#fff', width: { xs: '100%', sm: 'auto' } }}>
            Close
          </Button>
          {selectedPayment?.paymentStatus === 'pending' && (
            <>
              <Button
                onClick={handleReject}
                disabled={actionLoading}
                color="error"
                variant="contained"
                startIcon={<CancelIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                color="success"
                variant="contained"
                startIcon={<CheckCircleIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
