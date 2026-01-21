#!/usr/bin/env node

/**
 * Add verified_colors column to products table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVerifiedColorsColumn() {
  console.log('Adding verified_colors column to products table...');
  console.log('');

  // Read the SQL file
  const sqlPath = join(__dirname, 'add-verified-colors-column.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  console.log('SQL to execute:');
  console.log(sql);
  console.log('');

  // Since Supabase client doesn't support raw SQL directly,
  // we need to inform the user to run this manually
  console.log('⚠️  Please run this SQL manually in your Supabase SQL Editor:');
  console.log('    1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');
  console.log('    2. Copy the SQL above');
  console.log('    3. Paste and run it');
  console.log('');
  console.log('OR use the Supabase CLI:');
  console.log('    supabase db execute --file scripts/add-verified-colors-column.sql');
  console.log('');

  // Try to verify by checking if column exists (will fail if it doesn't)
  const { data, error } = await supabase
    .from('products')
    .select('verified_colors')
    .limit(1);

  if (error && error.code === '42703') {
    console.log('❌ Column does not exist yet. Please run the SQL manually.');
    console.log('');
    console.log('After running the SQL, run this script again to verify.');
    process.exit(1);
  } else if (error) {
    console.log('❌ Error checking column:', error.message);
    process.exit(1);
  } else {
    console.log('✅ verified_colors column exists!');
    console.log('');
    console.log('You can now run: npm run scripts/extract-product-colors.mjs');
  }
}

addVerifiedColorsColumn().catch(console.error);
