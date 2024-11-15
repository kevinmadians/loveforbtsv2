import type { Metadata } from "next";
import { db } from '../../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Fetch the letter data
  const docRef = doc(db, "letters", params.id);
  let letterTitle = "Letter to BTS";
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      letterTitle = data.title || "Letter to BTS";
    }
  } catch (error) {
    console.error("Error fetching letter for metadata:", error);
  }

  return {
    title: `${letterTitle} - Love for BTS`,
    description: 'A heartfelt letter from ARMY to BTS. Read and share messages of love and support for our beloved artists.',
    openGraph: {
      title: `${letterTitle} - Love for BTS`,
      description: 'A heartfelt letter from ARMY to BTS. Read and share messages of love and support for our beloved artists.',
      url: `https://loveforbts.com/letter/${params.id}`,
      siteName: 'Love for BTS',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Love for BTS - Letters from ARMY',
        }
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${letterTitle} - Love for BTS`,
      description: 'A heartfelt letter from ARMY to BTS. Read and share messages of love and support for our beloved artists.',
      images: ['/og-image.jpg'],
    },
  }
}
