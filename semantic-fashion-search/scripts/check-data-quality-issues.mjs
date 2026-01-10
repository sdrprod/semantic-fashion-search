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

async function checkDataQuality() {
  console.log('='.repeat(70));
  console.log('DATA QUALITY ISSUES CHECK');
  console.log('='.repeat(70));
  console.log('');

  // Check for non-fashion electronics/tech items
  console.log('1. CHECKING FOR NON-FASHION ITEMS (Electronics, Tech)...');
  const { data: electronics } = await supabase
    .from('products')
    .select('id, title, brand')
    .or('title.ilike.%watch strap%,title.ilike.%phone case%,title.ilike.%iphone%,title.ilike.%samsung%,title.ilike.%charger%,title.ilike.%cable%,title.ilike.%usb%')
    .limit(20);

  console.log(`   Found: ${electronics?.length || 0} electronics/tech items`);
  if (electronics && electronics.length > 0) {
    electronics.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title.slice(0, 70)}`);
    });
    if (electronics.length > 5) {
      console.log(`   ... and ${electronics.length - 5} more`);
    }
  }
  console.log('');

  // Check for sexy/inappropriate items
  console.log('2. CHECKING FOR SEXY/INAPPROPRIATE ITEMS...');
  const { data: sexy } = await supabase
    .from('products')
    .select('id, title, description')
    .or('title.ilike.%sexy%,description.ilike.%sexy%,title.ilike.%lingerie%,title.ilike.%boudoir%')
    .limit(20);

  console.log(`   Found: ${sexy?.length || 0} sexy/inappropriate items`);
  if (sexy && sexy.length > 0) {
    sexy.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title.slice(0, 70)}`);
    });
    if (sexy.length > 5) {
      console.log(`   ... and ${sexy.length - 5} more`);
    }
  }
  console.log('');

  // Check for null/poor descriptions
  console.log('3. CHECKING FOR POOR/MISSING DESCRIPTIONS...');
  const { data: poorDesc } = await supabase
    .from('products')
    .select('id, title, description')
    .or('description.is.null,description.eq.,description.eq.null,description.eq.none')
    .limit(20);

  console.log(`   Found: ${poorDesc?.length || 0} products with poor/missing descriptions`);
  if (poorDesc && poorDesc.length > 0) {
    poorDesc.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title.slice(0, 60)} | desc: "${p.description}"`);
    });
    if (poorDesc.length > 5) {
      console.log(`   ... and ${poorDesc.length - 5} more`);
    }
  }
  console.log('');

  // Check for "Unknown" brand
  console.log('4. CHECKING FOR UNKNOWN BRANDS...');
  const { data: unknownBrand } = await supabase
    .from('products')
    .select('id, title, brand')
    .eq('brand', 'Unknown')
    .limit(10);

  console.log(`   Found: ${unknownBrand?.length || 0} products with "Unknown" brand (showing first 10)`);
  console.log('');

  // Check for kitchen/home items
  console.log('5. CHECKING FOR KITCHEN/HOME ITEMS...');
  const { data: kitchen } = await supabase
    .from('products')
    .select('id, title')
    .or('title.ilike.%kitchen%,title.ilike.%waffle%,title.ilike.%grill%,title.ilike.%bbq%,title.ilike.%garlic%')
    .limit(20);

  console.log(`   Found: ${kitchen?.length || 0} kitchen/home items`);
  if (kitchen && kitchen.length > 0) {
    kitchen.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title.slice(0, 70)}`);
    });
  }
  console.log('');

  // Summary
  console.log('='.repeat(70));
  console.log('SUMMARY:');
  console.log('='.repeat(70));
  const totalIssues = (electronics?.length || 0) + (sexy?.length || 0) + (kitchen?.length || 0);
  const totalProducts = 1000; // We know this from previous check
  const issuePercentage = ((totalIssues / totalProducts) * 100).toFixed(1);

  console.log(`❌ Non-fashion items: ${electronics?.length || 0}`);
  console.log(`⚠️  Sexy/inappropriate: ${sexy?.length || 0}`);
  console.log(`📝 Poor descriptions: ${poorDesc?.length || 0}`);
  console.log(`🏷️  Unknown brands: ${unknownBrand?.length || 0}`);
  console.log(`🏠 Kitchen/home items: ${kitchen?.length || 0}`);
  console.log('');
  console.log(`Total quality issues: ${totalIssues}/${totalProducts} (${issuePercentage}%)`);
  console.log('');

  if (totalIssues > 100) {
    console.log('🚨 CRITICAL: High number of quality issues detected!');
    console.log('   Recommendation: Clear database and resync with stricter quality filters');
  } else if (totalIssues > 50) {
    console.log('⚠️  WARNING: Moderate quality issues detected');
    console.log('   Recommendation: Apply additional filtering or resync');
  } else {
    console.log('✅ Quality issues within acceptable range');
  }
}

checkDataQuality()
  .then(() => {
    console.log('');
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
