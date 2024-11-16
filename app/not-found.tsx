'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background elements */}
      <div className="gradient-bg" />
      <div className="bg-pattern" />
      <div className="floating-stickers" />
      <div className="sticker-1">✨</div>
      <div className="sticker-2">🎵</div>
      
      <div className="text-center z-10 max-w-2xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-purple-100">
        <h1 className="text-6xl font-reenie mb-4 text-[#9333EA]">Oops! 404</h1>
        <h2 className="text-2xl font-fredoka mb-6 text-gray-800">Page Not Found</h2>
        <p className="text-gray-600 mb-8 font-fredoka">
          The page you&apos;re looking for seems to have disappeared like a BTS concert ticket on sale day! 💜
        </p>
        <Link 
          href="/"
          className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#9333EA] rounded-full hover:bg-[#7928CA] transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
