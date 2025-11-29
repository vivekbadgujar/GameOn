'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

// Dynamically import App component with SSR disabled to prevent document/window access during SSR
const App = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        color: 'white', 
        fontSize: '18px',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid rgba(255,255,255,0.3)', 
          borderTopColor: '#fff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        Loading Admin Panel...
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

export default function AdminHomePage() {
  useEffect(() => {
    // Any initialization logic for Next.js admin panel
    console.log('GameOn Admin Panel initialized with Next.js')
  }, [])

  return <App />
}