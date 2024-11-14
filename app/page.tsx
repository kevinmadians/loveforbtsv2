'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Letter } from './types/Letter';
import { db } from './firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  where,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Masonry from 'react-masonry-css';
import SpotifySearch from './components/SpotifySearch';
import SpotifyPlayer from './components/SpotifyPlayer';

type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
};

const membersList = ['BTS', 'RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'];
const colorClasses = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'mostLoved', label: 'Most Loved' }
];

export default function Home() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [name, setName] = useState('');
  const [member, setMember] = useState(membersList[0]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [selectedMember, setSelectedMember] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastLetterRef = useRef<HTMLDivElement | null>(null);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const LETTERS_PER_PAGE = 12;

  const router = useRouter();

  const [likedLetters, setLikedLetters] = useState<Set<string>>(new Set());
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);

  useEffect(() => {
    const savedLikes = localStorage.getItem('likedLetters');
    if (savedLikes) {
      setLikedLetters(new Set(JSON.parse(savedLikes)));
    }
  }, []);

  useEffect(() => {
    try {
      setIsLoading(true);
      setHasMore(true);
      lastDocRef.current = null;
      const lettersRef = collection(db, 'letters');
      
      const queryConstraints = [];
      
      if (selectedMember !== 'all') {
        queryConstraints.push(where('member', '==', selectedMember));
      }
      
      if (sortOrder === 'mostLoved') {
        queryConstraints.push(orderBy('likes', 'desc'));
        queryConstraints.push(orderBy('timestamp', 'desc'));
      } else {
        queryConstraints.push(orderBy('timestamp', sortOrder === 'newest' ? 'desc' : 'asc'));
      }
      
      queryConstraints.push(limit(LETTERS_PER_PAGE));
      
      const q = query(lettersRef, ...queryConstraints);
      
      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const fetchedLetters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Letter[];
          
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
          setLetters(fetchedLetters);
          setHasMore(snapshot.docs.length === LETTERS_PER_PAGE);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching letters:", error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up Firebase listener:", error);
      setIsLoading(false);
    }
  }, [selectedMember, sortOrder]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || isLoading) return;

    try {
      setLoadingMore(true);
      const lettersRef = collection(db, 'letters');
      
      const queryConstraints = [];
      
      if (selectedMember !== 'all') {
        queryConstraints.push(where('member', '==', selectedMember));
      }
      
      if (sortOrder === 'mostLoved') {
        queryConstraints.push(orderBy('likes', 'desc'));
        queryConstraints.push(orderBy('timestamp', 'desc'));
      } else {
        queryConstraints.push(orderBy('timestamp', sortOrder === 'newest' ? 'desc' : 'asc'));
      }
      
      queryConstraints.push(startAfter(lastDocRef.current));
      queryConstraints.push(limit(LETTERS_PER_PAGE));
      
      const q = query(lettersRef, ...queryConstraints);
      const snapshot = await getDocs(q);
      
      const newLetters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Letter[];

      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      setLetters(prev => [...prev, ...newLetters]);
      setHasMore(snapshot.docs.length === LETTERS_PER_PAGE);
    } catch (error) {
      console.error("Error loading more letters:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, isLoading, selectedMember, sortOrder]);

  const lastLetterElementRef = useCallback((node: HTMLDivElement) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [hasMore, loadMore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const colorClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];
      const letterData = {
        name,
        member,
        message,
        timestamp: Timestamp.now(),
        colorClass,
        likes: 0,
        likedBy: [],
        ...(selectedTrack && {
          spotifyTrack: {
            id: selectedTrack.id,
            name: selectedTrack.name,
            artist: selectedTrack.artists[0]?.name,
            albumCover: selectedTrack.album.images[0]?.url
          }
        })
      };

      const docRef = await addDoc(collection(db, 'letters'), letterData);
      
      setName('');
      setMessage('');
      setMember(membersList[0]);
      setSelectedMember(member);
      
    } catch (error) {
      console.error('Error adding letter:', error);
      alert('Failed to send letter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberFilter = (member: string) => {
    console.log('Filtering for member:', member);
    setSelectedMember(member);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
  };

  const handleLike = async (e: React.MouseEvent, letterId: string) => {
    e.stopPropagation();
    const userId = localStorage.getItem('userId') || crypto.randomUUID();
    
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }

    try {
      const letterRef = doc(db, 'letters', letterId);
      const isLiked = likedLetters.has(letterId);

      await updateDoc(letterRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });

      const newLikedLetters = new Set(likedLetters);
      if (isLiked) {
        newLikedLetters.delete(letterId);
      } else {
        newLikedLetters.add(letterId);
      }
      setLikedLetters(newLikedLetters);
      
      localStorage.setItem('likedLetters', JSON.stringify([...newLikedLetters]));

    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  // Update breakpoint columns object
  const breakpointColumnsObj = {
    default: 4,    // >= 1280px
    1280: 3,       // >= 1024px
    1024: 3,       // >= 768px
    768: 2,        // >= 640px
    640: 2,        // >= 380px
    380: 1         // < 380px
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      {/* Hero Section */}
      <header className="text-center mb-16">
        <button 
          onClick={() => router.push('/')} 
          className="font-reenie font-bold text-6xl mb-4 animate-fade-in text-gray-800 hover:text-[#9333EA] transition-colors duration-300"
        >
          Love for BTS
        </button>
        <p className="text-gray-600 italic text-base">Pour your love for BTS into words that inspire and unite ARMY worldwide💜</p>
      </header>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="message-box p-4 rounded-xl mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
            </div>
            <div>
              <p className="text-sm text-center text-white font-medium mb-1">
                Dear ARMY!
              </p>
              <p className="text-sm text-center text-white/90">
                Please share your message with care! Also avoid including any sensitive or personal information like phone numbers, addresses, or any private thing. Please use appropriate language.
              </p>
            </div>
          </div>
        </div>

        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none"
            required
          />
        </div>

        <div>
          <select
            value={member}
            onChange={(e) => setMember(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none appearance-none bg-white"
            required
          >
            {membersList.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your heartfelt message... (1000 characters max)"
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none min-h-[150px]"
            required
          />
        </div>

        <div>
          <SpotifySearch
            onSelect={(track) => {
              setSelectedTrack(track);
            }}
            selectedTrack={selectedTrack}
            required={false}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !selectedTrack || !name || !message || !member}
            className={`bg-[#9333EA] text-white px-8 py-3 rounded-full font-medium 
              transition-all duration-300 transform hover:scale-105 
              ${(isSubmitting || !selectedTrack || !name || !message || !member) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#7928CA]'}`}
          >
            {isSubmitting ? 'Sending...' : 'Send Letter'}
          </button>
        </div>
      </form>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleMemberFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${selectedMember === 'all' 
                  ? 'bg-[#9333EA] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            {membersList.map((m) => (
              <button
                key={m}
                onClick={() => handleMemberFilter(m)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${selectedMember === m 
                    ? 'bg-[#9333EA] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="bg-white text-gray-600 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Letters Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="heart-loading"></div>
          </div>
        ) : letters.length > 0 ? (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {letters.map((letter, index) => (
              <div
                key={letter.id}
                ref={index === letters.length - 1 ? lastLetterElementRef : undefined}
                className={`letter-card ${letter.colorClass} cursor-pointer hover:border-[#9333EA]`}
                onClick={() => router.push(`/letter/${letter.id}`)}
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  minHeight: letter.spotifyTrack ? '240px' : '220px'
                }}
              >
                <div className="text-center mb-2 relative">
                  <span className="absolute right-0 top-0 text-xl">💌</span>
                  <h3 className="font-bold text-base">
                    To: {letter.member}
                  </h3>
                </div>
                
                <div className="letter-card-content">
                  <p className="text-sm leading-relaxed">
                    {letter.message}
                  </p>
                </div>
                
                <div className="mt-auto">
                  {letter.spotifyTrack && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-center italic text-xs text-white/80 mb-2">Favorite song</p>
                      <div className="flex items-center gap-2 justify-center">
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
                  )}

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-black italic">
                        {new Date(letter.timestamp.toDate()).toLocaleDateString()}
                      </span>
                      <p className="text-right text-xs font-medium text-gray-950">
                        {letter.name}
                      </p>
                    </div>
                    
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => handleLike(e, letter.id)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full 
                          ${likedLetters.has(letter.id) 
                            ? 'bg-[#C688F8] text-white' 
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'} 
                          transition-colors duration-300`}
                      >
                        <svg 
                          className={`w-3 h-3 ${likedLetters.has(letter.id) ? 'text-white' : 'text-[#C688F8]'}`}
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {letter.likes > 0 && (
                          <span className="text-[10px] font-medium">
                            {letter.likes}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No letters found{selectedMember !== 'all' ? ` for ${selectedMember}` : ''}. 
            Be the first to write one!
          </div>
        )}
      </div>
    </div>
  );
}
