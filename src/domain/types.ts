// =====================================================
// FashionWire 核心类型定义
// =====================================================

export type TrendSource = 'google' | 'rss' | 'reddit';

export type TrendDirection = 'up' | 'down' | 'flat';

export type EntityType = 'brand' | 'person' | 'event';

/** 提取后的实体集合 */
export interface EntitySet {
  brands: string[];
  people: string[];
  events: string[];
}

/** 前端展示用的融合热榜条目 */
export interface FusedTrend {
  id: string;
  titleZh: string;
  titleEn: string;
  score: number;
  direction: TrendDirection;
  changePercent: number | null;
  sources: string[];
  sourceLabels: string[];
  entities: EntitySet;
  tags: string[];
  topEntity: string;
  entityType: string | null;
  rawScores: { google: number; rss: number; reddit: number };
}

/** DB 层 — fused_trends 表行 */
export interface DBFusedTrend {
  id: string;
  title_zh: string;
  title_en: string | null;
  score: number;
  direction: string;
  change_percent: number | null;
  sources: string[];
  source_labels: string[];
  entities: EntitySet | null;
  tags: string[];
  top_entity: string | null;
  entity_type: string | null;
  source_topic_ids: string[];
  raw_scores: Record<string, number> | null;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
}

/** DB 层 — trending_topics 表行 */
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
