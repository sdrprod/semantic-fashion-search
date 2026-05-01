/**
 * recategorize-products.mjs
 *
 * Bulk re-categorizes all products using a keyword rule engine applied to
 * title + description + tags. Rules are ordered from most-specific to least-
 * specific to avoid misclassification (e.g., "ankle boot" beats "boot" beats
 * general shoe signals).
 *
 * Usage:
 *   node scripts/recategorize-products.mjs              # live run
 *   node scripts/recategorize-products.mjs --dry-run    # preview only
 *   node scripts/recategorize-products.mjs --sample 50  # show 50 classifications without writing
 *   node scripts/recategorize-products.mjs --category dresses  # only re-check products in one category
 *   node scripts/recategorize-products.mjs --skip-unchanged    # only write rows that actually change
 *
 * Safety:
 *   - Never sets category to null
 *   - Products that match NO rule keep their current category (logged separately)
 *   - Run --dry-run first to review before committing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const skipUnchanged = args.includes('--skip-unchanged');
const sampleIdx = args.indexOf('--sample');
const sampleSize = sampleIdx >= 0 ? parseInt(args[sampleIdx + 1], 10) || 50 : 0;
const categoryIdx = args.indexOf('--category');
const filterCategory = categoryIdx >= 0 ? args[categoryIdx + 1] : null;

// ── Category rule engine ─────────────────────────────────────────────────────
//
// Rules are evaluated IN ORDER — first match wins.
// Each rule is [category, keywords[]].
// A product matches if its searchable text contains ANY keyword in the array.
// Keywords are matched as whole-words or as substrings (simpler, effective for fashion).
//
// Priority order rationale:
//   1. Highly specific compound terms (ankle boot, sports bra) come first
//   2. Accessory categories (watches, belts) before clothing catchalls
//   3. Footwear hierarchy: boots > heels > sandals > sneakers > flats
//   4. Clothing hierarchy: jumpsuits > dresses > skirts > pants > outerwear > activewear > tops
//   5. Bag/jewelry specifics before general jewelry

const RULES = [
  // ── Swimwear (very specific signals) ─────────────────────────────────────
  ['swimwear', ['bikini', 'swimsuit', 'bathing suit', 'one-piece swimwear', 'swimwear',
                'tankini', 'monokini', 'swim brief', 'board short', 'rash guard']],

  // ── Activewear (must come before tops/pants since those overlap) ──────────
  ['activewear', ['sports bra', 'sports top', 'athletic legging', 'yoga pant', 'yoga legging',
                  'gym legging', 'workout legging', 'compression legging', 'athletic short',
                  'gym short', 'workout short', 'running short', 'cycling short',
                  'athletic wear', 'activewear', 'sportswear', 'athletic set',
                  'workout set', 'gym set', 'running tights', 'compression tights']],

  // ── Watches ───────────────────────────────────────────────────────────────
  ['watches', ['wristwatch', 'smartwatch', 'analog watch', 'digital watch',
               'chronograph', 'timepiece', 'watch band', 'watch strap',
               ' watch ', 'watch,', 'watch.']],

  // ── Sunglasses ────────────────────────────────────────────────────────────
  ['sunglasses', ['sunglasses', 'sunglass', 'sun glasses', 'polarized lens',
                  'uv400 glasses', 'oversized glasses', 'aviator glasses',
                  'cat eye glasses', 'wayfarers', 'shades ']],

  // ── Boots (before general shoe terms) ────────────────────────────────────
  ['boots', ['ankle boot', 'ankle-boot', 'knee boot', 'knee-high boot', 'thigh boot',
             'thigh-high boot', 'over-the-knee boot', 'combat boot', 'cowboy boot',
             'western boot', 'chelsea boot', 'rain boot', 'winter boot', 'snow boot',
             'hiking boot', 'riding boot', 'lace-up boot', 'platform boot', 'chukka boot',
             'booties', 'bootie', ' boots', 'boots,', 'boots.', 'boot heel',
             'ankle bootie']],

  // ── Heels (before sandals — "heeled sandal" is heels) ────────────────────
  ['heels', ['stiletto', 'kitten heel', 'block heel', 'cone heel', 'wedge heel',
             'platform heel', 'high-heel', 'high heel', 'strappy heel', 'slingback heel',
             'pump shoe', 'court shoe', 'mary jane heel', ' pumps', 'pumps,',
             'heeled sandal', 'heeled mule', 'heeled clog', 'heeled loafer',
             'pointed toe heel', ' heels', 'heels,', 'heels.']],

  // ── Sandals ───────────────────────────────────────────────────────────────
  ['sandals', ['sandal', 'flip flop', 'flip-flop', 'thong sandal', 'slide sandal',
               ' slide ', 'espadrille', 'gladiator sandal', 'strappy sandal',
               'flatform sandal', 'platform sandal', 'birkenstock', 'jelly sandal']],

  // ── Sneakers ──────────────────────────────────────────────────────────────
  ['sneakers', ['sneaker', 'trainer', 'athletic shoe', 'running shoe', 'tennis shoe',
                'canvas sneaker', 'low-top sneaker', 'high-top sneaker', 'chunky sneaker',
                'platform sneaker', 'dad shoe', 'sport shoe', 'walking shoe',
                'crosstrainer', 'cross trainer', 'go run', 'court shoe athletic']],

  // ── Flats (includes clogs, slippers, mules) ───────────────────────────────
  ['flats', ['ballet flat', 'flat shoe', 'loafer', 'moccasin', 'oxford shoe',
             'pointed flat', 'round-toe flat', 'slip-on flat', 'smoking slipper',
             ' flats', 'flats,', 'flats.', 'mule flat', 'pointed-toe flat',
             ' clog', 'clog shoe', 'clog sandal', 'wooden clog', 'platform clog',
             'suede clog', 'leather clog', 'slip-on clog',
             ' slipper', 'slipper shoe', 'sheepskin slipper', 'suede slipper',
             'memory foam slipper', 'house slipper', 'indoor slipper',
             'plain toe oxford', 'plain-toe oxford', 'cap toe oxford',
             'lace-up oxford', 'derby shoe', 'monk strap']],

  // ── Jumpsuits / Rompers (before dresses) ─────────────────────────────────
  ['jumpsuits', ['jumpsuit', 'romper', 'playsuit', 'one-piece outfit', 'overalls',
                 'dungarees', 'boilersuit', 'catsuit']],

  // ── Dresses ───────────────────────────────────────────────────────────────
  ['dresses', ['maxi dress', 'midi dress', 'mini dress', 'wrap dress', 'shift dress',
               'bodycon dress', 'a-line dress', 'skater dress', 'slip dress',
               'shirt dress', 'sweater dress', 'knit dress', 'shirt-dress',
               'sundress', 'sheath dress', 'ball gown', 'evening gown', 'cocktail dress',
               'party dress', 'prom dress', 'wedding dress', 'bridesmaid dress',
               'floral dress', 'lace dress', 'satin dress', 'velvet dress',
               'tiered dress', 'smocked dress', 'babydoll dress', 'peasant dress',
               'boho dress', 'bohemian dress', 'kaftan', 'caftan', 'muumuu',
               ' dress', 'dress,', 'dress.', 'dresses']],

  // ── Skirts ────────────────────────────────────────────────────────────────
  ['skirts', ['maxi skirt', 'midi skirt', 'mini skirt', 'pencil skirt', 'a-line skirt',
              'wrap skirt', 'pleated skirt', 'tiered skirt', 'tulle skirt', 'denim skirt',
              'leather skirt', 'floral skirt', 'tennis skirt', 'asymmetric skirt',
              ' skirt', 'skirt,', 'skirt.', 'skirts']],

  // ── Pants ─────────────────────────────────────────────────────────────────
  ['pants', ['wide-leg pant', 'wide leg pant', 'straight-leg pant', 'skinny jean',
             'high-rise jean', 'high waist jean', 'bootcut jean', 'flare jean',
             'mom jean', 'palazzo pant', 'culottes', 'capri pant', 'cargo pant',
             'chino pant', 'linen pant', 'pleated pant', 'trousers', 'jogger pant',
             'sweatpant', 'legging', ' jeans', 'jeans,', 'jeans.',
             ' pants', 'pants,', 'pants.',
             ' slacks', 'slacks,', 'slacks.', 'dress slacks', 'work slacks',
             'tummy control pant', 'slim leg pant', 'pull-on pant', 'pull on pant',
             'stretch pant', 'comfort pant']],

  // ── Outerwear (before tops since jackets overlap) ────────────────────────
  ['outerwear', ['trench coat', 'puffer coat', 'puffer jacket', 'down jacket', 'down coat',
                 'parka', 'anorak', 'windbreaker', 'rain jacket', 'rain coat',
                 'wool coat', 'overcoat', 'peacoat', 'cape coat', 'duster coat',
                 'faux fur coat', 'leather jacket', 'moto jacket', 'biker jacket',
                 'denim jacket', 'jean jacket', 'bomber jacket', 'flight jacket',
                 'blazer jacket', 'blazer', 'structured blazer', 'suit jacket',
                 'utility jacket', 'sherpa jacket', ' coat', 'coat,', 'coat.',
                 'outerwear', ' jacket', 'jacket,', 'jacket.']],

  // ── Two-piece sets / co-ords / lounge sets / beach cover-ups ─────────────
  // These are valid fashion items; route them to "tops" (closest canonical category)
  // until a dedicated "sets" category is added.
  ['tops', ['two piece set', 'two-piece set', '2 piece set', '2-piece set',
            'matching set', 'co-ord set', 'coord set', 'coordinates set',
            'lounge set', 'tracksuit set', 'sweat set', 'jogger set',
            'beach cover up', 'beach cover-up', 'swimwear cover up',
            'cover up set', 'kimono cover', 'kaftan cover',
            'vacation set', 'airport outfit set', 'resort set',
            'biker short set', 'bike short set', 'shorts set']],

  // ── Tops (broadest clothing catchall; comes after specific categories) ─────
  ['tops', ['crop top', 'tube top', 'halter top', 'off-shoulder top', 'cold-shoulder top',
            'strapless top', 'wrap top', 'peplum top', 'corset top', 'bustier top',
            'bralette top', 'bodysuit', 'camisole', 'tank top', 'racerback top',
            'mock neck top', 'turtleneck top', 'cowl neck top', 'flutter top',
            'graphic tee', 'graphic t-shirt', 'band tee', 'band t-shirt',
            'oversized tee', 'oversized shirt', 'button-down shirt', 'button-up shirt',
            'oxford shirt', 'chambray shirt', 'flannel shirt', 'linen shirt',
            'silk blouse', 'satin blouse', 'chiffon blouse', 'peasant blouse',
            'ruffle blouse', 'wrap blouse', 'tunic top', 'tunic blouse',
            'pullover sweater', 'crewneck sweater', 'v-neck sweater', 'cashmere sweater',
            'cable knit sweater', 'chunky knit', 'turtleneck sweater', 'mock neck sweater',
            'cardigan sweater', ' cardigan', 'zip-up hoodie', 'pullover hoodie',
            'sweatshirt', 'crewneck sweatshirt', 'henley', ' blouse', 'blouse,',
            'blouse.', ' shirt', 'shirt,', 'shirt.', ' top,', 'top.', ' tops',
            ' sweater', 'sweater,', 'sweater.', ' tee', 'tee,', 'tee.',
            't-shirt', 't-shirts']],

  // ── Handbags ─────────────────────────────────────────────────────────────
  ['handbags', ['shoulder bag', 'crossbody bag', 'crossbody purse', 'satchel bag',
                'hobo bag', 'bucket bag', 'saddle bag', 'mini bag', 'micro bag',
                'baguette bag', 'clutch bag', ' clutch', 'wristlet', 'envelope bag',
                'chain bag', 'flap bag', 'tote bag', ' tote', 'shopper bag',
                'weekend bag', 'travel bag', 'handbag', ' purse', 'purse,',
                'purse.', ' bag,', 'bag.', ' bags']],

  // ── Jewelry (specific types first) ───────────────────────────────────────
  ['necklaces', ['necklace', 'pendant necklace', 'choker necklace', 'chain necklace',
                 'layering necklace', 'statement necklace', 'pearl necklace',
                 'gold necklace', 'silver necklace', ' pendant', 'lariat']],

  ['earrings', ['earring', 'stud earring', 'hoop earring', 'drop earring',
                'dangle earring', 'ear cuff', 'climber earring', 'threader earring',
                'huggie earring']],

  ['rings', [' ring,', 'ring.', ' rings', 'statement ring', 'band ring',
             'stackable ring', 'cocktail ring', 'signet ring', 'gemstone ring']],

  ['jewelry', ['jewelry', 'jewellery', 'bracelet', 'anklet', 'brooch', 'hair pin',
               'hair clip', 'hair comb', 'hair accessory', 'body chain',
               'waist chain', 'crystal jewelry', 'rhinestone jewelry']],

  // ── Belts ─────────────────────────────────────────────────────────────────
  ['belts', ['leather belt', 'chain belt', 'waist belt', 'wide belt', 'skinny belt',
             'corset belt', 'obi belt', ' belt,', 'belt.', ' belts']],

  // ── Scarves ───────────────────────────────────────────────────────────────
  ['scarves', ['silk scarf', 'wool scarf', 'cashmere scarf', 'infinity scarf',
               'blanket scarf', 'bandana scarf', 'neck scarf', 'head scarf',
               'wrap scarf', ' scarf', 'scarf,', 'scarf.', 'scarves', 'shawl']],

  // ── Hats ─────────────────────────────────────────────────────────────────
  ['hats', ['baseball cap', 'bucket hat', 'wide-brim hat', 'fedora hat', 'straw hat',
            'cowboy hat', 'beanie hat', 'beret hat', 'visor hat', 'newsboy cap',
            'trucker hat', 'snapback', 'panama hat', ' hat,', 'hat.', ' hats',
            ' cap,', 'cap.', ' beanie', ' beret', ' fedora']],
];

/**
 * Classify a product into a canonical category using the rule engine.
 * Returns the matched category string, or null if no rule matches.
 */
