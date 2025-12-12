import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>GameOn — Play. Compete. Win.</title>
        <meta name="description" content="GameOn — premium esports tournaments, real-time matches, and rewards." />
        <meta property="og:title" content="GameOn — Play. Compete. Win." />
        <meta property="og:description" content="GameOn — premium esports tournaments, real-time matches, and rewards." />
        <meta property="og:image" content="https://gameonesport.xyz/opengraph-image.png" />
        <meta property="og:url" content="https://gameonesport.xyz" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="192x192" href="/logo192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/logo512.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}