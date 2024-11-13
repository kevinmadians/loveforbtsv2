'use client';

import { useState, useEffect } from 'react';
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
  Query
} from 'firebase/firestore';

const membersList = ['BTS', 'RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'];
const colorClasses = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' }
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

  useEffect(() => {
    try {
      setIsLoading(true);
      const lettersRef = collection(db, 'letters');
      
      let queryConstraints = [];
      
      if (selectedMember !== 'all') {
        queryConstraints.push(where('member', '==', selectedMember));
      }
      
      queryConstraints.push(orderBy('timestamp', sortOrder === 'newest' ? 'desc' : 'asc'));
      
      const q = query(lettersRef, ...queryConstraints);
      
      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const fetchedLetters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Letter[];
          
          setLetters(fetchedLetters);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create the letter document
      const newLetter = {
        name,
        member, // This should match exactly with the filter value
        message,
        timestamp: Timestamp.now(),
        colorClass: colorClasses[Math.floor(Math.random() * colorClasses.length)]
      };

      // Add to Firestore
      await addDoc(collection(db, 'letters'), newLetter);
      
      // Reset form
      setName('');
      setMessage('');
      setMember(membersList[0]);
      
      // Optional: Switch filter to show the newly added letter
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

  return (
    <div className="min-h-screen p-8 bg-white">
      {/* Hero Section */}
      <header className="text-center mb-16">
        <h1 className="font-reenie text-6xl mb-4 animate-fade-in text-gray-800">
          Letters for BTS
        </h1>
        <p className="text-xl text-gray-700">Share your heartfelt messages with BTS</p>
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
          className={`w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 
            transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Letter'}
        </button>
      </form>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col items-center space-y-6">
            {/* Member Filter Buttons */}
            <div className="w-full text-center">
              <label className="block text-lg font-medium text-gray-700 mb-4">
                Filter by Member
              </label>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleMemberFilter('all')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                    ${selectedMember === 'all'
                      ? 'bg-purple-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                >
                  All
                </button>
                {membersList.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMemberFilter(m)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                      ${selectedMember === m
                        ? 'bg-purple-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Order */}
            <div className="w-full max-w-xs">
              <label className="block text-center text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                className="input-style text-center"
                value={sortOrder}
                onChange={handleSortChange}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Filter Stats */}
          <div className="mt-6 text-sm text-gray-600 text-center">
            Showing {letters.length} letter{letters.length !== 1 ? 's' : ''} 
            {selectedMember !== 'all' ? ` for ${selectedMember}` : ''}
          </div>
        </div>
      </div>

      {/* Letters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-600">
            Loading letters...
          </div>
        ) : letters.length > 0 ? (
          letters.map((letter) => (
            <div
              key={letter.id}
              className={`letter-card ${letter.colorClass}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-800">To: {letter.member}</h3>
                <span className="text-sm text-gray-600">
                  {new Date(letter.timestamp.toDate()).toLocaleDateString()}
                </span>
              </div>
              <p className="mb-4 whitespace-pre-wrap text-gray-700">{letter.message}</p>
              <p className="text-right text-sm font-semibold text-gray-800">From: {letter.name}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-600">
            No letters found{selectedMember !== 'all' ? ` for ${selectedMember}` : ''}. 
            Be the first to write one!
          </div>
        )}
      </div>
    </div>
  );
}
