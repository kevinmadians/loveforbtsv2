'use client';

import { useState, useEffect, useRef } from 'react';
import { searchSongs } from '../services/spotify';
import { SpotifyTrack } from '../types/SpotifyTrack';

type SpotifySearchProps = {
  onSelect: (track: SpotifyTrack | null) => void;
  selectedTrack: SpotifyTrack | null;
  required?: boolean;
};

const SpotifySearch = ({ onSelect, selectedTrack, required = false }: SpotifySearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query) {
        setIsLoading(true);
        try {
          const tracks = await searchSongs(query);
          setResults(tracks);
        } catch (error) {
          console.error('Error searching songs:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleClearSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(null);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  const handleTrackSelect = (e: React.MouseEvent, track: SpotifyTrack) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(track);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {selectedTrack ? (
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
          <img 
            src={selectedTrack.album.images[0]?.url} 
            alt={selectedTrack.album.name}
            className="w-12 h-12 rounded-md"
          />
          <div className="flex-1">
            <p className="font-medium text-gray-800">{selectedTrack.name}</p>
            <p className="text-sm text-gray-500">{selectedTrack.artists[0]?.name}</p>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Clear selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(!isOpen);
            }}
            className="w-full p-3 text-left rounded-lg border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Your favorite BTS/Members Song</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search BTS/Members songs..."
                    className="w-full p-2 pl-8 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#9333EA] focus:border-transparent outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                  />
                  <svg
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {isLoading && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#9333EA] border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {results.length > 0 ? (
                  results.map((track) => (
                    <button
                      key={track.id}
                      onClick={(e) => handleTrackSelect(e, track)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <img 
                        src={track.album.images[0]?.url} 
                        alt={track.album.name}
                        className="w-12 h-12 rounded-md"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800">{track.name}</p>
                        <p className="text-sm text-gray-500">{track.artists[0]?.name}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    {query ? 'No songs found' : 'Type to search for BTS songs'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { SpotifySearch };