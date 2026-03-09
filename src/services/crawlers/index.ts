import { crawlGoogleTrends } from './google-trends';
import { crawlFashionMedia } from './fashion-media';
import { crawlReddit } from './reddit';

export async function crawlAll() {
  const results = {
    google: await crawlGoogleTrends().catch(e => ({ success: false, error: e.message })),
    fashionMedia: await crawlFashionMedia().catch(e => ({ success: false, error: e.message })),
    reddit: await crawlReddit().catch(e => ({ success: false, error: e.message }))
  };
  
  return results;
}
