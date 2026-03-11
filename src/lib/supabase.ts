import { createClient } from '@supabase/supabase-js';
import type { TrendSource, TrendDirection, DBTrendingTopic, DBFusedTrend } from '@/domain/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Re-export types for convenience
export type { TrendSource, TrendDirection, DBTrendingTopic, DBFusedTrend };

export interface DBCrawlLog {
  id: string;
  source: TrendSource;
  status: 'success' | 'failed' | 'partial';
  items_count: number;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

// =====================================================
// trending_topics CRUD
// =====================================================

export async function insertTrendingTopics(
  topics: Omit<DBTrendingTopic, 'id' | 'created_at' | 'updated_at'>[]
) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');

  const { data, error } = await supabaseAdmin
    .from('trending_topics')
    .upsert(topics, { onConflict: 'source,source_id', ignoreDuplicates: false })
    .select();

  if (error) throw error;
  return data;
}

export async function getRecentTopics(hoursAgo: number = 24): Promise<DBTrendingTopic[]> {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('trending_topics')
    .select('*')
    .gte('created_at', since)
    .order('score', { ascending: false });

  if (error) throw error;
  return data as DBTrendingTopic[];
}

export async function deleteOldTopics(source: TrendSource, keepCount: number = 50) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');

  const { data: oldData, error: selectError } = await supabaseAdmin
    .from('trending_topics')
    .select('id, created_at')
    .eq('source', source)
    .order('created_at', { ascending: false });

  if (selectError) throw selectError;

  if (oldData && oldData.length > keepCount) {
    const idsToDelete = oldData.slice(keepCount).map((d: any) => d.id);
    const { error: deleteError } = await supabaseAdmin
      .from('trending_topics')
      .delete()
      .in('id', idsToDelete);
    if (deleteError) throw deleteError;
    console.log(`[DB] Deleted ${idsToDelete.length} old topics from ${source}`);
  }
}

// =====================================================
// fused_trends CRUD
// =====================================================

export async function insertFusedTrends(
  trends: Omit<DBFusedTrend, 'id' | 'created_at' | 'updated_at'>[]
) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');

  const { data, error } = await supabaseAdmin
    .from('fused_trends')
    .insert(trends)
    .select();

  if (error) throw error;
  return data;
}

export async function getLatestFusedTrends(options?: {
  limit?: number;
  entityType?: string;
}): Promise<DBFusedTrend[]> {
  const client = supabaseAdmin || supabase;

  // 拿到最新的 batch_id
  const { data: latestBatch, error: batchError } = await client
    .from('fused_trends')
    .select('batch_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (batchError || !latestBatch) return [];

  let query = client
    .from('fused_trends')
    .select('*')
    .eq('batch_id', latestBatch.batch_id)
    .order('score', { ascending: false });

  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as DBFusedTrend[];
}

export async function getPreviousFusedTrends(): Promise<DBFusedTrend[]> {
  const client = supabaseAdmin || supabase;

  const { data: batches, error: batchError } = await client
    .from('fused_trends')
    .select('batch_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (batchError || !batches || batches.length === 0) return [];

  const latestBatchId = batches[0].batch_id;
  const previousBatch = batches.find((b: any) => b.batch_id !== latestBatchId);
  if (!previousBatch) return [];

  const { data, error } = await client
    .from('fused_trends')
    .select('*')
    .eq('batch_id', previousBatch.batch_id)
    .order('score', { ascending: false });

  if (error) throw error;
  return data as DBFusedTrend[];
}

export async function cleanOldFusedTrends(keepBatches: number = 10) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');

  const { data: batches, error: batchError } = await supabaseAdmin
    .from('fused_trends')
    .select('batch_id, created_at')
    .order('created_at', { ascending: false });

  if (batchError || !batches) return;

  const uniqueBatches: string[] = [];
  for (const b of batches) {
    if (!uniqueBatches.includes(b.batch_id)) uniqueBatches.push(b.batch_id);
  }
  if (uniqueBatches.length <= keepBatches) return;

  const batchesToDelete = uniqueBatches.slice(keepBatches);
  const { error } = await supabaseAdmin
    .from('fused_trends')
    .delete()
    .in('batch_id', batchesToDelete);

  if (error) throw error;
  console.log(`[DB] Cleaned ${batchesToDelete.length} old fused batches`);
}

// =====================================================
// crawl_logs
// =====================================================

export async function logCrawl(log: Omit<DBCrawlLog, 'id' | 'created_at'>) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');

  const { data, error } = await supabaseAdmin
    .from('crawl_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}
