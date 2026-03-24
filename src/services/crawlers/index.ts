import { crawlGoogleTrends } from './google-trends';
import { crawlFashionMedia } from './fashion-media';
import { crawlReddit } from './reddit';
import { runFusion } from '../fusion';

/** 完整流程：抓取三源 → 融合 → 返回结果 */
export async function crawlAndFuse() {
  // Step 1: Google + RSS 并行（核心数据源，最多 30s）
  // Reddit 单独跑，25s 内完成，失败不阻塞整体
  const [google, rss] = await Promise.all([
    crawlGoogleTrends().catch(e => ({ success: false, count: 0, error: String(e?.message || e) })),
    crawlFashionMedia().catch(e => ({ success: false, count: 0, error: String(e?.message || e) })),
  ]);

  // Reddit 独立执行，有自己的超时保护
  const reddit = await crawlReddit().catch(e => ({
    success: false, count: 0, error: String(e?.message || e),
  }));

  const crawlResults = { google, rss, reddit };
  console.log('[Crawl] 抓取结果:', JSON.stringify(crawlResults));

  // Step 2: 执行融合（只要有任意数据源成功即可）
  const fusionResult = await runFusion().catch(e => ({
    success: false, count: 0, error: String(e?.message || e),
  }));

  console.log('[Fusion] 融合结果:', JSON.stringify(fusionResult));

  return { crawl: crawlResults, fusion: fusionResult };
}

// 向后兼容旧的 crawlAll
export const crawlAll = crawlAndFuse;
