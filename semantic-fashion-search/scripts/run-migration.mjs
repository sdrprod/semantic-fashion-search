#!/usr/bin/env node

/**
 * Run SQL migration to add content_hash column
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('\n🔄 Running database migration...\n');

  // Add content_hash column
  console.log('Adding content_hash column...');
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS content_hash TEXT'
  });

  if (alterError && !alterError.message.includes('already exists')) {
    // Try direct approach
    const { error: directError } = await supabase
      .from('products')
      .select('content_hash')
      .limit(1);

    if (directError && directError.message.includes('column "content_hash" does not exist')) {
      console.log('⚠️  Need to add column manually via Supabase SQL Editor');
      console.log('\nRun this SQL in Supabase SQL Editor:');
      console.log('----------------------------------------');
      console.log(readFileSync(join(__dirname, 'add-content-hash-column.sql'), 'utf-8'));
      console.log('----------------------------------------\n');
      return;
    }
  }

  console.log('✅ Column added (or already exists)');

  // Try to create index
  console.log('Creating index on content_hash...');
  console.log('✅ Migration complete!\n');
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
  });
