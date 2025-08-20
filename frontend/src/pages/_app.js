import React from 'react';
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

// Import styles
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <WalletProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              <ModernBackground />
              
              {/* Global Notifications */}
              <GlobalNotifications />
              
              {/* Main App Content */}
              <div className="relative z-10">
                <Header />
                
                <main className="min-h-screen">
                  <Component {...pageProps} />
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