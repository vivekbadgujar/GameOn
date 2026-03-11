import React, { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { getTournamentById } from '../services/api';

export default function ManualPaymentPage() {
  const router = useRouter();
  const { tournamentId } = router.query;
  
  const [step, setStep] = useState(1);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    playerName: '',
    email: '',
    gameId: '',
    phone: '',
    transactionId: '',
    screenshot: null
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
    }
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      const data = await getTournamentById(tournamentId);
      setTournament(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      setLoading(false);
    }
  }

  const UPI_ID = 'gameon@upi';
  const ENTRY_FEE = tournament?.entryFee || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-white">Loading tournament details...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="container-custom max-w-2xl">
          <motion.div className="glass-card p-8 text-center">
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
      if (file) {
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
          setErrors(prev => ({ ...prev, screenshot: 'Only JPG/PNG allowed' }));
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({ ...prev, screenshot: 'File too large (max 5MB)' }));
          return;
        }
        setFormData(prev => ({ ...prev, [name]: file }));
        setErrors(prev => ({ ...prev, screenshot: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('tournamentId', tournamentId);
      fd.append('playerName', formData.playerName);
      fd.append('email', formData.email);
      fd.append('phone', formData.phone);
      fd.append('gameId', formData.gameId);
      fd.append('transactionId', formData.transactionId);
      fd.append('screenshot', formData.screenshot);

      const apiUrl =
        `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'https://api.gameonesport.xyz/api'}`;
      const response = await fetch(`${apiUrl}/payments/manual/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: fd
      });

      let data;
      // try to parse JSON, fallback to status text
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.message || `Server error ${response.status}`);
      }

      setStep(3);
    } catch (error) {
      console.error('Payment submission failed:', error);
      setErrors(prev => ({ ...prev, submit: error.message || 'Unable to submit payment' }));
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(UPI_ID);
  };

  // Step 1: Instructions
  if (step === 1) {
    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="container-custom max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            {/* Tournament info */}
            <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-lg">
              <h2 className="text-2xl font-bold text-white mb-2">{tournament?.title}</h2>
              <p className="text-gray-300 mb-4">{tournament?.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Entry Fee</p>
                  <p className="text-xl font-bold text-green-400">₹{ENTRY_FEE}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Slots Remaining</p>
                  <p className="text-xl font-bold text-blue-400">
                    {tournament?.maxParticipants - tournament?.currentParticipants}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment instructions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-400" />
                Payment Instructions
              </h3>
              <p className="text-white/70 mb-6">
                Please complete the payment using any UPI app (Google Pay, PhonePe, Paytm) to the
                UPI ID below, then submit your transaction details on the next page.
              </p>

              {/* UPI ID */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-600/30 rounded-lg p-6 mb-6">
                <p className="text-gray-300 text-sm mb-2">UPI Address</p>
                <div className="flex items-center justify-between bg-black/40 rounded p-4">
                  <code className="text-white font-mono text-lg">{UPI_ID}</code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/10 rounded transition"
                    title="Copy UPI ID"
                  >
                    <Copy className="w-5 h-5 text-green-400" />
                  </button>
                </div>
              </div>

              {/* Instructions list */}
              <ol className="space-y-3 text-white/70">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-sm font-bold">1</span>
                  <span>Open your UPI app (Google Pay, PhonePe, or Paytm)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-sm font-bold">2</span>
                  <span>Send ₹{ENTRY_FEE} to <code className="text-green-400 bg-black/40 px-2 py-1 rounded">{UPI_ID}</code></span>
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

            {/* Info message */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <p className="text-white/70 text-sm">
                Your payment will be verified by our admin team. Once approved, you'll be added to the tournament and can access the details.
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

  // Step 2: Form
  if (step === 2) {
    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="container-custom max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Submit Payment Details</h2>

            {errors.submit && (
              <div className="bg-red-600/10 border border-red-600/30 text-red-200 p-4 rounded-lg mb-6 flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Player Name */}
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
                  className="w-full bg-white/5 border border-white/20 rounded px-4 py-2 text-white placeholder:text-gray-500 focus:border-blue-400/50 focus:outline-none"
                  placeholder="Your full name"
                />
                {errors.playerName && <p className="text-red-400 text-sm mt-1">{errors.playerName}</p>}
              </div>

              {/* Email */}
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
                  className="w-full bg-white/5 border border-white/20 rounded px-4 py-2 text-white placeholder:text-gray-500 focus:border-blue-400/50 focus:outline-none"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Game ID */}
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
                  className="w-full bg-white/5 border border-white/20 rounded px-4 py-2 text-white placeholder:text-gray-500 focus:border-blue-400/50 focus:outline-none"
                  placeholder="Your in-game ID"
                />
                {errors.gameId && <p className="text-red-400 text-sm mt-1">{errors.gameId}</p>}
              </div>

              {/* Phone */}
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
                  className="w-full bg-white/5 border border-white/20 rounded px-4 py-2 text-white placeholder:text-gray-500 focus:border-blue-400/50 focus:outline-none"
                  placeholder="10-digit phone number"
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Transaction ID */}
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
                  className="w-full bg-white/5 border border-white/20 rounded px-4 py-2 text-white placeholder:text-gray-500 focus:border-blue-400/50 focus:outline-none"
                  placeholder="Reference ID from your UPI app"
                />
                {errors.transactionId && <p className="text-red-400 text-sm mt-1">{errors.transactionId}</p>}
              </div>

              {/* Screenshot upload */}
              <div>
                <label className="block text-white mb-2 font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Payment Screenshot (JPG/PNG)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    name="screenshot"
                    accept="image/jpeg,image/png"
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  {formData.screenshot && (
                    <p className="text-green-400 text-sm mt-2">
                      ✓ {formData.screenshot.name}
                    </p>
                  )}
                </div>
                {errors.screenshot && <p className="text-red-400 text-sm mt-1">{errors.screenshot}</p>}
              </div>

              {/* Submit button */}
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

  // Step 3: Confirmation
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-2">Payment Submitted!</h2>
          <p className="text-white/70 mb-8">
            Your payment details have been submitted successfully. Our admin team will verify your payment and add you to the tournament.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
            <p className="text-white/60 text-sm mb-2">Payment Status</p>
            <p className="text-2xl font-bold text-yellow-400">⏳ Pending Verification</p>
            <p className="text-white/50 text-sm mt-2">
              You'll receive a notification once your payment is approved.
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
