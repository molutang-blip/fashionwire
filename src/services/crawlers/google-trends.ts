import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';
import { extractEntities } from '../fusion/entities';

// -------------------------------------------------------
// Google Trends 数据源
// 方案A（主）: SerpAPI Google Trends API
//   - 需要环境变量 SERPAPI_KEY（免费100次/月）
//   - 注册地址: https://serpapi.com/
// 方案B（降级）: google-trends-api npm包（直连，Vercel可能被封）
// -------------------------------------------------------

const FASHION_KEYWORDS = [
  'Chanel', 'Louis Vuitton', 'Gucci', 'Dior', 'Prada',
  'Hermes', 'Balenciaga', 'Versace', 'Burberry', 'Zendaya',
  'Met Gala', 'Paris Fashion Week', 'Milan Fashion Week',
  'Taylor Swift fashion', 'streetwear trend',
];

// 时尚相关过滤词（用于 dailyTrends 结果筛选）
const FASHION_FILTER_KEYWORDS = [
  'chanel','louis vuitton','gucci','dior','prada','hermes','balenciaga',
  'versace','burberry','ysl','celine','valentino','givenchy','fendi',
  'bottega','loewe','miu miu','off-white','supreme','nike','adidas',
  'zara','uniqlo','h&m','shein','zendaya','rihanna','beyonce',
  'taylor swift','kim kardashian','kylie jenner','kendall jenner',
  'gigi hadid','bella hadid','timothee chalamet','harry styles',
  'lady gaga','billie eilish','fashion week','met gala','coachella',
  'vogue','runway','collection','couture','streetwear','sneaker',
  'outfit','style','fashion','luxury','designer',
];

function isFashionRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return FASHION_FILTER_KEYWORDS.some(k => lower.includes(k));
}

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

// -------------------------------------------------------
// 方案A：SerpAPI - Google Trends（主方案）
// SerpAPI 通过自己的服务器代理请求，完全绕过 Vercel IP 封锁
// -------------------------------------------------------
async function fetchViaSerpAPI(): Promise<{ keyword: string; score: number; snippet: string }[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.log('[Google/SerpAPI] 未配置 SERPAPI_KEY，跳过');
    return [];
  }

  const results: { keyword: string; score: number; snippet: string }[] = [];

  // SerpAPI: Google Trends 热门搜索（trending now）
  try {
    const trendingUrl = new URL('https://serpapi.com/search.json');
    trendingUrl.searchParams.set('engine', 'google_trends_trending_now');
    trendingUrl.searchParams.set('frequency', 'daily');
    trendingUrl.searchParams.set('geo', 'US');
    trendingUrl.searchParams.set('api_key', apiKey);

    const res = await fetch(trendingUrl.toString());
    if (res.ok) {
      const data = await res.json();
      const searches = data.trending_searches || [];

      for (const item of searches) {
        const title = item.query || item.title?.query || '';
        const articles = item.articles || item.related_articles || [];
        const articleText = articles
          .map((a: any) => `${a.title || ''} ${a.snippet || ''}`)
          .join(' ');

        if (isFashionRelated(title) || isFashionRelated(articleText)) {
          const traffic = parseInt(
            (item.formattedTraffic || item.traffic || '1000').replace(/[^0-9]/g, ''),
            10
          ) || 1000;

          const snippet = articles
            .slice(0, 2)
            .map((a: any) => `${a.title || ''}: ${a.snippet || ''}`)
            .join('. ')
            .substring(0, 400);

          results.push({ keyword: title, score: traffic, snippet });
        }
      }
      console.log(`[Google/SerpAPI] trending_now: 找到 ${results.length} 条时尚相关`);
    }
  } catch (e) {
    console.warn('[Google/SerpAPI] trending_now 失败:', e instanceof Error ? e.message : e);
  }

  // 如果 trending now 时尚结果不足5条，补充关键词查询
  if (results.length < 5) {
    const keywords = FASHION_KEYWORDS.slice(0, 8); // 控制 API 用量
    for (const keyword of keywords) {
      try {
        const url = new URL('https://serpapi.com/search.json');
        url.searchParams.set('engine', 'google_trends');
        url.searchParams.set('q', keyword);
        url.searchParams.set('date', 'now 7-d');
        url.searchParams.set('geo', '');
        url.searchParams.set('api_key', apiKey);

        const res = await fetch(url.toString());
        if (!res.ok) continue;

        const data = await res.json();
        const timeline = data.interest_over_time?.timeline_data || [];
        if (!timeline.length) continue;

        const latest = timeline[timeline.length - 1];
        const value = latest?.values?.[0]?.extracted_value || 0;
        if (value > 0) {
          results.push({ keyword, score: value * 1000, snippet: '' });
        }

        await new Promise(r => setTimeout(r, 300)); // 避免触发限速
      } catch {
        // 单个关键词失败不影响其他
      }
    }
    console.log(`[Google/SerpAPI] 关键词补充后共 ${results.length} 条`);
  }

  return results;
}

