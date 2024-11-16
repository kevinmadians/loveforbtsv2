import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

const CLIENT_ID = 'b7f6d01df636488092d8c08980e43c07';
const CLIENT_SECRET = 'a4f12c910cac4f678a21547f9265fbbf';

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

const ARTISTS = [
  'BTS',
  'Jung Kook',
  'Jungkook',
  'V',
  'Jin',
  'Agust D',
  'SUGA',
  'j-hope',
  'j hope',
  'jhope',
  'RM',
  'Jimin',
  'JIN',
  '방탄소년단'
];

type CachedSpotifyTrack = {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  albumCover: string;
  lastUpdated: number;
};

type SpotifyAPITrack = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
};

// Memory cache for quick access to recently searched tracks
const memoryCache: { [key: string]: { data: SpotifyTrack[], timestamp: number } } = {};
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

const getAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

export const searchSongs = async (query: string): Promise<SpotifyTrack[]> => {
  if (!query) return [];
  
  const cacheKey = query.toLowerCase();
  
  // Check memory cache first
  if (memoryCache[cacheKey] && 
      Date.now() - memoryCache[cacheKey].timestamp < CACHE_DURATION) {
    return memoryCache[cacheKey].data;
  }

  try {
    // Check Firebase cache
    const songsRef = collection(db, 'spotify_songs');
    const cacheSnapshot = await getDocs(songsRef);
    
    const cachedSongs = cacheSnapshot.docs
      .map(doc => doc.data() as SpotifyTrack)
      .filter(track => 
        track.name.toLowerCase().includes(cacheKey) ||
        track.artists.some(artist => 
          artist.name.toLowerCase().includes(cacheKey)
        )
      );

    if (cachedSongs.length > 0) {
      // Update memory cache and return cached results
      memoryCache[cacheKey] = {
        data: cachedSongs,
        timestamp: Date.now()
      };
      return cachedSongs;
    }

    // If no cache hit, fetch from Spotify API
    const token = await getAccessToken();
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to search songs');

    const data = await response.json();
    let tracks = (data.tracks?.items || []) as SpotifyAPITrack[];

    // Filter for BTS and members
    tracks = tracks.filter((track: SpotifyAPITrack) => 
      track.artists.some(artist => 
        ARTISTS.some(name => 
          artist.name.toLowerCase().includes(name.toLowerCase())
        )
      )
    );

    // Transform tracks to include uri
    const transformedTracks: SpotifyTrack[] = tracks.map(track => ({
      id: track.id,
      name: track.name,
      uri: track.uri,
      artists: track.artists,
      album: track.album
    }));

    // Update both caches
    const batch = writeBatch(db);
    transformedTracks.forEach((track) => {
      const docRef = doc(songsRef, track.id);
      batch.set(docRef, track);
    });
    
    // Don't wait for cache update to complete
    batch.commit().catch(error => 
      console.error('Error updating song cache:', error)
    );

    // Update memory cache
    memoryCache[cacheKey] = {
      data: transformedTracks,
      timestamp: Date.now()
    };

    return transformedTracks;
  } catch (error) {
    console.error('Error searching songs:', error);
    throw error;
  }
};

export const updateSpotifySongsCache = async () => {
  try {
    const token = await getAccessToken();
    const allTracks: CachedSpotifyTrack[] = [];
    
    // Search for each artist's songs
    for (const artist of ARTISTS) {
      const searchUrl = `https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(artist)}"&type=track&limit=50`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      const tracks = data.tracks?.items || [] as SpotifyAPITrack[];
      
      // Filter and map tracks
      const artistTracks = tracks
        .filter((track: SpotifyAPITrack) => 
          track.artists.some((trackArtist: { name: string }) => 
            ARTISTS.some(validArtist => {
              const artistName = trackArtist.name.toLowerCase();
              const validArtistName = validArtist.toLowerCase();
              return artistName.includes(validArtistName) || validArtistName.includes(artistName);
            })
          )
        )
        .map((track: SpotifyAPITrack) => ({
          id: track.id,
          name: track.name,
          artistName: track.artists[0].name,
          albumName: track.album.name,
          albumCover: track.album.images[0]?.url || '',
          lastUpdated: Date.now()
        }));

      allTracks.push(...artistTracks);
    }

    // Remove duplicates based on track ID
    const uniqueTracks = Array.from(
      new Map(allTracks.map(track => [track.id, track])).values()
    );

    // Update Firebase collection
    const batch = writeBatch(db);
    const songsRef = collection(db, 'spotify_songs');

    // Delete existing songs
    const existingDocs = await getDocs(songsRef);
    existingDocs.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add new songs
    uniqueTracks.forEach(track => {
      const docRef = doc(songsRef);
      batch.set(docRef, track);
    });

    await batch.commit();
    console.log(`Updated ${uniqueTracks.length} songs in Firebase`);

  } catch (error) {
    console.error('Error updating Spotify songs cache:', error);
    throw error;
  }
};

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
};