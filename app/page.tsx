'use client';

import { SpotifyTrack } from './types/SpotifyTrack';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Letter } from './types/Letter';
import { db } from './firebase/config';
import Swal from 'sweetalert2';
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
  QueryDocumentSnapshot,
  getCountFromServer,
  DocumentReference,
  writeBatch
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Masonry from 'react-masonry-css';
import { containsBadWords } from './utils/wordFilter';
import './styles/global.css';
import WelcomePopup from './components/WelcomePopup';

const SpotifySearch = dynamic(() => import('./components/SpotifySearch').then(mod => mod.SpotifySearch), {
  loading: () => <div className="loading-placeholder">Loading music search...</div>,
  ssr: false
});

const SpotifyPlayer = dynamic(() => import('./components/SpotifyPlayer'), {
  loading: () => <div className="loading-placeholder">Loading player...</div>,
  ssr: false
});

const LetterPreviewModal = dynamic(() => import('./components/LetterPreviewModal'), {
  loading: () => <div className="loading-placeholder">Loading preview...</div>,
  ssr: false
});

import Image from 'next/image';

const members = [
  { id: 'BTS', name: 'BTS', image: '/images/profile/bts.jpg' },
  { id: 'RM', name: 'RM', image: '/images/profile/rm.jpg' },
  { id: 'Jin', name: 'Jin', image: '/images/profile/jin.jpg' },
  { id: 'Suga', name: 'Suga', image: '/images/profile/suga.jpg' },
  { id: 'J-Hope', name: 'J-Hope', image: '/images/profile/jhope.jpg' },
  { id: 'Jimin', name: 'Jimin', image: '/images/profile/jimin.jpg' },
  { id: 'V', name: 'V', image: '/images/profile/v.jpg' },
  { id: 'Jungkook', name: 'Jungkook', image: '/images/profile/jungkook.jpg' }
];

const colorClasses = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'mostLoved', label: 'Most Loved' }
];

