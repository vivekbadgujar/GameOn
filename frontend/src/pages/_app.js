import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import { WalletProvider } from '../contexts/WalletContext';
import { NotificationProvider } from '../contexts/NotificationContext';

// Layout Components
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SupportChat from '../components/UI/SupportChat';
import NotificationSystem from '../components/UI/NotificationSystem';
import NotificationToast from '../components/UI/NotificationToast';
import GlobalNotifications from '../components/UI/GlobalNotifications';
import ModernBackground from '../components/UI/ModernBackground';
import ClientOnly from '../components/ClientOnly';

// Import styles
import '../styles/globals.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('GlobalErrorBoundary caught an error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md w-full glass-card p-6 text-center">
            <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
            <p className="text-white/70 mt-2">Please refresh the page and try again.</p>
            <button
              className="btn-primary mt-4"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <WalletProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
              <ModernBackground />
              
              {/* Global Notifications */}
              <GlobalNotifications />
              
              {/* Main App Content */}
              <div className="relative z-10">
                <ClientOnly>
                  <Header />
                </ClientOnly>
                
                <main className="min-h-screen">
                  <ClientOnly>
                    <GlobalErrorBoundary>
                      <Component {...pageProps} />
                    </GlobalErrorBoundary>
                  </ClientOnly>
                </main>
                
                <Footer />
              </div>
              
              {/* Support Chat */}
              <SupportChat />
              
              {/* Notification Systems */}
              <NotificationSystem />
              <NotificationToast />
              
              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #374151',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </SocketProvider>
        </WalletProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default MyApp;