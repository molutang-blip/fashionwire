import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

// 时尚关键词列表
const FASHION_KEYWORDS = [
  { keyword: 'Met Gala', category: 'event' },
  { keyword: 'Paris Fashion Week', category: 'event' },
  { keyword: 'Milan Fashion Week', category: 'event' },
  { keyword: 'New York Fashion Week', category: 'event' },
  { keyword: 'Chanel', category: 'brand' },
  { keyword: 'Louis Vuitton', category: 'brand' },
  { keyword: 'Gucci', category: 'brand' },
  { keyword: 'Dior', category: 'brand' },
  { keyword: 'Prada', category: 'brand' },
  { keyword: 'Hermes', category: 'brand' },
  { keyword: 'Balenciaga', category: 'brand' },
  { keyword: 'Versace', category: 'brand' },
  { keyword: 'YSL', category: 'brand' },
  { keyword: 'Burberry', category: 'brand' },
  { keyword: 'Celine', category: 'brand' },
];

interface GoogleTrendsItem {
  keyword: string;
  searchVolume: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
}

// 模拟 Google Trends 数据（后续替换为真实 API）
function generateMockTrends(): GoogleTrendsItem[] {
  const now = new Date();
  
  // 基于时间生成不同的趋势数据
  return FASHION_KEYWORDS.map((item, index) => {
    // 模拟波动：根据日期和索引生成伪随机数
    const baseVolume = 100000;
    const randomFactor = Math.sin(now.getDate() + index) * 0.5 + 1; // 0.5 ~ 1.5
    const eventBoost = item.category === 'event' ? 2 : 1; // 事件类热度更高
    
    const searchVolume = Math.round(baseVolume * randomFactor * eventBoost * (Math.random() * 2 + 1));
    
    // 模拟趋势方向
    const trendRandom = Math.random();
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (trendRandom > 0.6) trend = 'up';
    else if (trendRandom < 0.4) trend = 'down';
    
    return {
      keyword: item.keyword,
      searchVolume,
      trend,
      category: item.category,
    };
  }).sort((a, b) => b.searchVolume - a.searchVolume); // 按搜索量排序
}

function getTrendDirection(trend: string): TrendDirection {
  if (trend === 'up') return 'up';
  if (trend === 'down') return 'down';
  return 'flat';
}

export async function crawlGoogleTrendsMock(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const trendsData = generateMockTrends();
    
    // 只取前 15 条
    const topTrends = trendsData.slice(0, 15);

    const topics = topTrends.map((item, index) => ({
      title_zh: item.keyword,
      title_en: item.keyword,
      score: item.searchVolume,
      source: 'google' as const,
      source_label: item.category === 'event' ? '时尚事件' : '奢侈品牌',
      direction: getTrendDirection(item.trend),
      source_url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(item.keyword)}`,
      source_id: `google_trends_${item.keyword}_${new Date().toISOString().split('T')[0]}`,
      raw_data: item as unknown as Record<string, unknown>,
    }));

    // 先删除旧数据
    await deleteOldTopics('google', 50);
    
    // 插入新数据
    await insertTrendingTopics(topics);
    
    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'google',
      status: 'success',
      items_count: topics.length,
      error_message: null,
      duration_ms: duration,
    });

    return { success: true, count: topics.length };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    await logCrawl({
      source: 'google',
      status: 'failed',
      items_count: 0,
      error_message: errorMessage,
      duration_ms: duration,
    });

    return { success: false, count: 0, error: errorMessage };
  }
}

export async function crawlGoogleTrends() {
  return crawlGoogleTrendsMock();
}
