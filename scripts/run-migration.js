const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wuxhiuoxnwsqpcmjowse.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1eGhpdW94bndzcXBjbWpvd3NlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NDg2MywiZXhwIjoyMDgwMjQwODYzfQ.OgdnKvllEJkDmkp_iRHiAdGHE5SMIFzD4vukNadzfkA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Creating acs_strategy_personas table...');

  // Use raw SQL via postgres functions
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS acs_strategy_personas (
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
      CREATE INDEX IF NOT EXISTS idx_strategy_personas_project_id ON acs_strategy_personas(project_id);
    `
  });

  if (error) {
    console.log('RPC not available, trying alternative method...');

    // Alternative: Check if table exists by querying
    const { error: checkError } = await supabase
      .from('acs_strategy_personas')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST205') {
      console.log('Table does not exist. Need to create via SQL Editor.');
      console.log('Error:', checkError.message);

      // Try using postgres extension if available
      const { data: pgData, error: pgError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'acs_strategy_personas');

      if (pgError) {
        console.log('Cannot query pg_tables:', pgError.message);
      } else {
        console.log('pg_tables result:', pgData);
      }

      return false;
    } else if (!checkError) {
      console.log('Table already exists!');
      return true;
    }
  } else {
    console.log('Migration completed successfully!');
    return true;
  }
}

runMigration().then(success => {
  process.exit(success ? 0 : 1);
});
