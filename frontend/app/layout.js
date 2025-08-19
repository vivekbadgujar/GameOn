import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GameOn - Gaming Tournament Platform',
  description: 'Join exciting gaming tournaments and compete with players worldwide',
  keywords: 'gaming, tournaments, esports, BGMI, competition',
  authors: [{ name: 'GameOn Team' }],
  creator: 'GameOn Platform',
  publisher: 'GameOn',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://gameonesport.xyz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GameOn - Gaming Tournament Platform',
    description: 'Join exciting gaming tournaments and compete with players worldwide',
    url: 'https://gameonesport.xyz',
    siteName: 'GameOn',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GameOn Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GameOn - Gaming Tournament Platform',
    description: 'Join exciting gaming tournaments and compete with players worldwide',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
        <div id="modal-root"></div>
      </body>
    </html>
  )
}