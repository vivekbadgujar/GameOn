/**
 * Test script for password reset functionality
 */

const API_BASE_URL = 'http://localhost:5000/api';

async function testPasswordReset() {
  console.log('🔐 Testing Password Reset Functionality\n');

  try {
    // Test 1: Send forgot password request
    console.log('1️⃣ Testing forgot password request...');
    
    const forgotPasswordResponse = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test2@example.com' // Using existing test user
      })
    });

    const forgotPasswordData = await forgotPasswordResponse.json();
    console.log('Forgot password response:', forgotPasswordData);

    if (forgotPasswordData.success && forgotPasswordData.resetToken) {
      const resetToken = forgotPasswordData.resetToken;
      console.log('✅ Forgot password request successful');
      console.log('Reset token:', resetToken);

      // Test 2: Verify reset token
      console.log('\n2️⃣ Testing reset token verification...');
      
      const verifyTokenResponse = await fetch(`${API_BASE_URL}/auth/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken
        })
      });

      const verifyTokenData = await verifyTokenResponse.json();
      console.log('Verify token response:', verifyTokenData);

      if (verifyTokenData.success) {
        console.log('✅ Token verification successful');
        console.log('Email:', verifyTokenData.email);

        // Test 3: Reset password
        console.log('\n3️⃣ Testing password reset...');
        
        const resetPasswordResponse = await fetch(`${API_BASE_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: resetToken,
            newPassword: 'newpassword123'
          })
        });

        const resetPasswordData = await resetPasswordResponse.json();
        console.log('Reset password response:', resetPasswordData);

        if (resetPasswordData.success) {
          console.log('✅ Password reset successful');

          // Test 4: Try to login with new password
          console.log('\n4️⃣ Testing login with new password...');
          
          const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: 'test2@example.com',
              password: 'newpassword123'
            })
          });

          const loginData = await loginResponse.json();
          console.log('Login response:', loginData);

          if (loginData.success) {
            console.log('✅ Login with new password successful');
            console.log('\n🎉 All password reset tests passed!');
          } else {
            console.log('❌ Login with new password failed');
          }
        } else {
          console.log('❌ Password reset failed');
        }
      } else {
        console.log('❌ Token verification failed');
      }
    } else {
      console.log('❌ Forgot password request failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPasswordReset();