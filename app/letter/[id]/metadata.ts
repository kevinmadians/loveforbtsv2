import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Letter to BTS - Love for BTS`,
    description: 'A heartfelt letter from ARMY to BTS. Read and share messages of love and support for our beloved artists.',
    openGraph: {
      title: `Letter to BTS - Love for BTS`,
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
      title: `Letter to BTS - Love for BTS`,
      description: 'A heartfelt letter from ARMY to BTS. Read and share messages of love and support for our beloved artists.',
      images: ['/og-image.jpg'],
    },
  }
}
