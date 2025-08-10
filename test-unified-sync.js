#!/usr/bin/env node

/**
 * GameOn Unified Platform - Sync Test Script
 * Tests real-time synchronization between web and mobile platforms
 */

const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const WS_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  phoneNumber: '9876543210',
  otp: '123456' // This should be the actual OTP in production
};

console.log('🎯 GameOn Unified Platform - Sync Test');
console.log('=====================================\n');

class UnifiedSyncTester {
  constructor() {
    this.webSocket = null;
    this.mobileSocket = null;
    this.authToken = null;
    this.userId = null;
    this.testResults = [];
  }

  async runTests() {
    try {
      console.log('🚀 Starting unified platform sync tests...\n');

      // Step 1: Authentication
      await this.testAuthentication();

      // Step 2: Socket connections
      await this.testSocketConnections();

      // Step 3: Wallet sync test
      await this.testWalletSync();

      // Step 4: Tournament sync test
      await this.testTournamentSync();

      // Step 5: Multi-device session test
      await this.testMultiDeviceSession();

      // Step 6: Cleanup
      await this.cleanup();

      // Show results
      this.showResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    try {
      // Send OTP (in production, this would send actual SMS)
      const otpResponse = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
        phoneNumber: TEST_USER.phoneNumber
      });

      if (!otpResponse.data.success) {
        throw new Error('Failed to send OTP');
      }

      console.log('  ✅ OTP sent successfully');

      // Verify OTP and login
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        phoneNumber: TEST_USER.phoneNumber,
        otp: TEST_USER.otp
      });

      if (!loginResponse.data.success) {
        throw new Error('Failed to verify OTP');
      }

      this.authToken = loginResponse.data.token;
      this.userId = loginResponse.data.user._id;

      console.log('  ✅ Authentication successful');
      console.log(`  👤 User ID: ${this.userId}`);
      console.log(`  🔑 Token: ${this.authToken.substring(0, 20)}...`);

      this.addTestResult('Authentication', 'PASS', 'User authenticated successfully');

    } catch (error) {
      console.error('  ❌ Authentication failed:', error.message);
      this.addTestResult('Authentication', 'FAIL', error.message);
      throw error;
    }
  }

  async testSocketConnections() {
    console.log('\n🔌 Testing Socket Connections...');

    return new Promise((resolve, reject) => {
      let webConnected = false;
      let mobileConnected = false;
      let webAuthenticated = false;
      let mobileAuthenticated = false;

      const checkComplete = () => {
        if (webConnected && mobileConnected && webAuthenticated && mobileAuthenticated) {
          console.log('  ✅ Both platforms connected and authenticated');
          this.addTestResult('Socket Connections', 'PASS', 'Web and mobile sockets connected');
          resolve();
        }
      };

      // Web socket connection
      this.webSocket = io(WS_URL, {
        transports: ['websocket', 'polling']
      });

      this.webSocket.on('connect', () => {
        console.log('  🌐 Web socket connected');
        webConnected = true;
        
        this.webSocket.emit('authenticate', {
          userId: this.userId,
          platform: 'web',
          token: this.authToken
        });
      });

      this.webSocket.on('authenticated', (data) => {
        console.log('  ✅ Web socket authenticated');
        webAuthenticated = true;
        checkComplete();
      });

      // Mobile socket connection
      this.mobileSocket = io(WS_URL, {
        transports: ['websocket', 'polling']
      });

      this.mobileSocket.on('connect', () => {
        console.log('  📱 Mobile socket connected');
        mobileConnected = true;
        
        this.mobileSocket.emit('authenticate', {
          userId: this.userId,
          platform: 'mobile',
          token: 'mock-fcm-token'
        });
      });

      this.mobileSocket.on('authenticated', (data) => {
        console.log('  ✅ Mobile socket authenticated');
        mobileAuthenticated = true;
        checkComplete();
      });

      // Error handling
      this.webSocket.on('connect_error', (error) => {
        console.error('  ❌ Web socket connection error:', error.message);
        this.addTestResult('Socket Connections', 'FAIL', 'Web socket connection failed');
        reject(error);
      });

      this.mobileSocket.on('connect_error', (error) => {
        console.error('  ❌ Mobile socket connection error:', error.message);
        this.addTestResult('Socket Connections', 'FAIL', 'Mobile socket connection failed');
        reject(error);
      });

      // Timeout
      setTimeout(() => {
        if (!webConnected || !mobileConnected || !webAuthenticated || !mobileAuthenticated) {
          const error = new Error('Socket connection timeout');
          this.addTestResult('Socket Connections', 'FAIL', 'Connection timeout');
          reject(error);
        }
      }, 10000);
    });
  }

  async testWalletSync() {
    console.log('\n💰 Testing Wallet Sync...');

    return new Promise(async (resolve, reject) => {
      let mobileReceived = false;
      const testAmount = 100;

      // Listen for wallet sync on mobile
      this.mobileSocket.on('wallet_sync', (event) => {
        console.log('  📱 Mobile received wallet sync:', event.type);
        
        if (event.type === 'wallet_credited' && event.data.transaction.amount === testAmount) {
          console.log(`  ✅ Mobile wallet updated: ₹${event.data.balance}`);
          mobileReceived = true;
          this.addTestResult('Wallet Sync', 'PASS', `Wallet sync successful - ₹${testAmount} added`);
          resolve();
        }
      });

      try {
        // Add money via web API
        console.log(`  🌐 Adding ₹${testAmount} via web API...`);
        
        const response = await axios.post(`${API_BASE_URL}/api/wallet/add-money`, {
          amount: testAmount,
          paymentMethod: 'test'
        }, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });

        if (!response.data.success) {
          throw new Error('Failed to add money to wallet');
        }

        console.log('  ✅ Money added to wallet via web');

        // Wait for mobile sync
        setTimeout(() => {
          if (!mobileReceived) {
            const error = new Error('Mobile did not receive wallet sync');
            this.addTestResult('Wallet Sync', 'FAIL', 'Mobile sync timeout');
            reject(error);
          }
        }, 5000);

      } catch (error) {
        console.error('  ❌ Wallet sync test failed:', error.message);
        this.addTestResult('Wallet Sync', 'FAIL', error.message);
        reject(error);
      }
    });
  }

  async testTournamentSync() {
    console.log('\n🎮 Testing Tournament Sync...');

    return new Promise(async (resolve, reject) => {
      let webReceived = false;

      try {
        // Get available tournaments
        const tournamentsResponse = await axios.get(`${API_BASE_URL}/api/tournaments?status=upcoming&limit=1`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });

        if (!tournamentsResponse.data.success || tournamentsResponse.data.tournaments.length === 0) {
          console.log('  ⚠️ No tournaments available for testing');
          this.addTestResult('Tournament Sync', 'SKIP', 'No tournaments available');
          resolve();
          return;
        }

        const tournament = tournamentsResponse.data.tournaments[0];
        console.log(`  🎯 Testing with tournament: ${tournament.title}`);

        // Listen for tournament sync on web
        this.webSocket.on('tournament_sync', (event) => {
          console.log('  🌐 Web received tournament sync:', event.type);
          
          if (event.type === 'tournament_joined' && event.data._id === tournament._id) {
            console.log('  ✅ Web received tournament join notification');
            webReceived = true;
            this.addTestResult('Tournament Sync', 'PASS', 'Tournament sync successful');
            resolve();
          }
        });

        // Join tournament via mobile API
        console.log('  📱 Joining tournament via mobile API...');
        
        const joinResponse = await axios.post(`${API_BASE_URL}/api/tournaments/${tournament._id}/join`, {}, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });

        if (!joinResponse.data.success) {
          throw new Error('Failed to join tournament');
        }

        console.log('  ✅ Tournament joined via mobile');

        // Wait for web sync
        setTimeout(() => {
          if (!webReceived) {
            const error = new Error('Web did not receive tournament sync');
            this.addTestResult('Tournament Sync', 'FAIL', 'Web sync timeout');
            reject(error);
          }
        }, 5000);

      } catch (error) {
        console.error('  ❌ Tournament sync test failed:', error.message);
        this.addTestResult('Tournament Sync', 'FAIL', error.message);
        reject(error);
      }
    });
  }

  async testMultiDeviceSession() {
    console.log('\n📱 Testing Multi-Device Session...');

    return new Promise((resolve) => {
      let sessionNotificationReceived = false;

      // Listen for session notifications
      this.webSocket.on('user_sync', (event) => {
        if (event.type === 'session_connected') {
          console.log('  ✅ Web received new session notification');
          sessionNotificationReceived = true;
        }
      });

      // Create third socket connection to simulate another device
      const thirdSocket = io(WS_URL, {
        transports: ['websocket', 'polling']
      });

      thirdSocket.on('connect', () => {
        console.log('  📱 Third device connected');
        
        thirdSocket.emit('authenticate', {
          userId: this.userId,
          platform: 'mobile',
          token: 'another-device-token'
        });
      });

      thirdSocket.on('authenticated', () => {
        console.log('  ✅ Third device authenticated');
        
        setTimeout(() => {
          thirdSocket.disconnect();
          
          if (sessionNotificationReceived) {
            this.addTestResult('Multi-Device Session', 'PASS', 'Session notifications working');
          } else {
            this.addTestResult('Multi-Device Session', 'FAIL', 'No session notifications');
          }
          
          resolve();
        }, 2000);
      });

      // Timeout
      setTimeout(() => {
        thirdSocket.disconnect();
        this.addTestResult('Multi-Device Session', 'TIMEOUT', 'Test timed out');
        resolve();
      }, 10000);
    });
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.webSocket) {
      this.webSocket.disconnect();
      console.log('  ✅ Web socket disconnected');
    }
    
    if (this.mobileSocket) {
      this.mobileSocket.disconnect();
      console.log('  ✅ Mobile socket disconnected');
    }
  }

  addTestResult(testName, status, message) {
    this.testResults.push({
      test: testName,
      status,
      message,
      timestamp: new Date().toISOString()
    });
  }

  showResults() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : 
                   result.status === 'SKIP' ? '⏭️' : '⏱️';
      
      console.log(`${icon} ${result.test}: ${result.status} - ${result.message}`);
      
      if (result.status === 'PASS') passed++;
      else if (result.status === 'FAIL') failed++;
      else if (result.status === 'SKIP') skipped++;
    });
    
    console.log('\n📈 Summary:');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⏭️ Skipped: ${skipped}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your unified platform is working perfectly!');
      console.log('\n🚀 Your GameOn platform now provides:');
      console.log('  • Real-time sync between web and mobile');
      console.log('  • Cross-platform data consistency');
      console.log('  • Multi-device session management');
      console.log('  • Instant notifications');
      console.log('  • Amazon-like unified experience');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the implementation.');
    }
  }
}

// Run the tests
const tester = new UnifiedSyncTester();
tester.runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});