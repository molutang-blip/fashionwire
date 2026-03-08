import { insertTrendingTopics, logCrawl, deleteOldTopics, deleteAllTopicsExcept, type TrendDirection } from '@/lib/supabase';

const googleTrends = require('google-trends-api');

const FASHION_KEYWORDS = [
  'Met Gala',
  'Paris Fashion Week',
  'Milan Fashion Week',
  'New York Fashion Week',
  'London Fashion Week',
  'Chanel',
  'Louis Vuitton',
  'Gucci',
  'Dior',
  'Prada',
  'Hermes',
  'Balenciaga',
  'Versace',
  'YSL',
  'Burberry',
  'Celine',
  'Valentino',
  'Givenchy',
  'Fendi',
  'Bottega Veneta',
];

interface TrendsResult {
  keyword: string;
  searchVolume: number;
  trend: 'up' | 'down' | 'stable';
}

async function getKeywordTrend(keyword: string): Promise<TrendsResult | null> {
  try {
    const results = await googleTrends.interestOverTime({
      keyword: keyword,
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      geo: '',
    });

    const data = JSON.parse(results);
    
    if (!data.default || !data.default.timelineData || data.default.timelineData.length === 0) {
      return null;
    }

    const timelineData = data.default.timelineData;
    const latest = timelineData[timelineData.length - 1];
    const previous = timelineData[timelineData.length - 2];
    
    const currentValue = latest.value[0];
    const previousValue = previous ? previous.value[0] : currentValue;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (currentValue > previousValue * 1.1) trend = 'up';
    else if (currentValue < previousValue * 0.9) trend = 'down';
    
    const searchVolume = currentValue * 50000;

    return {
      keyword,
      searchVolume,
      trend,
    };
  } catch (error) {
    console.error(`Failed to fetch trend for ${keyword}:`, error);
    return null;
  }
}

function getTrendDirection(trend: string): TrendDirection {
  if (trend === 'up') return 'up';
  if (trend === 'down') return 'down';
  return 'flat';
}

export async function crawlGoogleTrends(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    console.log('[Google Trends] Starting to fetch fashion keywords...');
    
    const batchSize = 5;
    const results: TrendsResult[] = [];
    
    for (let i = 0; i < FASHION_KEYWORDS.length; i += batchSize) {
      const batch = FASHION_KEYWORDS.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(keyword => getKeywordTrend(keyword))
      );
      
      results.push(...batchResults.filter((r): r is TrendsResult => r !== null));
      
      if (i + batchSize < FASHION_KEYWORDS.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const topTrends = results
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 15);

    if (topTrends.length === 0) {
      throw new Error('No trend data fetched');
    }

    const topics = topTrends.map((item) => ({
      title_zh: item.keyword,
      title_en: item.keyword,
      score: Math.round(item.searchVolume),
      source: 'google' as const,
      source_label: 'Google Trends',
      direction: getTrendDirection(item.trend),
      source_url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(item.keyword)}`,
      source_id: `google_trends_${item.keyword}_${new Date().toISOString().split('T')[0]}`,
      raw_data: item as unknown as Record<string, unknown>,
    }));

    // 先删除所有非 Google 数据，再删除旧的 Google 数据
    await deleteAllTopicsExcept('google');
    await deleteOldTopics('google', 50);
    
    await insertTrendingTopics(topics);
    
    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'google',
      status: 'success',
      items_count: topics.length,
      error_message: null,
      duration_ms: duration,
    });

    console.log(`[Google Trends] Fetched ${topics.length} trends`);
    return { success: true, count: topics.length };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    console.error('[Google Trends] Error:', errorMessage);
    
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

export async function crawlGoogleTrendsMock(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  return crawlGoogleTrends();
}
