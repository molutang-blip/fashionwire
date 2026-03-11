import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

const SUBREDDITS = ['fashion', 'streetwear', 'malefashionadvice', 'femalefashionadvice'];

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

export async function crawlReddit() {
  const startTime = Date.now();

  try {
    console.log('[Reddit] Starting...');
    const allPosts: any[] = [];

    for (const subreddit of SUBREDDITS) {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
          { headers: { 'User-Agent': 'FashionWire/1.0' } }
        );
        if (!response.ok) continue;

        const data = await response.json();
        const posts = data.data?.children || [];

        const filtered = posts
          .filter((p: any) => p.data.ups > 300 && p.data.num_comments > 15)
          .map((p: any, index: number) => ({
            title_zh: p.data.title,   // 原始标题，中文生成交给融合层
            title_en: p.data.title,
            score: Math.round(p.data.ups + p.data.num_comments * 10),
            source: 'reddit' as const,
            source_label: `r/${subreddit}`,
            direction: getTrendDirection(index),
            source_url: `https://reddit.com${p.data.permalink}`,
            source_id: `reddit_${p.data.id}`,
            raw_data: {
              ups: p.data.ups,
              num_comments: p.data.num_comments,
              subreddit,
              created_utc: p.data.created_utc,
            },
          }));

        allPosts.push(...filtered);
      } catch {
        console.error(`[Reddit] r/${subreddit} 抓取失败`);
      }
    }

    if (allPosts.length === 0) {
      console.warn('[Reddit] No posts found');
      return { success: false, count: 0, error: 'No Reddit data' };
    }

    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    await deleteOldTopics('reddit', 30);
    await insertTrendingTopics(topPosts);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'reddit', status: 'success',
      items_count: topPosts.length, duration_ms: duration, error_message: null,
    });

    console.log(`[Reddit] Fetched ${topPosts.length} posts`);
    return { success: true, count: topPosts.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    await logCrawl({
      source: 'reddit', status: 'failed',
      items_count: 0, error_message: msg, duration_ms: Date.now() - startTime,
    });
    return { success: false, count: 0, error: msg };
  }
}
