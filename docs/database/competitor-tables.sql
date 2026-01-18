-- Meta広告ライブラリ連携用テーブル
-- Supabase SQL Editorで実行してください

-- 競合広告テーブル
CREATE TABLE IF NOT EXISTS acs_competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES acs_projects(id) ON DELETE CASCADE,
  meta_ad_id TEXT NOT NULL,
  page_name TEXT,
  page_id TEXT,
  ad_creative_body TEXT,
  ad_snapshot_url TEXT,
  media_type TEXT,
  publisher_platforms JSONB,
  ad_delivery_start_date DATE,
  search_term TEXT,
  country_code TEXT DEFAULT 'JP',
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meta_ad_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_competitor_ads_project_id ON acs_competitor_ads(project_id);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_search_term ON acs_competitor_ads(search_term);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_meta_ad_id ON acs_competitor_ads(meta_ad_id);

-- 競合分析結果テーブル
CREATE TABLE IF NOT EXISTS acs_competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES acs_projects(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  country_code TEXT DEFAULT 'JP',
  ad_count INTEGER,
  analysis_summary JSONB,
  appeal_axes_distribution JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_project_id ON acs_competitor_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_search_term ON acs_competitor_analyses(search_term);

-- RLS (Row Level Security) ポリシー
-- 必要に応じて有効化してください
-- ALTER TABLE acs_competitor_ads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE acs_competitor_analyses ENABLE ROW LEVEL SECURITY;
