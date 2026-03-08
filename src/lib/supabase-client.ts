import { createClient } from '@supabase/supabase-js';
import type { TrendingTopic } from '@/domain/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getTrendingTopics(): Promise<TrendingTopic[]> {
  const { data, error } = await supabase
    .from('trending_topics')
    .select('*')
    .order('score', { ascending: false })
    .limit(20);

  if (error) throw error;
  
  return data.map(item => ({
    id: item.id,
    titleZh: item.title_zh,
    titleEn: item.title_en || '',
    score: item.score,
    sourceLabel: item.source_label || '',
    direction: item.direction,
    timestamp: item.created_at,
    entities: item.raw_data?.entities
  }));
}
