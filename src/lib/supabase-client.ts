import { createClient } from '@supabase/supabase-js';
import type { FusedTrend, TrendDirection, EntitySet } from '@/domain/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** 从 fused_trends 表读取最新一批融合热榜 */
export async function getFusedTrends(options?: {
  limit?: number;
  entityType?: string;
}): Promise<FusedTrend[]> {
  // 1. 拿最新 batch_id
  const { data: latest, error: bErr } = await supabase
    .from('fused_trends')
    .select('batch_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (bErr || !latest) return [];

  // 2. 查该 batch 的数据
  let query = supabase
    .from('fused_trends')
    .select('*')
    .eq('batch_id', latest.batch_id)
    .order('score', { ascending: false });

  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    titleZh: row.title_zh,
    titleEn: row.title_en || '',
    score: row.score,
    direction: (row.direction || 'flat') as TrendDirection,
    changePercent: row.change_percent,
    sources: row.sources || [],
    sourceLabels: row.source_labels || [],
    entities: (row.entities || { brands: [], people: [], events: [] }) as EntitySet,
    tags: row.tags || [],
    topEntity: row.top_entity || '',
    entityType: row.entity_type,
    rawScores: row.raw_scores || { google: 0, rss: 0, reddit: 0 },
  }));
}
