# 🎯 GameOn Unified Platform

A comprehensive gaming tournament platform that works seamlessly across **Web** and **Mobile** with real-time synchronization, just like Amazon's unified experience.

## 🌟 Key Features

### ✅ **Single Backend & Database**
- One central Node.js + Express backend
- MongoDB database for all platforms
- Shared business logic and validation
- No platform-specific data silos

### ✅ **API-First Architecture**
- RESTful APIs for all operations
- Consistent data flow across platforms
- Secure JWT authentication
- Real-time WebSocket events

### ✅ **Real-Time Sync**
- Instant updates across all devices
- Socket.IO for real-time communication
- Cross-platform state synchronization
- Offline-first mobile architecture

### ✅ **Unified Authentication**
- JWT tokens work across platforms
- Multi-device session management
- Secure cross-platform login
- Session persistence and sync

### ✅ **Cross-Platform Features**
- Tournament joining/leaving
- Wallet transactions
- Slot management
- Push notifications
- Live updates

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Mobile App     │
│   (React.js)    │    │ (React Native)  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │   HTTP/WebSocket     │
          │                      │
    ┌─────┴──────────────────────┴─────┐
    │        Backend Server            │
    │      (Node.js + Express)         │
    │                                  │
    │  ┌─────────────────────────────┐ │
    │  │     Sync Service            │ │
    │  │  - Real-time updates        │ │
    │  │  - Cross-platform sync      │ │
    │  │  - Session management       │ │
    │  └─────────────────────────────┘ │
    │                                  │
    │  ┌─────────────────────────────┐ │
    │  │  Push Notification Service  │ │
    │  │  - Web push notifications   │ │
    │  │  - Mobile push via Firebase │ │
    │  └─────────────────────────────┘ │
    └─────────────┬────────────────────┘
                  │
    ┌─────────────┴────────────────────┐
    │         MongoDB Database         │
    │  - Users & Authentication        │
    │  - Tournaments & Participants    │
    │  - Wallet & Transactions         │
    │  - Real-time Session Data        │
    └──────────────────────────────────┘
```

## 🚀 Quick Start

### 1. **Setup & Installation**

```bash
# Clone the repository
git clone <repository-url>
cd GameOn-Platform

# Run the unified setup script
node setup-unified-platform.js

# Initialize database
npm run init-db

# Start development servers
npm run dev
```

### 2. **Manual Setup (Alternative)**

```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev

# Frontend setup
cd ../frontend
npm install
cp .env.example .env
# Configure your environment variables
npm start

# Mobile setup
cd ../mobile
npm install
# Configure your environment variables
npm start
```

## 📱 Platform-Specific Setup

### **Web Frontend**
- **Framework**: React.js
- **State Management**: Redux Toolkit
- **Real-time**: Socket.IO Client
- **Styling**: CSS Modules + Styled Components
- **Build**: Create React App

### **Mobile App**
- **Framework**: React Native
- **State Management**: Redux Toolkit
- **Real-time**: Socket.IO Client
- **Navigation**: React Navigation
- **Push Notifications**: Firebase Cloud Messaging
- **Offline Storage**: AsyncStorage + Redux Persist

### **Backend**
- **Framework**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Refresh Tokens
- **Real-time**: Socket.IO
- **Push Notifications**: Firebase Admin SDK

## 🔄 Real-Time Sync Examples

### **Tournament Join Flow**
```javascript
// User joins tournament on mobile app
1. Mobile App → API: POST /api/tournaments/:id/join
2. Backend → Database: Update tournament participants
3. Backend → Sync Service: Broadcast tournament_sync event
4. Sync Service → All Platforms: Real-time update
5. Web Frontend: Auto-updates tournament status
6. Push Notification: Sent to all user devices
```

### **Wallet Update Flow**
```javascript
// User adds money on website
1. Web Frontend → API: POST /api/wallet/add-money
2. Backend → Payment Gateway: Process payment
3. Backend → Database: Update wallet balance
4. Backend → Sync Service: Broadcast wallet_sync event
5. Mobile App: Instantly shows new balance
6. Push Notification: "Wallet credited ₹500"
```

## 🛠️ Development

### **Project Structure**
```
GameOn-Platform/
├── backend/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   │   ├── syncService.js  # Real-time sync
│   │   └── pushNotificationService.js
│   └── server.js           # Main server file
├── frontend/               # React.js web app
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── services/       # API services
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── store/          # Redux store
│   │   └── providers/      # Context providers
├── shared/                 # Shared utilities
│   └── services/           # Unified API service
└── setup-unified-platform.js
```

### **Available Scripts**

```bash
# Development
npm run dev              # Start backend + frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run dev:mobile       # Start mobile development

# Production
npm run build            # Build all platforms
npm run start:all        # Start production servers

# Database
npm run init-db          # Initialize database
npm run seed-data        # Seed sample data