function classifyProduct(title, description, tags) {
  const searchText = [
    (title || '').toLowerCase(),
    (description || '').toLowerCase(),
    (Array.isArray(tags) ? tags.join(' ') : (tags || '')).toLowerCase(),
  ].join(' ');

  for (const [category, keywords] of RULES) {
    for (const kw of keywords) {
      if (searchText.includes(kw)) {
        return category;
      }
    }
  }

  return null;  // No rule matched
}

// ── Main ──────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 500;
let from = 0;
let totalProcessed = 0;
let totalChanged = 0;
let totalUnmatched = 0;
let totalErrors = 0;

const changeCounts = {};
const unmatchedSamples = [];

console.log('');
console.log('='.repeat(70));
console.log(' PRODUCT RE-CATEGORIZER');
console.log('='.repeat(70));
console.log(` Mode     : ${isDryRun ? 'DRY RUN (no writes)' : sampleSize > 0 ? `SAMPLE ${sampleSize}` : 'LIVE'}`);
console.log(` Batch    : ${BATCH_SIZE} products per round`);
if (filterCategory) console.log(` Filter   : only category = "${filterCategory}"`);
if (skipUnchanged)  console.log(` Skip     : products whose category would not change`);
console.log('');

const startTime = Date.now();

while (true) {
  let query = supabase
    .from('products')
    .select('id, title, description, tags, category')
    .range(from, from + BATCH_SIZE - 1)
    .order('id');

  if (filterCategory) {
    query = query.eq('category', filterCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase fetch error:', error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) break;

  const updates = [];

  for (const row of data) {
    const suggested = classifyProduct(row.title, row.description, row.tags);
    const current = row.category || 'NULL';

    if (suggested === null) {
      totalUnmatched++;
      if (unmatchedSamples.length < 20) {
        unmatchedSamples.push({ id: row.id, title: (row.title || '').slice(0, 80), current });
      }
      continue;
    }

    if (skipUnchanged && suggested === current) continue;
    if (suggested === current) continue;  // Always skip no-ops (saves API calls)

    const key = `${current} → ${suggested}`;
    changeCounts[key] = (changeCounts[key] || 0) + 1;
    updates.push({ id: row.id, category: suggested });

    if (sampleSize > 0 && totalChanged < sampleSize) {
      console.log(`  [${current.padEnd(15)}→ ${suggested.padEnd(15)}] ${(row.title || '').slice(0, 70)}`);
    }
  }

  totalProcessed += data.length;
  totalChanged += updates.length;

  // Write updates unless dry-run or sample mode
  if (!isDryRun && sampleSize === 0 && updates.length > 0) {
    for (const upd of updates) {
      const { error: patchErr } = await supabase
        .from('products')
        .update({ category: upd.category })
        .eq('id', upd.id);

      if (patchErr) {
        console.error(`  ERROR updating ${upd.id}: ${patchErr.message}`);
        totalErrors++;
        totalChanged--;
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  process.stdout.write(`\r  Processed ${totalProcessed} | Changed ${totalChanged} | Unmatched ${totalUnmatched} | ${elapsed}s`);

  from += data.length;
  if (data.length < BATCH_SIZE) break;

  // Stop early for sample mode
  if (sampleSize > 0 && totalProcessed >= sampleSize * 5) break;
}

// ── Summary ───────────────────────────────────────────────────────────────────
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('\n');
console.log('='.repeat(70));
console.log(' RESULTS');
console.log('='.repeat(70));
console.log(` Total processed : ${totalProcessed}`);
console.log(` Categories changed: ${totalChanged}`);
console.log(` No match (kept) : ${totalUnmatched}`);
console.log(` Errors          : ${totalErrors}`);
console.log(` Time            : ${elapsed}s`);
console.log('');

if (Object.keys(changeCounts).length > 0) {
  console.log(' Top category changes:');
  const sorted = Object.entries(changeCounts).sort((a, b) => b[1] - a[1]);
  for (const [transition, count] of sorted.slice(0, 30)) {
    console.log(`   ${String(count).padStart(5)}  ${transition}`);
  }
}

if (unmatchedSamples.length > 0) {
  console.log('');
  console.log(` Sample unmatched products (no rule → kept as-is):`);
  for (const s of unmatchedSamples) {
    console.log(`   [${s.current}] ${s.title}`);
  }
}

if (isDryRun) {
  console.log('');
  console.log(' DRY RUN: no changes were written to the database.');
  console.log(' Remove --dry-run to apply.');
} else if (sampleSize > 0) {
  console.log('');
  console.log(' SAMPLE mode: no changes were written to the database.');
  console.log(' Remove --sample to apply.');
}

console.log('');
