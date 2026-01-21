import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnType() {
  console.log('Checking products table schema...\n');

  // Query pg_catalog to get column info
  const { data, error } = await supabase.rpc('query', {
    query: `
      SELECT
        column_name,
        data_type,
        udt_name,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'embedding';
    `
  });

  if (error) {
    console.error('Error querying schema:', error);
    console.log('\nTrying alternate method...\n');

    // Try using a raw SQL query to check
    const { data: typeData, error: typeError } = await supabase
      .from('products')
      .select('embedding')
      .limit(1)
      .single();

    if (typeError) {
      console.error('Error getting product:', typeError);
      return;
    }

    console.log('Sample embedding from database:');
    console.log('Type:', typeof typeData.embedding);
    console.log('Is array:', Array.isArray(typeData.embedding));
    console.log('Length:', typeData.embedding.length);
    console.log('First 100 chars:', JSON.stringify(typeData.embedding).substring(0, 100));
  } else {
    console.log('Column information:', data);
  }
}

checkColumnType().catch(console.error);
