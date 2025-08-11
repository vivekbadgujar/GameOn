# GameOn Mobile App

A React Native mobile application for the GameOn gaming tournament platform.

## Features

### 🎮 Core Features
- **Tournament Management**: Browse, join, and participate in gaming tournaments
- **Real-time Updates**: Live tournament status and participant updates
- **Wallet Integration**: Add money, withdraw earnings, and track transactions
- **Leaderboards**: View rankings and compete with other players
- **Push Notifications**: Stay updated with tournament alerts and announcements
- **Profile Management**: Manage your gaming profile and statistics

### 🎯 Supported Games
- BGMI (Battlegrounds Mobile India)
- Free Fire
- Call of Duty Mobile

### 📱 Screens
- **Authentication**: Login and registration
- **Home Dashboard**: Overview of tournaments and stats
- **Tournaments**: Browse and filter available tournaments
- **Tournament Details**: Detailed view with join functionality
- **My Tournaments**: Track your joined tournaments
- **Wallet**: Manage your balance and transactions
- **Profile**: User settings and statistics
- **Notifications**: View and manage notifications
- **Room Lobby**: Tournament room with real-time updates
- **Leaderboard**: Rankings and achievements

## Tech Stack

### Frontend
- **React Native**: 0.72.7
- **React Navigation**: 6.x for navigation
- **Redux Toolkit**: State management
- **React Native Paper**: UI components
- **React Native Vector Icons**: Icon library
- **React Native Linear Gradient**: Gradient backgrounds
- **Socket.IO Client**: Real-time communication

### Backend Integration
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data persistence
- **Redux Persist**: State persistence

### Push Notifications
- **Firebase Cloud Messaging**: Push notifications
- **React Native Push Notification**: Local notifications

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Metro**: React Native bundler

## Installation

### Prerequisites
- Node.js (>= 16)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GameOn-Platform/mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Android Setup**
   - Ensure Android SDK is installed
   - Create a virtual device in Android Studio

5. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update API endpoints and configuration

### Running the App

#### Development Mode

**Android**
```bash
npm run android
```

**iOS**
```bash
npm run ios
```

**Start Metro Bundler**
```bash
npm start
```

#### Production Build

**Android**
```bash
npm run build:android
```

**iOS**
```bash
npm run build:ios
```

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── LoadingSpinner.js
│   │   ├── LoadingScreen.js
│   │   └── TournamentCard.js
│   ├── config/              # App configuration
│   │   └── index.js
│   ├── navigation/          # Navigation setup
│   │   └── AppNavigator.js
│   ├── providers/           # Context providers
│   │   └── SyncProvider.js
│   ├── screens/             # App screens
│   │   ├── AuthScreen.js
│   │   ├── HomeScreen.js
│   │   ├── TournamentsScreen.js
│   │   ├── TournamentDetailsScreen.js
│   │   ├── MyTournamentsScreen.js
│   │   ├── WalletScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── NotificationsScreen.js
│   │   ├── RoomLobbyScreen.js
│   │   ├── LeaderboardScreen.js
│   │   └── SplashScreen.js
│   ├── store/               # Redux store
│   │   ├── index.js
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── tournamentsSlice.js
│   │       ├── walletSlice.js
│   │       ├── notificationsSlice.js
│   │       └── syncSlice.js
│   └── theme/               # App theming
│       └── index.js
├── android/                 # Android-specific files
├── ios/                     # iOS-specific files
├── App.js                   # Root component
└── package.json
```

## Configuration

### API Configuration
Update `src/config/index.js` with your backend API endpoints:

```javascript
export const API_CONFIG = {
  BASE_URL: 'https://your-api-domain.com',
  TIMEOUT: 10000,
};
```

### Firebase Setup
1. Create a Firebase project
2. Add Android/iOS apps to the project
3. Download configuration files:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS
4. Place files in respective platform directories

### Push Notifications
Configure Firebase Cloud Messaging:
1. Enable FCM in Firebase console
2. Update notification settings in `src/config/index.js`
3. Test notifications using Firebase console

## State Management

The app uses Redux Toolkit for state management with the following slices:

- **authSlice**: User authentication and profile
- **tournamentsSlice**: Tournament data and operations
- **walletSlice**: Wallet balance and transactions
- **notificationsSlice**: Push notifications and alerts
- **syncSlice**: Real-time synchronization status

## API Integration

### Authentication
- Login/Register with email and password
- JWT token-based authentication
- Automatic token refresh

### Tournaments
- Fetch available tournaments
- Join tournaments with entry fee
- Real-time tournament updates
- Tournament history and results

### Wallet
- View balance and transaction history
- Add money via payment gateway
- Withdraw earnings to bank account
- Transaction notifications

### Real-time Features
- Live tournament updates
- Participant status changes
- Room lobby synchronization
- Push notifications

## Styling and Theming

The app uses a dark theme with orange accents:

- **Primary Color**: #FF6B35 (Orange)
- **Secondary Color**: #F7931E (Light Orange)
- **Background**: #121212 (Dark)
- **Surface**: #1E1E1E (Dark Gray)
- **Text**: #FFFFFF (White)

Customize colors in `src/theme/index.js`.

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Linting
```bash
npm run lint
```

## Deployment

### Android
1. Generate signed APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
2. Upload to Google Play Store

### iOS
1. Archive in Xcode
2. Upload to App Store Connect

## Performance Optimization

### Bundle Size
- Use Hermes JavaScript engine
- Enable ProGuard for Android
- Optimize images and assets

### Memory Management
- Implement proper component cleanup
- Use FlatList for large datasets
- Optimize image loading with FastImage

### Network Optimization
- Implement request caching
- Use compression for API responses
- Implement offline functionality

## Security

### Data Protection
- Secure token storage with Keychain/Keystore
- API request encryption
- Input validation and sanitization

### Authentication
- JWT token expiration handling
- Biometric authentication support
- Session management

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build failures**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS build issues**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Network connectivity**
   - Check API endpoint configuration
   - Verify network permissions
   - Test with different network conditions

### Debug Mode
Enable debug mode for detailed logging:
```javascript
// In src/config/index.js
export const DEBUG_MODE = __DEV__;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add JSDoc comments for functions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## Changelog

### v1.0.0
- Initial release
- Core tournament functionality
- Wallet integration
- Push notifications
- Real-time updates
- User authentication
- Profile management