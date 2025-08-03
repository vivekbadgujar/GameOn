import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Device detection
import { isMobileApp, getDeviceType } from './utils/deviceDetection';

// Layout Components
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/UI/LoadingSpinner';
import SupportChat from './components/UI/SupportChat';
import NotificationSystem from './components/UI/NotificationSystem';
import NotificationToast from './components/UI/NotificationToast';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const TournamentDetails = lazy(() => import('./pages/TournamentDetailsRedesigned'));
const MediaGallery = lazy(() => import('./pages/MediaGallery'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Support = lazy(() => import('./pages/Support'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Policy Pages
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const FairPlayPolicy = lazy(() => import('./pages/FairPlayPolicy'));

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route wrapper (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Mobile App Route wrapper (shows login first for mobile apps)
const MobileAppRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const deviceType = getDeviceType();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (deviceType === 'mobile-app' && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Main App Routes Component (needs to be inside AuthProvider)
const AppRoutes = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Global Components */}
      <Header />
      <NotificationSystem />
      <NotificationToast />
      <SupportChat />
      
      {/* Main Content */}
      <main className="relative">
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes>
                    {/* Public Routes */}
                    <Route 
                      path="/login" 
                      element={
                        <PublicRoute>
                          <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Login />
                          </motion.div>
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/register" 
                      element={
                        <PublicRoute>
                          <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Register />
                          </motion.div>
                        </PublicRoute>
                      } 
                    />
                    
                    {/* Dashboard - public for web, requires auth for mobile app */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <MobileAppRoute>
                          <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Dashboard />
                          </motion.div>
                        </MobileAppRoute>
                      } 
                    />
                    
                    {/* Protected Routes */}
                    <Route 
                      path="/tournaments" 
                      element={
                        <ProtectedRoute>
                          <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Tournaments />
                          </motion.div>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/tournament/:id" 
                      element={
                        <ProtectedRoute>
                          <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <TournamentDetails />
                          </motion.div>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/media" 
                      element={
                        <motion.div
                          initial="initial"
                          animate="in"
                          exit="out"
                          variants={pageVariants}
                          transition={pageTransition}
                        >
                          <MediaGallery />
                        </motion.div>
                      } 
                    />
                    {/* Redirect old routes to new combined page */}
                    <Route path="/videos" element={<Navigate to="/media" replace />} />
                    <Route path="/gallery" element={<Navigate to="/media" replace />} />
                    <Route 
                      path="/wallet" 
                      element={
                        <ProtectedRoute>
                          <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Wallet />
                          </motion.div>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/support" 
                      element={
                        <ProtectedRoute>
                          <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Support />
                          </motion.div>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Profile />
                          </motion.div>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Policy Pages - Public Routes */}
                    <Route 
                      path="/terms" 
                      element={
                        <motion.div
                          initial="initial"
                          animate="in"
                          exit="out"
                          variants={pageVariants}
                          transition={pageTransition}
                        >
                          <TermsAndConditions />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/privacy" 
                      element={
                        <motion.div
                          initial="initial"
                          animate="in"
                          exit="out"
                          variants={pageVariants}
                          transition={pageTransition}
                        >
                          <PrivacyPolicy />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/refund" 
                      element={
                        <motion.div
                          initial="initial"
                          animate="in"
                          exit="out"
                          variants={pageVariants}
                          transition={pageTransition}
                        >
                          <RefundPolicy />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/fairplay" 
                      element={
                        <motion.div
                          initial="initial"
                          animate="in"
                          exit="out"
                          variants={pageVariants}
                          transition={pageTransition}
                        >
                          <FairPlayPolicy />
                        </motion.div>
                      } 
                    />
                    
                    {/* Redirects */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#32ff7e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4757',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;