-- =====================================================
-- FashionWire 数据库表结构
-- =====================================================

CREATE TYPE trend_source AS ENUM (
  'instagram',
  'tiktok',
  'xiaohongshu',
  'weibo',
  'google',
  'baidu',
  'amazon',
  'taobao'
);

CREATE TYPE trend_direction AS ENUM ('up', 'down', 'flat');

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

CREATE TABLE crawl_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source trend_source NOT NULL,
  status TEXT NOT NULL,
  items_count INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trending_topics_source ON trending_topics(source);
CREATE INDEX idx_trending_topics_created_at ON trending_topics(created_at DESC);
CREATE INDEX idx_trending_topics_score ON trending_topics(score DESC);
CREATE INDEX idx_crawl_logs_source ON crawl_logs(source);
CREATE INDEX idx_crawl_logs_created_at ON crawl_logs(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trending_topics_updated_at
  BEFORE UPDATE ON trending_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trending_details_updated_at
  BEFORE UPDATE ON trending_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on trending_topics"
  ON trending_topics FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read on trending_details"
  ON trending_details FOR SELECT TO anon USING (true);

CREATE POLICY "Allow service_role insert on trending_topics"
  ON trending_topics FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service_role update on trending_topics"
  ON trending_topics FOR UPDATE TO service_role USING (true);

CREATE POLICY "Allow service_role insert on trending_details"
  ON trending_details FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service_role update on trending_details"
  ON trending_details FOR UPDATE TO service_role USING (true);

CREATE POLICY "Allow service_role all on crawl_logs"
  ON crawl_logs FOR ALL TO service_role USING (true);
