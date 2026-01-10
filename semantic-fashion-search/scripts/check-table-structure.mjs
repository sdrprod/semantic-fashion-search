#!/usr/bin/env node

/**
 * Check the actual structure of the products table
 */

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

async function checkTableStructure() {
  console.log('='.repeat(70));
  console.log('CHECKING PRODUCTS TABLE STRUCTURE');
  console.log('='.repeat(70));
  console.log('');

  // Get a sample product to see its columns
  const { data: sampleProducts, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error fetching sample product:', error);
    process.exit(1);
  }

  if (sampleProducts && sampleProducts.length > 0) {
    const product = sampleProducts[0];
    console.log('📋 Columns in products table:');
    console.log('');

    const columns = Object.keys(product);
    columns.forEach((column) => {
      const value = product[column];
      const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
      console.log(`   • ${column}: ${type}`);

      // Show sample for non-array fields
      if (!Array.isArray(value) && value !== null) {
        const sample = String(value).slice(0, 60);
        console.log(`     Sample: ${sample}${String(value).length > 60 ? '...' : ''}`);
      }
    });

    console.log('');
    console.log('🔍 Looking for embedding columns:');
    const embeddingColumns = columns.filter(col =>
      col.includes('embed') || col.includes('vector')
    );

    if (embeddingColumns.length > 0) {
      console.log('   Found:', embeddingColumns.join(', '));
    } else {
      console.log('   ⚠️  No embedding columns found!');
    }
  }

  console.log('');
  console.log('='.repeat(70));
}

checkTableStructure()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
