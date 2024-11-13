'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Letter } from '../../types/Letter';

export default function LetterPage() {
  const params = useParams();
  const router = useRouter();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLetter() {
      try {
        const letterId = params.id as string;
        const letterDoc = await getDoc(doc(db, 'letters', letterId));
        
        if (letterDoc.exists()) {
          setLetter({
            id: letterDoc.id,
            ...letterDoc.data()
          } as Letter);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching letter:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    fetchLetter();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4C0083] border-t-transparent"></div>
      </div>
    );
  }

  if (!letter) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className={`max-w-2xl w-full rounded-xl shadow-2xl ${letter.colorClass} p-8`}>
        <div className="mb-6 text-center">
          <h1 className="font-reenie text-5xl mb-4 text-gray-800">Letters for BTS</h1>
          <div className="w-16 h-1 mx-auto bg-[#4C0083]/20 rounded-full mb-6"></div>
          <h2 className="font-bold text-2xl text-gray-800 mb-2">
            To: {letter.member}
          </h2>
        </div>

        <div className="mb-6">
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">
            {letter.message}
          </p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-[#4C0083]/20">
          <span className="text-sm text-gray-600">
            {new Date(letter.timestamp.toDate()).toLocaleDateString()}
          </span>
          <p className="text-base font-semibold text-gray-800">
            From: {letter.name}
          </p>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="primary-button"
          >
            Write Your Own Letter
          </button>
        </div>
      </div>
    </div>
  );
} 