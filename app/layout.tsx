import type { Metadata } from "next";
import { Reenie_Beanie } from "next/font/google";
import "./globals.css";

const reenie = Reenie_Beanie({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-reenie",
});

export const metadata: Metadata = {
  title: "Love for BTS",
  description: "Pour your love for BTS into words that inspire and unite ARMY worldwide",
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
      <body className={`${reenie.variable}`}>{children}</body>
    </html>
  );
}
