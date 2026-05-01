/**
 * cleanup-nonfashion-products.mjs
 *
 * Identifies and deletes products that are clearly not fashion items —
 * functional/utility goods, medical products, automotive parts, storage
 * accessories, multi-pack basics, and other non-apparel/non-accessory items
 * that contaminate search results.
 *
 * Usage:
 *   node scripts/cleanup-nonfashion-products.mjs --dry-run     # preview (no deletes)
 *   node scripts/cleanup-nonfashion-products.mjs --sample 50   # show 50 matches
 *   node scripts/cleanup-nonfashion-products.mjs               # live delete (asks confirmation)
 *   node scripts/cleanup-nonfashion-products.mjs --yes         # live delete (no prompt)
 *
 * Safety:
 *   - Default (no flags) runs dry-run automatically first, then prompts before deleting
 *   - Rules are conservative: only delete on unambiguous non-fashion signals
 *   - Produces a JSON log of deleted product IDs for rollback reference
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Env loading ──────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
for (const line of envFile.split('\n')) {
  const eqIdx = line.indexOf('=');
  if (eqIdx > 0) {
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && val) process.env[key] = val;
  }
}

const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipPrompt = args.includes('--yes');
const sampleIdx = args.indexOf('--sample');
const sampleSize = sampleIdx >= 0 ? parseInt(args[sampleIdx + 1], 10) || 50 : 0;
const isSampleMode = sampleSize > 0;

// ── Non-fashion signal rules ─────────────────────────────────────────────────
//
// HARD_DELETE: If the product title/description contains ANY of these strings,
// it is unconditionally non-fashion and should be removed. Phrases are checked
// as simple substrings (lowercased) for speed.
//
// Keep rules CONSERVATIVE — prefer false negatives over false positives.
// When in doubt, leave the product in and handle it manually.

const HARD_DELETE_SIGNALS = [

  // ── Incontinence / medical bladder products ───────────────────────────────
  'incontinence', 'bladder leak', 'bladder leakage', 'postpartum bladder',
  'adult diaper', 'adult brief absorbency', 'maximum absorbency adult',
  'overnight absorbency', 'urinary leak', 'light bladder',

  // ── Automotive / industrial belts ─────────────────────────────────────────
  'alternator belt', 'timing belt', 'serpentine belt', 'fan belt',
  'conveyor belt', 'drive belt', 'v-belt', 'poly v belt', 'poly-v belt',
  'automotive belt', 'engine belt', 'accessory belt',

  // ── Tool / gym utility belts (not fashion) ────────────────────────────────
  'tool belt', 'tool pouch belt', 'powerlifting belt', 'lifting belt',
  'weight lifting belt', 'squat belt', 'deadlift belt',

  // ── Hat racks / storage (not hats) ───────────────────────────────────────
  'hat rack', 'hat stand', 'hat display stand', 'hat box', 'hat storage',
  'hat organizer', 'cap rack', 'cap organizer', 'cap holder',

  // ── Shoe storage / care (not shoes) ──────────────────────────────────────
  'shoe rack', 'shoe organizer', 'shoe tower', 'shoe shelf',
  'shoe box organizer', 'shoe storage box', 'shoe cabinet',
  'shoe polish', 'shoe cleaner', 'shoe protector spray', 'shoe deodorizer',
  'shoe care kit', 'shoe cleaning kit', 'sneaker cleaning kit',
  'boot dryer', 'shoe stretcher',

  // ── Bag / purse organizers (not bags) ────────────────────────────────────
  'purse organizer', 'purse hook', 'bag organizer insert', 'handbag organizer',
  'purse hanger', 'bag liner insert', 'felt bag liner',

  // ── Jewelry storage (not jewelry) ────────────────────────────────────────
  'jewelry box', 'jewelry organizer', 'jewelry storage', 'jewelry armoire',
  'jewelry tray', 'jewelry roll', 'ring dish organizer', 'earring holder',
  'necklace organizer', 'jewelry stand',

  // ── Clothing storage / hangers ────────────────────────────────────────────
  'clothes hanger', 'clothing hanger', 'garment hanger', 'velvet hanger',
  'pants hanger', 'skirt hanger', 'closet organizer', 'wardrobe organizer',
  'garment bag storage', 'cedar block', 'vacuum storage bag',

  // ── Laundry accessories ───────────────────────────────────────────────────
  'laundry hamper', 'laundry basket', 'washing bag', 'mesh laundry bag',
  'delicates laundry bag', 'lint roller', 'lint remover', 'lint brush',
  'fabric shaver', 'clothes shaver', 'pilling remover',

  // ── Luggage tags / travel accessories that aren't bags ───────────────────
  'luggage tag', 'baggage tag', 'suitcase tag', 'luggage lock',

  // ── Athletic / functional socks (not fashion, sold individually or small packs) ──
  'no show sock', 'no-show sock', 'no show running sock',
  'ankle sock pack', 'crew sock pack', 'athletic sock pack',
  'running sock', 'golf sock', 'hiking sock', 'compression sock',
  'anti-blister sock', 'anti blister sock', 'wicking sock', 'coolmax sock',
  'cushion tab ankle', 'tab ankle sock',

  // ── Men's athletic/sport shoes (not women's fashion) ─────────────────────
  // NOTE: 'basketball shoe' alone is too broad — luxury sneakers mention it in descriptions.
  // Use brand-anchored or function-anchored phrases only.
  'lockdown basketball', 'lockdown 7 basketball',
  'unisex-adult training shoe', 'unisex adult training shoe',
  'basketball shoe for men', 'men\'s basketball shoe', 'men basketball shoe',

  // ── Functional undergarments (not bralettes/fashion bras) ─────────────────
  'push up bra for women seamless wireless no underwire',
  'wireless no underwire jelly', 'jelly bra support',
  'hipster panties mid rise briefs', 'hipster panty mid rise',
  'full brief panties breathable seamless',
  'boy shorts underwear for women – no show',
  'boy shorts underwear no show',

  // ── Medical compression / orthopedic (not fashion) ───────────────────────
  'compression sleeve', 'orthopedic insole', 'orthotic insole',
  'plantar fasciitis', 'knee brace', 'ankle brace', 'ankle support brace',
  'wrist brace', 'wrist support', 'back brace', 'posture corrector',
  'compression stocking', 'medical compression', 'diabetic sock',
  'diabetic slipper', 'edema sock',

  // ── Sports protective gear (not fashion) ─────────────────────────────────
  'knee pad', 'elbow pad', 'shin guard', 'shoulder pad sports',
  'mouth guard', 'athletic cup', 'jockstrap',

  // ── Personal care / hygiene (not fashion) ────────────────────────────────
  'nursing bra', 'nursing pad', 'breast pump', 'nipple shield',
  'maternity support belt', 'belly band maternity',
  'period underwear', 'period panty', 'menstrual underwear',
  'sweat pad', 'underarm pad', 'armpit pad',

  // ── Occupational / safety footwear (not fashion) ─────────────────────────
  'steel toe boot', 'steel-toe boot', 'steel toe shoe', 'safety toe',
  'composite toe', 'metatarsal guard', 'puncture resistant sole',
  'electrical hazard boot', 'slip resistant work boot',

  // ── Watch / phone accessories (not watches themselves) ───────────────────
  'watch winder', 'watch box', 'watch case storage', 'watch stand display',

  // ── Hair tools (not hair accessories/fashion) ─────────────────────────────
  'hair dryer', 'hair straightener', 'flat iron', 'curling iron', 'curling wand',
  'hot air brush', 'hair diffuser', 'hair crimper',

  // ── Personal electronics / appliances ────────────────────────────────────
  'electric shaver', 'epilator', 'facial steamer', 'steam mop',

  // ── Miscellaneous non-fashion ─────────────────────────────────────────────
  'welcome mat', 'door mat', 'bath mat', 'yoga mat',
  'sleeping bag', 'camping gear',
  'pet collar', 'dog leash', 'cat collar',
  'phone case', 'tablet case', 'laptop bag',     // laptop bag ≠ fashion bag
];

// ── PACK signals: delete when BOTH conditions match ──────────────────────────
//
// These items are borderline when sold individually but clearly non-fashion
// when sold as multi-packs of basics. Each entry is [packWord, itemWord[]].
//
// Match logic: title contains packWord AND any itemWord.

const PACK_DELETE_PAIRS = [
  // Pack indicator keywords
  ['3-pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks', 't-shirt pack', 'tee pack']],
  ['3 pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['4-pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['4 pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['5-pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['5 pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['6-pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['6 pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['7-pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'sock', 'socks']],
  ['7 pack',     ['underwear', 'panty', 'panties', 'brief', 'boxer', 'sock', 'socks']],
  ['10-pack',    ['underwear', 'panty', 'panties', 'brief', 'boxer', 'sock', 'socks']],
  ['10 pack',    ['underwear', 'panty', 'panties', 'brief', 'boxer', 'sock', 'socks']],
  ['multipack',  ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['multi-pack', ['underwear', 'panty', 'panties', 'brief', 'boxer', 'bra ', 'sock', 'socks']],
  ['bulk pack',  ['underwear', 'panty', 'panties', 'brief', 'boxer', 'sock', 'socks']],
  ['value pack', ['underwear', 'panty', 'panties', 'brief', 'boxer', 'sock', 'socks']],
  // Socks specifically — sock packs are never fashion
  ['pair of socks',  ['no show', 'ankle sock', 'crew sock', 'athletic sock', 'running sock', 'tab sock']],
  ['pairs of socks', ['no show', 'ankle sock', 'crew sock', 'athletic sock', 'running sock']],
];

// ── Classifier ───────────────────────────────────────────────────────────────

/**
 * Returns the matching signal string if product should be deleted, or null.
 */
