import { NextRequest, NextResponse } from 'next/server';
import { getLatestFusedTrends } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('type') || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10), 1), 100);

    const trends = await getLatestFusedTrends({ limit, entityType });

    const formatted = trends.map((t) => ({
      id: t.id,
      titleZh: t.title_zh,
      titleEn: t.title_en || '',
      score: t.score,
      direction: t.direction,
      changePercent: t.change_percent,
      sources: t.sources,
      sourceLabels: t.source_labels,
      entities: t.entities,
      tags: t.tags,
      topEntity: t.top_entity,
      entityType: t.entity_type,
      rawScores: t.raw_scores,
      timestamp: t.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error('[API] 获取热榜失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取数据失败' },
      { status: 500 }
    );
  }
}

export const revalidate = 300; // 5分钟缓存
