const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('Key:', supabaseKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTable() {
  // Check if table exists
  const { data, error } = await supabase
    .from('acs_strategy_personas')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === '42P01') {
      console.log('Table does not exist.');
      return false;
    } else {
      console.log('Error:', error.message, error.code);
      return false;
    }
  } else {
    console.log('Table already exists!');
    return true;
  }
}

checkAndCreateTable();
