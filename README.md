# 🎮 GameOn: AI-Powered BGMI Tournament Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Latest-purple)](https://reactnative.dev/)

Welcome to **GameOn** - A comprehensive, AI-powered BGMI tournament platform designed for Indian college gamers and casual players. This platform provides seamless tournament management, secure payment integration, and advanced AI-based anti-cheat systems.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm or yarn
- MongoDB (for backend)
- Git

### One-Click Setup
```bash
# Clone the repository
git clone <repository-url>
cd GameOn

# Quick start script
./quick-start.sh
```

### Manual Setup
```bash
# Install root dependencies
npm install

# Setup backend
cd backend && npm install
cp .env.example .env
# Configure your environment variables

# Setup frontend
cd ../frontend && npm install

# Setup mobile app
cd ../mobile && npm install

# Setup admin panel
cd ../admin-panel && npm install
```

### Start Development Servers
```bash
# Start all services (recommended)
npm run dev

# Or start individually:
npm run start:backend    # Backend API server
npm run start:frontend   # React web app
npm run start:mobile     # React Native app
npm run start:admin      # Admin panel
```

## 📱 Applications

| Application | Technology | Port | Description |
|-------------|------------|------|-------------|
| **Backend API** | Node.js + Express | 5000 | Core API server with MongoDB |
| **Web Frontend** | React.js + Tailwind | 3000 | Tournament platform web interface |
| **Mobile App** | React Native + Expo | - | Mobile application for tournaments |
| **Admin Panel** | React.js | 3001 | Administrative dashboard |

## 🌟 Key Features

### For Players
- 📱 **Cross-Platform**: Web and mobile applications
- 🎯 **Tournament Participation**: Join solo, duo, or squad tournaments
- 💰 **Secure Payments**: Razorpay integration for entry fees
- 🏆 **Real-time Leaderboards**: Track rankings and statistics
- 🎮 **Gamification**: XP points, badges, and achievements
- 📷 **AI Screenshot Verification**: Automated result validation
- 💬 **In-game Chat**: Moderated communication system
- 👥 **Room Lobby System**: Pre-tournament gathering spaces

### For Admins
- 📊 **Tournament Management**: Create, edit, and monitor tournaments
- 👨‍💼 **User Management**: Player profiles, bans, and statistics
- 💸 **Payment Tracking**: Transaction monitoring and payouts
- 🤖 **AI Flag Review**: Review AI-detected suspicious activities
- 📈 **Analytics Dashboard**: Comprehensive platform insights
- 📤 **Data Export**: User and tournament data export features

### AI-Powered Anti-Cheat
- 🔍 **Screenshot Analysis**: Google Vision API text extraction
- 🌐 **IP Conflict Detection**: Multi-account detection
- 🤖 **Chat Moderation**: OpenAI-powered message filtering
- ⚡ **Real-time Monitoring**: Automated flag generation

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + OTP verification
- **Payments**: Razorpay integration
- **File Storage**: Cloudinary for media storage
- **Real-time**: Socket.io for live updates

### Frontend
- **Web**: React.js with Tailwind CSS
- **Mobile**: React Native with Expo
- **State Management**: Context API + React Query
- **UI Components**: Headless UI + Heroicons
- **Animations**: Framer Motion

### AI & External Services
- **Computer Vision**: Google Vision API
- **Chat Moderation**: OpenAI API
- **SMS**: OTP service integration
- **Analytics**: Custom analytics dashboard

## 📁 Project Structure

