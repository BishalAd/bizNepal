import type { Metadata } from 'next'
import { Inter, Noto_Sans_Devanagari } from 'next/font/google'
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
    default: 'BizNepal – Nepal\'s Business Platform',
    template: '%s | BizNepal',
  },
  description: 'Discover Nepal\'s best businesses, products, jobs, events, and offers — all in one place. नेपालको उत्कृष्ट व्यापारहरू खोज्नुहोस्।',
  keywords: ['nepal', 'business', 'products', 'jobs', 'events', 'biznepal', 'kathmandu'],
  authors: [{ name: 'BizNepal' }],
  openGraph: {
    title: 'BizNepal – Nepal\'s Business Platform',
    description: 'Discover Nepal\'s best businesses, products, jobs, events, and offers.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://biznepal.com',
    siteName: 'BizNepal',
    locale: 'en_NP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BizNepal',
    description: 'Nepal\'s Business Platform',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://biznepal.com'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoDevanagari.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased font-sans bg-gray-50">
        {children}
      </body>
    </html>
  )
}
