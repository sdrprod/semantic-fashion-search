#!/usr/bin/env node

/**
 * Classify products by target_gender: 'women', 'men', or 'unisex'
 *
 * Run AFTER add-target-gender-column.sql has been executed.
 *
 * Usage:
 *   node scripts/classify-product-gender.mjs
 *
 * Options:
 *   --dry-run     Print classifications without writing to database
 *   --unclassified-only  Only process products where target_gender IS NULL
 *   --batch-size=N  Number of products per batch (default: 500)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const UNCLASSIFIED_ONLY = process.argv.includes('--unclassified-only');
const BATCH_SIZE_ARG = process.argv.find(a => a.startsWith('--batch-size='));
const BATCH_SIZE = BATCH_SIZE_ARG ? parseInt(BATCH_SIZE_ARG.split('=')[1]) : 500;

// ── Load env ─────────────────────────────────────────────────────────────────

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  try {
    const envPath = join(__dirname, '../.env.local');
    const envFile = readFileSync(envPath, 'utf8');
    const getVar = (name) => {
      const match = envFile.match(new RegExp(`^${name}=(.+)$`, 'm'));
      return match ? match[1].trim() : null;
    };
    SUPABASE_URL = SUPABASE_URL || getVar('NEXT_PUBLIC_SUPABASE_URL');
    SUPABASE_KEY = SUPABASE_KEY || getVar('SUPABASE_SERVICE_ROLE_KEY');
  } catch {
    console.error('Could not load .env.local');
  }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Classification Logic ──────────────────────────────────────────────────────

function decodeHtmlEntities(text) {
  return text
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Classify a product as 'men', 'unisex', or 'women'.
 *
 * Logic:
 *   1. Unisex markers → 'unisex'  (checked first, highest priority)
 *   2. Explicit women's markers → 'women'
 *   3. Explicit men's markers → 'men'
 *   4. Ambiguous (e.g. plain sneakers, basic tees) → 'unisex'
 *   5. Default → 'women'  (this is a women's fashion site)
 */
function classifyGender(title, description = '') {
  const decoded = `${decodeHtmlEntities(title)} ${decodeHtmlEntities(description)}`.toLowerCase();

  // ── 1. Unisex ────────────────────────────────────────────────────────────
  const unisexPatterns = [
    /\bunisex\b/,
    /\bfor men and women\b/,
    /\bfor women and men\b/,
    /\bmen (&|and) women\b/,
    /\bwomen (&|and) men\b/,
    /\bmens? (\/|and|&) womens?\b/,
    /\bwomens? (\/|and|&) mens?\b/,
    /\bgender.?neutral\b/,
    /\ball.?gender\b/,
  ];
  if (unisexPatterns.some(p => p.test(decoded))) return 'unisex';

  // ── 2. Explicit women's ──────────────────────────────────────────────────
  const womensPatterns = [
    /\bwom[ae]n'?s?\b/,
    /\bfor (her|women|ladies|girls)\b/,
    /\bher\b/,
    /\bladies\b/,
    /\bfeminine\b/,
    /\bfemale\b/,
    /\bgirls?\b/,
    /\bmaternity\b/,
    /\bplus.?size\b/,   // predominantly women's market on this site
  ];
  if (womensPatterns.some(p => p.test(decoded))) return 'women';

  // ── 3. Explicit men's ────────────────────────────────────────────────────
  const mensPatterns = [
    /\bmen'?s\b/,
    /\bfor (him|men|guys|boys)\b/,
    /\bmale\b/,
    /\bmasculine\b/,
    /\bgentleman'?s?\b/,
    /\bmenswear\b/,
    /\bboys?\b/,
    /\bboy'?s\b/,
    /\bfor him\b/,
    /\bhis\b/,
  ];
  if (mensPatterns.some(p => p.test(decoded))) return 'men';

  // ── 4. Ambiguous categories default to unisex ────────────────────────────
  // These item types are commonly worn across genders
  const unisexCategories = [
    /\bsneakers?\b/,
    /\btrainers?\b/,
    /\bbasket(ball)? shoes?\b/,
    /\brunning shoes?\b/,
    /\bslides?\b/,
    /\bsandals?\b/,        // can be either
    /\bflip.?flops?\b/,
    /\bsocks?\b/,
    /\bwatch(es)?\b/,
    /\bsunglasses\b/,
    /\bbackpack\b/,
    /\bwallet\b/,
    /\bcap\b/,
    /\bbeanie\b/,
    /\bhood(ie)?\b/,       // hoodies are commonly unisex
    /\bsweat(shirt|pants)\b/,
    /\btracksuit\b/,
    /\bjoggers?\b/,
    /\bpolo shirt\b/,      // polo is ambiguous without gender marker
    /\bt.?shirt\b/,        // plain tee without gender marker = unisex
    /\btee\b/,
    /\btank top\b/,
    /\boveralls?\b/,       // often unisex
    /\bovercoat\b/,
    /\bparka\b/,
    /\bbomber jacket\b/,
    /\bdenim jacket\b/,
    /\btrench coat\b/,
  ];
  if (unisexCategories.some(p => p.test(decoded))) return 'unisex';

  // ── 5. Default: women (this is a women's fashion site) ───────────────────
  return 'women';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('===========================================');
  console.log('Product Gender Classification Script');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Scope: ${UNCLASSIFIED_ONLY ? 'Unclassified products only' : 'All products'}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log('===========================================\n');

  // Count total products
  const countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (UNCLASSIFIED_ONLY) countQuery.is('target_gender', null);

  const { count: totalCount, error: countError } = await countQuery;
  if (countError) {
    console.error('Failed to count products:', countError.message);
    process.exit(1);
  }

  console.log(`Total products to classify: ${totalCount}\n`);

  const stats = { women: 0, men: 0, unisex: 0, errors: 0 };
  let offset = 0;
  let processed = 0;

  while (offset < totalCount) {
    // Fetch batch
    const query = supabase
      .from('products')
      .select('id, title, description')
      .range(offset, offset + BATCH_SIZE - 1);

    if (UNCLASSIFIED_ONLY) query.is('target_gender', null);

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      console.error(`Batch fetch error at offset ${offset}:`, fetchError.message);
      stats.errors += BATCH_SIZE;
      offset += BATCH_SIZE;
      continue;
    }

    if (!products || products.length === 0) break;

    // Classify each product
    const updates = products.map(p => ({
      id: p.id,
      target_gender: classifyGender(p.title, p.description || ''),
    }));

    // Tally stats
    updates.forEach(u => stats[u.target_gender]++);

    // Write to database (unless dry run)
    if (!DRY_RUN) {
      const { error: upsertError } = await supabase
        .from('products')
        .upsert(updates, { onConflict: 'id' });

      if (upsertError) {
        console.error(`Batch upsert error at offset ${offset}:`, upsertError.message);
        stats.errors += products.length;
      }
    } else {
      // Dry run: show sample
      if (offset === 0) {
        console.log('Sample classifications (first 10):');
        updates.slice(0, 10).forEach(u => {
          const product = products.find(p => p.id === u.id);
          console.log(`  [${u.target_gender.padEnd(6)}] ${product.title.slice(0, 70)}`);
        });
        console.log('');
      }
    }

    processed += products.length;
    offset += BATCH_SIZE;

    const pct = Math.round((processed / totalCount) * 100);
    process.stdout.write(`\rProgress: ${processed}/${totalCount} (${pct}%) — women: ${stats.women}, unisex: ${stats.unisex}, men: ${stats.men}`);
  }

  console.log('\n\n===========================================');
  console.log('Classification Complete');
  console.log(`  women:  ${stats.women}`);
  console.log(`  unisex: ${stats.unisex}`);
  console.log(`  men:    ${stats.men}`);
  if (stats.errors > 0) console.log(`  errors: ${stats.errors}`);
  console.log('===========================================');

  if (DRY_RUN) {
    console.log('\nThis was a DRY RUN. Re-run without --dry-run to apply changes.');
  }
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
