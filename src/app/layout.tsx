import type { Metadata } from 'next'
import { Inter, Noto_Sans_Devanagari } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-noto-nepali',
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Biznity — Nepal\'s Business Directory',
    template: '%s | Biznity',
  },
  description: 'Discover Nepal\'s best businesses, products, jobs, events, and deals — all in one place. Browse verified local businesses across Nepal.',
  keywords: [
    'nepal business directory', 'businesses in nepal', 'nepal jobs', 'nepal events',
    'nepal products', 'kathmandu business', 'nepal deals', 'biznity',
  ],
  authors: [{ name: 'Biznity' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Biznity — Nepal\'s Business Directory',
    description: 'Discover Nepal\'s best businesses, products, jobs, events, and offers.',
    url: 'https://biznity.vercel.app',
    siteName: 'Biznity',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Biznity — Nepal\'s Business Directory',
    description: 'Nepal\'s Business Platform',
  },
  metadataBase: new URL('https://biznity.vercel.app'),
  applicationName: 'Biznity',
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Biznity',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Biznity',
    'mobile-web-app-capable': 'yes',
  }
}

export const viewport = {
  themeColor: '#DC2626',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoDevanagari.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Biznity" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col antialiased font-sans bg-gray-50">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-PHNQFH4HJ6`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-PHNQFH4HJ6');
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}
