import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// 只留 Phase 1 需要的3个数据源
export type TrendSource =
  | 'google'
  | 'instagram'
  | 'reddit';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface DBTrendingTopic {
  id: string;
  title_zh: string;
  title_en: string | null;
  score: number;
  source: TrendSource;
  source_label: string | null;
  direction: TrendDirection;
  source_url: string | null;
  source_id: string | null;
  raw_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface DBCrawlLog {
  id: string;
  source: TrendSource;
  status: 'success' | 'failed' | 'partial';
  items_count: number;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export async function insertTrendingTopics(
  topics: Omit<DBTrendingTopic, 'id' | 'created_at' | 'updated_at'>[]
) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }

  const { data, error } = await supabaseAdmin
    .from('trending_topics')
    .upsert(topics, {
      onConflict: 'source,source_id',
      ignoreDuplicates: false,
    })
    .select();

  if (error) throw error;
  return data;
}

export async function deleteOldTopics(source: TrendSource, keepCount: number = 50) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }

  const { data: oldData, error: selectError } = await supabaseAdmin
    .from('trending_topics')
    .select('id, created_at')
    .eq('source', source)
    .order('created_at', { ascending: false });

  if (selectError) throw selectError;

  if (oldData && oldData.length > keepCount) {
    const idsToDelete = oldData.slice(keepCount).map(d => d.id);
    const { error: deleteError } = await supabaseAdmin
      .from('trending_topics')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) throw deleteError;
    console.log(`Deleted ${idsToDelete.length} old topics from ${source}`);
  }
}

export async function logCrawl(log: Omit<DBCrawlLog, 'id' | 'created_at'>) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }

  const { data, error } = await supabaseAdmin
    .from('crawl_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTrendingTopics(options?: {
  source?: TrendSource;
  limit?: number;
  offset?: number;
}) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('trending_topics')
    .select('*')
    .gte('created_at', oneDayAgo)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false });

  if (options?.source) {
    query = query.eq('source', options.source);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as DBTrendingTopic[];
}
