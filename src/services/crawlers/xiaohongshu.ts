import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

interface XiaohongshuHotItem {
  id: string;
  title: string;
  score: number;
  type: 'hot' | 'new' | 'trending';
}

function getTrendDirection(item: XiaohongshuHotItem): TrendDirection {
  if (item.type === 'new') return 'up';
  if (item.type === 'trending') return 'up';
  return 'flat';
}

function getSourceLabel(item: XiaohongshuHotItem): string {
  if (item.type === 'new') return '新';
  if (item.type === 'hot') return '热';
  if (item.type === 'trending') return '飙升';
  return '小红书';
}

export async function crawlXiaohongshuHotMock(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const mockData: XiaohongshuHotItem[] = [
      { id: 'xhs_1', title: '今日穿搭OOTD', score: 5800000, type: 'hot' },
      { id: 'xhs_2', title: '静奢风怎么穿', score: 3200000, type: 'trending' },
      { id: 'xhs_3', title: '平价穿搭分享', score: 2900000, type: 'hot' },
      { id: 'xhs_4', title: '小个子穿搭', score: 2650000, type: 'hot' },
      { id: 'xhs_5', title: '韩系穿搭', score: 2400000, type: 'trending' },
      { id: 'xhs_6', title: '春季新款推荐', score: 2100000, type: 'new' },
      { id: 'xhs_7', title: '通勤穿搭公式', score: 1850000, type: 'trending' },
      { id: 'xhs_8', title: '美拉德配色', score: 1620000, type: 'new' },
      { id: 'xhs_9', title: '显瘦穿搭技巧', score: 1480000, type: 'hot' },
      { id: 'xhs_10', title: '法式优雅风', score: 1350000, type: 'trending' },
      { id: 'xhs_11', title: '简约风穿搭', score: 1200000, type: 'hot' },
      { id: 'xhs_12', title: '春游穿搭', score: 1080000, type: 'new' },
      { id: 'xhs_13', title: '配饰搭配灵感', score: 950000, type: 'trending' },
      { id: 'xhs_14', title: '复古风穿搭', score: 880000, type: 'hot' },
      { id: 'xhs_15', title: '氛围感穿搭', score: 760000, type: 'new' },
    ];

    const topics = mockData.map((item) => ({
      title_zh: item.title,
      title_en: null,
      score: item.score,
      source: 'xiaohongshu' as const,
      source_label: getSourceLabel(item),
      direction: getTrendDirection(item),
      source_url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.title)}`,
      source_id: `xhs_${item.id}_${new Date().toISOString().split('T')[0]}`,
      raw_data: item as unknown as Record<string, unknown>,
    }));

    await deleteOldTopics('xiaohongshu', 50);await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;

    await logCrawl({
      source: 'xiaohongshu',
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
      source: 'xiaohongshu',
      status: 'failed',
      items_count: 0,
      error_message: errorMessage,
      duration_ms: duration,
    });

    return { success: false, count: 0, error: errorMessage };
  }
}

export async function crawlXiaohongshuHot() {
  return crawlXiaohongshuHotMock();
}
