import { NextRequest, NextResponse } from 'next/server';
import { getTrendingTopics, type TrendSource } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const source = searchParams.get('source') as TrendSource | null;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'offset must be non-negative' },
        { status: 400 }
      );
    }

    const topics = await getTrendingTopics({
      source: source || undefined,
      limit,
      offset,
    });

    const formattedTopics = topics.map((topic) => ({
      id: topic.id,
      titleZh: topic.title_zh,
      titleEn: topic.title_en || '',
      score: topic.score,
      sourceLabel: topic.source_label || topic.source,
      direction: topic.direction,
      timestamp: topic.created_at,
      source: topic.source,
      sourceUrl: topic.source_url,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTopics,
      pagination: { limit, offset, total: formattedTopics.length },
    });
  } catch (error) {
    console.error('获取热榜数据失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取数据失败',
      },
      { status: 500 }
    );
  }
}

export const revalidate = 60;
