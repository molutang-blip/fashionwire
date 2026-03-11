-- =====================================================
-- FashionWire Migration 001: 融合层支持
-- 执行方式: 在 Supabase SQL Editor 中依次执行
-- =====================================================

-- =====================================================
-- 1. 修正 instagram → rss 命名错误
-- =====================================================

-- 1.1 给枚举添加 rss 值
ALTER TYPE trend_source ADD VALUE IF NOT EXISTS 'rss';

-- 1.2 更新已有数据（需要在添加枚举值后执行）
UPDATE trending_topics SET source = 'rss' WHERE source = 'instagram';
UPDATE crawl_logs SET source = 'rss' WHERE source = 'instagram';

-- 注意: PostgreSQL 不支持直接删除枚举值，'instagram' 会保留但不再使用
-- 这不影响功能

-- =====================================================
-- 2. 新建 fused_trends 融合结果表
-- =====================================================

CREATE TABLE IF NOT EXISTS fused_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_zh TEXT NOT NULL,
  title_en TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  direction TEXT DEFAULT 'flat',
  change_percent NUMERIC,
  sources TEXT[],
  source_labels TEXT[],
  entities JSONB,
  tags TEXT[],
  top_entity TEXT,
  entity_type TEXT,
  source_topic_ids UUID[],
  raw_scores JSONB,
  batch_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fused_trends_score ON fused_trends(score DESC);
