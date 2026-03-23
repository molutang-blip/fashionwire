import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

// Reddit 每个 subreddit 都原生提供 RSS feed，无需任何认证
// 格式：https://www.reddit.com/r/{sub}/hot/.rss
const SUBREDDITS = [
  { name: 'fashion',              weight: 1.2 },
  { name: 'streetwear',           weight: 1.1 },
  { name: 'malefashionadvice',    weight: 1.0 },
  { name: 'femalefashionadvice',  weight: 1.0 },
  { name: 'sneakers',             weight: 0.9 },
  { name: 'handbags',             weight: 0.9 },
  { name: 'luxuryfashion',        weight: 1.0 },
];

const Parser = require('rss-parser');
// 自定义字段：抓取 Reddit RSS 中的投票数字段
const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'thumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

/** 从 Reddit RSS item 的正文中提取投票数（格式：&#32; submitted by &#32;...  \n 1234 points...） */
function extractScore(content: string): number {
  // Reddit RSS 正文里包含 "1,234 points" 或 "1234 points"
  const match = content.match(/([\d,]+)\s+point/i);
  if (match) return parseInt(match[1].replace(/,/g, ''), 10);
  return 100; // 无法解析时给默认分
}

/** 提取评论数 */
function extractComments(content: string): number {
  const match = content.match(/([\d,]+)\s+comment/i);
  if (match) return parseInt(match[1].replace(/,/g, ''), 10);
  return 0;
}

/** 清洗 RSS 正文（去HTML标签，取前300字） */
function cleanContent(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);
}

async function fetchSubredditRSS(sub: { name: string; weight: number }): Promise<any[]> {
  const url = `https://www.reddit.com/r/${sub.name}/hot/.rss?limit=25`;
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).map((item: any) => {
      const rawContent = item.contentEncoded || item.content || item.contentSnippet || '';
      const ups = extractScore(rawContent);
      const comments = extractComments(rawContent);
      const snippet = cleanContent(rawContent);

      return {
        title: item.title || '',
        link: item.link || item.id || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        ups,
        comments,
        snippet,         // 供融合层生成中文标题用
        subreddit: sub.name,
        weight: sub.weight,
        // 组合分：参考原逻辑 ups + comments×10
        combinedScore: ups + comments * 10,
      };
    });
  } catch (e) {
    console.error(`[Reddit RSS] r/${sub.name} 失败:`, e instanceof Error ? e.message : e);
    return [];
  }
}

export async function crawlReddit() {
  const startTime = Date.now();

  try {
    console.log('[Reddit RSS] Starting...');
    const allPosts: any[] = [];

    for (const sub of SUBREDDITS) {
      const posts = await fetchSubredditRSS(sub);
      // 过滤：ups > 50（RSS解析出来的分数，标准宽松）
      const filtered = posts.filter(p => p.ups > 50 || p.combinedScore > 100);
      allPosts.push(...filtered);
      console.log(`[Reddit RSS] r/${sub.name}: ${filtered.length} 条（共 ${posts.length} 原始）`);
      // subreddit 之间间隔 600ms，避免被限速
      await new Promise(r => setTimeout(r, 600));
    }

    if (allPosts.length === 0) {
      const msg = '所有 subreddit RSS 均无数据';
      console.warn(`[Reddit RSS] ${msg}`);
      await logCrawl({
        source: 'reddit', status: 'failed',
        items_count: 0, error_message: msg, duration_ms: Date.now() - startTime,
      });
      return { success: false, count: 0, error: msg };
    }

    // 按 combinedScore 排序，取 Top 20
    const topPosts = allPosts
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, 20);

    const topics = topPosts.map((item, index) => ({
      title_zh: item.title,
      title_en: item.title,
      score: Math.round(item.combinedScore),
      source: 'reddit' as const,
      source_label: `r/${item.subreddit}`,
      direction: getTrendDirection(index),
      source_url: item.link,
      // Reddit RSS 里 link 本身是唯一的帖子 URL，直接用作 source_id
      source_id: `reddit_rss_${item.link.split('/').filter(Boolean).pop() || index}_${item.subreddit}`,
      raw_data: {
        ups: item.ups,
        num_comments: item.comments,
        subreddit: item.subreddit,
        weight: item.weight,
        // 正文摘要，供融合层生成中文标题
        article_content: item.snippet,
        flair: '',
      },
    }));

    await deleteOldTopics('reddit', 60);
    await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'reddit', status: 'success',
      items_count: topics.length, duration_ms: duration, error_message: null,
    });

    console.log(`[Reddit RSS] 写入 ${topics.length} 条，耗时 ${duration}ms`);
    return { success: true, count: topics.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    console.error('[Reddit RSS] Error:', msg);
    await logCrawl({
      source: 'reddit', status: 'failed',
      items_count: 0, error_message: msg, duration_ms: Date.now() - startTime,
    });
    return { success: false, count: 0, error: msg };
  }
}
