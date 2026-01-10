#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmbeddings() {
  const { count: total, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting products:', countError);
    process.exit(1);
  }

  const { count: withEmbeddings, error: embedError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('text_embedding', 'is', null);

  if (embedError) {
    console.error('Error counting embeddings:', embedError);
    process.exit(1);
  }

  console.log('Total products:', total);
  console.log('Products with embeddings:', withEmbeddings);
  console.log('Products without embeddings:', total - withEmbeddings);
}

checkEmbeddings();
