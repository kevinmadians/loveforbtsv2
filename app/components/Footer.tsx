'use client';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-sm py-3 px-4 flex flex-col items-center justify-center gap-2 z-50">
      <p className="text-black/90 text-xs text-center max-w-lg">
        Support this project to help keep it running and add more features! 💜
      </p>
      
      <a
        href="https://ko-fi.com/kpopgenerator"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-[#FF5E5B] hover:bg-[#FF4642] text-white px-4 py-1.5 rounded-full 
          transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
      >
        <svg 
          className="w-4 h-4" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
        </svg>
        Support on Ko-fi
      </a>
    </footer>
  );
} 