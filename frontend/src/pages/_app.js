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
import Router from 'next/router';
import { useRouter } from 'next/router';

// Import styles
import '../styles/globals.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null, errorStack: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || String(error), errorStack: error?.stack || null };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo);

    // Save last error to window so we can inspect it in the browser console during debugging
    if (typeof window !== 'undefined') {
      try {
        window.__lastGlobalError = {
          message: error?.message || String(error),
          stack: error?.stack || null,
          componentStack: errorInfo?.componentStack || null,
          path: window.location?.pathname || null
        };
      } catch (e) {
        // ignore
      }
    }
  }

  componentDidMount() {
    // Reset boundary state on route changes so an earlier error doesn't block navigation
    if (Router && Router.events) {
      this._handleRouteChange = () => {
        if (this.state.hasError) {
          this.setState({ hasError: false, errorMessage: null, errorStack: null });
        }
      };

      Router.events.on('routeChangeStart', this._handleRouteChange);
    }
  }

  componentWillUnmount() {
    if (Router && Router.events && this._handleRouteChange) {
      Router.events.off('routeChangeStart', this._handleRouteChange);
    }
  }

  render() {
    if (this.state.hasError) {
      // Determine current path and whether to suppress the full-screen fallback
      const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
      const isSensitiveRoute = path === '/profile' || path.startsWith('/tournaments');

      // Always log the error with path context
      if (typeof console !== 'undefined') {
        console.error('GlobalErrorBoundary caught an error on path', path, this.state.errorMessage, this.state.errorStack);
      }

      // For Profile and Tournament routes, show a compact inline notice (do NOT show full-screen "Something went wrong" page)
      if (isSensitiveRoute) {
        return (
          <div className="min-h-screen pt-20 pb-8">
            <div className="container-custom">
              <div className="glass-card p-4 mb-6 bg-yellow-600/10 border border-yellow-600/20 text-white/80">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Notice</div>
                    <div className="text-sm mt-1">An error occurred while rendering this page, but you can continue; details are in the console for debugging.</div>
                    {this.state.errorMessage && <div className="mt-2 text-sm text-yellow-200">{this.state.errorMessage}</div>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="btn-secondary" onClick={() => window.location.reload()}>Reload</button>
                    <button className="btn-primary" onClick={() => { if (typeof window !== 'undefined') window.location.href = path; }}>Continue</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Default full-page fallback for other routes
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md w-full glass-card p-6 text-center">
            <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
            <p className="text-white/70 mt-2">Please refresh the page and try again.</p>

            {this.state.errorMessage && (
              <div className="mt-4 text-left text-sm text-red-200 bg-black/20 p-3 rounded">
                <div className="font-semibold">Error:</div>
                <div>{this.state.errorMessage}</div>
                {this.state.errorStack && (
                  <pre className="mt-2 text-xs overflow-auto max-h-40">{this.state.errorStack}</pre>
                )}
              </div>
            )}

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
  const router = useRouter();
  const currentPath = router?.asPath || router?.pathname || '';
  const disableGlobalBoundary =
    currentPath === '/profile' ||
    currentPath.startsWith('/tournaments') ||
    currentPath.startsWith('/tournament');

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
                    {disableGlobalBoundary ? (
                      <Component {...pageProps} />
                    ) : (
                      <GlobalErrorBoundary>
                        <Component {...pageProps} />
                      </GlobalErrorBoundary>
                    )}
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