```
GameOn/
├── 📁 backend/                 # Node.js API server
│   ├── 📁 config/             # Database and service configurations
│   ├── 📁 middleware/         # Auth, validation, and security middleware
│   ├── 📁 models/             # MongoDB schemas and models
│   ├── 📁 routes/             # API endpoints and route handlers
│   ├── 📁 services/           # Business logic and external services
│   ├── 📁 utils/              # Helper functions and utilities
│   └── 📄 server.js           # Main server entry point
│
├── 📁 frontend/               # React.js web application
│   ├── 📁 public/             # Static assets and HTML template
│   ├── 📁 src/
│   │   ├── 📁 components/     # Reusable UI components
│   │   ├── 📁 pages/          # Page-level components
│   │   ├── 📁 services/       # API service functions
│   │   ├── 📁 contexts/       # React context providers
│   │   └── 📁 utils/          # Frontend utility functions
│   └── 📄 package.json
│
├── 📁 mobile/                 # React Native mobile app
│   ├── 📁 src/
│   │   ├── 📁 components/     # Mobile-specific components
│   │   ├── 📁 screens/        # App screens/pages
│   │   ├── 📁 navigation/     # Navigation configuration
│   │   ├── 📁 providers/      # State management providers
│   │   └── 📁 utils/          # Mobile utility functions
│   └── 📄 app.json
│
├── 📁 admin-panel/            # Admin dashboard application
│   ├── 📁 src/
│   │   ├── 📁 components/     # Admin-specific components
│   │   └── 📁 services/       # Admin API services
│   └── 📄 package.json
│
├── 📁 shared/                 # Shared code between platforms
│   └── 📁 services/           # Common API service layer
│
└── 📁 docs/                   # Documentation files
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gameon
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GOOGLE_VISION_API_KEY=your_google_vision_key
OPENAI_API_KEY=your_openai_key
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key
REACT_APP_SOCKET_URL=http://localhost:5000
```

#### Mobile (app.json)
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:5000/api",
      "socketUrl": "http://localhost:5000"
    }
  }
}
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/send-otp          # Send OTP to mobile number
POST /api/auth/verify-otp        # Verify OTP and login
POST /api/admin/login            # Admin login with credentials
```

### Tournament Endpoints
```
GET    /api/tournaments          # List all tournaments
GET    /api/tournaments/:id      # Get tournament details
POST   /api/tournaments/:id/join # Join a tournament
POST   /api/tournaments/:id/upload-screenshot # Upload result screenshot
```

### User Management
```
GET    /api/users/profile        # Get user profile
PUT    /api/users/profile        # Update user profile
GET    /api/users/wallet         # Get wallet balance
GET    /api/users/leaderboard    # Get leaderboard rankings
```

### Admin Operations
```
GET    /api/admin/tournaments    # List all tournaments (admin)
POST   /api/admin/tournaments    # Create new tournament
PUT    /api/admin/tournaments/:id # Update tournament
DELETE /api/admin/tournaments/:id # Delete tournament
GET    /api/admin/users          # List all users
POST   /api/admin/users/:id/ban  # Ban a user
GET    /api/admin/flags          # Get AI-flagged activities
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Mobile tests
cd mobile && npm test

# Run all tests
npm run test:all
```

### Test Coverage
- Unit tests for API endpoints
- Integration tests for payment flows
- E2E tests for critical user journeys
- AI service mocking for reliable testing

## 🚀 Deployment

### Production Deployment
```bash
# Build all applications
npm run build:all

# Deploy backend (PM2)
pm2 start backend/ecosystem.config.js

# Deploy frontend (Nginx)
npm run deploy:frontend

# Deploy mobile app
cd mobile && expo publish
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write unit tests for new features
- Update documentation for API changes
- Use conventional commits for commit messages

## 📖 Documentation

### Additional Resources
- [API Specification](./docs/api-spec.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Mobile Testing Guide](./mobile/testing/DeviceTestingGuide.md)
- [Admin Panel Setup](./ADMIN_PANEL_STATUS.md)
- [Tournament Flow](./TOURNAMENT_FLOW_README.md)

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Check port availability
lsof -i :5000

# Clear node modules and reinstall
rm -rf node_modules package-lock.json && npm install
```

#### Mobile app build fails
```bash
# Clear Expo cache
expo start -c

