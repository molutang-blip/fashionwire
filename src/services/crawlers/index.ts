export { crawlWeiboHot, crawlWeiboHotMock } from './weibo';
export { crawlXiaohongshuHot, crawlXiaohongshuHotMock } from './xiaohongshu';
export { crawlWeiboFashion, crawlWeiboFashionMock } from './weibo-fashion';

interface CrawlResult {
  success: boolean;
  count: number;
  error?: string;
}

export async function crawlAll(useMock = false) {
  const results: Record<string, CrawlResult> = {
    weibo: { success: false, count: 0 },
    xiaohongshu: { success: false, count: 0 },
    weiboFashion: { success: false, count: 0 },
  };

  const [weiboResult, xiaohongshuResult, weiboFashionResult] = await Promise.allSettled([
    useMock
      ? import('./weibo').then(m => m.crawlWeiboHotMock())
      : import('./weibo').then(m => m.crawlWeiboHot()),
    useMock
      ? import('./xiaohongshu').then(m => m.crawlXiaohongshuHotMock())
      : import('./xiaohongshu').then(m => m.crawlXiaohongshuHot()),
    useMock
      ? import('./weibo-fashion').then(m => m.crawlWeiboFashionMock())
      : import('./weibo-fashion').then(m => m.crawlWeiboFashion()),
  ]);

  if (weiboResult.status === 'fulfilled') {
    results.weibo = weiboResult.value;
  } else {
    results.weibo.error = weiboResult.reason?.message || '未知错误';
  }

  if (xiaohongshuResult.status === 'fulfilled') {
    results.xiaohongshu = xiaohongshuResult.value;
  } else {
    results.xiaohongshu.error = xiaohongshuResult.reason?.message || '未知错误';
  }

  if (weiboFashionResult.status === 'fulfilled') {
    results.weiboFashion = weiboFashionResult.value;
  } else {
    results.weiboFashion.error = weiboFashionResult.reason?.message || '未知错误';
  }

  return results;
}
