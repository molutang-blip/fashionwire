import { insertTrendingTopics, logCrawl, type TrendDirection } from '@/lib/supabase';

interface WeiboHotItem {
  word: string;
  hot_word_num?: number;
  flag?: number;
  raw_hot?: number;
}

function getTrendDirection(item: WeiboHotItem): TrendDirection {
  if (item.flag === 1) return 'up';
  if (item.flag === 3) return 'up';
  return 'flat';
}

function getSourceLabel(item: WeiboHotItem): string {
  if (item.flag === 1) return '新';
  if (item.flag === 2) return '热';
  if (item.flag === 3) return '沸';
  return '微博';
}

export async function crawlWeiboHotMock(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const mockData: WeiboHotItem[] = [
      { word: '老钱风穿搭', hot_word_num: 2850000, flag: 3 },
      { word: '静奢风搭配', hot_word_num: 1920000, flag: 2 },
      { word: '多巴胺穿搭', hot_word_num: 1680000, flag: 2 },
      { word: '美拉德色系', hot_word_num: 1450000, flag: 1 },
      { word: '春季穿搭灵感', hot_word_num: 1320000, flag: 1 },
      { word: 'Prada 2025春夏', hot_word_num: 1180000, flag: 2 },
      { word: '清冷感穿搭', hot_word_num: 980000, flag: 1 },
      { word: 'Gucci创意总监离任', hot_word_num: 890000, flag: 3 },
      { word: '法式慵懒风', hot_word_num: 750000, flag: 1 },
      { word: '职场通勤穿搭', hot_word_num: 620000, flag: 1 },
      { word: 'LVMH财报发布', hot_word_num: 580000, flag: 2 },
      { word: '网红同款测评', hot_word_num: 520000, flag: 1 },
      { word: '明星机场造型', hot_word_num: 480000, flag: 1 },
      { word: '小众设计师品牌', hot_word_num: 420000, flag: 1 },
      { word: '极简主义穿搭', hot_word_num: 380000, flag: 1 },
    ];

    const topics = mockData.map((item) => ({
      title_zh: item.word,
      title_en: null,
      score: item.hot_word_num || 0,
      source: 'weibo' as const,
      source_label: getSourceLabel(item),
      direction: getTrendDirection(item),
      source_url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
      source_id: `weibo_${item.word}_${new Date().toISOString().split('T')[0]}`,
      raw_data: item as unknown as Record<string, unknown>,
    }));

    await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;

    await logCrawl({
      source: 'weibo',
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
      source: 'weibo',
      status: 'failed',
      items_count: 0,
      error_message: errorMessage,
      duration_ms: duration,
    });

    return { success: false, count: 0, error: errorMessage };
  }
}

export async function crawlWeiboHot() {
  return crawlWeiboHotMock();
}
