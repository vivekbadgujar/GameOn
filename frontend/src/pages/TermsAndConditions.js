import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const TermsAndConditions = () => {
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
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Terms & Conditions</span>
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
          className="glass-card p-8 space-y-8"
        >
          {/* Section 1: Eligibility */}
          <section>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-400 font-bold">1</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Eligibility</h2>
            </div>
            <div className="text-white/80 space-y-3 ml-11">
              <p>• Users must be 18 years or older to participate in cash prize tournaments.</p>
              <p>• Users under 18 can only participate with written parental/guardian consent.</p>
              <p>• By registering, you confirm that you meet all eligibility requirements.</p>
              <p>• GameOn reserves the right to verify age and identity.</p>
            </div>
          </section>

          {/* Section 2: Account Registration */}
          <section>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Account Registration</h2>
            </div>
            <div className="text-white/80 space-y-3 ml-11">
              <p>• You must provide accurate details (Name, Email, Phone Number, In-Game ID).</p>
              <p>• Multiple accounts are prohibited; any detection will result in permanent ban.</p>
              <p>• Any false or misleading information will result in disqualification and loss of fees.</p>
            </div>
          </section>

          {/* Section 3: Tournament Participation */}
          <section>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-400 font-bold">3</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Tournament Participation</h2>
            </div>
            <div className="text-white/80 space-y-3 ml-11">
              <p>• Once you pay and join, your slot is confirmed.</p>
              <p>• No refunds for withdrawing, no-shows, or technical issues on the user's end.</p>
              <p>• All match schedules are final; GameOn is not responsible for delays caused by the player.</p>
            </div>
          </section>

          {/* Section 4: Room ID & Password */}
          <section>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-yellow-400 font-bold">4</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Room ID & Password</h2>
            </div>
            <div className="text-white/80 space-y-3 ml-11">
              <p>• Room ID & Password are provided 30 minutes before the match to registered participants.</p>
              <p>• Sharing Room ID/Password with non-registered players will lead to ban and slot cancellation.</p>
            </div>
          </section>

          {/* Section 5: Fair Play */}
          <section>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Fair Play</h2>
            </div>
            <div className="text-white/80 space-y-3 ml-11">
              <p>• No cheating, hacks, exploits, or third-party tools.</p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">Violations will result in:</p>
                <ul className="space-y-1 text-red-300">
                  <li>• Immediate disqualification</li>
                  <li>• Forfeiture of prize money</li>
                  <li>• Permanent account ban</li>
                </ul>
              </div>
              <p>• GameOn reserves the right to demand proof of gameplay (screenshots, recordings).</p>
            </div>
          </section>

          {/* Section 6: Prizes & Payout */}
          <section>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-400 font-bold">6</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Prizes & Payout</h2>
            </div>
            <div className="text-white/80 space-y-3 ml-11">
              <p>• Prizes will be credited within 7 working days after verification of results.</p>
              <p>• GameOn is not liable for payment delays caused by incorrect payment details provided by the user.</p>
              <p>• Taxes or deductions (if any) are the responsibility of the user.</p>
            </div>
          </section>

          {/* Section 7: Liability Disclaimer */}
          <section>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Liability Disclaimer</h2>
            </div>
            <div className="text-white/80 space-y-3 ml-11">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <p className="text-orange-400 font-semibold mb-2">GameOn is not responsible for:</p>
                <ul className="space-y-1 text-orange-300">
                  <li>• Internet failures</li>
                  <li>• Device malfunctions</li>
                  <li>• Server downtime of the game</li>
                </ul>
              </div>
              <p>• All tournaments are subject to availability and technical feasibility.</p>
            </div>
          </section>

          {/* Section 8: Amendments */}
          <section>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-indigo-400 font-bold">8</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Amendments</h2>
            </div>
            <div className="text-white/80 space-y-3 ml-11">
              <p>• GameOn reserves the right to update fees, schedules, and rules at any time with notification via platform.</p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t border-white/10 pt-8">
            <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
            <div className="text-white/60 space-y-2">
              <p>For questions about these Terms & Conditions, please contact us:</p>
              <p>Email: legal@gameon.com</p>
              <p>Support: support@gameon.com</p>
            </div>
          </section>
        </motion.div>

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
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

export default TermsAndConditions;

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}
