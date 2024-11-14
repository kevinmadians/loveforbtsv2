export default function SpotifyPlayer({ songId }: { songId: string }) {
  return (
    <iframe
      src={`https://open.spotify.com/embed/track/${songId}`}
      width="100%"
      height="80"
      frameBorder="0"
      allow="encrypted-media"
      className="rounded-lg"
    />
  );
} 