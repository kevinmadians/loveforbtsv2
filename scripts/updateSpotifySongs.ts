import { updateSpotifySongsCache } from '../app/services/spotify';

// Run this script periodically (e.g., daily) to update the songs cache
updateSpotifySongsCache()
  .then(() => {
    console.log('Successfully updated Spotify songs cache');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to update Spotify songs cache:', error);
    process.exit(1);
  }); 