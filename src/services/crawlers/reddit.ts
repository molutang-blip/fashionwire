import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

// 扩展 subreddit 列表，增加更多时尚相关版块
const SUBREDDITS = [
  'fashion',
  'streetwear',
  'malefashionadvice',
  'femalefashionadvice',
  'sneakers',
  'handbags',
  'luxuryfashion',
];

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
        // 增加每个subreddit的抓取量到25条，提高命中率
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
          {
            headers: {
              'User-Agent': 'FashionWire/1.0 (fashion intelligence platform)',
              'Accept': 'application/json',
            },
          }
        );
        if (!response.ok) {
          console.warn(`[Reddit] r/${subreddit} 返回 ${response.status}`);
          continue;
        }

        const data = await response.json();
        const posts = data.data?.children || [];

        const filtered = posts
          // 降低过滤阈值：ups>50 && comments>5，大幅扩大可用数据范围
          // PRD要求的 ups>1000 仅适用于详情页展示，首页抓取需要更宽松
          .filter((p: any) => p.data.ups > 50 && p.data.num_comments > 5)
          .map((p: any, index: number) => {
            // 提取帖子的 selftext（帖子正文）供标题生成使用
            const selftext = (p.data.selftext || '').substring(0, 300);

            return {
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
                // 保存帖子正文内容，供融合层生成更有意义的中文标题
                article_content: selftext,
                // 保存 flair 标签（如 "Discussion", "Outfit", "Review" 等）
                flair: p.data.link_flair_text || '',
              },
            };
          });

        allPosts.push(...filtered);
        console.log(`[Reddit] r/${subreddit}: 获取 ${filtered.length} 条帖子`);
      } catch {
        console.error(`[Reddit] r/${subreddit} 抓取失败`);
      }
    }

    if (allPosts.length === 0) {
      console.warn('[Reddit] No posts found');
      return { success: false, count: 0, error: 'No Reddit data' };
    }

    // 按综合分数排序，取 Top 20（从之前的15增加到20）
    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // 保留数量从30增加到60，保留更多历史数据
    await deleteOldTopics('reddit', 60);
    await insertTrendingTopics(topPosts);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'reddit', status: 'success',
      items_count: topPosts.length, duration_ms: duration, error_message: null,
    });

    console.log(`[Reddit] Fetched ${topPosts.length} posts from ${SUBREDDITS.length} subreddits`);
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
