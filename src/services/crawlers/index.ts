import { crawlGoogleTrends } from './google-trends';
import { crawlFashionMedia } from './fashion-media';

interface CrawlResult {
  success: boolean;
  count: number;
  error?: string;
}

export async function crawlAll(useMock = false) {
  const results: Record<string, CrawlResult> = {
    google: { success: false, count: 0 },
    fashionMedia: { success: false, count: 0 },
  };

  try {
    const googleResult = await crawlGoogleTrends();
    results.google = googleResult;
  } catch (error) {
    results.google.error = error instanceof Error ? error.message : '未知错误';
  }

  try {
    const mediaResult = await crawlFashionMedia();
    results.fashionMedia = mediaResult;
  } catch (error) {
    results.fashionMedia.error = error instanceof Error ? error.message : '未知错误';
  }

  return results;
}
