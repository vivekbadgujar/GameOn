/**
 * API Connection Test Utility
 * Tests if the backend API is accessible
 */

import config from '../config';

export const testApiConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    console.log('API Base URL:', config.API_BASE_URL);
    
    const healthUrl = `${config.API_BASE_URL}/health`.replace(/\/\/health/, '/health');
    console.log('Health check URL:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Don't include credentials for health check
      credentials: 'omit',
    });
    
    console.log('Health check response status:', response.status);
    console.log('Health check response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Health check failed:', {
        status: response.status,
        statusText: response.statusText,
        body: text
      });
      return {
        success: false,
        status: response.status,
        message: `Backend returned ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log('✅ Health check successful:', data);
    
    return {
      success: true,
      data: data,
      message: 'Backend is accessible'
    };
  } catch (error) {
    console.error('❌ Health check error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    let message = 'Unable to connect to backend server. ';
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      message += 'The server may be down or unreachable.';
    } else if (error.message?.includes('CORS')) {
      message += 'CORS error - check backend CORS configuration.';
    } else {
      message += error.message || 'Unknown error occurred.';
    }
    
    return {
      success: false,
      error: error.message,
      message: message
    };
  }
};

export const testApiEndpoints = async () => {
  const results = {
    health: await testApiConnection(),
    tournaments: null,
  };
  
  // Test tournaments endpoint
  try {
    const tournamentsUrl = `${config.API_BASE_URL}/tournaments`.replace(/\/\/tournaments/, '/tournaments');
    console.log('Testing tournaments endpoint:', tournamentsUrl);
    
    const response = await fetch(tournamentsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'omit',
    });
    
    results.tournaments = {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Tournaments endpoint accessible' : `Tournaments endpoint returned ${response.status}`
    };
  } catch (error) {
    results.tournaments = {
      success: false,
      error: error.message,
      message: 'Tournaments endpoint not accessible'
    };
  }
  
  return results;
};

