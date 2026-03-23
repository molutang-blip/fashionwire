import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

const googleTrends = require('google-trends-api');

// 精选关键词：聚焦最容易有数据的热门词（减少失败率）
const FASHION_KEYWORDS = [
  // 大事件（搜索量最稳定）
  'Met Gala', 'Paris Fashion Week', 'Milan Fashion Week',
  'New York Fashion Week', 'London Fashion Week',
  // 顶级品牌（长期热度）
  'Chanel', 'Louis Vuitton', 'Gucci', 'Dior', 'Prada',
  'Hermes', 'Balenciaga', 'Versace', 'Burberry',
  // 热门人物（流量来源）
  'Zendaya', 'Rihanna', 'Beyonce', 'Taylor Swift',
];

interface TrendsResult {
  keyword: string;
  searchVolume: number;
  trend: 'up' | 'down' | 'stable';
  timelineData?: { date: string; value: number }[];
}

/** 带重试的单关键词请求 */
async function getKeywordTrend(keyword: string, retries = 2): Promise<TrendsResult | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 每次重试间隔递增
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }

      const results = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        geo: '',  // 全球数据
      });

      const data = JSON.parse(results);

      if (!data.default?.timelineData?.length) {
        console.warn(`[Google] ${keyword}: 返回空数据`);
        return null;
      }

      const timeline = data.default.timelineData;
      const latest = timeline[timeline.length - 1];
      const previous = timeline[timeline.length - 2];

      const currentValue = latest.value[0];
      const previousValue = previous ? previous.value[0] : currentValue;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (currentValue > previousValue * 1.1) trend = 'up';
      else if (currentValue < previousValue * 0.9) trend = 'down';

      // 保存时间轴数据（最近7天，供详情页展示）
      const timelineData = timeline.slice(-7).map((t: any) => ({
        date: t.formattedTime || t.formattedAxisTime || '',
        value: t.value[0],
      }));

      return {
        keyword,
        searchVolume: currentValue * 50000,
        trend,
        timelineData,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Google] ${keyword} 第${attempt + 1}次失败: ${msg}`);
      if (attempt === retries) return null;
    }
  }
  return null;
}

function getTrendDirection(trend: string): TrendDirection {
  if (trend === 'up') return 'up';
  if (trend === 'down') return 'down';
  return 'flat';
}

export async function crawlGoogleTrends() {
  const startTime = Date.now();

  try {
    console.log('[Google Trends] Starting...');
    const batchSize = 3;  // 减小批次大小，降低被封风险
    const results: TrendsResult[] = [];
    let failCount = 0;

    for (let i = 0; i < FASHION_KEYWORDS.length; i += batchSize) {
      const batch = FASHION_KEYWORDS.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(kw => getKeywordTrend(kw)));

      const validResults = batchResults.filter((r): r is TrendsResult => r !== null);
      results.push(...validResults);
      failCount += batchResults.filter(r => r === null).length;

      console.log(`[Google Trends] 批次 ${Math.floor(i/batchSize)+1}: ${validResults.length}/${batch.length} 成功`);

      // 批次间延迟：2秒（比之前的1秒更保守，减少IP封锁）
      if (i + batchSize < FASHION_KEYWORDS.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`[Google Trends] 总计: ${results.length} 成功, ${failCount} 失败`);

    if (results.length === 0) {
      throw new Error(`所有 ${FASHION_KEYWORDS.length} 个关键词均失败，可能存在网络限制`);
    }

    const topTrends = results
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 15);

    const topics = topTrends.map((item) => ({
      title_zh: item.keyword,
      title_en: item.keyword,
      score: Math.round(item.searchVolume),
      source: 'google' as const,
      source_label: 'Google Trends',
      direction: getTrendDirection(item.trend),
      source_url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(item.keyword)}`,
      // 使用日期 + 关键词 + 搜索量哈希保证唯一性，同一关键词每天只存一次
      source_id: `google_${item.keyword.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      raw_data: {
        keyword: item.keyword,
        searchVolume: item.searchVolume,
        trend: item.trend,
        // 保存时间轴数据，供详情页图表展示
        timelineData: item.timelineData || [],
        // article_content 留空（Google Trends 无正文内容）
        article_content: '',
      } as unknown as Record<string, unknown>,
    }));

    await deleteOldTopics('google', 50);
    await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'google', status: results.length === FASHION_KEYWORDS.length ? 'success' : 'partial',
      items_count: topics.length,
      error_message: failCount > 0 ? `${failCount} 个关键词失败` : null,
      duration_ms: duration,
    });

    console.log(`[Google Trends] 完成，写入 ${topics.length} 条数据，耗时 ${duration}ms`);
    return { success: true, count: topics.length };
  } catch (error) {
    const duration = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : '未知错误';
    console.error('[Google Trends] Error:', msg);
    await logCrawl({
      source: 'google', status: 'failed',
      items_count: 0, error_message: msg, duration_ms: duration,
    });
    return { success: false, count: 0, error: msg };
  }
}
