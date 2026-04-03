import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  User,
  Smartphone,
  Receipt,
  Upload,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import { getManualPaymentStatus, getTournamentById, submitManualPayment } from '../services/api';

const ALLOWED_SCREENSHOT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ManualPaymentPage() {
  const router = useRouter();
  const { tournamentId } = router.query;
  const { user, token, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    playerName: '',
    email: '',
    gameId: '',
    phone: '',
    transactionId: '',
    screenshot: null,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [existingPayment, setExistingPayment] = useState(null);
  const [allowResubmission, setAllowResubmission] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId || authLoading) return;

    if (!user || !token) {
      setExistingPayment(null);
      setStatusLoading(false);
      return;
    }

    fetchExistingPaymentStatus();
  }, [tournamentId, authLoading, token, user?._id, user?.email]);

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      playerName: prev.playerName || user.displayName || user.username || '',
      email: prev.email || user.email || '',
      gameId: prev.gameId || user.gameProfile?.bgmiId || '',
      phone: prev.phone || user.phone || '',
    }));
  }, [user]);

  const fetchTournament = async () => {
    try {
      const resolvedTournamentId = Array.isArray(tournamentId) ? tournamentId[0] : tournamentId;
      const data = await getTournamentById(resolvedTournamentId);
      setTournament(data);
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingPaymentStatus = async () => {
    try {
      setStatusLoading(true);
      const resolvedTournamentId = Array.isArray(tournamentId) ? tournamentId[0] : tournamentId;
      const response = await getManualPaymentStatus(resolvedTournamentId);
      if (response?.success && response?.data) {
        setExistingPayment(response.data);
        setAllowResubmission(false);
      } else {
        setExistingPayment(null);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch manual payment status:', error);
      }
      setExistingPayment(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const getAssetUrl = (assetPath) => {
    if (!assetPath) return '';
    if (/^https?:\/\//i.test(assetPath)) return assetPath;

    const origin = config.API_BASE_URL.replace(/\/api\/?$/, '');
    return `${origin}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
  };

  const UPI_ID = tournament?.upiId?.trim() || 'gameon@upi';
  const UPI_QR_IMAGE = getAssetUrl(tournament?.qrCode || tournament?.upiQrImage);
  const ENTRY_FEE = tournament?.entryFee || 0;

  const validate = () => {
    const newErrors = {};
    if (!formData.playerName?.trim()) newErrors.playerName = 'Player name required';
    if (!formData.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone required';
    if (!formData.gameId?.trim()) newErrors.gameId = 'Game ID required';
    if (!formData.transactionId?.trim()) newErrors.transactionId = 'Transaction ID required';
    if (!formData.screenshot) newErrors.screenshot = 'Screenshot required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'file') {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ALLOWED_SCREENSHOT_TYPES.includes(file.type)) {
        setErrors((prev) => ({ ...prev, screenshot: 'Only JPG, PNG, or WEBP allowed' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, screenshot: 'File too large (max 5MB)' }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: file }));
      setErrors((prev) => ({ ...prev, screenshot: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!token) {
      setErrors((prev) => ({
        ...prev,
        submit: 'Please login again before submitting payment details.',
      }));
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('tournamentId', Array.isArray(tournamentId) ? tournamentId[0] : tournamentId);
      fd.append('playerName', formData.playerName.trim());
      fd.append('email', formData.email.trim());
      fd.append('phone', formData.phone.trim());
      fd.append('gameId', formData.gameId.trim());
      fd.append('transactionId', formData.transactionId.trim());
      fd.append('screenshot', formData.screenshot);

      const data = await submitManualPayment(fd);
      if (!data?.success) {
        throw new Error(data?.message || 'Unable to submit payment');
      }

      setExistingPayment({
        ...data.data,
        status: data?.data?.paymentStatus || 'pending',
      });
      setAllowResubmission(false);
      setStep(3);
    } catch (error) {
      console.error('Payment submission failed:', error);
      const validationErrors = error.response?.data?.errors;
      const validationMessage = Array.isArray(validationErrors)
        ? validationErrors.map((item) => item.msg).join(', ')
        : null;

      setErrors((prev) => ({
        ...prev,
        submit:
          validationMessage ||
          error.response?.data?.message ||
          error.message ||
          'Unable to submit payment',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!UPI_ID) return;
    navigator.clipboard.writeText(UPI_ID);
  };

  const resolvedPaymentStatus = existingPayment?.status;
  const showExistingPaymentState = existingPayment && !allowResubmission;

  if (loading || authLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-white">Loading tournament details...</p>
      </div>
    );
  }

  if (showExistingPaymentState) {
    const statusConfig = {
      pending: {
        heading: 'Payment Status: Pending Verification',
        statusLabel: 'Pending Verification',
        statusClass: 'text-yellow-400',
        borderClass: 'border-yellow-500/30',
        bgClass: 'bg-yellow-500/10',
        message: 'Your payment has been submitted and is currently under admin verification. Please wait for approval.',
        actionLabel: 'Back to Tournaments',
        action: () => router.push('/tournaments'),
      },
      approved: {
        heading: 'Tournament Status',
        statusLabel: 'Approved',
        statusClass: 'text-green-400',
        borderClass: 'border-green-500/30',
        bgClass: 'bg-green-500/10',
        message: 'You are successfully registered for this tournament.',
        actionLabel: 'Back to Tournaments',
        action: () => router.push('/tournaments'),
      },
      rejected: {
        heading: 'Tournament Status',
        statusLabel: 'Rejected',
        statusClass: 'text-red-400',
        borderClass: 'border-red-500/30',
        bgClass: 'bg-red-500/10',
        message: 'Your payment was rejected. Please submit payment again.',
        actionLabel: 'Submit Payment Again',
        action: () => {
          setAllowResubmission(true);
          setStep(2);
        },
      },
    };

    const currentStatus = statusConfig[resolvedPaymentStatus] || statusConfig.pending;

    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="container-custom max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card page-transition p-5 sm:p-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{currentStatus.heading}</h2>

            <div className={`rounded-lg border p-6 mb-6 ${currentStatus.bgClass} ${currentStatus.borderClass}`}>
              <p className="text-white/60 text-sm mb-2">Payment Status</p>
              <p className={`text-2xl font-bold ${currentStatus.statusClass}`}>{currentStatus.statusLabel}</p>
            </div>

            <p className="text-white/70 mb-8">{currentStatus.message}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={currentStatus.action}
                className="w-full btn-primary"
              >
                {currentStatus.actionLabel}
              </button>

              {resolvedPaymentStatus === 'rejected' && (
                <button
                  onClick={() => router.push('/tournaments')}
                  className="w-full btn-secondary"
                >
                  Back to Tournaments
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="container-custom max-w-2xl">
          <motion.div className="glass-card p-6 sm:p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Tournament Not Found</h2>
            <button
              onClick={() => router.push('/tournaments')}
              className="btn-primary mt-4"
            >
              Back to Tournaments
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="container-custom max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card page-transition p-5 sm:p-8"
          >
            <div className="mb-8 p-4 sm:p-6 bg-white/5 border border-white/10 rounded-lg">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{tournament?.title || tournament?.name}</h2>
              <p className="text-gray-300 mb-4">{tournament?.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Entry Fee</p>
                  <p className="text-xl font-bold text-green-400">Rs {ENTRY_FEE}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Slots Remaining</p>
                  <p className="text-xl font-bold text-blue-400">
                    {(tournament?.maxParticipants || 0) - (tournament?.currentParticipants || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-400" />
                Payment Instructions
              </h3>
              <p className="text-white/70 mb-6">
                Please complete the payment using any UPI app. You can either scan the QR code or
                pay directly to the UPI ID below, then submit your transaction details on the next page.
              </p>

              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-600/30 rounded-lg p-4 sm:p-6 mb-6">
                {UPI_QR_IMAGE && (
                  <div className="mb-6">
                    <p className="text-gray-300 text-sm mb-3">Scan & Pay</p>
                    <div className="flex justify-center rounded-xl bg-black/40 p-4">
                      <img
                        src={UPI_QR_IMAGE}
                        alt="UPI QR code"
                        className="w-full max-w-xs rounded-lg object-contain"
                      />
                    </div>
                  </div>
                )}

                <p className="text-gray-300 text-sm mb-2">UPI Address</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between bg-black/40 rounded p-4">
                  <code className="text-white font-mono text-base sm:text-lg break-all">{UPI_ID}</code>
                  <button
                    onClick={copyToClipboard}
                    className="btn-secondary w-full sm:w-auto px-4 py-2"
                    title="Copy UPI ID"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Copy className="w-5 h-5 text-green-400" />
                      <span>Copy</span>
                    </span>
                  </button>
                </div>
              </div>

              <ol className="space-y-3 text-white/70">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-sm font-bold">1</span>
                  <span>Open your UPI app (Google Pay, PhonePe, or Paytm)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-sm font-bold">2</span>
                  <span>
                    {UPI_QR_IMAGE ? 'Scan the QR code or ' : ''}
                    send Rs {ENTRY_FEE} to <code className="text-green-400 bg-black/40 px-2 py-1 rounded break-all">{UPI_ID}</code>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-sm font-bold">3</span>
                  <span>Copy your transaction ID / reference number</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-sm font-bold">4</span>
                  <span>Take a screenshot of the payment confirmation</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-sm font-bold">5</span>
                  <span>Click "Next" and fill in your details below</span>
                </li>
              </ol>
            </div>

            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <p className="text-white/70 text-sm">
                Your payment will be verified by our admin team. Once approved, you&apos;ll be added to the tournament and can access the details.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              Next: Submit Payment Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="container-custom max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card page-transition p-5 sm:p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Submit Payment Details</h2>

            {errors.submit && (
              <div className="bg-red-600/10 border border-red-600/30 text-red-200 p-4 rounded-lg mb-6 flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white mb-2 font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Player Name
                </label>
                <input
                  type="text"
                  name="playerName"
                  value={formData.playerName}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="Your full name"
                />
                {errors.playerName && <p className="text-red-400 text-sm mt-1">{errors.playerName}</p>}
              </div>

              <div>
                <label className="block text-white mb-2 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-white mb-2 font-medium flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Game ID
                </label>
                <input
                  type="text"
                  name="gameId"
                  value={formData.gameId}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="Your in-game ID"
                />
                {errors.gameId && <p className="text-red-400 text-sm mt-1">{errors.gameId}</p>}
              </div>

              <div>
                <label className="block text-white mb-2 font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="10-digit phone number"
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-white mb-2 font-medium flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  UPI Transaction ID
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="Reference ID from your UPI app"
                />
                {errors.transactionId && <p className="text-red-400 text-sm mt-1">{errors.transactionId}</p>}
              </div>

              <div>
                <label className="block text-white mb-2 font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Payment Screenshot (JPG/PNG/WEBP)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    name="screenshot"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleInputChange}
                    className="input-field w-full file:mr-3"
                  />
                  {formData.screenshot && (
                    <p className="text-green-400 text-sm mt-2">
                      Selected: {formData.screenshot.name}
                    </p>
                  )}
                </div>
                {errors.screenshot && <p className="text-red-400 text-sm mt-1">{errors.screenshot}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary mt-8"
              >
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full btn-secondary"
              >
                Back
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card page-transition p-6 sm:p-8 text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-2">Payment Submitted!</h2>
          <p className="text-white/70 mb-8">
            Your payment details have been submitted successfully. Our admin team will verify your payment and add you to the tournament.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
            <p className="text-white/60 text-sm mb-2">Payment Status</p>
            <p className="text-2xl font-bold text-yellow-400">Pending Verification</p>
            <p className="text-white/50 text-sm mt-2">
              You&apos;ll receive a notification once your payment is approved.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/tournaments'}
            className="w-full btn-primary"
          >
            Back to Tournaments
          </button>
        </motion.div>
      </div>
    </div>
  );
}
