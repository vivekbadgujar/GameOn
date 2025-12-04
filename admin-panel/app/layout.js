import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GameOn Admin - Tournament Management',
  description: 'Admin panel for managing GameOn tournaments and users',
  robots: {
    index: false,
    follow: false,
  },
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <div id="root" style={{ minHeight: '100vh' }}>
          {children}
        </div>
        <div id="modal-root"></div>
      </body>
    </html>
  )
}