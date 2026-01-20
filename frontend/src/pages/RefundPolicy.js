import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';

const RefundPolicy = () => {
  const lastUpdated = "20-01-2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8">
      <Head>
        <title>Cancellation & Refund Policy | GameOn</title>
      </Head>
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
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Cancellation & Refund Policy</span>
            </h1>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              Last updated on {lastUpdated}
            </p>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card p-8 md:p-12"
        >
          <div className="prose prose-invert max-w-none">
            <p className="text-white/90 text-lg leading-relaxed mb-8">
              VIVEK BADGUJAR believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
            </p>

            <ul className="space-y-6 text-white/80 list-none p-0">
              <li className="flex items-start">
                <span className="text-green-400 mr-3 mt-1.5">•</span>
                <p>Cancellations will be considered only if the request is made immediately after tournament registration. However, the cancellation request may not be entertained if the participation confirmation has been issued or the tournament has already started.</p>
              </li>
              
              <li className="flex items-start">
                <span className="text-green-400 mr-3 mt-1.5">•</span>
                <p>There is no cancellation of registrations for tournaments scheduled for the same day.</p>
              </li>

              <li className="flex items-start">
                <span className="text-green-400 mr-3 mt-1.5">•</span>
                <p>No cancellations are entertained for those tournament registrations that the GameOn marketing team has obtained on special occasions like festive events or seasonal championships. These are limited occasion offers and therefore cancellations are not possible.</p>
              </li>

              <li className="flex items-start">
                <span className="text-green-400 mr-3 mt-1.5">•</span>
                <p>VIVEK BADGUJAR does not accept cancellation requests due to user-end issues such as internet connectivity problems or device malfunctions. However, a refund can be made if a technical error occurs from the platform side preventing participation despite successful payment.</p>
              </li>

              <li className="flex items-start">
                <span className="text-green-400 mr-3 mt-1.5">•</span>
                <p>In case of payment being deducted but participation not being confirmed, please report the same to our Customer Service team. The request will, however, be entertained once GameOn has checked and determined the same at its own end. This should be reported within 24 hours of the transaction.</p>
              </li>

              <li className="flex items-start">
                <span className="text-green-400 mr-3 mt-1.5">•</span>
                <p>In case you feel that the tournament experience is not as described on the site or as per your expectations, you must bring it to the notice of our customer service within 24 hours of the tournament completion. The Customer Service Team after looking into your complaint will take an appropriate decision.</p>
              </li>

              <li className="flex items-start">
                <span className="text-green-400 mr-3 mt-1.5">•</span>
                <p>Refunds are NOT applicable in cases of user withdrawal, disqualification due to rule violations, late joining, or no-show for the scheduled tournament.</p>
              </li>

              <li className="flex items-start">
                <span className="text-green-400 mr-3 mt-1.5">•</span>
                <p>In case of any Refunds approved by VIVEK BADGUJAR, it’ll take 5–7 working days for the refund to be processed to the original payment method of the end customer.</p>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-wrap gap-4 justify-center"
        >
          <Link 
            href="/terms" 
            className="text-white/40 hover:text-white transition-colors text-sm"
          >
            Terms & Conditions
          </Link>
          <span className="text-white/20">•</span>
          <Link 
            href="/privacy" 
            className="text-white/40 hover:text-white transition-colors text-sm"
          >
            Privacy Policy
          </Link>
          <span className="text-white/20">•</span>
          <Link 
            href="/refund" 
            className="text-white/40 hover:text-white transition-colors text-sm font-semibold"
          >
            Refund Policy
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}

export default RefundPolicy;
