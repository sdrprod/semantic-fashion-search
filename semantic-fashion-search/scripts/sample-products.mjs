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

async function sampleProducts() {
  console.log('Sampling 50 products from database:');
  console.log('');

  const { data, error } = await supabase
    .from('products')
    .select('brand, merchant_name, title')
    .limit(50);

  if (error) {
    console.error('Error:', error);
    return;
  }

  data.forEach((p, i) => {
    const displayBrand = p.brand !== 'Unknown' ? p.brand : (p.merchant_name || 'Unknown');
    console.log(`${i + 1}. ${displayBrand} - ${p.title.slice(0, 70)}...`);
  });
}

sampleProducts();
