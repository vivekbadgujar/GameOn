import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getTournamentById } from '../../services/api';

const TournamentDebug = () => {
  const router = useRouter();
  const { id } = router.query;
  const [debugInfo, setDebugInfo] = useState({
    tournamentId: id,
    loading: true,
    error: null,
    tournament: null,
    apiResponse: null,
    networkError: null
  });

  useEffect(() => {
    const testTournamentAPI = async () => {
      try {
        setDebugInfo(prev => ({ ...prev, loading: true, error: null }));
        
        console.log('🔍 Debug: Starting tournament fetch for ID:', id);
        
        // Test direct API call
        const response = await fetch(`http://localhost:5000/api/tournaments/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        console.log('🔍 Debug: Raw response status:', response.status);
        console.log('🔍 Debug: Raw response headers:', response.headers);
        
        const rawData = await response.text();
        console.log('🔍 Debug: Raw response data:', rawData);
        
        let parsedData;
        try {
          parsedData = JSON.parse(rawData);
        } catch (parseError) {
          throw new Error(`Failed to parse JSON: ${parseError.message}`);
        }
        
        console.log('🔍 Debug: Parsed response:', parsedData);
        
        // Now test with our API service
        const serviceData = await getTournamentById(id);
        console.log('🔍 Debug: Service response:', serviceData);
        
        setDebugInfo(prev => ({
          ...prev,
          loading: false,
          apiResponse: parsedData,
          tournament: serviceData,
          error: null
        }));
        
      } catch (error) {
        console.error('🔍 Debug: Error occurred:', error);
        setDebugInfo(prev => ({
          ...prev,
          loading: false,
          error: error.message,
          networkError: error
        }));
      }
    };
    
    if (id) {
      testTournamentAPI();
    }
  }, [id]);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: '#fff', 
      fontFamily: 'monospace',
      minHeight: '100vh'
    }}>
      <h1>🔍 Tournament Debug Information</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Basic Info:</h2>
        <p><strong>Tournament ID:</strong> {debugInfo.tournamentId}</p>
        <p><strong>Loading:</strong> {debugInfo.loading ? 'Yes' : 'No'}</p>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>API Base URL:</strong> http://localhost:5000/api</p>
      </div>

      {debugInfo.loading && (
        <div style={{ color: '#yellow' }}>
          <h2>⏳ Loading...</h2>
        </div>
      )}

      {debugInfo.error && (
        <div style={{ color: '#ff6b6b', marginBottom: '20px' }}>
          <h2>❌ Error:</h2>
          <p>{debugInfo.error}</p>
          {debugInfo.networkError && (
            <pre style={{ backgroundColor: '#2a2a2a', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(debugInfo.networkError, null, 2)}
            </pre>
          )}
        </div>
      )}

      {debugInfo.apiResponse && (
        <div style={{ marginBottom: '20px' }}>
          <h2>📡 Raw API Response:</h2>
          <pre style={{ backgroundColor: '#2a2a2a', padding: '10px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(debugInfo.apiResponse, null, 2)}
          </pre>
        </div>
      )}

      {debugInfo.tournament && (
        <div style={{ marginBottom: '20px' }}>
          <h2>🎮 Tournament Data (from service):</h2>
          <pre style={{ backgroundColor: '#2a2a2a', padding: '10px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(debugInfo.tournament, null, 2)}
          </pre>
        </div>
      )}

      {!debugInfo.loading && !debugInfo.error && !debugInfo.tournament && (
        <div style={{ color: '#ffa500' }}>
          <h2>⚠️ No tournament data received</h2>
          <p>The API call completed but no tournament data was returned.</p>
        </div>
      )}
    </div>
  );
};

export default TournamentDebug;