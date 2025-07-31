import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, XCircle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-300 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Refund Policy</h1>
            <p className="text-white/60 text-lg">
              Last Updated: {new Date().toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          {/* Refunds Are Granted Section */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Refunds Are Granted ONLY If:</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-400 mb-4">Eligible Refund Scenarios</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Tournament is cancelled by GameOn due to insufficient participants or technical errors.</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Payment was deducted but slot was not allocated.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Refunds Will NOT Be Granted Section */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Refunds Will NOT Be Granted If:</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Non-Eligible Scenarios</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Player withdraws after registration.</p>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Player is disqualified due to rule violation.</p>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Player cannot join due to internet/device issues.</p>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Player fails to join on time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Timeline Section */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Refund Timeline</h2>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-blue-400 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-blue-400 mb-2">Processing Time</h3>
                  <p className="text-white/80">
                    Eligible refunds are processed within <span className="font-bold text-blue-400">5–7 working days</span> via the same payment method.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Important Notes</h2>
            <div className="space-y-4 text-white/80">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 font-semibold mb-2">⚠️ Please Note:</p>
                <ul className="space-y-2 text-yellow-300">
                  <li>• All tournament fees are non-refundable once the tournament begins</li>
                  <li>• Refund requests must be submitted within 24 hours of the incident</li>
                  <li>• GameOn reserves the right to investigate all refund claims</li>
                  <li>• Fraudulent refund requests will result in account suspension</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How to Request a Refund */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-6">How to Request a Refund</h2>
            <div className="space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-indigo-400 mb-4">Refund Process</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-indigo-400 text-sm font-bold">1</span>
                    </div>
                    <p>Contact our support team at <span className="text-indigo-400 font-semibold">support@gameon.com</span></p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-indigo-400 text-sm font-bold">2</span>
                    </div>
                    <p>Provide your transaction ID and tournament details</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-indigo-400 text-sm font-bold">3</span>
                    </div>
                    <p>Our team will review and process eligible refunds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="glass-card p-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
            <div className="text-white/60 space-y-2">
              <p>For refund-related queries, please contact us:</p>
              <p>Email: <span className="text-blue-400">refunds@gameon.com</span></p>
              <p>Support: <span className="text-blue-400">support@gameon.com</span></p>
              <p>Phone: <span className="text-blue-400">+91-XXXX-XXXXXX</span></p>
            </div>
          </div>
        </motion.div>

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
          <Link 
            to="/terms" 
            className="glass-card px-6 py-3 text-white/80 hover:text-white transition-colors duration-300"
          >
            Terms & Conditions
          </Link>
          <Link 
            to="/privacy" 
            className="glass-card px-6 py-3 text-white/80 hover:text-white transition-colors duration-300"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/fairplay" 
            className="glass-card px-6 py-3 text-white/80 hover:text-white transition-colors duration-300"
          >
            Fair Play Policy
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicy;