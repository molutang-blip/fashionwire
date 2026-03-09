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
    // 通过 Reddit RSS 抓取（免费，无需 API Key）
    const allPosts = [];
    
    for (const subreddit of SUBREDDITS) {
      try {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=10`, {
          headers: { 'User-Agent': 'FashionWire/1.0' }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const posts = data.data?.children || [];
        
        // 只取高互动帖子（PRD要求：upvotes>1000, comments>50）
        const filtered = posts
          .filter((p: any) => p.data.ups > 1000 && p.data.num_comments > 50)
          .map((p: any, index: number) => ({
            title_zh: p.data.title, // 暂时用英文，后续翻译
            title_en: p.data.title,
            score: Math.round(p.data.ups / 100), // 临时分数，后续加权
            source: 'reddit' as const,
            source_label: `r/${subreddit}`,
            direction: getTrendDirection(index),
            source_url: `https://reddit.com${p.data.permalink}`,
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

    // 按热度排序取前10
    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    await deleteOldTopics('reddit', 20);
    await insertTrendingTopics(topPosts);
    
    await logCrawl({
      source: 'reddit',
      status: 'success',
      items_count: topPosts.length,
      duration_ms: Date.now() - startTime
    });

    return { success: true, count: topPosts.length };
  } catch (error) {
    await logCrawl({
      source: 'reddit',
      status: 'failed',
      error_message: error instanceof Error ? error.message : '未知错误',
      duration_ms: Date.now() - startTime
    });
    return { success: false, count: 0, error: error.message };
  }
}