// -------------------------------------------------------
// 方案B：google-trends-api npm包（降级，Vercel 环境可能失败）
// -------------------------------------------------------
async function fetchViaGoogleTrendsNpm(): Promise<{ keyword: string; score: number; snippet: string }[]> {
  const googleTrends = require('google-trends-api');
  const results: { keyword: string; score: number; snippet: string }[] = [];

  // 优先尝试 dailyTrends（不需要关键词，更稳定）
  for (const geo of ['US', 'GB', '']) {
    try {
      const raw = await googleTrends.dailyTrends({ geo: geo || undefined });
      const data = JSON.parse(raw);
      const searches = data?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

      const fashionItems = searches.filter((item: any) => {
        const title = item.title?.query || '';
        const articleText = (item.articles || [])
          .map((a: any) => `${a.title || ''} ${a.snippet || ''}`)
          .join(' ');
        return isFashionRelated(title) || isFashionRelated(articleText);
      });

      if (fashionItems.length > 0) {
        for (const item of fashionItems) {
          const traffic = parseInt(
            (item.formattedTraffic || '1000').replace(/[^0-9]/g, ''),
            10
          ) || 1000;
          const snippet = (item.articles || [])
            .slice(0, 2)
            .map((a: any) => `${a.title || ''}: ${a.snippet || ''}`)
            .join('. ')
            .substring(0, 400);
          results.push({ keyword: item.title?.query || '', score: traffic, snippet });
        }
        console.log(`[Google/npm] dailyTrends geo=${geo || 'global'}: ${results.length} 条时尚内容`);
        return results;
      }
    } catch (e) {
      console.warn(`[Google/npm] dailyTrends geo=${geo || 'global'} 失败`);
    }
  }

  // dailyTrends 无结果时，回退到 interestOverTime（核心6词）
  const coreKeywords = ['Chanel', 'Gucci', 'Dior', 'Met Gala', 'Paris Fashion Week', 'Zendaya'];
  for (const keyword of coreKeywords) {
    try {
      const raw = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        geo: '',
      });
      const data = JSON.parse(raw);
      const timeline = data.default?.timelineData || [];
      if (!timeline.length) continue;
      const value = timeline[timeline.length - 1]?.value?.[0] || 0;
      if (value > 0) results.push({ keyword, score: value * 50000, snippet: '' });
      await new Promise(r => setTimeout(r, 1500));
    } catch { /* 忽略单个失败 */ }
  }

  return results;
}

// -------------------------------------------------------
// 主入口
// -------------------------------------------------------
export async function crawlGoogleTrends() {
  const startTime = Date.now();

  try {
    console.log('[Google Trends] Starting...');

    // 优先使用 SerpAPI（稳定），无 Key 时降级到 npm 包
    let items = await fetchViaSerpAPI();

    if (items.length === 0) {
      console.log('[Google Trends] SerpAPI 无结果，降级到 npm 包...');
      items = await fetchViaGoogleTrendsNpm();
    }

    if (items.length === 0) {
      throw new Error(
        process.env.SERPAPI_KEY
          ? 'SerpAPI 和 npm 包均无时尚数据，请检查 SERPAPI_KEY 是否有效'
          : '未配置 SERPAPI_KEY，且 npm 包失败（Vercel IP 被封）。请到 serpapi.com 注册并配置 SERPAPI_KEY'
      );
    }

    const topItems = items
      .filter(i => i.keyword)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    const topics = topItems.map((item, index) => ({
      title_zh: item.keyword,
      title_en: item.keyword,
      score: Math.round(item.score),
      source: 'google' as const,
      source_label: 'Google Trends',
      direction: getTrendDirection(index),
      source_url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(item.keyword)}`,
      source_id: `google_${item.keyword.replace(/\W+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`,
      raw_data: {
        keyword: item.keyword,
        searchVolume: item.score,
        // 保存关联文章摘要，供融合层生成中文标题
        article_content: item.snippet,
        entities: extractEntities(item.keyword),
      } as unknown as Record<string, unknown>,
    }));

    await deleteOldTopics('google', 50);
    await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'google', status: 'success',
      items_count: topics.length, error_message: null, duration_ms: duration,
    });

    console.log(`[Google Trends] 完成，写入 ${topics.length} 条，耗时 ${duration}ms`);
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
