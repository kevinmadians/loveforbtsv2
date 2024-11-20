import type { Metadata } from "next";
import { Reenie_Beanie, Fredoka, Inter } from "next/font/google";
import "./globals.css";
import "./styles/global.css";
import Script from 'next/script'
import StickyFooter from './components/StickyFooter'
import ErrorBoundary from './components/ErrorBoundary';

const reenie = Reenie_Beanie({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-reenie",
});

const fredoka = Fredoka({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-fredoka",
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Love for BTS - Letters from ARMY, to BTS',
  description: 'Write and share your love letters to BTS. A very special platform for ARMY to express love, gratitude, and support through personal messages. Share your story with RM, Jin, Suga, J-Hope, Jimin, V, and Jungkook. Connect with fellow ARMY worldwide through meaningful letters.',
  keywords: 'BTS, ARMY, Love Letters, Fan Letters, 방탄소년단, BTS Letters, ARMY Letters, K-pop, Fan Message, RM, Jin, Suga, J-Hope, Jimin, V, Jungkook, Kim Namjoon, Kim Seokjin, Min Yoongi, Jung Hoseok, Park Jimin, Kim Taehyung, Jeon Jungkook, Bangtan Boys, Bangtan Sonyeondan, Write to BTS, Message to BTS, Fan Platform, ARMY Community, BTS Fan Letters, K-pop Letters, BTS Members, Purple Letters, Borahae, 보라해',
  metadataBase: new URL('https://loveforbts.com'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Love for BTS - Letters from ARMY, to BTS',
    description: 'Share your heartfelt letters with BTS. Write, design, and share your personal message of love and support.',
    url: 'https://loveforbts.com',
    siteName: 'Love for BTS',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Love for BTS - Letters from ARMY',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Love for BTS - Letters from ARMY, to BTS',
    description: 'Share your heartfelt letters with BTS. Write, design, and share your personal message of love and support.',
    images: ['/og-image.jpg'],
    creator: '@loveforbts',
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
    google: 'MlAyR9FS1QjQftHzMW8aL4Yj7Wze_w0-pHQXHjELyg4', 
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon-16x16.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
          `}
        </Script>
        
        {/* Favicon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" />
        <meta name="theme-color" content="#C688F8" />
      </head>
      <body className={`${reenie.variable} ${fredoka.variable} font-fredoka relative ${inter.className} min-h-screen flex flex-col`}>
        <div className="main-background"></div>
        <div className="background-pattern"></div>
        <div className="gradient-bg" />
        <div className="bg-pattern" />
        <div className="floating-stickers" />
        <div className="sticker-1">💜</div>
        <div className="sticker-2">✨</div>
        <div className="sticker-3">💫</div>
        <div className="sticker-4">⭐</div>
        
        <div className="main-content">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
        <StickyFooter />
      </body>
    </html>
  );
}
