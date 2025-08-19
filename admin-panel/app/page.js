'use client'

import { useEffect } from 'react'

// Import your existing React admin app component
// You'll need to update the import path based on your current structure
import App from '../src/App'

export default function AdminHomePage() {
  useEffect(() => {
    // Any initialization logic for Next.js admin panel
    console.log('GameOn Admin Panel initialized with Next.js')
  }, [])

  return <App />
}