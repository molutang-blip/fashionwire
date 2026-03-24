import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

const Parser = require('rss-parser');
const parser = new Parser();

// PRD 要求的 8 个 RSS 源 + Reddit 封锁期间扩展至 14 个，权重补充
const RSS_FEEDS = [
  // ── 原有 8 个核心媒体 ──
  { name: 'WWD', url: 'https://wwd.com/feed/', weight: 1.2 },
  { name: 'Business of Fashion', url: 'https://www.businessoffashion.com/feed/', weight: 1.3 },
  { name: 'Vogue Business', url: 'https://www.voguebusiness.com/feed', weight: 1.2 },
  { name: 'Hypebeast', url: 'https://hypebeast.com/feed', weight: 0.9 },
  { name: 'Highsnobiety', url: 'https://www.highsnobiety.com/feed/', weight: 0.9 },
  { name: 'The Cut', url: 'https://www.thecut.com/feed/rss.xml', weight: 1.0 },
  { name: 'Fashionista', url: 'https://fashionista.com/.rss/full/', weight: 0.8 },
  { name: 'Footwear News', url: 'https://footwearnews.com/feed/', weight: 0.9 },
  // ── Reddit 封锁期间新增 6 个（覆盖更多视角）──
  { name: 'Harper\'s Bazaar', url: 'https://www.harpersbazaar.com/rss/all.xml/', weight: 1.1 },
  { name: 'Elle', url: 'https://www.elle.com/rss/all.xml/', weight: 1.0 },
  { name: 'GQ', url: 'https://www.gq.com/feed/rss', weight: 1.0 },
  { name: 'Vogue', url: 'https://www.vogue.com/feed/rss', weight: 1.2 },
  { name: 'CR Fashion Book', url: 'https://www.crfashionbook.com/feed/', weight: 0.8 },
  { name: 'Complex Style', url: 'https://www.complex.com/style/rss', weight: 0.9 },
];

// 爬虫层方向仅作初始占位，真实方向由融合层基于历史分数计算
function getTrendDirection(_index: number): TrendDirection {
  return 'flat';
}

async function fetchRssFeed(feed: typeof RSS_FEEDS[0]) {
  try {
    const feedData = await parser.parseURL(feed.url);
    return feedData.items.slice(0, 8).map((item: any) => {
      // 提取最完整的正文内容：优先 content:encoded > content > contentSnippet
      const fullContent = item['content:encoded'] || item.content || item.contentSnippet || '';
      // 去除 HTML 标签，保留纯文本（最多 500 字符供标题生成使用）
      const cleanContent = fullContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500);

      return {
        title: item.title || 'Untitled',
        link: item.link || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        // contentSnippet 保留原有字段，cleanContent 是清洗后的完整正文
        content: item.contentSnippet || '',
        fullContent: cleanContent,
        source: feed.name,
        weight: feed.weight,
      };
    });
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
      .slice(0, 30);

    const topics = sortedArticles.map((item: any, index: number) => ({
      title_zh: item.title,  // 原始标题，中文生成交给融合层
      title_en: item.title,
      score: Math.round(1000 - index * 40),  // 基于时间排序的相对分
      source: 'rss' as const,                 // ✅ 修正：instagram → rss
      source_label: item.source,
      direction: getTrendDirection(index),
      source_url: item.link,
      source_id: `rss_${item.source}_${Date.now()}_${index}`,
      raw_data: {
        ...item,
        media_weight: item.weight,
        // 保存清洗后的正文，供融合层生成高质量中文标题使用
        article_content: item.fullContent || item.content || '',
      },
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
