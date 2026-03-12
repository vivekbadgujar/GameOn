import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Smartphone,
  Wallet,
  CheckCircle,
  Loader2,
  Shield,
  Lock
} from 'lucide-react';
import { acceptPolicies } from '../../services/api';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, amount, onSuccess, tournamentName }) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('method');
  const [agreeToPolicies, setAgreeToPolicies] = useState(false);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI Transfer',
      description: 'Use the manual UPI process',
      icon: Smartphone,
      color: 'green'
    },
    {
      id: 'wallet',
      name: 'GameOn Wallet',
      description: 'Use your wallet balance',
      icon: Wallet,
      color: 'purple'
    }
  ];

  const handlePayment = async () => {
    if (!agreeToPolicies) {
      toast.error('Please agree to the Terms & Conditions and Policies to proceed with payment');
      return;
    }

    try {
      setProcessing(true);
      setPaymentStep('processing');
      setPaymentStep('success');

      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user._id) {
          await acceptPolicies(user._id, '1.0');
        }
      } catch (error) {
        console.error('Error saving policy acceptance:', error);
      }

      setTimeout(() => {
        onSuccess({
          paymentId: `${selectedMethod}_${Date.now()}`,
          method: selectedMethod,
          amount
        });
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setProcessing(false);
      setPaymentStep('method');
    }
  };

  const getMethodColor = (method) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 border-blue-500/30',
      green: 'from-green-500 to-green-600 border-green-500/30',
      purple: 'from-purple-500 to-purple-600 border-purple-500/30'
    };
    return colors[method.color] || colors.blue;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-shell">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.2 }}
        className="modal-panel relative mx-auto w-full max-w-md glass-card p-4 sm:p-6"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Payment</h2>
            <p className="text-sm text-white/60">Complete your tournament entry</p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="glass-card mb-6 border-green-500/30 bg-gradient-to-r from-green-500/20 to-transparent p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/60">Entry Fee</p>
              <p className="font-medium text-white">{tournamentName}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xl font-bold text-green-400 sm:text-2xl">{`Rs ${amount}`}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {paymentStep === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="mb-4 text-lg font-semibold text-white">Choose Payment Method</h3>

              {paymentMethods.map((method) => (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-300 ${
                    selectedMethod === method.id
                      ? `bg-gradient-to-r ${getMethodColor(method)} shadow-lg`
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4 sm:items-center">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                        selectedMethod === method.id ? 'bg-white/20' : 'bg-white/10'
                      }`}
                    >
                      <method.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{method.name}</p>
                      <p className="text-sm text-white/60">{method.description}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-white" />
                    )}
                  </div>
                </motion.button>
              ))}

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-blue-400">Secure Payment</p>
                  <p className="text-xs text-white/60">Your payment information is encrypted and secure.</p>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToPolicies"
                  checked={agreeToPolicies}
                  onChange={(e) => setAgreeToPolicies(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-2 border-white/20 bg-transparent text-blue-600 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <label htmlFor="agreeToPolicies" className="text-xs leading-relaxed text-white/80">
                  I have read and agree to GameOn&apos;s{' '}
                  <Link href="/terms" className="text-blue-400 underline hover:text-blue-300" target="_blank">
                    Terms & Conditions
                  </Link>
                  ,{' '}
                  <Link href="/refund" className="text-blue-400 underline hover:text-blue-300" target="_blank">
                    Refund Policy
                  </Link>
                  ,{' '}
                  <Link href="/privacy" className="text-blue-400 underline hover:text-blue-300" target="_blank">
                    Privacy Policy
                  </Link>
                  , and{' '}
                  <Link href="/fairplay" className="text-blue-400 underline hover:text-blue-300" target="_blank">
                    Fair Play Policy
                  </Link>
                  .
                </label>
              </div>

              <motion.button
                whileHover={{ scale: agreeToPolicies && !processing ? 1.01 : 1 }}
                whileTap={{ scale: agreeToPolicies && !processing ? 0.99 : 1 }}
                onClick={handlePayment}
                disabled={processing || !agreeToPolicies}
                className="mt-6 w-full btn-primary py-4 text-base font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5" />
                  <span>{`Pay Rs ${amount}`}</span>
                </span>
              </motion.button>
            </motion.div>
          )}

          {paymentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Processing Payment</h3>
              <p className="text-white/60">Please wait while we process your payment...</p>
            </motion.div>
          )}

          {paymentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"
              >
                <CheckCircle className="h-8 w-8 text-green-400" />
              </motion.div>
              <h3 className="mb-2 text-xl font-bold text-white">Payment Successful!</h3>
              <p className="text-white/60">You have successfully joined the tournament.</p>
              <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <p className="text-sm font-semibold text-green-400">Your slot will be assigned shortly.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PaymentModal;
