import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

const Parser = require('rss-parser');
const parser = new Parser();

// PRD 实体库
const BRANDS = ['Chanel', 'Louis Vuitton', 'Gucci', 'Dior', 'Prada', 'Hermès', 'Balenciaga', 'Versace', 'YSL', 'Burberry', 'Celine', 'Valentino', 'Givenchy', 'Fendi', 'Bottega Veneta', 'Nike', 'Adidas', 'Supreme', 'Off-White'];
const PEOPLE = ['Zendaya', 'Rihanna', 'Beyoncé', 'Kanye', 'Travis Scott', 'Kylie Jenner', 'Kim Kardashian', 'Gigi Hadid', 'Bella Hadid', 'Kendall Jenner', 'Timothée Chalamet', 'Harry Styles'];

// PRD 中文翻译规则
function generateChineseTitle(title: string): string {
  let cn = title;
  const foundBrands: string[] = [];
  const foundPeople: string[] = [];
  
  BRANDS.forEach(b => {
    if (title.toLowerCase().includes(b.toLowerCase())) {
      foundBrands.push(b);
      cn = cn.replace(new RegExp(b, 'gi'), `__BRAND_${foundBrands.length-1}__`);
    }
  });
  
  PEOPLE.forEach(p => {
    if (title.toLowerCase().includes(p.toLowerCase())) {
      foundPeople.push(p);
      cn = cn.replace(new RegExp(p, 'gi'), `__PEOPLE_${foundPeople.length-1}__`);
    }
  });
  
  cn = cn
    .replace(/streetwear/gi, '街头服饰')
    .replace(/collaboration|collab/gi, '联名合作')
    .replace(/drop|release/gi, '限量发售')
    .replace(/collection/gi, '系列发布')
    .replace(/fashion week/gi, '时装周')
    .replace(/spring\/summer|ss\d{2}/gi, '春夏系列')
    .replace(/fall\/winter|fw\d{2}/gi, '秋冬系列')
    .replace(/lookbook/gi, '造型手册')
    .replace(/campaign/gi, '广告大片')
    .replace(/vintage/gi, '复古')
    .replace(/minimalist/gi, '极简');
  
  foundBrands.forEach((b, i) => cn = cn.replace(`__BRAND_${i}__`, b));
  foundPeople.forEach((p, i) => cn = cn.replace(`__PEOPLE_${i}__`, p));
  
  return cn;
}

const RSS_FEEDS = [
  { name: 'WWD', url: 'https://wwd.com/feed/', category: 'business' },
  { name: 'Hypebeast', url: 'https://hypebeast.com/feed', category: 'streetwear' },
  { name: 'Vogue Business', url: 'https://www.voguebusiness.com/feed', category: 'business' },
  { name: 'Business of Fashion', url: 'https://www.businessoffashion.com/feed/', category: 'business' },
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
      category: feed.category,
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS from ${feed.name}:`, error);
    return [];
  }
}

export async function crawlFashionMedia() {
  const startTime = Date.now();

  try {
    console.log('[Fashion Media] Starting RSS fetch...');
    const allFeeds = await Promise.all(RSS_FEEDS.map(feed => fetchRssFeed(feed)));
    const allArticles = allFeeds.flat();

    if (allArticles.length === 0) {
      throw new Error('No RSS data fetched');
    }

    const sortedArticles = allArticles
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 15);

    const topics = sortedArticles.map((item, index) => ({
      title_zh: generateChineseTitle(item.title), // 中文标题
      title_en: item.title,
      score: Math.round(1000000 - index * 50000),
      source: 'instagram' as const,
      source_label: item.source,
      direction: getTrendDirection(index),
      source_url: item.link,
      source_id: `rss_${item.source}_${Date.now()}_${index}`,
      raw_data: item,
    }));

    await deleteOldTopics('instagram', 50);
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

export async function crawlFashionMediaMock() {
  return crawlFashionMedia();
}
