-- =====================================================
-- FashionWire 数据库表结构（完整版 v2）
-- 包含: 原始抓取表 + 融合结果表 + 实体映射表
-- =====================================================

-- 数据源类型
CREATE TYPE trend_source AS ENUM ('google', 'rss', 'reddit');
CREATE TYPE trend_direction AS ENUM ('up', 'down', 'flat');

-- =====================================================
-- 1. 原始抓取数据表
-- =====================================================
CREATE TABLE trending_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_zh TEXT NOT NULL,
  title_en TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  source trend_source NOT NULL,
  source_label TEXT,
  direction trend_direction DEFAULT 'flat',
  source_url TEXT,
  source_id TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id)
);

-- =====================================================
-- 2. 融合结果表（前端展示的热榜数据）
-- =====================================================
CREATE TABLE fused_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_zh TEXT NOT NULL,           -- 生成的中文情报标题
  title_en TEXT,                    -- 英文原标题/核心实体
  score INTEGER NOT NULL DEFAULT 0, -- 加权后综合热度 0-100
  direction TEXT DEFAULT 'flat',    -- up / down / flat
  change_percent NUMERIC,           -- 较上次变化百分比
  sources TEXT[],                   -- 来源数组
  source_labels TEXT[],             -- 来源展示标签
  entities JSONB,                   -- {"brands":[],"people":[],"events":[]}
  tags TEXT[],                      -- 标签云（最多3个）
  top_entity TEXT,                  -- 核心实体名
  entity_type TEXT,                 -- brand / person / event
  source_topic_ids UUID[],          -- 关联原始数据ID
  raw_scores JSONB,                 -- {"google":x,"rss":y,"reddit":z}
  batch_id TEXT,                    -- 批次ID，标识同一次融合
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. 实体映射表
-- =====================================================
CREATE TABLE entity_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_en TEXT NOT NULL,
  entity_zh TEXT,
  entity_type TEXT NOT NULL,        -- brand / person / event
  aliases TEXT[],
  weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. 详情页数据（Phase 2）
-- =====================================================
CREATE TABLE trending_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES trending_topics(id) ON DELETE CASCADE,
  key_insight TEXT,
  platform_breakdown JSONB,
  trend_drivers JSONB,
  curated_posts JSONB,
  related_items JSONB,
  timeline_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. 抓取日志表
-- =====================================================
CREATE TABLE crawl_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source trend_source NOT NULL,
  status TEXT NOT NULL,
  items_count INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_trending_topics_source ON trending_topics(source);
CREATE INDEX idx_trending_topics_created_at ON trending_topics(created_at DESC);
CREATE INDEX idx_trending_topics_score ON trending_topics(score DESC);
CREATE INDEX idx_fused_trends_score ON fused_trends(score DESC);
CREATE INDEX idx_fused_trends_created_at ON fused_trends(created_at DESC);
CREATE INDEX idx_fused_trends_batch_id ON fused_trends(batch_id);
CREATE INDEX idx_fused_trends_entity_type ON fused_trends(entity_type);
CREATE INDEX idx_entity_mappings_type ON entity_mappings(entity_type);
CREATE INDEX idx_crawl_logs_source ON crawl_logs(source);
CREATE INDEX idx_crawl_logs_created_at ON crawl_logs(created_at DESC);

-- =====================================================
-- 触发器: 自动更新 updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trending_topics_updated_at
  BEFORE UPDATE ON trending_topics FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fused_trends_updated_at
  BEFORE UPDATE ON fused_trends FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trending_details_updated_at
  BEFORE UPDATE ON trending_details FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS 策略
-- =====================================================
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fused_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;

-- 匿名用户: 只读
CREATE POLICY "Allow public read on trending_topics"
  ON trending_topics FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on fused_trends"
  ON fused_trends FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on trending_details"
  ON trending_details FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on entity_mappings"
  ON entity_mappings FOR SELECT TO anon USING (true);

-- service_role: 完全控制
CREATE POLICY "Allow service_role insert on trending_topics"
  ON trending_topics FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow service_role update on trending_topics"
  ON trending_topics FOR UPDATE TO service_role USING (true);
CREATE POLICY "Allow service_role delete on trending_topics"
  ON trending_topics FOR DELETE TO service_role USING (true);

CREATE POLICY "Allow service_role insert on fused_trends"
  ON fused_trends FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow service_role update on fused_trends"
  ON fused_trends FOR UPDATE TO service_role USING (true);
CREATE POLICY "Allow service_role delete on fused_trends"
  ON fused_trends FOR DELETE TO service_role USING (true);

CREATE POLICY "Allow service_role all on trending_details"
  ON trending_details FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service_role all on entity_mappings"
  ON entity_mappings FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service_role all on crawl_logs"
  ON crawl_logs FOR ALL TO service_role USING (true);
