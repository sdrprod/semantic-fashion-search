#!/usr/bin/env node

/**
 * Remove non-fashion products from the database
 * These should have been filtered during sync but slipped through
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

// Fashion-related keywords that should appear in titles
const FASHION_KEYWORDS = [
  'dress', 'shirt', 'pants', 'jeans', 'skirt', 'shorts', 'jacket', 'coat',
  'sweater', 'cardigan', 'blazer', 'suit', 'blouse', 'top', 'tee', 't-shirt',
  'shoes', 'boots', 'heels', 'sandals', 'sneakers', 'flats', 'loafers',
  'bag', 'handbag', 'purse', 'tote', 'clutch', 'backpack', 'wallet',
  'jewelry', 'necklace', 'earrings', 'bracelet', 'ring', 'watch',
  'scarf', 'belt', 'hat', 'cap', 'beanie', 'sunglasses',
  'clothing', 'apparel', 'fashion', 'wear', 'outfit', 'style',
  'leggings', 'hoodie', 'sweatshirt', 'polo', 'tank', 'vest'
];

// Non-fashion keywords that indicate product should be removed
const NON_FASHION_KEYWORDS = [
  // Electronics & Gadgets
  'phone', 'iphone', 'samsung', 'galaxy', 'case', 'charger', 'cable', 'electronics',
  'headphone', 'earbud', 'speaker', 'bluetooth', 'wireless', 'usb', 'led', 'battery',
  'remote', 'control', 'smart watch', 'smartwatch', 'gadget', 'device',
  'tv box', 'tv stick', 'android tv', 'streaming device', 'dongle', 'set top',
  'ipad cover', 'ipad case', 'tablet case',

  // Computers & Peripherals
  'computer', 'laptop', 'keyboard', 'mouse', 'monitor', 'printer',
  'switch', 'ethernet', 'router', 'modem',
  'graphics card', 'gpu', 'rtx', 'rx7800', 'rx7900', 'rtx3050', 'rtx4060', 'rtx4070', 'rtx4080', 'rtx4090',
  'motherboard', 'mainboard', 'pcie', 'nvme', 'ssd', 'hard drive', 'storage drive',
  'asus', 'gigabyte', 'msi motherboard', 'asrock',
  'ram', 'ddr4', 'ddr5', 'memory module',

  // Kitchen & Appliances
  'kitchen', 'garlic', 'peeler', 'meat', 'cutter', 'appliance', 'machine',
  'blender', 'mixer', 'toaster', 'microwave',
  'wafflemaker', 'waffle maker', 'barbecue', 'bbq grill', 'teppanyaki', 'grill',

  // Toys & Games
  'inflatable', 'toy', 'game', 'puzzle', 'console', 'controller', 'doll',

  // Tools & Hardware
  'tool', 'hardware', 'equipment', 'power supply', 'circuit', 'motor',
  'drill', 'saw', 'wrench', 'screwdriver', 'bearing', 'gear',

  // Pets
  'pet', 'dog', 'cat', 'animal feed', 'pet food',

  // Photography & Video
  'camera', 'gopro', 'lens', 'tripod', 'backdrop', 'photography', 'studio',
  'lighting', 'softbox', 'reflector',

  // Baby & Nursery
  'baby shower', 'baby birthday', 'nursery', 'newborn', 'diaper',

  // Automotive & Sports Equipment
  'bicycle', 'bike', 'cycling', 'fishing', 'rod', 'reel',
  'drone', 'quadcopter',

  // Communications
  'walkie talkie', 'radio', 'antenna',

  // Home & Office
  'fan', 'electric fan', 'desk fan', 'piggy bank', 'coin bank',
  'curler', 'curling iron', 'hair curler',

  // Vision & Reading
  'bifocal', 'reading glasses', 'magnifying',

  // Party & Decorations (non-wearable)
  'party backdrop', 'birthday backdrop', 'decoration backdrop',

  // Safety & Industrial
  'safety light', 'flashlight', 'clip light', 'night vision',
  'spray ball', 'rotating clip', 'tri clover', 'industrial',

  // Outdoor & Camping (non-apparel)
  'tent', 'sleeping bag', 'camping stove',

  // Sports Equipment (non-apparel)
  'golf bag', 'golf club', 'golf accessory', 'golf cover',
  'roller skate', 'rollerblades', 'freestyle slalom', 'three wheel',

  // Packaging (non-wearable)
  'jewelry box', 'paper box packaging', 'gift box'
];

async function cleanupNonFashionProducts() {
  console.log('='.repeat(70));
  console.log('CLEANUP NON-FASHION PRODUCTS');
  console.log('='.repeat(70));
  console.log('');

  console.log('⚠️  WARNING: This will permanently delete non-fashion products!');
  console.log('');

  // Get total count
  const { count: total } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  console.log(`Total products before cleanup: ${total}`);
  console.log('');

  // Fetch all products in batches
  console.log('Step 1: Fetching all products...');
  const batchSize = 1000;
  const allProducts = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const { data: batch } = await supabase
      .from('products')
      .select('id, title, brand, description')
      .range(offset, offset + batchSize - 1);

    if (batch) {
      allProducts.push(...batch);
      console.log(`   Fetched ${allProducts.length}/${total}...`);
    }
  }

  console.log('');
  console.log('Step 2: Identifying non-fashion products...');

  // Identify products to delete
  const toDelete = [];

  for (const product of allProducts) {
    const text = `${product.title} ${product.description || ''}`.toLowerCase();

    // Check if it has fashion keywords
    const hasFashionKeyword = FASHION_KEYWORDS.some(keyword => text.includes(keyword));

    // Check if it has non-fashion keywords
    const hasNonFashionKeyword = NON_FASHION_KEYWORDS.some(keyword => text.includes(keyword));

    // Delete if no fashion keywords OR has non-fashion keywords
    if (!hasFashionKeyword || hasNonFashionKeyword) {
      toDelete.push(product);
    }
  }

  console.log(`   Identified ${toDelete.length} non-fashion products to delete`);
  console.log('');

  // Show breakdown by brand
  const brandCounts = toDelete.reduce((acc, p) => {
    const brand = p.brand || 'Unknown';
    acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {});

  const topBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('   Brands being removed:');
  topBrands.forEach(([brand, count]) => {
    console.log(`     ${brand}: ${count} products`);
  });
  console.log('');

  if (toDelete.length === 0) {
    console.log('✅ No non-fashion products found!');
    return;
  }

  // Show samples
  console.log('   Sample products being deleted:');
  toDelete.slice(0, 10).forEach((p, i) => {
    console.log(`     ${i + 1}. ${p.brand} - ${p.title.slice(0, 60)}...`);
  });
  console.log('');

  // Delete in batches
  console.log('Step 3: Deleting products...');
  const deleteBatchSize = 100;
  let deleted = 0;

  for (let i = 0; i < toDelete.length; i += deleteBatchSize) {
    const batch = toDelete.slice(i, i + deleteBatchSize);
    const ids = batch.map(p => p.id);

    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', ids);

    if (!error) {
      deleted += batch.length;
      console.log(`   Deleted ${deleted}/${toDelete.length} products...`);
    } else {
      console.error(`   ❌ Error deleting batch:`, error);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log(`✅ Deleted ${deleted} non-fashion products`);
  console.log('');

  // Verification
  console.log('='.repeat(70));
  console.log('VERIFICATION');
  console.log('='.repeat(70));

  const { count: remaining } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  console.log(`Products before: ${total}`);
  console.log(`Products deleted: ${deleted}`);
  console.log(`Products remaining: ${remaining}`);
  console.log(`Expected remaining: ${total - deleted}`);
  console.log('');

  if (remaining === total - deleted) {
    console.log('✅ Cleanup successful!');
  } else {
    console.log('⚠️  Mismatch in counts - some deletes may have failed');
  }
  console.log('');

  // Show sample of remaining products
  console.log('Sample remaining products:');
  const { data: samples } = await supabase
    .from('products')
    .select('brand, merchant_name, title')
    .limit(10);

  if (samples && samples.length > 0) {
    samples.forEach((p, i) => {
      const displayBrand = p.brand !== 'Unknown' ? p.brand : (p.merchant_name || 'Unknown');
      console.log(`   ${i + 1}. ${displayBrand} - ${p.title.slice(0, 60)}...`);
    });
  }
  console.log('');
}

cleanupNonFashionProducts()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
