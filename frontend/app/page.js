'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Import your existing React app component
// You'll need to update the import path based on your current structure
import App from '../src/App'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Any initialization logic for Next.js
    console.log('GameOn Frontend initialized with Next.js')
  }, [])

  return <App />
}