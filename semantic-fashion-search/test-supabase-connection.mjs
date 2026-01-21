import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Testing Supabase connection...');
console.log('URL:', process.env.SUPABASE_URL);

try {
  // Try a simple query
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Query failed:', error.message);
  } else {
    console.log('✅ Supabase connection working!');
    console.log('Sample product ID:', data?.[0]?.id);
  }
} catch (error) {
  console.error('❌ Connection test failed:', error.message);
}
