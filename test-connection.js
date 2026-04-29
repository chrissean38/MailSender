require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');

  try {
    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase connection FAILED:', error.message);
      process.exit(1);
    }

    console.log('✅ Supabase connection SUCCESSFUL');
    console.log(`   - Found ${count || 0} campaigns in database`);

    const requiredTables = [
      'campaigns',
      'email_templates',
      'contact_lists',
      'contacts',
      'contact_suppression',
      'email_events',
      'email_jobs',
    ];

    for (const table of requiredTables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*', { head: true, count: 'exact' });

      if (tableError) {
        throw new Error(`Missing or inaccessible table '${table}': ${tableError.message}`);
      }
    }

    console.log(`   - Required tables verified (${requiredTables.length})`);

  } catch (err) {
    console.error('❌ Supabase connection FAILED:', err.message);
    process.exit(1);
  }

  console.log('\n✅ All connections working!');
}

testConnection();