# Testing
npm run test             # Run all tests
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
```

## 🔧 Configuration

### **Environment Variables**

#### **Backend (.env)**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gameon
JWT_SECRET=your-super-secret-key

# Unified Platform Features
ENABLE_SYNC_SERVICE=true
ENABLE_PUSH_NOTIFICATIONS=true

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Razorpay
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
```

#### **Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
REACT_APP_ENABLE_SYNC=true

# Firebase Web Push
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
```

#### **Mobile (.env)**
```env
API_BASE_URL=http://localhost:5000
ENABLE_SYNC=true
ENABLE_PUSH_NOTIFICATIONS=true

# Firebase Mobile
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_APP_ID=your-app-id
```

## 📊 API Documentation

### **Authentication**
```javascript
POST /api/auth/send-otp     # Send OTP
POST /api/auth/verify-otp   # Verify OTP & login
POST /api/auth/refresh      # Refresh JWT token
```

### **Tournaments**
```javascript
GET    /api/tournaments           # Get all tournaments
GET    /api/tournaments/:id       # Get tournament details
POST   /api/tournaments/:id/join  # Join tournament
POST   /api/tournaments/:id/leave # Leave tournament
PUT    /api/tournaments/:id/slot  # Update slot
```

### **Wallet**
```javascript
GET    /api/wallet/balance        # Get balance
GET    /api/wallet/transactions   # Get transaction history
POST   /api/wallet/add-money      # Add money
POST   /api/wallet/deduct         # Deduct money
```

### **Sync**
```javascript
GET    /api/sync/status           # Get sync status
POST   /api/sync/register-device  # Register for push notifications
POST   /api/sync/force-sync       # Force sync data
GET    /api/sync/user-sessions    # Get active sessions
```

## 🔔 Push Notifications

### **Web Push Notifications**
- Service Worker based
- Browser native notifications
- Real-time tournament updates
- Wallet transaction alerts

### **Mobile Push Notifications**
- Firebase Cloud Messaging
- Background notifications
- Deep linking to specific screens
- Rich notifications with actions

## 🎮 Real-Time Features

### **Tournament Updates**
- Live participant count
- Slot availability changes
- Tournament status updates
- Room details distribution

### **Wallet Sync**
- Instant balance updates
- Transaction notifications
- Payment confirmations
- Low balance alerts

### **Session Management**
- Multi-device login detection
- Cross-platform session sync
- Device-specific notifications
- Session security alerts

## 🚀 Deployment

### **Backend Deployment**
```bash
# Using PM2
npm install -g pm2
pm2 start backend/server.js --name "gameon-backend"

# Using Docker
docker build -t gameon-backend ./backend
docker run -p 5000:5000 gameon-backend
```

### **Frontend Deployment**
```bash
# Build for production
cd frontend
npm run build

# Deploy to Vercel/Netlify
# Or serve with nginx/apache
```

### **Mobile App Deployment**
```bash
# Android
cd mobile
npm run build:android

# iOS
npm run build:ios
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate limiting** on all API endpoints
- **Input validation** and sanitization
- **CORS protection** for cross-origin requests
- **Helmet.js** for security headers
- **MongoDB injection** protection
- **XSS protection** on frontend
- **Secure WebSocket** connections

## 📈 Performance Optimizations

- **Database indexing** for fast queries
- **Redis caching** for frequently accessed data
- **Image optimization** and lazy loading
- **Code splitting** in React apps
- **Bundle optimization** for mobile
- **WebSocket connection pooling**
- **Offline-first** mobile architecture

## 🧪 Testing

### **Backend Testing**
```bash
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end tests
```

### **Frontend Testing**
```bash
cd frontend
npm test                   # Run React tests
npm run test:coverage     # Coverage report
npm run test:e2e          # Cypress E2E tests
```

## 🐛 Troubleshooting

### **Common Issues**

#### **Sync Not Working**
1. Check WebSocket connection in browser dev tools
2. Verify JWT token is valid
3. Check server logs for sync service errors
4. Ensure CORS is properly configured

#### **Mobile App Not Connecting**
1. Check API_BASE_URL in mobile config
2. Verify network connectivity
3. Check if backend server is running
4. Review React Native logs

#### **Push Notifications Not Working**
1. Verify Firebase configuration
2. Check notification permissions
3. Test with Firebase console
4. Review service worker registration

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=gameon:* npm run dev

# Check sync service status
curl http://localhost:5000/api/sync/stats

# Monitor WebSocket connections
# Use browser dev tools → Network → WS
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discord**: Join our development Discord server
- **Email**: Contact the development team

---

## 🎉 Success Metrics

After implementing this unified platform, you should achieve:

- ✅ **Real-time sync** < 100ms latency
- ✅ **Cross-platform consistency** 99.9%
- ✅ **Mobile app performance** > 60fps
- ✅ **API response time** < 200ms
- ✅ **Push notification delivery** > 95%
- ✅ **User session sync** across all devices
- ✅ **Offline-first** mobile experience

**Your GameOn platform now works like Amazon - seamless, fast, and unified across all platforms! 🚀**