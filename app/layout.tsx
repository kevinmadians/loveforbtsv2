import type { Metadata } from "next";
import { Fredoka, Reenie_Beanie } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
});

const reenieBeanie = Reenie_Beanie({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-reenie",
});

export const metadata: Metadata = {
  title: "Letters for BTS",
  description: "Pour your love for BTS into words that inspire and unite ARMY worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${reenieBeanie.variable} font-fredoka pb-16`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
