import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Ban, Camera, AlertTriangle, Eye, Zap } from 'lucide-react';
import Link from 'next/link';

const FairPlayPolicy = () => {
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
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Fair Play & Anti-Cheat Policy</span>
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
          {/* Zero Tolerance Policy */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                <Ban className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Zero Tolerance Policy</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Prohibited Activities</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <Ban className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Cheating Software</p>
                      <p>Any cheat, hack, exploit, or third-party tools that provide unfair advantage</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Ban className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Emulators</p>
                      <p>Using emulators when not allowed for the specific tournament</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Ban className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Account Sharing</p>
                      <p>Sharing account credentials or allowing others to play on your behalf</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Ban className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Team Coordination</p>
                      <p>Unauthorized team coordination in solo tournaments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consequences */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Consequences of Violations</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-orange-400 mb-4">Immediate Actions</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <Zap className="w-5 h-5 text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Immediate Disqualification</p>
                      <p>Instant removal from the current tournament</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Zap className="w-5 h-5 text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Forfeiture of Prize Money</p>
                      <p>Loss of all winnings and entry fees</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Zap className="w-5 h-5 text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Permanent Account Ban</p>
                      <p>Lifetime ban from all GameOn tournaments and services</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Zap className="w-5 h-5 text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Blacklist from Future Tournaments</p>
                      <p>Permanent exclusion from all future GameOn events</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Requirements */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                <Camera className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Verification Requirements</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Proof Requirements</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <Camera className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Gameplay Proof</p>
                      <p>Screenshots and recordings of gameplay when requested</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Camera className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Identity Verification</p>
                      <p>Government-issued ID to confirm fair play and prevent account sharing</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Camera className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Device Information</p>
                      <p>Device specifications and software details when suspicious activity is detected</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Camera className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Live Verification</p>
                      <p>Video call verification for high-stakes tournaments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detection Methods */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Anti-Cheat Detection</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-400 mb-4">Detection Systems</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <Eye className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">AI-Powered Analysis</p>
                      <p>Advanced algorithms analyze gameplay patterns for suspicious behavior</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Eye className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Statistical Analysis</p>
                      <p>Performance metrics compared against normal player behavior</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Eye className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Community Reporting</p>
                      <p>Player reports are investigated by our moderation team</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Eye className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white mb-1">Manual Review</p>
                      <p>Expert moderators review flagged matches and suspicious activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reporting Cheaters */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Report Suspicious Activity</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-400 mb-4">How to Report</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-green-400 text-sm font-bold">1</span>
                    </div>
                    <p>Use the in-game report feature during tournaments</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-green-400 text-sm font-bold">2</span>
                    </div>
                    <p>Email detailed reports to <span className="text-green-400 font-semibold">anticheat@gameon.com</span></p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-green-400 text-sm font-bold">3</span>
                    </div>
                    <p>Include player ID, tournament details, and evidence (screenshots/videos)</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-green-400 text-sm font-bold">4</span>
                    </div>
                    <p>Our team will investigate within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fair Play Guidelines */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Fair Play Guidelines</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-indigo-400 mb-4">Best Practices</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Play with integrity and respect for other participants</p>
                  </div>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Use only approved devices and software</p>
                  </div>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Report suspicious behavior to maintain tournament integrity</p>
                  </div>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Cooperate with verification requests from GameOn staff</p>
                  </div>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p>Maintain good sportsmanship throughout competitions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="glass-card p-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
            <div className="text-white/60 space-y-2">
              <p>For fair play and anti-cheat related queries:</p>
              <p>Anti-Cheat Team: <span className="text-red-400">anticheat@gameon.com</span></p>
              <p>Fair Play Officer: <span className="text-red-400">fairplay@gameon.com</span></p>
              <p>General Support: <span className="text-red-400">support@gameon.com</span></p>
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
            to="/refund" 
            className="glass-card px-6 py-3 text-white/80 hover:text-white transition-colors duration-300"
          >
            Refund Policy
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default FairPlayPolicy;