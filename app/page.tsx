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
  Query,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Masonry from 'react-masonry-css';

const membersList = ['BTS', 'RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'];
const colorClasses = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5'];
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
  const lastLetterRef = useRef<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const LETTERS_PER_PAGE = 12;

  const router = useRouter();

  const [likedLetters, setLikedLetters] = useState<Set<string>>(new Set());

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
      lastLetterRef.current = null;
      const lettersRef = collection(db, 'letters');
      
      let queryConstraints = [];
      
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
          
          lastLetterRef.current = snapshot.docs[snapshot.docs.length - 1];
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

  const loadMore = async () => {
    if (!hasMore || loadingMore || isLoading) return;

    try {
      setLoadingMore(true);
      const lettersRef = collection(db, 'letters');
      
      let queryConstraints = [];
      
      if (selectedMember !== 'all') {
        queryConstraints.push(where('member', '==', selectedMember));
      }
      
      if (sortOrder === 'mostLoved') {
        queryConstraints.push(orderBy('likes', 'desc'));
        queryConstraints.push(orderBy('timestamp', 'desc'));
      } else {
        queryConstraints.push(orderBy('timestamp', sortOrder === 'newest' ? 'desc' : 'asc'));
      }
      
      queryConstraints.push(startAfter(lastLetterRef.current));
      queryConstraints.push(limit(LETTERS_PER_PAGE));
      
      const q = query(lettersRef, ...queryConstraints);
      const snapshot = await getDocs(q);
      
      const newLetters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Letter[];

      lastLetterRef.current = snapshot.docs[snapshot.docs.length - 1];
      setLetters(prev => [...prev, ...newLetters]);
      setHasMore(snapshot.docs.length === LETTERS_PER_PAGE);
    } catch (error) {
      console.error("Error loading more letters:", error);
    } finally {
      setLoadingMore(false);
    }
  };

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
    
    if (name.length > 20) {
      alert('Name must be 20 characters or less');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newLetter = {
        name,
        member,
        message,
        timestamp: Timestamp.now(),
        colorClass: colorClasses[Math.floor(Math.random() * colorClasses.length)],
        likes: 0,
        likedBy: []
      };

      await addDoc(collection(db, 'letters'), newLetter);
      
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

  // Add breakpoint object for responsive columns
  const breakpointColumnsObj = {
    default: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1
  };

  return (
    <div className="min-h-screen p-8 bg-black">
      {/* Hero Section */}
      <header className="text-center mb-16">
        <h1 className="font-reenie text-6xl mb-4 animate-fade-in text-white">
          Letters for BTS
        </h1>
        <p className="text-xl text-zinc-300">Share your heartfelt messages with BTS</p>
      </header>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-16 space-y-6">
        <div>
          <input
            type="text"
            placeholder="Your Name"
            className="input-style"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={20}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <select
            className="input-style"
            value={member}
            onChange={(e) => setMember(e.target.value)}
            required
            disabled={isSubmitting}
          >
            {membersList.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div>
          <textarea
            placeholder="Write your message (max 1000 characters)"
            className="input-style min-h-[200px]"
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        
        <button
          type="submit"
          className={`w-full bg-[#C688F8] text-white py-3 rounded-lg hover:bg-[#B674E7] 
            transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Letter'}
        </button>
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
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
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
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg border border-zinc-700 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none"
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
      <div className="max-w-7xl mx-auto">
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
              >
                <div className="text-center mb-2">
                  <h3 className="font-bold text-base text-zinc-200">
                    To: {letter.member}
                  </h3>
                </div>
                
                <div className="letter-card-content mb-2">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {letter.message}
                  </p>
                </div>
                
                <div className="mt-auto pt-2 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-xs text-zinc-400 italic">
                    {new Date(letter.timestamp.toDate()).toLocaleDateString()}
                  </span>
                  
                  <button
                    onClick={(e) => handleLike(e, letter.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full 
                      ${likedLetters.has(letter.id) 
                        ? 'bg-[#C688F8] text-white' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'} 
                      transition-colors duration-300`}
                  >
                    <svg 
                      className={`w-4 h-4 ${likedLetters.has(letter.id) ? 'text-white' : 'text-[#C688F8]'}`}
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="text-xs font-medium">
                      {letter.likes ?? 0}
                    </span>
                  </button>

                  <p className="text-right text-xs font-medium text-zinc-300">
                    {letter.name}
                  </p>
                </div>
              </div>
            ))}
          </Masonry>
        ) : (
          <div className="text-center py-8 text-zinc-400">
            No letters found{selectedMember !== 'all' ? ` for ${selectedMember}` : ''}. 
            Be the first to write one!
          </div>
        )}
      </div>
    </div>
  );
}
