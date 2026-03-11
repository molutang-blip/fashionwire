import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

const Parser = require('rss-parser');
const parser = new Parser();

// PRD 要求的 8 个 RSS 源 + 权重
const RSS_FEEDS = [
  { name: 'WWD', url: 'https://wwd.com/feed/', weight: 1.2 },
  { name: 'Business of Fashion', url: 'https://www.businessoffashion.com/feed/', weight: 1.3 },
  { name: 'Vogue Business', url: 'https://www.voguebusiness.com/feed', weight: 1.2 },
  { name: 'Hypebeast', url: 'https://hypebeast.com/feed', weight: 0.9 },
  { name: 'Highsnobiety', url: 'https://www.highsnobiety.com/feed/', weight: 0.9 },
  { name: 'The Cut', url: 'https://www.thecut.com/feed/rss.xml', weight: 1.0 },
  { name: 'Fashionista', url: 'https://fashionista.com/.rss/full/', weight: 0.8 },
  { name: 'Footwear News', url: 'https://footwearnews.com/feed/', weight: 0.9 },
];

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

async function fetchRssFeed(feed: typeof RSS_FEEDS[0]) {
  try {
    const feedData = await parser.parseURL(feed.url);
    return feedData.items.slice(0, 5).map((item: any) => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      content: item.contentSnippet || item.content || '',
      source: feed.name,
      weight: feed.weight,
    }));
  } catch (error) {
    console.error(`[RSS] Failed: ${feed.name}`, error);
    return [];
  }
}

export async function crawlFashionMedia() {
  const startTime = Date.now();

  try {
    console.log('[Fashion Media] Starting RSS fetch...');
    const allFeeds = await Promise.all(RSS_FEEDS.map(fetchRssFeed));
    const allArticles = allFeeds.flat();

    if (allArticles.length === 0) throw new Error('No RSS data fetched');

    const sortedArticles = allArticles
      .sort((a: any, b: any) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20);

    const topics = sortedArticles.map((item: any, index: number) => ({
      title_zh: item.title,  // 原始标题，中文生成交给融合层
      title_en: item.title,
      score: Math.round(1000 - index * 40),  // 基于时间排序的相对分
      source: 'rss' as const,                 // ✅ 修正：instagram → rss
      source_label: item.source,
      direction: getTrendDirection(index),
      source_url: item.link,
      source_id: `rss_${item.source}_${Date.now()}_${index}`,
      raw_data: { ...item, media_weight: item.weight },  // 存入权重供融合层使用
    }));

    await deleteOldTopics('rss', 50);
    await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'rss', status: 'success',
      items_count: topics.length, error_message: null, duration_ms: duration,
    });

    console.log(`[Fashion Media] Fetched ${topics.length} articles from ${RSS_FEEDS.length} sources`);
    return { success: true, count: topics.length };
  } catch (error) {
    const duration = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : '未知错误';
    console.error('[Fashion Media] Error:', msg);
    await logCrawl({
      source: 'rss', status: 'failed',
      items_count: 0, error_message: msg, duration_ms: duration,
    });
    return { success: false, count: 0, error: msg };
  }
}
