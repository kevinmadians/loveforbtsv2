'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background elements */}
      <div className="gradient-bg" />
      <div className="bg-pattern" />
      <div className="floating-stickers" />
      <div className="sticker-1">💜</div>
      <div className="sticker-2">🎵</div>
      
      <div className="text-center z-10 max-w-2xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-purple-100">
        <h1 className="text-6xl font-reenie mb-4 text-[#9333EA]">Oops!</h1>
        <h2 className="text-2xl font-fredoka mb-6 text-gray-800">Something went wrong</h2>
        <p className="text-gray-600 mb-8 font-fredoka">
          Don&apos;t worry, even BTS has technical difficulties sometimes! Let&apos;s try again. 💜
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#9333EA] rounded-full hover:bg-[#7928CA] transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
