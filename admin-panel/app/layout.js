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
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
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