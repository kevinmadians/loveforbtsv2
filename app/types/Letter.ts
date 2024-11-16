import { Timestamp } from 'firebase/firestore';

export type Letter = {
  id: string;
  name: string;
  member: string;
  message: string;
  country: string;
  timestamp: Timestamp;
  colorClass: string;
  likes: number;
  likedBy: string[];
  spotifyTrack?: {
    id: string;
    name: string;
    artist: string;
    albumCover: string;
  };
}