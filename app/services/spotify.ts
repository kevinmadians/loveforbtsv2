const CLIENT_ID = 'b7f6d01df636488092d8c08980e43c07';
const CLIENT_SECRET = '89602db6a0c64a8baf8662ea370b3d79';

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
    const token = await getAccessToken();
    
    // First, try searching with artist filter
    const artistQuery = ARTISTS.map(artist => `artist:"${artist}"`).join(' OR ');
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to search songs');
    }

    const data = await response.json();
    let tracks = data.tracks?.items || [];

    // Filter results to include BTS and members
    tracks = tracks.filter(track => 
      track.artists.some(artist => 
        ARTISTS.some(validArtist => {
          const artistName = artist.name.toLowerCase();
          const validArtistName = validArtist.toLowerCase();
          return artistName.includes(validArtistName) || validArtistName.includes(artistName);
        })
      )
    );

    return tracks.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: {
        name: track.album.name,
        images: track.album.images
      }
    }));
  } catch (error) {
    console.error('Error searching songs:', error);
    return [];
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