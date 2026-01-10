import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCampaignData() {
  console.log('\n📊 Analyzing product data quality by campaign...\n');

  // Get all unique merchant IDs
  const { data: merchants } = await supabase
    .from('products')
    .select('merchant_id')
    .not('merchant_id', 'is', null);

  const uniqueMerchants = [...new Set(merchants?.map(m => m.merchant_id) || [])];

  console.log(`Found ${uniqueMerchants.length} campaigns with products\n`);

  for (const merchantId of uniqueMerchants) {
    const { data: products } = await supabase
      .from('products')
      .select('title, description, price, image_url, product_url')
      .eq('merchant_id', merchantId)
      .limit(100);

    if (!products) continue;

    const total = products.length;
    const withDesc = products.filter(p => p.description && p.description.length > 10).length;
    const withPrice = products.filter(p => p.price && p.price > 0).length;
    const withImage = products.filter(p => p.image_url && p.image_url.length > 10).length;
    const withUrl = products.filter(p => p.product_url && p.product_url.length > 10).length;

    const quality = Math.round(((withDesc + withPrice + withImage + withUrl) / (total * 4)) * 100);

    console.log(`Campaign ${merchantId}:`);
    console.log(`  Total products: ${total}`);
    console.log(`  With descriptions: ${withDesc}/${total} (${Math.round(withDesc/total*100)}%)`);
    console.log(`  With prices: ${withPrice}/${total} (${Math.round(withPrice/total*100)}%)`);
    console.log(`  With images: ${withImage}/${total} (${Math.round(withImage/total*100)}%)`);
    console.log(`  With URLs: ${withUrl}/${total} (${Math.round(withUrl/total*100)}%)`);
    console.log(`  QUALITY SCORE: ${quality}%`);

    // Show sample product
    if (products.length > 0) {
      const sample = products[0];
      console.log(`  Sample: "${sample.title.substring(0, 60)}..."`);
    }
    console.log('');
  }

  console.log('\nRecommendation: Sync more products from campaigns with 60%+ quality score\n');
}

checkCampaignData().catch(console.error);
