import { db } from '../app/firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function updateExistingLetters() {
  const lettersRef = collection(db, 'letters');
  const snapshot = await getDocs(lettersRef);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.likes === 'undefined') {
      await updateDoc(doc.ref, {
        likes: 0,
        likedBy: []
      });
      console.log(`Updated document ${doc.id}`);
    }
  }
}

// Run this function once to update all existing documents
updateExistingLetters().then(() => console.log('Update complete')); 