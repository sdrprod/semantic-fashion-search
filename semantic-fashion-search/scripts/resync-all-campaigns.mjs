#!/usr/bin/env node

/**
 * Resync products from all Impact.com campaigns
 * Uses merchant-specific quality thresholds:
 * - DHGate: Requires score 6+ (very high quality only)
 * - Other merchants: Requires score 5+ (good quality)
 *
 * Target: 20,000+ high-quality fashion products
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { syncAllCampaigns, getAllCampaignIds } from '../lib/impact.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resyncAllCampaigns() {
  console.log('='.repeat(80));
  console.log('RESYNC ALL CAMPAIGNS - HIGH QUALITY FASHION PRODUCTS');
  console.log('='.repeat(80));
  console.log('');

  console.log('Quality thresholds:');
  console.log('  - DHGate merchants: Score 6+ (excellent quality required)');
  console.log('  - Other merchants: Score 5+ (good quality required)');
  console.log('');
  console.log('Target: 20,000+ products');
  console.log('');

  // Get all campaign IDs
  const campaignIds = getAllCampaignIds();
  console.log(`Found ${campaignIds.length} campaigns configured:`);
  console.log(`  Campaign IDs: ${campaignIds.join(', ')}`);
  console.log('');

  if (campaignIds.length === 0) {
    console.error('❌ No campaigns configured!');
    console.error('   Set IMPACT_CAMPAIGN_IDS in .env.local');
    process.exit(1);
  }

  // Get current product count
  const { count: currentCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  console.log(`Current products in database: ${currentCount}`);
  console.log('');

  // Sync all campaigns
  console.log('Starting multi-campaign sync...');
  console.log('');

  const result = await syncAllCampaigns(supabase, {
    maxProductsPerCampaign: 1500, // ~1500 per campaign * 20 campaigns = 30,000 potential products
    generateEmbeddings: false, // Generate separately for better control
    minQualityScore: 5, // Base threshold (DHGate will use 6+)
  });

  console.log('');
  console.log('='.repeat(80));
  console.log('SYNC RESULTS');
  console.log('='.repeat(80));
  console.log(`Total products synced: ${result.totalSynced}`);
  console.log(`Total errors: ${result.totalErrors}`);
  console.log('');

  console.log('Campaign breakdown:');
  result.campaignResults.forEach((r, i) => {
    console.log(`  ${i + 1}. Campaign ${r.campaignId}: ${r.synced} products (${r.errors} errors)`);
  });
  console.log('');

  // Get updated count
  const { count: newCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  console.log('='.repeat(80));
  console.log('DATABASE STATUS');
  console.log('='.repeat(80));
  console.log(`Products before: ${currentCount}`);
  console.log(`Products after: ${newCount}`);
  console.log(`Net change: +${newCount - currentCount}`);
  console.log('');

  // Show merchant distribution
  const { data: merchantCounts } = await supabase
    .rpc('get_merchant_distribution')
    .limit(10);

  if (!merchantCounts) {
    // Fallback query if RPC doesn't exist
    const { data: products } = await supabase
      .from('products')
      .select('merchant_name')
      .limit(10000);

    if (products) {
      const counts: Record<string, number> = {};
      products.forEach((p: any) => {
        const merchant = p.merchant_name || 'Unknown';
        counts[merchant] = (counts[merchant] || 0) + 1;
      });

      const topMerchants = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      console.log('Top 10 merchants by product count:');
      topMerchants.forEach(([merchant, count], i) => {
        console.log(`  ${i + 1}. ${merchant}: ${count} products`);
      });
    }
  } else {
    console.log('Top 10 merchants by product count:');
    merchantCounts.forEach((m: any, i: number) => {
      console.log(`  ${i + 1}. ${m.merchant_name}: ${m.count} products`);
    });
  }
  console.log('');

  if (newCount >= 20000) {
    console.log('✅ SUCCESS: Reached target of 20,000+ products!');
  } else {
    console.log(`⚠️  Currently at ${newCount} products (target: 20,000+)`);
    console.log('   Consider:');
    console.log('   - Running sync again with different campaigns');
    console.log('   - Adjusting quality thresholds');
    console.log('   - Adding more campaign IDs to IMPACT_CAMPAIGN_IDS');
  }
  console.log('');
}

resyncAllCampaigns()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });
