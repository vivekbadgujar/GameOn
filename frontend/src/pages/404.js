import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | GameOn</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center px-4"
        >
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-purple-500 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
            <p className="text-gray-300 text-lg mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </motion.button>
            </Link>
            
            <div>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors ml-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}