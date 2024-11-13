import { Timestamp } from 'firebase/firestore';

export type Letter = {
  id: string;
  name: string;
  member: string;
  message: string;
  timestamp: Timestamp;
  colorClass: string;
  likes: number;
  likedBy?: string[];
} 