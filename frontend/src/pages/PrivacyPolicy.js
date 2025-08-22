import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';
import Link from 'next/link';

const PrivacyPolicy = () => {
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
            href="/dashboard" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-300 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Privacy Policy</span>
            </h1>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
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
          {/* Data Collection */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Data We Collect</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Personal Information</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <UserCheck className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Basic Details</p>
                      <p>Name, Email, Phone Number, In-Game ID for tournament purposes</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <UserCheck className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Account Information</p>
                      <p>Username, password (encrypted), profile preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <UserCheck className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Tournament Data</p>
                      <p>Participation history, results, rankings, and gameplay statistics</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Security */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                <Lock className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Payment Security</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-400 mb-4">Secure Payment Processing</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <Lock className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Payment details are processed securely by <span className="font-semibold text-green-400">Cashfree/UPI</span></p>
                  </div>
                  <div className="flex items-start">
                    <Lock className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p><span className="font-semibold text-white">GameOn does not store</span> sensitive payment information</p>
                  </div>
                  <div className="flex items-start">
                    <Lock className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>All transactions are encrypted using industry-standard SSL technology</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Usage */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">How We Use Your Data</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-400 mb-4">Data Usage Purposes</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-purple-400 text-sm font-bold">1</span>
                    </div>
                    <p>Tournament organization and participant management</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-purple-400 text-sm font-bold">2</span>
                    </div>
                    <p>Prize distribution and payment processing</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-purple-400 text-sm font-bold">3</span>
                    </div>
                    <p>Account security and fraud prevention</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-purple-400 text-sm font-bold">4</span>
                    </div>
                    <p>Platform improvement and user experience enhancement</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-purple-400 text-sm font-bold">5</span>
                    </div>
                    <p>Communication about tournaments and platform updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Protection */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Data Protection & Privacy</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Our Commitments</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p><span className="font-semibold text-white">We do not sell or share</span> data with third parties, except where legally required</p>
                  </div>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>All data is <span className="font-semibold text-white">encrypted and securely stored</span> using industry standards</p>
                  </div>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Compliance with <span className="font-semibold text-white">Indian privacy norms</span> and data protection laws</p>
                  </div>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Regular security audits and vulnerability assessments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Rights */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
                <UserCheck className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Your Rights</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">Data Rights</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <UserCheck className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Access Your Data</p>
                      <p>Request a copy of all personal data we hold about you</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <UserCheck className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Correct Your Data</p>
                      <p>Update or correct any inaccurate personal information</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <UserCheck className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Delete Your Data</p>
                      <p>Request deletion of your personal data (subject to legal requirements)</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <UserCheck className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Data Portability</p>
                      <p>Receive your data in a structured, machine-readable format</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cookies and Tracking */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mr-4">
                <Eye className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Cookies & Tracking</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-indigo-400 mb-4">Cookie Usage</h3>
                <div className="space-y-3 text-white/80">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Maintain your login session</li>
                    <li>• Remember your preferences</li>
                    <li>• Analyze platform usage for improvements</li>
                    <li>• Ensure security and prevent fraud</li>
                  </ul>
                  <p className="text-indigo-300 font-semibold mt-4">
                    You can control cookie settings through your browser preferences.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="glass-card p-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
            <div className="text-white/60 space-y-2">
              <p>For privacy-related questions or to exercise your rights, contact us:</p>
              <p>Email: <span className="text-purple-400">privacy@gameon.com</span></p>
              <p>Data Protection Officer: <span className="text-purple-400">dpo@gameon.com</span></p>
              <p>Support: <span className="text-purple-400">support@gameon.com</span></p>
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
            href="/terms" 
            className="glass-card px-6 py-3 text-white/80 hover:text-white transition-colors duration-300"
          >
            Terms & Conditions
          </Link>
          <Link 
            href="/refund" 
            className="glass-card px-6 py-3 text-white/80 hover:text-white transition-colors duration-300"
          >
            Refund Policy
          </Link>
          <Link 
            href="/fairplay" 
            className="glass-card px-6 py-3 text-white/80 hover:text-white transition-colors duration-300"
          >
            Fair Play Policy
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;