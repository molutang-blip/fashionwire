export { crawlGoogleTrends, crawlGoogleTrendsMock } from './google-trends';
export { crawlFashionMedia, crawlFashionMediaMock } from './fashion-media';

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

  const [googleResult, fashionMediaResult] = await Promise.allSettled([
    useMock
      ? import('./google-trends').then(m => m.crawlGoogleTrendsMock())
      : import('./google-trends').then(m => m.crawlGoogleTrends()),
    useMock
      ? import('./fashion-media').then(m => m.crawlFashionMediaMock())
      : import('./fashion-media').then(m => m.crawlFashionMedia()),
  ]);

  if (googleResult.status === 'fulfilled') {
    results.google = googleResult.value;
  } else {
    results.google.error = googleResult.reason?.message || '未知错误';
  }

  if (fashionMediaResult.status === 'fulfilled') {
    results.fashionMedia = fashionMediaResult.value;
  } else {
    results.fashionMedia.error = fashionMediaResult.reason?.message || '未知错误';
  }

  return results;
}
