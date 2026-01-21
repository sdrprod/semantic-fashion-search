#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}

async function main() {
  console.log('='.repeat(70));
  console.log('CLEAR ALL PRODUCTS FROM DATABASE');
  console.log('='.repeat(70));
  console.log('');

  // Get current count
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  console.log(`Current products in database: ${count || 0}`);
  console.log('');

  if (!count || count === 0) {
    console.log('✅ Database is already empty.');
    process.exit(0);
  }

  console.log('⚠️  WARNING: This will DELETE ALL PRODUCTS!');
  console.log('');
  console.log('This action:');
  console.log('  - Deletes all product records');
  console.log('  - Removes all embeddings');
  console.log('  - Cannot be undone');
  console.log('');

  const answer = await askQuestion('Are you sure you want to continue? (yes/no): ');

  if (answer.toLowerCase() !== 'yes') {
    console.log('');
    console.log('Cancelled. No changes made.');
    process.exit(0);
  }

  console.log('');
  console.log('Deleting all products...');

  // Delete all products
  const { error } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('❌ Error deleting products:', error.message);
    process.exit(1);
  }

  // Verify deletion
  const { count: finalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  console.log('');
  console.log('✅ Successfully deleted all products!');
  console.log(`   Remaining products: ${finalCount || 0}`);
  console.log('');
  console.log('Database is now empty and ready for fresh sync.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run sync script: .\scripts\sync-dhgate-strict.ps1');
  console.log('  2. Generate embeddings: .\scripts\generate-embeddings.ps1');
  console.log('  3. Verify quality: node scripts/check-data-quality-issues.mjs');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
