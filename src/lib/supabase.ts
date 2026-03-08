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

export type TrendSource =
  | 'instagram'
  | 'tiktok'
  | 'xiaohongshu'
  | 'weibo'
  | 'google'
  | 'baidu'
  | 'amazon'
  | 'taobao';

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
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DBCrawlLog {
  id: string;
  source: TrendSource;
  status: 'success' | 'failed' | 'partial';
  items_count: number;
  error_message: string | null
