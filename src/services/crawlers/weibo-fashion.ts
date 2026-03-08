import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

// 微博时尚话题 Mock 数据（后续替换为真实抓取）
const FASHION_KEYWORDS = [
  '时装周', '大秀', '红毯', '高定', '奢侈品', 
  'LV', 'Gucci', 'Chanel', 'Dior', 'Prada',
  'Met Gala', '巴黎时装周', '米兰时装周', '纽约时装周',
  '明星穿搭', '设计师', '联名', '限量款', '财报'
];

interface WeiboFashionItem {
  word: string;
  hot_word_num: number;
  category: string;
  flag?: number;
}

function getTrendDirection(item: WeiboFashionItem): TrendDirection {
  if (item.flag === 1) return 'up';
  if (item.flag === 2) return 'up';
  return 'flat';
}

function getSourceLabel(item: WeiboFashionItem): string {
  if (item.flag === 1) return '新';
  if (item.flag === 2) return '热';
  return '微博时尚';
}

// 判断是否是时尚相关话题
function isFashionRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return FASHION_KEYWORDS.some(keyword => 
    lower.includes(keyword.toLowerCase()) ||
    title.includes(keyword)
  );
}

export async function crawlWeiboFashionMock(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Mock 数据 - 模拟微博时尚话题
    const mockData: WeiboFashionItem[] = [
      { word: 'Met Gala 2024 红毯造型', hot_word_num: 9850000, category: '时尚', flag: 2 },
      { word: 'LV 2025 春夏大秀巴黎举办', hot_word_num: 6520000, category: '时尚', flag: 1 },
      { word: 'Gucci 创意总监离任', hot_word_num: 5280000, category: '时尚', flag: 2 },
      { word: 'Chanel 高级定制周', hot_word_num: 4150000, category: '时尚', flag: 1 },
      { word: 'Zendaya 红毯造型封神', hot_word_num: 3890000, category: '时尚', flag: 2 },
      { word: '巴黎时装周日程公布', hot_word_num: 3250000, category: '时尚', flag: 1 },
      { word: 'Dior 新季包袋预售', hot_word_num: 2980000, category: '时尚', flag: 1 },
      { word: 'LVMH 集团财报创新高', hot_word_num: 2650000, category: '时尚', flag: 2 },
      { word: 'Prada 与 Adidas 联名', hot_word_num: 2420000, category: '时尚', flag: 1 },
      { word: '明星机场私服穿搭', hot_word_num: 2150000, category: '时尚', flag: 1 },
      { word: '米兰时装周邀请函', hot_word_num: 1980000, category: '时尚', flag: 1 },
      { word: '爱马仕铂金包涨价', hot_word_num: 1850000, category: '时尚', flag: 2 },
      { word: 'YSL 新代言人官宣', hot_word_num: 1720000, category: '时尚', flag: 1 },
      { word: 'Burberry 换标争议', hot_word_num: 1580000, category: '时尚', flag: 2 },
      { word: '卡地亚高级珠宝展', hot_word_num: 1450000, category: '时尚', flag: 1 },
    ];

    // 过滤出时尚相关话题
    const fashionTopics = mockData.filter(item => isFashionRelated(item.word));

    const topics = fashionTopics.map((item) => ({
      title_zh: item.word,
      title_en: null,
      score: item.hot_word_num,
      source: 'weibo' as const,
      source_label: getSourceLabel(item),
      direction: getTrendDirection(item),
      source_url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
      source_id: `weibo_fashion_${item.word}_${Date.now()}`, // 用时间戳确保唯一
      raw_data: item as unknown as Record<string, unknown>,
    }));

    // 先删除旧数据，只保留最新50条
    await deleteOldTopics('weibo', 50);
    
    // 插入新数据
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

export async function crawlWeiboFashion() {
  return crawlWeiboFashionMock();
}