function getNonFashionSignal(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  for (const signal of HARD_DELETE_SIGNALS) {
    if (text.includes(signal)) return signal;
  }

  for (const [packWord, itemWords] of PACK_DELETE_PAIRS) {
    if (text.includes(packWord)) {
      for (const itemWord of itemWords) {
        if (text.includes(itemWord)) return `${packWord} + ${itemWord.trim()}`;
      }
    }
  }

  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 500;
let from = 0;
let totalScanned = 0;
let toDeleteIds = [];
const matchedSignals = {};
const deleteSamples = [];

console.log('');
console.log('='.repeat(70));
console.log(' NON-FASHION PRODUCT CLEANUP');
console.log('='.repeat(70));
console.log(` Mode     : ${isDryRun ? 'DRY RUN' : isSampleMode ? `SAMPLE ${sampleSize}` : 'LIVE'}`);
console.log(` Scanning : all products`);
console.log('');

const startTime = Date.now();

// ── Scan phase ────────────────────────────────────────────────────────────────
while (true) {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, description, category')
    .range(from, from + BATCH_SIZE - 1)
    .order('id');

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  if (!data || data.length === 0) break;

  for (const row of data) {
    const signal = getNonFashionSignal(row.title, row.description);
    if (signal) {
      toDeleteIds.push(row.id);
      matchedSignals[signal] = (matchedSignals[signal] || 0) + 1;
      if (deleteSamples.length < 100) {
        deleteSamples.push({
          id: row.id,
          category: row.category || 'NULL',
          signal,
          title: (row.title || '').slice(0, 90),
        });
      }
    }
  }

  totalScanned += data.length;
  process.stdout.write(`\r  Scanned ${totalScanned} | Flagged ${toDeleteIds.length}`);

  from += data.length;
  if (data.length < BATCH_SIZE) break;
  if (isSampleMode && deleteSamples.length >= sampleSize) break;
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n`);

// ── Report ────────────────────────────────────────────────────────────────────
console.log('='.repeat(70));
console.log(' SCAN RESULTS');
console.log('='.repeat(70));
console.log(` Scanned  : ${totalScanned} products`);
console.log(` Flagged  : ${toDeleteIds.length} to delete`);
console.log(` Safe     : ${totalScanned - toDeleteIds.length} no action`);
console.log(` Time     : ${elapsed}s`);
console.log('');

console.log(' Top signals triggering deletion:');
const sortedSignals = Object.entries(matchedSignals).sort((a, b) => b[1] - a[1]);
for (const [signal, count] of sortedSignals.slice(0, 40)) {
  console.log(`   ${String(count).padStart(5)}  "${signal}"`);
}

console.log('');
const showCount = isSampleMode ? Math.min(sampleSize, deleteSamples.length) : Math.min(30, deleteSamples.length);
console.log(` Sample of flagged products (showing ${showCount}):`);
for (const s of deleteSamples.slice(0, showCount)) {
  console.log(`   [${(s.category).padEnd(12)}] [${s.signal.slice(0, 25).padEnd(25)}] ${s.title}`);
}

if (toDeleteIds.length === 0) {
  console.log('');
  console.log(' Nothing to delete. Database is clean.');
  process.exit(0);
}

// ── Dry run / sample: exit here ───────────────────────────────────────────────
if (isDryRun || isSampleMode) {
  console.log('');
  console.log(isDryRun
    ? ' DRY RUN: no products were deleted. Remove --dry-run to apply.'
    : ` SAMPLE mode: no products were deleted. Remove --sample to apply.`);
  console.log('');
  process.exit(0);
}

// ── Confirmation prompt ───────────────────────────────────────────────────────
if (!skipPrompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => {
    rl.question(`\n  Delete ${toDeleteIds.length} products permanently? Type YES to confirm: `, resolve);
  });
  rl.close();

  if (answer.trim() !== 'YES') {
    console.log('\n  Aborted. No products deleted.');
    process.exit(0);
  }
}

// ── Delete phase ───────────────────────────────────────────────────────────────
console.log('');
console.log(' Deleting...');

// Save ID log for rollback reference
const logPath = path.join(__dirname, '..', `deleted-products-${Date.now()}.json`);
fs.writeFileSync(logPath, JSON.stringify({ deletedAt: new Date().toISOString(), ids: toDeleteIds }, null, 2));
console.log(` Deletion log saved → ${path.basename(logPath)}`);

const CHUNK = 200;  // Supabase IN clause limit
let deletedCount = 0;
let deleteErrors = 0;

for (let i = 0; i < toDeleteIds.length; i += CHUNK) {
  const chunk = toDeleteIds.slice(i, i + CHUNK);
  const { error } = await supabase.from('products').delete().in('id', chunk);

  if (error) {
    console.error(`  Error deleting chunk at ${i}: ${error.message}`);
    deleteErrors += chunk.length;
  } else {
    deletedCount += chunk.length;
  }
  process.stdout.write(`\r  Deleted ${deletedCount} / ${toDeleteIds.length}`);
}

console.log('\n');
console.log('='.repeat(70));
console.log(' DONE');
console.log('='.repeat(70));
console.log(` Deleted  : ${deletedCount} products`);
if (deleteErrors > 0) console.log(` Errors   : ${deleteErrors} (see log for IDs)`);
console.log(` Log file : ${path.basename(logPath)}`);
console.log('');
console.log(' Next: click the ↺ cache clear button in the footer to flush Redis.');
console.log('');
