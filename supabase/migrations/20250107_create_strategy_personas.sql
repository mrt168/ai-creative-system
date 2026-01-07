-- Create acs_strategy_personas table
CREATE TABLE acs_strategy_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES acs_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  age_from INTEGER,
  age_to INTEGER,
  issue TEXT,
  funnel VARCHAR(50),
  appeal_axes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by project
CREATE INDEX idx_strategy_personas_project_id ON acs_strategy_personas(project_id);

-- Add comment for documentation
COMMENT ON TABLE acs_strategy_personas IS 'Strategy personas for advertising creative generation';
COMMENT ON COLUMN acs_strategy_personas.funnel IS 'Marketing funnel stage: awareness, consideration, conversion, retention';
COMMENT ON COLUMN acs_strategy_personas.appeal_axes IS 'JSON array of appeal axis IDs for this persona';
