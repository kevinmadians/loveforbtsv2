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
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
};

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
  
  try {
    // First try to search in Firebase
    const songsRef = collection(db, 'spotify_songs');
    const snapshot = await getDocs(songsRef);
    
    if (snapshot.empty) {
      // If no cached songs, fall back to direct Spotify API search
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
        track.artists.some((artist: { name: string }) => 
          ARTISTS.some(validArtist => {
            const artistName = artist.name.toLowerCase();
            const validArtistName = validArtist.toLowerCase();
            return artistName.includes(validArtistName) || validArtistName.includes(artistName);
          })
        )
      );

      return tracks.slice(0, 20).map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: {
          name: track.album.name,
          images: track.album.images
        }
      }));
    }

    // Search in cached songs
    const searchTerms = query.toLowerCase().split(' ').filter(word => word.length > 0);
    const tracks = snapshot.docs
      .map(doc => doc.data() as CachedSpotifyTrack)
      .filter(track => 
        searchTerms.some(term => 
          track.name.toLowerCase().includes(term) ||
          track.artistName.toLowerCase().includes(term) ||
          track.albumName.toLowerCase().includes(term)
        )
      )
      .slice(0, 20);

    return tracks.map(track => ({
      id: track.id,
      name: track.name,
      artists: [{ name: track.artistName }],
      album: {
        name: track.albumName,
        images: [{ url: track.albumCover }]
      }
    }));

  } catch (error) {
    console.error('Error searching songs:', error);
    return [];
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
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}; 