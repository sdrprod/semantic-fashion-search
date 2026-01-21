import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Verifying products table...\n');

// Try to select from products table
const { data, error, count } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: false })
  .limit(1);

if (error) {
  console.error('❌ Error accessing products table:');
  console.error('  Code:', error.code);
  console.error('  Message:', error.message);
  console.error('  Details:', error.details);
  console.error('  Hint:', error.hint);
  console.log('\nThis error suggests:');
  if (error.code === 'PGRST202') {
    console.log('  - The table might not exist');
    console.log('  - The table might be in a different schema');
    console.log('  - RLS policies might be blocking access');
  }
  process.exit(1);
}

console.log('✅ Products table is accessible!');
console.log(`   Total rows: ${count !== null ? count : 'unknown'}`);
if (data && data.length > 0) {
  console.log(`   Sample row:`, data[0]);
}

// Try to insert a test row
console.log('\nTrying to insert a test product...');
const testInsert = await supabase
  .from('products')
  .insert({
    brand: 'Test Brand',
    title: 'Test Product',
    description: 'Test description',
    tags: ['test'],
    price: 99.99,
    currency: 'USD',
    image_url: 'https://example.com/test.jpg',
    product_url: 'https://example.com/test',
    combined_text: 'Test product',
    embedding: '[' + Array(1536).fill(0).join(',') + ']'
  })
  .select();

if (testInsert.error) {
  console.error('❌ Error inserting test product:');
  console.error('  Code:', testInsert.error.code);
  console.error('  Message:', testInsert.error.message);
  console.error('  Details:', testInsert.error.details);
} else {
  console.log('✅ Test product inserted successfully!');
  console.log('   ID:', testInsert.data[0].id);

  // Clean up
  await supabase.from('products').delete().eq('id', testInsert.data[0].id);
  console.log('   Test product deleted');
}
