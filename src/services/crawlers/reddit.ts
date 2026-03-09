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
    const allPosts = [];
    
    for (const subreddit of SUBREDDITS) {
      try {
        // 修复：删除 URL 中的空格
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=10`, {
          headers: { 'User-Agent': 'FashionWire/1.0' }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const posts = data.data?.children || [];
        
        const filtered = posts
          .filter((p: any) => p.data.ups > 1000 && p.data.num_comments > 50)
          .map((p: any, index: number) => ({
            title_zh: p.data.title,
            title_en: p.data.title,
            score: Math.round(p.data.ups / 100),
            source: 'reddit' as const,
            source_label: `r/${subreddit}`,
            direction: getTrendDirection(index),
            source_url: `https://reddit.com${p.data.permalink}`, // 修复：删除空格
            source_id: `reddit_${p.data.id}`,
            raw_data: p.data
          }));
          
        allPosts.push(...filtered);
      } catch (e) {
        console.error(`Reddit r/${subreddit} 抓取失败`);
      }
    }

    if (allPosts.length === 0) {
      return { success: false, count: 0, error: 'No Reddit data' };
    }

    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    await deleteOldTopics('reddit', 20);
    await insertTrendingTopics(topPosts);
    
    // 修复：补全所有必需字段
    await logCrawl({
      source: 'reddit',
      status: 'success',
      items_count: topPosts.length,
      duration_ms: Date.now() - startTime,
      error_message: null
    });

    return { success: true, count: topPosts.length };
  } catch (error) {
    // 修复：补全所有必需字段
    await logCrawl({
      source: 'reddit',
      status: 'failed',
      items_count: 0,
      error_message: error instanceof Error ? error.message : '未知错误',
      duration_ms: Date.now() - startTime
    });
    return { success: false, count: 0, error: error.message };
  }
}