export default function Home() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [name, setName] = useState('');
  const [member, setMember] = useState(members[0].id);
  const [message, setMessage] = useState('');
  const [country, setCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [totalLettersCount, setTotalLettersCount] = useState(0);
  const [totalUnfilteredCount, setTotalUnfilteredCount] = useState(0);
  
  // Filter states
  const [selectedMember, setSelectedMember] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const lastLetterRef = useRef<HTMLDivElement | null>(null);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const LETTERS_PER_PAGE = 12;

  const router = useRouter();

  const [likedLetters, setLikedLetters] = useState<Set<string>>(new Set());
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const lettersContainerRef = useRef<HTMLDivElement>(null);

  const [previewLetter, setPreviewLetter] = useState<Letter | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);

  // Touch interaction state
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchTimeRef = useRef(0);
  const isTouchMoveRef = useRef(false);

  const [allLetters, setAllLetters] = useState<Letter[]>([]);

  // Add userId state and initialization
  const [userId, setUserId] = useState<string>('');

  // Add this effect to initialize userId
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const newUserId = storedUserId || crypto.randomUUID();
    if (!storedUserId) {
      localStorage.setItem('userId', newUserId);
    }
    setUserId(newUserId);
  }, []);

  const handleLetterInteraction = useCallback((
    letter: Letter,
    event: React.TouchEvent | React.MouseEvent,
    type: 'start' | 'end'
  ) => {
    // Only handle touch events differently
    if (event.type.startsWith('mouse')) {
      if (type === 'end') {
        router.push(`/letter/${letter.id}`);
      }
      return;
    }

    const touch = (event as React.TouchEvent).touches?.[0] || (event as React.TouchEvent).changedTouches?.[0];
    
    if (type === 'start') {
      // Record start position and time
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
      touchTimeRef.current = Date.now();
      isTouchMoveRef.current = false;
      
      isLongPressRef.current = false;
      longPressTimeoutRef.current = setTimeout(() => {
        if (!isTouchMoveRef.current) {
          isLongPressRef.current = true;
          setPreviewLetter(letter);
        }
      }, 500);
    } else if (type === 'end') {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }

      // Calculate touch duration and distance
      const touchDuration = Date.now() - touchTimeRef.current;
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const deltaX = Math.abs(touchEndX - touchStartRef.current.x);
      const deltaY = Math.abs(touchEndY - touchStartRef.current.y);

      // If it's a quick tap without much movement, navigate to the letter
      if (!isLongPressRef.current && !isTouchMoveRef.current && touchDuration < 500 && deltaX < 10 && deltaY < 10) {
        router.push(`/letter/${letter.id}`);
      }
    }
  }, [router]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // If movement is significant, mark as scrolling
    if (deltaX > 5 || deltaY > 5) {
      isTouchMoveRef.current = true;
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const lettersRef = collection(db, 'letters');
      const queryConstraints = [];
      
      if (selectedMember !== 'all') {
        queryConstraints.push(where('member', '==', selectedMember));
      }

      if (sortOrder === 'newest') {
        queryConstraints.push(orderBy('timestamp', 'desc'));
      } else if (sortOrder === 'oldest') {
        queryConstraints.push(orderBy('timestamp', 'asc'));
      } else if (sortOrder === 'mostLoved') {
        queryConstraints.push(orderBy('likes', 'desc'));
      }

      queryConstraints.push(limit(LETTERS_PER_PAGE));
      const q = query(lettersRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const newLetters = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Letter[];

      setLetters(newLetters);
      lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
      setHasMore(querySnapshot.docs.length === LETTERS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching letters:', error);
    }
  }, [selectedMember, sortOrder, LETTERS_PER_PAGE]);

  const fetchInitialLetters = useCallback(async () => {
    setIsLoading(true);
    try {
      let q = query(
        collection(db, 'letters'),
        orderBy(sortOrder === 'mostLoved' ? 'likes' : 'timestamp', 
                sortOrder === 'oldest' ? 'asc' : 'desc'),
        limit(LETTERS_PER_PAGE)
      );

      if (selectedMember !== 'all') {
        q = query(q, where('member', '==', selectedMember));
      }

      const querySnapshot = await getDocs(q);
      const fetchedLetters = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Letter[];

      setLetters(fetchedLetters);
      lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
      setHasMore(querySnapshot.docs.length === LETTERS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching letters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMember, sortOrder]);

  useEffect(() => {
    const savedLikes = localStorage.getItem('likedLetters');
    if (savedLikes) {
      setLikedLetters(new Set(JSON.parse(savedLikes)));
    }
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setAllLetters([]);
      return;
    }

    const lettersRef = collection(db, 'letters');
    const queryConstraints = [];

    if (selectedMember && selectedMember !== 'all') {
      queryConstraints.push(where('member', '==', selectedMember));
    }

    if (sortOrder === 'mostLoved') {
      queryConstraints.push(orderBy('likes', 'desc'));
      queryConstraints.push(orderBy('timestamp', 'desc'));
    } else {
      queryConstraints.push(orderBy('timestamp', sortOrder === 'newest' ? 'desc' : 'asc'));
    }

    const unsubscribe = onSnapshot(
      query(lettersRef, ...queryConstraints),
      (snapshot) => {
        const fetchedLetters = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Letter[];

        const filteredLetters = fetchedLetters.filter(letter =>
          letter.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setAllLetters(filteredLetters);
        setLetters(filteredLetters.slice(0, LETTERS_PER_PAGE));
        setHasMore(filteredLetters.length > LETTERS_PER_PAGE);
        setTotalLettersCount(filteredLetters.length);
      },
      (error) => {
        console.error('Error fetching all letters:', error);
      }
    );

    return () => unsubscribe();
  }, [searchQuery, selectedMember, sortOrder]);

  useEffect(() => {
    if (searchQuery) return; // Skip if search is active

    try {
      setIsLoading(true);
      setHasMore(true);
      lastDocRef.current = null;

      const lettersRef = collection(db, 'letters');
      const queryConstraints = [];

      if (selectedMember && selectedMember !== 'all') {
        queryConstraints.push(where('member', '==', selectedMember));
      }

      if (sortOrder === 'mostLoved') {
        queryConstraints.push(orderBy('likes', 'desc'));
        queryConstraints.push(orderBy('timestamp', 'desc'));
      } else {
        queryConstraints.push(orderBy('timestamp', sortOrder === 'oldest' ? 'asc' : 'desc'));
      }

      queryConstraints.push(limit(LETTERS_PER_PAGE));

      const baseQuery = selectedMember && selectedMember !== 'all'
        ? query(lettersRef, where('member', '==', selectedMember))
        : query(lettersRef);

      const unsubscribeCount = onSnapshot(baseQuery, (snapshot) => {
        setTotalLettersCount(snapshot.size);
      });

      const unsubscribeLetters = onSnapshot(
        query(lettersRef, ...queryConstraints),
        (snapshot) => {
          const fetchedLetters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Letter[];

          setLetters(fetchedLetters);
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
          setHasMore(snapshot.docs.length === LETTERS_PER_PAGE);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching letters:', error);
          setIsLoading(false);
        }
      );

      return () => {
        unsubscribeCount();
        unsubscribeLetters();
      };
    } catch (error) {
      console.error('Error setting up listeners:', error);
      setIsLoading(false);
    }
  }, [selectedMember, sortOrder, searchQuery]);

  // Add a separate effect for total letters count
  useEffect(() => {
    const lettersRef = collection(db, 'letters');
    
    // Create a simple query without any filters
    const countQuery = query(lettersRef);
    
    const unsubscribe = onSnapshot(countQuery, (snapshot) => {
      setTotalUnfilteredCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedLikes = localStorage.getItem('likedLetters');
    if (savedLikes) {
      setLikedLetters(new Set(JSON.parse(savedLikes)));
    }
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setAllLetters([]);
      return;
    }

    const lettersRef = collection(db, 'letters');
    const queryConstraints = [];

    if (selectedMember && selectedMember !== 'all') {
      queryConstraints.push(where('member', '==', selectedMember));
    }

    if (sortOrder === 'mostLoved') {
      queryConstraints.push(orderBy('likes', 'desc'));
      queryConstraints.push(orderBy('timestamp', 'desc'));
    } else {
      queryConstraints.push(orderBy('timestamp', sortOrder === 'newest' ? 'desc' : 'asc'));
    }

    const unsubscribe = onSnapshot(
      query(lettersRef, ...queryConstraints),
      (snapshot) => {
        const fetchedLetters = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Letter[];

        const filteredLetters = fetchedLetters.filter(letter =>
          letter.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setAllLetters(filteredLetters);
        setLetters(filteredLetters.slice(0, LETTERS_PER_PAGE));
        setHasMore(filteredLetters.length > LETTERS_PER_PAGE);
      },
      (error) => {
        console.error('Error fetching all letters:', error);
      }
    );

    return () => unsubscribe();
  }, [searchQuery, selectedMember, sortOrder]);

  useEffect(() => {
    if (searchQuery) return; // Skip if search is active

    try {
      setIsLoading(true);
      setHasMore(true);
      lastDocRef.current = null;

      const lettersRef = collection(db, 'letters');
      const queryConstraints = [];

      if (selectedMember && selectedMember !== 'all') {
        queryConstraints.push(where('member', '==', selectedMember));
      }

      if (sortOrder === 'mostLoved') {
        queryConstraints.push(orderBy('likes', 'desc'));
        queryConstraints.push(orderBy('timestamp', 'desc'));
      } else {
        queryConstraints.push(orderBy('timestamp', sortOrder === 'oldest' ? 'asc' : 'desc'));
      }

      queryConstraints.push(limit(LETTERS_PER_PAGE));

      const baseQuery = selectedMember && selectedMember !== 'all'
        ? query(lettersRef, where('member', '==', selectedMember))
        : query(lettersRef);

      const unsubscribeLetters = onSnapshot(
        query(lettersRef, ...queryConstraints),
        (snapshot) => {
          const fetchedLetters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Letter[];

          setLetters(fetchedLetters);
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
          setHasMore(snapshot.docs.length === LETTERS_PER_PAGE);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching letters:', error);
          setIsLoading(false);
        }
      );

      return () => unsubscribeLetters();
    } catch (error) {
      console.error('Error setting up listeners:', error);
      setIsLoading(false);
    }
  }, [selectedMember, sortOrder, searchQuery]);

  // Add unsubscribe ref
  const paginationUnsubscribeRef = useRef<(() => void) | null>(null);

  // Cleanup pagination listener when filters change or component unmounts
  useEffect(() => {
    return () => {
      if (paginationUnsubscribeRef.current) {
        paginationUnsubscribeRef.current();
        paginationUnsubscribeRef.current = null;
      }
    };
  }, [selectedMember, sortOrder]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || isLoading) return;

    if (searchQuery) {
      // Handle pagination for search results
      setLetters(prev => {
        const currentLength = prev.length;
        return [...prev, ...allLetters.slice(currentLength, currentLength + LETTERS_PER_PAGE)];
      });
      setHasMore(allLetters.length > letters.length + LETTERS_PER_PAGE);
      return;
    }

    if (paginationUnsubscribeRef.current) {
      paginationUnsubscribeRef.current();
      paginationUnsubscribeRef.current = null;
    }

    try {
      setLoadingMore(true);
      const lettersRef = collection(db, 'letters');
      const queryConstraints = [];

      if (selectedMember && selectedMember !== 'all') {
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

      const unsubscribe = onSnapshot(
        query(lettersRef, ...queryConstraints),
        (snapshot) => {
          const newLetters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Letter[];

          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
          
          setLetters(prev => {
            const existingLetters = new Map(prev.map(letter => [letter.id, letter]));
            
            newLetters.forEach(letter => {
              if (!existingLetters.has(letter.id)) {
                existingLetters.set(letter.id, letter);
              }
            });
            
            return Array.from(existingLetters.values()).sort((a, b) => {
              if (sortOrder === 'mostLoved') {
                return b.likes - a.likes || 
                       ((b.timestamp as any).toMillis() - (a.timestamp as any).toMillis());
              }
              const timeA = (a.timestamp as any).toMillis();
              const timeB = (b.timestamp as any).toMillis();
              return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
            });
          });

          setHasMore(snapshot.docs.length === LETTERS_PER_PAGE);
          setLoadingMore(false);
        },
        (error) => {
          console.error("Error loading more letters:", error);
          setLoadingMore(false);
        }
      );

      paginationUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Error loading more letters:", error);
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, isLoading, selectedMember, sortOrder, searchQuery, allLetters, letters.length]);

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

    const { hasBadWords } = containsBadWords(message);
    if (hasBadWords) {
      return;
    }

    setIsSubmitting(true);
    const colorClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];

    try {
      const letterData = {
        name,
        nameLowerCase: name.toLowerCase(), // Add lowercase version for case-insensitive search
        member,
        message,
        country,
        timestamp: Timestamp.now(),
        colorClass,
        likes: 0,
        likedBy: [],
        ...(selectedTrack && {
          spotifyTrack: {
            id: selectedTrack.id,
            name: selectedTrack.name,
            artist: selectedTrack.artists[0]?.name,
            albumCover: selectedTrack.album?.images?.[0]?.url
          }
        })
      };

      const docRef = await addDoc(collection(db, 'letters'), letterData);
      
      // Reset form
      setName('');
      setMessage('');
      setCountry('');
      setMember(members[0].id);
      setSelectedMember(member);
      setSelectedTrack(null);
      
      // Show success message
      await Swal.fire({
        title: 'Letter Sent! 💜',
        text: 'Your letter has been sent successfully!',
        icon: 'success',
        confirmButtonText: 'View Letter',
        confirmButtonColor: '#9333EA',
        showCancelButton: true,
        cancelButtonText: 'Close',
        cancelButtonColor: '#6B7280',
      }).then((result) => {
        // If user clicks "View Letter", redirect to the letter page
        if (result.isConfirmed) {
          router.push(`/letter/${docRef.id}`);
        }
      });
      
    } catch (error) {
      console.error('Error adding letter:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to send letter. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#9333EA',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberFilter = (member: string) => {
    console.log('Filtering for member:', member);
    setSelectedMember(member);
    setTimeout(() => {
      scrollToLetters();
    }, 300);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
    setTimeout(() => {
      scrollToLetters();
    }, 300);
  };

  const handleLike = async (e: React.MouseEvent, letterId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) return;
    const isLiked = likedLetters.has(letterId);

    try {
      const letterRef = doc(db, 'letters', letterId);

      // First update the UI state optimistically
      const newLikedLetters = new Set(likedLetters);
      if (isLiked) {
        newLikedLetters.delete(letterId);
      } else {
        newLikedLetters.add(letterId);
      }
      setLikedLetters(newLikedLetters);

      // Then update the database
      const batch: Promise<void>[] = [];
      batch.push(updateDoc(letterRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      }));
      await Promise.all(batch);

      // Save to localStorage after successful database update
      localStorage.setItem('likedLetters', JSON.stringify(Array.from(newLikedLetters)));
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert UI state if database update fails
      const revertedLikedLetters = new Set(likedLetters);
      if (isLiked) {
        revertedLikedLetters.add(letterId);
      } else {
        revertedLikedLetters.delete(letterId);
      }
      setLikedLetters(revertedLikedLetters);
    }
  };

  // Migration function to update existing documents
  const migrateExistingDocuments = async () => {
    try {
      const lettersRef = collection(db, 'letters');
      const snapshot = await getDocs(lettersRef);
      
      const batch: Promise<void>[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.nameLowerCase && data.name) {
          batch.push(updateDoc(doc.ref as DocumentReference<DocumentData>, {
            nameLowerCase: data.name.toLowerCase()
          }));
        }
      });
      
      await Promise.all(batch);
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Error during migration:', error);
    }
  };

  // Run migration when component mounts
  useEffect(() => {
    migrateExistingDocuments();
  }, []);

  // Update the letters fetching effect to include likedBy field
  useEffect(() => {
    if (searchQuery) return; // Skip if search is active

    try {
      setIsLoading(true);
      setHasMore(true);
      lastDocRef.current = null;

      const lettersRef = collection(db, 'letters');
      const queryConstraints = [];

      if (selectedMember && selectedMember !== 'all') {
        queryConstraints.push(where('member', '==', selectedMember));
      }

      if (sortOrder === 'mostLoved') {
        queryConstraints.push(orderBy('likes', 'desc'));
        queryConstraints.push(orderBy('timestamp', 'desc'));
      } else {
        queryConstraints.push(orderBy('timestamp', sortOrder === 'oldest' ? 'asc' : 'desc'));
      }

      queryConstraints.push(limit(LETTERS_PER_PAGE));

      const unsubscribeLetters = onSnapshot(
        query(lettersRef, ...queryConstraints),
        (snapshot) => {
          const fetchedLetters = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              likedBy: data.likedBy || []
            };
          }) as Letter[];

          setLetters(fetchedLetters);
          
          // Update likedLetters based on fetched data
          if (userId) {
            const newLikedLetters = new Set(
              fetchedLetters
                .filter(letter => letter.likedBy?.includes(userId))
                .map(letter => letter.id)
            );
            setLikedLetters(newLikedLetters);
            localStorage.setItem('likedLetters', JSON.stringify(Array.from(newLikedLetters)));
          }

          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
          setHasMore(snapshot.docs.length === LETTERS_PER_PAGE);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching letters:', error);
          setIsLoading(false);
        }
      );

      return () => unsubscribeLetters();
    } catch (error) {
      console.error('Error setting up listeners:', error);
      setIsLoading(false);
    }
  }, [selectedMember, sortOrder, searchQuery, userId]);

  const lettersCardsRef = useRef<HTMLDivElement>(null);

  const scrollToLetters = useCallback(() => {
    if (lettersCardsRef.current) {
      lettersCardsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 relative">
      <div className="floating-stickers absolute inset-0 pointer-events-none overflow-hidden">
        <span className="sticker-1">✨</span>
        <span className="sticker-2">🎵</span>
        <span className="sticker-3">💫</span>
        <span className="sticker-4">⭐</span>
        <span className="sticker-5">💜</span>
      </div>
      <div className="bg-pattern fixed inset-0 pointer-events-none"></div>
      {previewLetter && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setPreviewLetter(null)} />
      )}
      <main className="min-h-screen bg-gradient-to-b from-white/80 to-white/90 py-8">
        <div className="text-center max-w-4xl mx-auto mb-6 px-4">
          <button 
            onClick={() => router.push('/')} 
            className="font-reenie font-bold text-6xl mb-4 animate-fade-in text-gray-800 hover:text-[#9333EA] transition-colors duration-300"
          >
            Love for BTS
          </button>
          <p className="text-gray-600 italic text-base">
            Pour your love into words for BTS that inspire and unite ARMYs worldwide
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="bg-[#9333EA]/10 border border-[#9333EA]/20 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#9333EA] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-black/90 leading-relaxed">
                Dear ARMY, Please write your message with care! Also avoid including any sensitive or personal information like phone numbers, addresses, or any private things. Please use appropriate language! 
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4">
          <div className="mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              maxLength={20}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none"
            />
          </div>

          <div className="mb-3 relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full p-3 pl-12 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none text-left bg-white relative"
            >
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <img 
                  src={members.find(m => m.id === member)?.image} 
                  alt={member}
                  className="w-8 h-8 rounded-full"
                />
              </div>
              {member}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMember(m.id);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <img 
                      src={m.image} 
                      alt={m.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-3">
            <textarea
              value={message}
              onChange={(e) => {
                const newMessage = e.target.value;
                const { hasBadWords, foundWords } = containsBadWords(newMessage);
                if (hasBadWords) {
                  setMessageError(`Please avoid using inappropriate words!`);
                } else {
                  setMessageError(null);
                }
                setMessage(newMessage);
              }}
              placeholder="Write your message... (1000 characters max)"
              required
              maxLength={1000}
              className={`w-full p-3 rounded-lg border ${messageError ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none resize-none h-32`}
            />
            {messageError && (
              <p className="mt-1 text-sm text-red-500">{messageError}</p>
            )}
          </div>

          <div className="mb-3">
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Where are you from? (optional)"
              maxLength={15}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none"
            />
          </div>

          <div className="mb-8">
            <SpotifySearch
              onSelect={(track) => {
                setSelectedTrack(track);
              }}
              selectedTrack={selectedTrack}
              required={false}
            />
          </div>

          <div className="flex justify-center mt-6 mb-8 sm:mb-8">
            <button
              type="submit"
              disabled={isSubmitting || !selectedTrack || !name || !message || !member}
              className={`w-[85%] sm:w-auto bg-[#9333EA] text-white px-8 py-3.5 rounded-full font-medium 
                transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2
                ${(isSubmitting || !selectedTrack || !name || !message || !member) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#7928CA]'}`}
            >
              <span>{isSubmitting ? 'Sending...' : 'Send Letter'}</span>
              {!isSubmitting && <span className="text-xl">💌</span>}
            </button>
          </div>
        </form>

        <div className="max-w-7xl mx-auto mb-12 px-4 mt-0 sm:mt-4">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-full flex justify-center ${showFilters ? 'mb-4' : 'mb-2'}`}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <span>{showFilters ? 'Hide' : 'Show'} Search & Filters</span>
                <svg 
                  className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className={`w-full flex flex-col items-center gap-6 transition-all duration-300 ${showFilters ? 'opacity-100 max-h-[500px] mb-4' : 'opacity-0 max-h-0 overflow-hidden mb-0'}`}>
              <div className="w-full max-w-md mb-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value) {
                        setTimeout(() => {
                          scrollToLetters();
                        }, 300);
                      }
                    }}
                    placeholder="Search by sender name..."
                    className="w-full p-3 pl-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 w-full">
                <button
                  onClick={() => handleMemberFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${selectedMember === 'all' 
                      ? 'bg-[#9333EA] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  All
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleMemberFilter(m.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                      ${selectedMember === m.id 
                        ? 'bg-[#9333EA] text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <select
              value={sortOrder}
              onChange={handleSortChange}
              className="w-[90%] sm:w-auto bg-white text-gray-600 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="text-center text-gray-600 mt-2 mb-2">
              <p className="italic font-light">
                <span className="font-bold text-sm">{totalUnfilteredCount}</span><span className="font-medium text-sm"> letters has been sent to BTS</span> 
                <span className="text-purple-500">💜</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-2" ref={lettersCardsRef}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="heart-loading"></div>
            </div>
          ) : letters.length > 0 ? (
            <Masonry
              breakpointCols={{
                default: 4,
                1280: 3,
                1024: 2,
                768: 2,
                640: 1
              }}
              className="masonry-grid"
              columnClassName="masonry-grid_column"
            >
              {letters.map((letter, index) => (
                <div
                  key={letter.id}
                  ref={index === letters.length - 1 ? lastLetterElementRef : undefined}
                  className={`letter-card ${colorClasses[index % colorClasses.length]} ${
                    letter.spotifyTrack ? 'has-track' : ''
                  }`}
                  onTouchStart={(e) => handleLetterInteraction(letter, e, 'start')}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleLetterInteraction(letter, e, 'end')}
                  onMouseDown={(e) => handleLetterInteraction(letter, e, 'start')}
                  onMouseUp={(e) => handleLetterInteraction(letter, e, 'end')}
                  onMouseLeave={() => {
                    if (longPressTimeoutRef.current) {
                      clearTimeout(longPressTimeoutRef.current);
                    }
                  }}
                >
                  <div className="flex flex-col h-full pointer-events-none">
                    <div className="mb-3 relative">
                      <span className="absolute top-2 right-2 text-2xl transform transition-transform duration-300 hover:scale-125 pointer-events-auto cursor-default">💌</span>
                      <h3 className="text-xl font-bold mb-2 pointer-events-none">
                        To: {letter.member}
                      </h3>
                      <div className="w-12 h-0.5 bg-white/30 rounded-full mb-3" />
                      <p className="letter-card-content text-white/90">
                        {letter.message}
                      </p>
                    </div>

                    <div className="mt-auto">
                      {letter.spotifyTrack && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <p className="text-center italic text-xs text-white/80 mb-2">Favorite song</p>
                          <div className="flex items-center gap-2 justify-center bg-black/20 rounded-2xl p-2">
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
                          <p className="text-left text-xs font-medium text-gray-950">
                            {letter.name}
                            {letter.country && (
                              <span className="text-[10px] text-black/70 ml-1">
                                from {letter.country}
                              </span>
                            )}
                          </p>
                          <div></div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1">
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
                          <span className="text-[10px] text-black/60 italic">
                            {new Date(letter.timestamp.toDate()).toLocaleDateString()}
                          </span>
                        </div>
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
      </main>

      {/* Preview Modal */}
      {previewLetter && (
        <div className="relative z-50">
          <LetterPreviewModal
            letter={previewLetter}
            onClose={() => setPreviewLetter(null)}
            onNavigate={() => {
              setPreviewLetter(null);
              router.push(`/letter/${previewLetter.id}`);
            }}
            onLike={(e) => handleLike(e, previewLetter.id)}
            isLiked={likedLetters.has(previewLetter.id)}
          />
        </div>
      )}
      <WelcomePopup />
    </div>
  );
}
