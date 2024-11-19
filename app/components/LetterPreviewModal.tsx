import { Letter } from '../types/Letter';
import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

interface LetterPreviewModalProps {
  letter: Letter;
  onClose: () => void;
  onNavigate: () => void;
  onLike: (e: React.MouseEvent) => void;
  isLiked: boolean;
}

export default function LetterPreviewModal({
  letter,
  onClose,
  onNavigate,
  onLike,
  isLiked
}: LetterPreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [currentLikes, setCurrentLikes] = useState(letter.likes || 0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Subscribe to real-time updates of the letter's likes
    const letterRef = doc(db, 'letters', letter.id);
    const unsubscribe = onSnapshot(letterRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCurrentLikes(data.likes || 0);
      }
    });

    return () => unsubscribe();
  }, [letter.id]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const formattedDate = letter.timestamp?.toDate
    ? formatDistanceToNow(letter.timestamp.toDate(), { addSuffix: true })
    : format(new Date(), 'PPP');

  const truncatedMessage = letter.message.length > 300 
    ? letter.message.slice(0, 300) + '...' 
    : letter.message;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className={`w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all
          ${letter.colorClass} text-white`}
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-1">To: {letter.member}</h3>
            <p className="text-sm opacity-80">
              From: {letter.name} {letter.country && `• ${letter.country}`}
            </p>
            <p className="text-xs opacity-60 mt-1">
              {formattedDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="Close preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-white/90 leading-relaxed bg-black/30 rounded-2xl p-6">
            {truncatedMessage}
            {letter.message.length > 350 && (
              <button 
                onClick={onNavigate}
                className="block w-full text-center mt-2 text-sm font-medium hover:opacity-80 transition-opacity underline"
              >
                Read full letter
              </button>
            )}
          </p>
        </div>

        {/* Spotify Track if present */}
        {letter.spotifyTrack && (
          <div className="px-4 pb-3 pt-2">
            <div className="border-t border-white/20 pt-3">
              <p className="text-center italic text-xs text-white/80 mb-2">Favorite song</p>
              <div className="flex items-center gap-2 justify-center bg-black/20 p-2 rounded-lg">
                <img 
                  src={letter.spotifyTrack.albumCover}
                  alt={letter.spotifyTrack.name}
                  className="w-10 h-10 rounded-md"
                />
                <div>
                  <p className="font-medium text-white text-xs truncate max-w-[150px]">
                    {letter.spotifyTrack.name}
                  </p>
                  <p className="text-[10px] text-white/80 truncate max-w-[150px]">
                    {letter.spotifyTrack.artist}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-white/20 flex justify-between items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(e);
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <svg
              className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none'}`}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm">{currentLikes} loves</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="text-sm px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            Read Full Letter
          </button>
        </div>
      </div>
    </div>
  );
}
