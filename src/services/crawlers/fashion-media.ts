import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

// RSS 解析库
const Parser = require('rss-parser');
const parser = new Parser();

const RSS_FEEDS = [
  { name: 'WWD', url: 'https://wwd.com/feed/', category: 'business' },
  { name: 'Hypebeast', url: 'https://hypebeast.com/feed', category: 'streetwear' },
  { name: 'Vogue Business', url: 'https://www.voguebusiness.com/feed', category: 'business' },
  { name: 'Business of Fashion', url: 'https://www.businessoffashion.com/feed/', category: 'business' },
];

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  source: string;
  category: string;
}

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

// 从 RSS 抓取真实数据
async function fetchRssFeed(feed: typeof RSS_FEEDS[0]): Promise<RssItem[]> {
  try {
    const feedData = await parser.parseURL(feed.url);
    
    return feedData.items.slice(0, 5).map((item: any) => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      content: item.contentSnippet || item.content || '',
      source: feed.name,
      category: feed.category,
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS from ${feed.name}:`, error);
    return [];
  }
}

export async function crawlFashionMedia(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    console.log('[Fashion Media] Starting RSS fetch...');
    
    // 并发抓取所有 RSS
    const allFeeds = await Promise.all(
      RSS_FEEDS.map(feed => fetchRssFeed(feed))
    );
    
    // 合并所有文章
    const allArticles = allFeeds.flat();
    
    if (allArticles.length === 0) {
      throw new Error('No RSS data fetched');
    }

    // 按日期排序，取前15条
    const sortedArticles = allArticles
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 15);

    const topics = sortedArticles.map((item, index) => ({
      title_zh: item.title,
      title_en: item.title,
      score: Math.round(1000000 - index * 50000),
      source: 'instagram' as const, // 用 instagram 代表国际媒体
      source_label: item.source,
      direction: getTrendDirection(index),
      source_url: item.link,
      source_id: `rss_${item.source}_${Date.now()}_${index}`,
      raw_data: item as unknown as Record<string, unknown>,
    }));

    // 删除旧数据
    await deleteOldTopics('instagram', 50);
    
    // 插入新数据
    await insertTrendingTopics(topics);
    
    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'instagram',
      status: 'success',
      items_count: topics.length,
      error_message: null,
      duration_ms: duration,
    });

    console.log(`[Fashion Media] Fetched ${topics.length} articles`);
    return { success: true, count: topics.length };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    console.error('[Fashion Media] Error:', errorMessage);
    
    await logCrawl({
      source: 'instagram',
      status: 'failed',
      items_count: 0,
      error_message: errorMessage,
      duration_ms: duration,
    });

    return { success: false, count: 0, error: errorMessage };
  }
}

// Mock 备用
export async function crawlFashionMediaMock(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  return crawlFashionMedia();
}