CREATE INDEX IF NOT EXISTS idx_fused_trends_created_at ON fused_trends(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fused_trends_batch_id ON fused_trends(batch_id);
CREATE INDEX IF NOT EXISTS idx_fused_trends_entity_type ON fused_trends(entity_type);

CREATE TRIGGER update_fused_trends_updated_at
  BEFORE UPDATE ON fused_trends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fused_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on fused_trends"
  ON fused_trends FOR SELECT TO anon USING (true);

CREATE POLICY "Allow service_role insert on fused_trends"
  ON fused_trends FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service_role update on fused_trends"
  ON fused_trends FOR UPDATE TO service_role USING (true);

CREATE POLICY "Allow service_role delete on fused_trends"
  ON fused_trends FOR DELETE TO service_role USING (true);

-- =====================================================
-- 3. 新建 entity_mappings 实体映射表
-- =====================================================

CREATE TABLE IF NOT EXISTS entity_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_en TEXT NOT NULL,
  entity_zh TEXT,
  entity_type TEXT NOT NULL,
  aliases TEXT[],
  weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_mappings_type ON entity_mappings(entity_type);

ALTER TABLE entity_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on entity_mappings"
  ON entity_mappings FOR SELECT TO anon USING (true);

CREATE POLICY "Allow service_role all on entity_mappings"
  ON entity_mappings FOR ALL TO service_role USING (true);

-- =====================================================
-- 4. 预填充实体库（PRD 定义）
-- =====================================================

-- 品牌库
INSERT INTO entity_mappings (entity_en, entity_zh, entity_type, aliases, weight) VALUES
  ('Chanel', NULL, 'brand', ARRAY['CHANEL','香奈儿'], 1.2),
  ('Louis Vuitton', NULL, 'brand', ARRAY['LV','LOUIS VUITTON','路易威登'], 1.3),
  ('Gucci', NULL, 'brand', ARRAY['GUCCI','古驰'], 1.2),
  ('Dior', NULL, 'brand', ARRAY['DIOR','Christian Dior','迪奥'], 1.2),
  ('Prada', NULL, 'brand', ARRAY['PRADA','普拉达'], 1.1),
  ('Hermès', NULL, 'brand', ARRAY['HERMES','Hermes','爱马仕'], 1.3),
  ('Balenciaga', NULL, 'brand', ARRAY['BALENCIAGA','巴黎世家'], 1.0),
  ('Versace', NULL, 'brand', ARRAY['VERSACE','范思哲'], 1.0),
  ('YSL', NULL, 'brand', ARRAY['Saint Laurent','Yves Saint Laurent','圣罗兰'], 1.0),
  ('Burberry', NULL, 'brand', ARRAY['BURBERRY','博柏利'], 1.0),
  ('Celine', NULL, 'brand', ARRAY['CELINE','赛琳'], 1.0),
  ('Valentino', NULL, 'brand', ARRAY['VALENTINO','华伦天奴'], 1.0),
  ('Givenchy', NULL, 'brand', ARRAY['GIVENCHY','纪梵希'], 1.0),
  ('Fendi', NULL, 'brand', ARRAY['FENDI','芬迪'], 1.0),
  ('Bottega Veneta', NULL, 'brand', ARRAY['BV','BOTTEGA VENETA','葆蝶家'], 1.0),
  ('Nike', NULL, 'brand', ARRAY['NIKE','耐克'], 0.9),
  ('Adidas', NULL, 'brand', ARRAY['ADIDAS','阿迪达斯'], 0.9),
  ('Supreme', NULL, 'brand', ARRAY['SUPREME'], 0.9),
  ('Off-White', NULL, 'brand', ARRAY['OFF-WHITE','Off White','OW'], 0.9)
ON CONFLICT DO NOTHING;

-- 人物库
INSERT INTO entity_mappings (entity_en, entity_zh, entity_type, aliases, weight) VALUES
  ('Zendaya', NULL, 'person', ARRAY['赞达亚'], 1.0),
  ('Rihanna', NULL, 'person', ARRAY['蕾哈娜'], 1.0),
  ('Beyoncé', NULL, 'person', ARRAY['Beyonce','碧昂丝'], 1.0),
  ('Kanye', NULL, 'person', ARRAY['Kanye West','Ye','侃爷'], 1.0),
  ('Travis Scott', NULL, 'person', ARRAY['特拉维斯·斯科特'], 0.9),
  ('Kylie Jenner', NULL, 'person', ARRAY['凯莉·詹纳'], 0.9),
  ('Kim Kardashian', NULL, 'person', ARRAY['金·卡戴珊','Kim K'], 1.0),
  ('Gigi Hadid', NULL, 'person', ARRAY['吉吉·哈迪德'], 0.9),
  ('Bella Hadid', NULL, 'person', ARRAY['贝拉·哈迪德'], 0.9),
  ('Kendall Jenner', NULL, 'person', ARRAY['肯达尔·詹纳'], 0.9),
  ('Timothée Chalamet', NULL, 'person', ARRAY['Timothee Chalamet','甜茶'], 1.0),
  ('Harry Styles', NULL, 'person', ARRAY['哈里·斯泰尔斯'], 0.9)
ON CONFLICT DO NOTHING;

-- 事件库
INSERT INTO entity_mappings (entity_en, entity_zh, entity_type, aliases, weight) VALUES
  ('Fashion Week', '时装周', 'event', ARRAY['FW','fashion week'], 1.2),
  ('Paris Fashion Week', '巴黎时装周', 'event', ARRAY['PFW'], 1.3),
  ('Milan Fashion Week', '米兰时装周', 'event', ARRAY['MFW'], 1.2),
  ('New York Fashion Week', '纽约时装周', 'event', ARRAY['NYFW'], 1.2),
  ('London Fashion Week', '伦敦时装周', 'event', ARRAY['LFW'], 1.1),
  ('Met Gala', 'Met Gala 时尚晚宴', 'event', ARRAY['Met Ball','大都会艺术博物馆'], 1.3),
  ('Coachella', 'Coachella 音乐节', 'event', ARRAY['科切拉'], 1.0),
  ('Collection', '系列发布', 'event', ARRAY['Spring Collection','Fall Collection','SS26','FW26'], 1.0),
  ('Collaboration', '联名合作', 'event', ARRAY['Collab','联名'], 1.1),
  ('Launch', '新品发售', 'event', ARRAY['Release','Drop','限量发售'], 1.0)
ON CONFLICT DO NOTHING;
