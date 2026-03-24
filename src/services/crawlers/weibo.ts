import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';
import { extractEntities } from '../fusion/entities';

// -------------------------------------------------------
// 微博 热搜数据源
//
// 策略A（主）: 热搜榜 API（无需登录，公开接口）
// 策略B（降级）: 热搜榜移动端 JSON 接口
// 过滤逻辑：命中实体库的词条才保留（去除娱乐/体育噪音）
// -------------------------------------------------------

// 时尚相关过滤词（命中任意一个才保留）
const FASHION_FILTER = [
  // 奢侈品牌
  'chanel','louis vuitton','gucci','dior','prada','hermes','balenciaga',
  'versace','burberry','celine','valentino','fendi','bottega','loewe',
  'miu miu','jacquemus','maison margiela','off-white','supreme',
  'balmain','moncler','vivienne westwood','alexander mcqueen',
  // 中文品牌名
  '香奈儿','路易威登','古驰','迪奥','普拉达','爱马仕','巴黎世家',
  '范思哲','博柏利','圣罗兰','华伦天奴','纪梵希','芬迪','葆蝶家',
  '罗意威','盟可睐','优衣库','耐克','阿迪达斯','新百伦',
  // 时装周
  '时装周','fashion week','met gala','coachella','高定周','haute couture',
  '巴黎时装周','米兰时装周','纽约时装周','伦敦时装周',
  // 潮流/购物
  '联名','限量','穿搭','时尚','潮流','奢侈品','高奢','轻奢',
  '球鞋','手袋','配饰','香水','珠宝','街头','streetwear',
  // 明星时尚
  '赞达亚','霉霉','蕾哈娜','碧昂丝','侃爷','甜茶','碧梨',
  'zendaya','taylor swift','rihanna','beyonce','timothee',
  // 设计师
  '设计师','创意总监','首席设计师',
];

function isFashionRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return FASHION_FILTER.some(k => lower.includes(k));
}

// -------------------------------------------------------
// 策略A：微博 热搜榜公开 API
// -------------------------------------------------------
async function fetchWeiboHotSearch(): Promise<{ keyword: string; score: number; rank: number; category: string }[]> {
  try {
    const res = await fetch('https://weibo.com/ajax/side/hotSearch', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://weibo.com/',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[微博] 热搜 API HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    // 接口返回结构：{ data: { realtime: [...] } }
    const realtime: any[] = data?.data?.realtime || [];

    return realtime
      .filter((item: any) => item.word && item.num)
      .map((item: any, idx: number) => ({
        keyword: item.word as string,
        score: parseInt(String(item.num).replace(/[^0-9]/g, ''), 10) || (50 - idx) * 1000,
        rank: item.rank || idx + 1,
        category: item.category || '',
      }));
  } catch (e) {
    console.warn('[微博] 策略A失败:', e instanceof Error ? e.message : e);
    return [];
  }
}

// -------------------------------------------------------
// 策略B：移动端降级接口
// -------------------------------------------------------
async function fetchWeiboHotSearchFallback(): Promise<{ keyword: string; score: number; rank: number; category: string }[]> {
  try {
    const res = await fetch('https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26recom%3D1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'Referer': 'https://m.weibo.cn/',
        'MWeibo-Pwa': '1',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const cards: any[] = data?.data?.cards?.[0]?.card_group || [];

    return cards
      .filter((c: any) => c.desc && c.desc_extr)
      .map((c: any, idx: number) => ({
        keyword: c.desc as string,
        score: parseInt(String(c.desc_extr).replace(/[^0-9]/g, ''), 10) || (50 - idx) * 1000,
        rank: idx + 1,
        category: c.category || '',
      }));
  } catch (e) {
    console.warn('[微博] 策略B失败:', e instanceof Error ? e.message : e);
    return [];
  }
}

// -------------------------------------------------------
// 主入口
// -------------------------------------------------------
export async function crawlWeibo() {
  const startTime = Date.now();

  try {
    console.log('[微博] 开始抓取热搜榜...');

    // 优先策略A，失败降级策略B
    let items = await fetchWeiboHotSearch();
    if (items.length === 0) {
      console.log('[微博] 策略A无数据，降级到策略B...');
      items = await fetchWeiboHotSearchFallback();
    }

    if (items.length === 0) {
      const msg = '微博热搜两种策略均失败（IP封锁或接口变动）';
      console.warn('[微博]', msg);
      await logCrawl({ source: 'rss', status: 'failed', items_count: 0, error_message: `[weibo] ${msg}`, duration_ms: Date.now() - startTime });
      return { success: false, count: 0, error: msg };
    }

    console.log(`[微博] 获取热搜 ${items.length} 条，开始过滤时尚词条...`);

    // 过滤：只保留时尚相关词条
    const fashionItems = items.filter(item => {
      const entities = extractEntities(item.keyword);
      const hasEntity = entities.brands.length > 0 || entities.people.length > 0 || entities.events.length > 0;
      return hasEntity || isFashionRelated(item.keyword);
    });

    console.log(`[微博] 过滤后时尚词条 ${fashionItems.length} 条`);

    if (fashionItems.length === 0) {
      // 今天热搜没有时尚词条，正常情况（娱乐/体育占主导），不算失败
      await logCrawl({ source: 'rss', status: 'success', items_count: 0, error_message: '[weibo] 今日无时尚热搜词条', duration_ms: Date.now() - startTime });
      return { success: true, count: 0 };
    }

    // 构建 topics（source 用 'rss' 表示中文社交，与架构兼容，source_label 标注来源）
    const today = new Date().toISOString().split('T')[0];
    const topics = fashionItems.slice(0, 15).map((item) => ({
      title_zh: item.keyword,
      title_en: item.keyword, // 融合层会进一步处理
      score: Math.min(10000, item.score),
      source: 'rss' as const,          // 复用 rss 类型与架构兼容
      source_label: '微博热搜',
      direction: 'flat' as TrendDirection,
      source_url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.keyword)}&Refer=top`,
      source_id: `weibo_${item.keyword.replace(/\W+/g, '_').substring(0, 30)}_${today}`,
      raw_data: {
        keyword: item.keyword,
        rank: item.rank,
        category: item.category,
        searchVolume: item.score,
        article_content: item.keyword, // 热搜词本身即核心信息
        entities: extractEntities(item.keyword),
      } as unknown as Record<string, unknown>,
    }));

    await deleteOldTopics('rss', 80); // 适当增大 rss 保留量（合并了微博）
    await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;
    await logCrawl({ source: 'rss', status: 'success', items_count: topics.length, error_message: null, duration_ms: duration });
    console.log(`[微博] ✅ 写入 ${topics.length} 条时尚热搜，耗时 ${duration}ms`);
    return { success: true, count: topics.length };

  } catch (error) {
    const duration = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : '未知错误';
    console.error('[微博] Error:', msg);
    await logCrawl({ source: 'rss', status: 'failed', items_count: 0, error_message: `[weibo] ${msg}`, duration_ms: duration });
    return { success: false, count: 0, error: msg };
  }
}
