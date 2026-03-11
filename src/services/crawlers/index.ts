import { crawlGoogleTrends } from './google-trends';
import { crawlFashionMedia } from './fashion-media';
import { crawlReddit } from './reddit';
import { runFusion } from '../fusion';

/** 完整流程：抓取三源 → 融合 → 返回结果 */
export async function crawlAndFuse() {
  // Step 1: 并行抓取三个数据源（真正并行，减少总耗时）
  const [google, rss, reddit] = await Promise.all([
    crawlGoogleTrends().catch(e => ({ success: false, count: 0, error: e.message })),
    crawlFashionMedia().catch(e => ({ success: false, count: 0, error: e.message })),
    crawlReddit().catch(e => ({ success: false, count: 0, error: e.message })),
  ]);

  const crawlResults = { google, rss, reddit };
  console.log('[Crawl] 抓取结果:', JSON.stringify(crawlResults));

  // Step 2: 执行融合
  const fusionResult = await runFusion().catch(e => ({
    success: false, count: 0, error: e.message,
  }));

  console.log('[Fusion] 融合结果:', JSON.stringify(fusionResult));

  return { crawl: crawlResults, fusion: fusionResult };
}

// 向后兼容旧的 crawlAll
export const crawlAll = crawlAndFuse;
