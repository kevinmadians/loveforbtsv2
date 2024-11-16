import type { Metadata } from "next";
import { Reenie_Beanie, Fredoka, Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'

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
  title: 'Love for BTS - Letters of Love from ARMY, for BTS',
  description: 'Write and share your love letters to BTS. A very special platform for ARMY to express love, gratitude, and support through personal messages. Share your story with RM, Jin, Suga, J-Hope, Jimin, V, and Jungkook. Connect with fellow ARMY worldwide through meaningful letters.',
  keywords: 'BTS, ARMY, Love Letters, Fan Letters, 방탄소년단, BTS Letters, ARMY Letters, K-pop, Fan Message, RM, Jin, Suga, J-Hope, Jimin, V, Jungkook, Kim Namjoon, Kim Seokjin, Min Yoongi, Jung Hoseok, Park Jimin, Kim Taehyung, Jeon Jungkook, Bangtan Boys, Bangtan Sonyeondan, Write to BTS, Message to BTS, Fan Platform, ARMY Community, BTS Fan Letters, K-pop Letters, BTS Members, Purple Letters, Borahae, 보라해',
  metadataBase: new URL('https://loveforbts.com'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Love for BTS - Letters of Love from ARMY, for BTS',
    description: 'Share your heartfelt letters with BTS. Write, design, and share your personal message of love and support.',
    url: 'https://loveforbts.com',
    siteName: 'Love for BTS',
    images: [
      {
        url: 'https://loveforbts.com/og-image.jpg',
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
    title: 'Love for BTS - Letters of Love from ARMY, for BTS',
    description: 'Share your heartfelt letters with BTS. Write, design, and share your personal message of love and support.',
    images: ['https://loveforbts.com/og-image.jpg'],
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
        <meta name="theme-color" content="#C688F8" />
      </head>
      <body className={`${reenie.variable} ${fredoka.variable} font-fredoka relative ${inter.className}`}>
        <div className="gradient-bg" />
        <div className="bg-pattern" />
        <div className="floating-stickers" />
        <div className="sticker-1">✨</div>
        <div className="sticker-2">🎵</div>
        <div className="sticker-3">💫</div>
        <div className="sticker-4">⭐</div>
        
        <div className="main-content">
          {children}
        </div>

        {/* Sticky Footer */}
        <footer className="sticky-footer">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-600 text-center sm:text-left">
              Help us to spreading love for BTS! Your support helps maintain this project for ARMYs worldwide 💜
            </p>
            <a
              href="https://ko-fi.com/kpopgenerator"
              target="_blank"
              rel="noopener noreferrer"
              className="support-button"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
              </svg>
              Support on Ko-fi
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
