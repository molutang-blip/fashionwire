import { crawlGoogleTrends } from './google-trends';

interface CrawlResult {
  success: boolean;
  count: number;
  error?: string;
}

export async function crawlAll(useMock = false) {
  const results: Record<string, CrawlResult> = {
    google: { success: false, count: 0 },
  };

  try {
    const googleResult = await crawlGoogleTrends();
    results.google = googleResult;
  } catch (error) {
    results.google.error = error instanceof Error ? error.message : '未知错误';
  }

  return results;
}
