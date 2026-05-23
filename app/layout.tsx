import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'

export const dynamic = "force-dynamic";

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Video Downloader Pro — Download Videos from Any URL',
    template: '%s | Video Downloader Pro',
  },
  description: 'Download videos from direct URLs and YouTube instantly. Supports MP4, WebM, MOV and 1000+ sites. Free, fast, and privacy-respecting video downloader.',
  keywords: [
    'video downloader', 'download video', 'youtube downloader', 'mp4 downloader',
    'online video downloader', 'free video downloader', 'download youtube video',
    'webm downloader', 'video download tool', 'direct url downloader',
  ],
  authors: [{ name: 'Video Downloader Pro' }],
  creator: 'Video Downloader Pro',
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
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Video Downloader Pro',
    title: 'Video Downloader Pro — Download Videos from Any URL',
    description: 'Download videos from direct URLs and YouTube instantly. Supports MP4, WebM, MOV and 1000+ sites. Free, fast, and privacy-respecting.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Video Downloader Pro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Downloader Pro — Download Videos from Any URL',
    description: 'Download videos from direct URLs and YouTube instantly. Supports MP4, WebM, MOV and 1000+ sites.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: BASE_URL,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Video Downloader Pro',
              url: BASE_URL,
              description: 'Download videos from direct URLs and YouTube instantly. Supports MP4, WebM, MOV and 1000+ sites.',
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <ChunkLoadErrorHandler />
        </ThemeProvider>
      </body>
    </html>
  )
}
