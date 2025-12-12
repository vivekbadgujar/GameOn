import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GameOn — Play. Compete. Win. | Admin Panel',
  description: 'GameOn — premium esports tournaments, real-time matches, and rewards. Admin panel for managing tournaments and users.',
  robots: {
    index: false,
    follow: false,
  },
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0',
  openGraph: {
    title: 'GameOn — Play. Compete. Win.',
    description: 'GameOn — premium esports tournaments, real-time matches, and rewards.',
    images: ['https://gameonesport.xyz/opengraph-image.png'],
    url: 'https://admin.gameonesport.xyz',
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
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