# Reset Metro cache
npx react-native start --reset-cache
```

#### Payment integration issues
- Verify Razorpay credentials in environment variables
- Check webhook URL configuration in Razorpay dashboard
- Ensure SSL certificate is valid for production

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- BGMI gaming community for feedback and testing
- Contributors and maintainers
- Open source libraries and frameworks used

---

## 🎨 Design Documentation

The platform's design will be clean, modern, and imbued with a gaming aesthetic to resonate with the target audience.

-   **Theme**: A clean, dark theme will be the foundation, creating an immersive experience. Key elements will be highlighted with neon green and purple to create a vibrant, "gaming vibe."
-   **Tournament Listings**: Tournaments will be displayed in a card-style layout. Each card will show essential information at a glance: Tournament Name, Date/Time, Entry Fee, Prize Pool, and Team Type (Solo, Duo, Squad).
-   **Calls-to-Action (CTAs)**: Buttons for critical actions like "Join Match" or "Register" will use a high-contrast neon green or purple to stand out and guide user interaction.
-   **AI Verification Badge**: To build trust, screenshots verified by our AI will feature a distinct "AI Verified" badge.
-   **Gamification**: A simple XP system will be implemented. Players earn XP for participating and winning matches. Accumulating XP unlocks badges (e.g., "Weekly Winner," "Headshot Master") that are displayed on their profiles.

---

## 📊 Database Schema (Firebase/Supabase)

Here is a foundational schema. We'll use a NoSQL approach with Firebase's Firestore for flexibility and real-time capabilities.

-   **users**:
    -   `uid` (Primary Key)
    -   `name`
    -   `mobile` (for OTP auth)
    -   `gameID`
    -   `walletBalance`
    -   `xpPoints`
    -   `unlockedBadges` (Array)
    -   `matchHistory` (Array of `tournamentID`)
    -   `referralCode`
    -   `createdAt`
-   **tournaments**:
    -   `tournamentID` (Primary Key)
    -   `title`
    -   `map` (e.g., Erangel, Sanhok)
    -   `teamType` (Solo, Duo, Squad)
    -   `prizePool`
    -   `entryFee`
    -   `status` (Upcoming, Active, Completed, Canceled)
    -   `scheduledAt`
    -   `roomID` (Encrypted)
    -   `roomPassword` (Encrypted)
    -   `participants` (Array of `userID`)
    -   `winner` (userID or teamID)
-   **participants**:
    -   `participationID` (Primary Key)
    -   `userID`
    -   `tournamentID`
    -   `finalRank`
    -   `kills`
    -   `screenshotURL`
    -   `isVerified` (Boolean, set by AI)
    -   `reviewStatus` (Pending, Approved, Flagged)
-   **transactions**:
    -   `transactionID` (Primary Key)
    -   `userID`
    -   `amount`
    -   `type` (EntryFee, PrizeWin, WalletTopUp)
    -   `razorpayPaymentID`
    -   `timestamp`
-   **adminUsers**:
    -   `adminID` (Primary Key)
    -   `email`
    -   `hashedPassword`
-   **notifications**:
    -   `notificationID` (Primary Key)
    -   `userID` (or `broadcast: true`)
    -   `message`
    -   `isRead`
    -   `createdAt`
-   **aiFlags**:
    -   `flagID` (Primary Key)
    -   `userID`
    -   `tournamentID`
    -   `reason` (e.g., "ScreenshotMismatch", "IPConflict", "FakeUpload")
    -   `details` (Object with AI-detected data)
    -   `status` (PendingReview, Resolved)

---

## ⚙️ Backend APIs (Node.js + Express)

API endpoints will be structured by resource. All routes will be prefixed with `/api`.

-   **Auth**:
    -   `POST /auth/send-otp`
    -   `POST /auth/verify-otp`
    -   `POST /admin/login`
-   **Users**:
    -   `GET /users/profile` (Get own profile)
    -   `PUT /users/profile` (Update profile/gameID)
    -   `GET /users/wallet`
    -   `GET /users/leaderboard`
-   **Tournaments**:
    -   `GET /tournaments` (List all)
    -   `GET /tournaments/:id` (Get details)
    -   `POST /tournaments/:id/join` (Join a match)
    -   `POST /tournaments/:id/upload-screenshot`
-   **Admin**:
    -   `GET /admin/tournaments`
    -   `POST /admin/tournaments` (Create)
    -   `PUT /admin/tournaments/:id` (Edit)
    -   `DELETE /admin/tournaments/:id`
    -   `POST /admin/tournaments/:id/set-room` (Set Room ID/Pass)
    -   `POST /admin/rewards/distribute`
    -   `GET /admin/flags` (See AI-flagged entries)
    -   `POST /admin/users/:id/ban`

---

## 🛒 Payment Integration (Razorpay)

-   **Frontend**: Integrate Razorpay's Checkout SDK. On "Join Match," call our backend to create a Razorpay order. The `order_id` is passed to the frontend SDK, which opens the payment modal.
-   **Backend**:
    1.  Create an API endpoint `POST /payments/create-order` that takes `amount` and `currency`.
    2.  It uses the Razorpay Node.js SDK to create an order and returns the `order_id` to the frontend.
    3.  Create a webhook endpoint `POST /payments/webhook` to listen for Razorpay events (e.g., `payment.captured`).
    4.  When a payment is successful, the webhook handler will securely verify the signature, update the user's wallet, and add the user to the tournament participants list.

---

## 🧠 AI Modules

AI is our core differentiator. We'll use a serverless function (Firebase Functions) to handle these tasks asynchronously.

1.  **Screenshot Verifier**:
    -   **Trigger**: A new file is uploaded to the "screenshots" bucket in Firebase Storage.
    -   **Process**:
        1.  The Firebase Function executes.
        2.  It sends the image URL to **Google Vision API**'s `TEXT_DETECTION` feature.
        3.  The API returns the recognized text.
        4.  Our code parses this text to find keywords like "Rank," "Kills," and player names.
        5.  It compares the extracted data with the player's claim. If `rank: "#1"` but screenshot shows `"#10"`, it creates a record in the `aiFlags` table.
        6.  It also checks for image properties to detect potential tampering (e.g., unusual blurriness, conflicting metadata), flagging suspicious uploads.

2.  **Cheat Detection (IP Tracking)**:
    -   **Trigger**: On user login or when joining a tournament.
    -   **Process**:
        1.  Log the user's IP address with their `userID` for the session.
        2.  A backend process checks if multiple `userIDs` are participating in the *same tournament* from the *same IP address*.
        3.  If a conflict is found, an entry is created in the `aiFlags` table for manual admin review.

3.  **In-App Chat Moderator**:
    -   **Process**: All chat messages are passed through a simple API call to the **OpenAI API**.
    -   **Prompt**: The prompt will be engineered to classify text, e.g., `"Classify the following message as \'safe\' or \'abusive\': [message]"`.
    -   If "abusive" is returned, the message is blocked or flagged.

---

## 📁 Project Folder Structure

A clean, scalable folder structure is key.

```
GameOn-Platform/
├── .git/
├── .github/
│   └── workflows/      # CI/CD pipelines (e.g., deploy.yml)
├── backend/            # Node.js + Express API
│   ├── src/
│   │   ├── api/        # Express routes (tournaments.js, users.js)
│   │   ├── config/     # Environment variables, Firebase/Supabase config
│   │   ├── controllers/ # Business logic (paymentController.js)
│   │   ├── models/     # Database interaction logic
│   │   ├── services/   # External API clients (razorpay.js, vision.js)
│   │   └── utils/      # Shared helper functions
│   ├── functions/      # Serverless functions (for AI tasks)
│   ├── package.json
│   └── .env.example
├── frontend/           # React.js (Web) + React Native (App)
│   ├── web/            # React.js web app
│   │   ├── public/
│   │   └── src/
│   │       ├── assets/
│   │       ├── components/ # Reusable UI components (TournamentCard.js)
│   │       ├── pages/    # Top-level pages (Dashboard.js, Profile.js)
│   │       ├── services/ # API call functions
│   │       └── App.js
│   ├── mobile/         # React Native app
│   │   └── ...         # Standard React Native structure
│   └── package.json
├── docs/               # Project documentation
│   └── api-spec.md     # OpenAPI/Swagger specs
└── README.md
```
