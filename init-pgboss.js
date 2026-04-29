// pg-boss v9 requires manual initialization when tables don't exist
// This script will install pg-boss contract first, then start the worker

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Connect to Supabase to check/pg-boss installation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInstallation() {
  console.log('Checking pg-boss installation...');
  
  // Check if boss tables exist
  const { data: tables, error } = await supabase.rpc('table_exists', { table_name: 'job' });
  
  if (error) {
    console.log('pg-boss tables do not exist. Need to run init script.');
  } else {
    console.log('pg-boss tables exist:', tables);
  }
}

checkInstallation();
