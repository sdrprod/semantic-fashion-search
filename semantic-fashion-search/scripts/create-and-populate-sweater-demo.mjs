import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo trigger phrases
const SWEATER_DEMO_TRIGGER = "luxury women's sweater in cream or beige color appropriate for work";
const BUTTONS_REFINEMENT_TRIGGER = `${SWEATER_DEMO_TRIGGER}||REFINE||buttons front`;

// ─────────────────────────────────────────────────────────────────
// Main sweater demo: curated cream/beige/ivory sweaters for work
// ─────────────────────────────────────────────────────────────────
const curatedSweaters = [
  {
    brand: 'Kathryn McCarron',
    title: 'Marguerite Paper Thin Cashmere Sweater',
    description: 'Revolutionary ultra-lightweight 100% cashmere sweater engineered for year-round wear. Its paper-thin construction delivers warmth in cold weather while remaining breathable and airy. A signature drapy, luxurious feel that elevates any professional outfit. In ivory white.',
    price: 395.00,
    image_url: 'https://kathrynmccarron.com/cdn/shop/files/Marguerite-Paper-Thin-Sweater-Ivory_0347.jpg?v=1768969002',
    product_url: 'https://www.nordstrom.com/s/marguerite-paper-thin-cashmere-sweater/8876560?origin=keywordsearch-personalizedsort&breadcrumb=Home%2FAll%20Results&color=250',
    verified_colors: ['ivory', 'white', 'cream'],
    target_gender: 'women'
  },
  {
    brand: 'Vince',
    title: 'Scallop-Trim Wool & Cashmere-Blend Cardigan',
    description: 'Soft, lightweight cardigan in a luxurious wool-cashmere blend with delicate scalloped trim at the collar, cuffs, and hem. Button-front closure with rib-knit accents. 54% wool, 35% cashmere, 11% polyester. 22.5-inch length. A polished layering piece for the office in off white.',
    price: 398.00,
    image_url: 'https://cdn.media.amplience.net/i/vince/V182979865_101OWH_001/Scallop-Trim-Wool--Cashmere-Blend-Cardigan-101OWH/?w=800&h=1100&fmt=auto&qlt=default&bg=rgb(241%2C241%2C241)',
    product_url: 'https://www.vince.com/product/scallop-trim-wool-and-cashmere-blend-cardigan-V182979865.html?dwvar_V182979865_color=101OWH',
    verified_colors: ['ivory', 'off white', 'cream'],
    target_gender: 'women'
  },
  {
    brand: 'Vince',
    title: 'Plush Cashmere Crew Neck Sweater',
    description: 'A timeless wardrobe staple knit from signature plush cashmere in two-ply yarn, boiled for added warmth and a lofty finish. The classic crew neck silhouette transitions seamlessly from desk to dinner. In off white.',
    price: 468.00,
    image_url: 'https://cdn.media.amplience.net/i/vince/V162379817_101OWH_001/Plush-Cashmere-Crew-Neck-Sweater-101OWH/?w=800&h=1100&fmt=auto&qlt=default&bg=rgb(241%2C241%2C241)',
    product_url: 'https://www.vince.com/product/plush-cashmere-crew-neck-sweater-V162379817.html?dwvar_V162379817_color=101OWH',
    verified_colors: ['ivory', 'off white', 'cream'],
    target_gender: 'women'
  },
  {
    brand: "C by Bloomingdale's",
    title: "Cashmere Crewneck Cardigan Sweater",
    description: "Luxurious 100% cashmere crewneck cardigan in a classic, versatile style. Button-front closure with refined rib-knit trim at the neck, cuffs, and hem. An elevated wardrobe essential for professional settings in ivory/cream.",
    price: 175.00,
    image_url: 'https://images.bloomingdalesassets.com/is/image/BLM/products/4/optimized/14049374_fpx.tif?op_sharpen=1&wid=1500&fit=fit%2C1&fmt=webp',
    product_url: 'https://www.bloomingdales.com/shop/product/c-by-bloomingdales-cashmere-crewneck-cardigan-sweater-exclusive?ID=5561062&CategoryID=12374#COLOR_NORMAL/Ivory/Cream',
    verified_colors: ['ivory', 'cream'],
    target_gender: 'women'
  },
  {
    brand: 'Club Monaco',
    title: 'Cashmere Crewneck Sweater',
    description: 'An elevated take on the classic crewneck, crafted from 100% cashmere with a relaxed, easy-fitting silhouette. Features a tapered hem and rib-knit details at the crew, cuffs, and hem. Approximately 24 inches in length. Effortlessly sophisticated for the office in natural beige.',
    price: 298.00,
    image_url: 'https://www.clubmonaco.com/cdn/shop/files/295102294-109_0.jpg?v=1738005409',
    product_url: 'https://www.clubmonaco.com/products/cashmere-crewneck-sweater-295102294-109',
    verified_colors: ['beige', 'natural', 'tan'],
    target_gender: 'women'
  },
  {
    brand: 'Brooks Brothers',
    title: 'Cashmere Turtleneck',
    description: 'Knit from premium Italian-spun cashmere sourced from Cariaggi Lanificio with natural moisture-wicking and breathable comfort. Classic rib knit trim at neck, hem, and cuffs. 24-inch length. A polished, elevated workwear staple in cream.',
    price: 498.00,
    image_url: 'https://brooksbrothers.bynder.com/match/WebName/WY01041_CREAM/CASHMERE_TURTLENECK_CREAM?preset=lg',
    product_url: 'https://www.brooksbrothers.com/cashmere-turtleneck/WY01041_____CREM_XSML_____.html',
    verified_colors: ['cream', 'ivory', 'white'],
    target_gender: 'women'
  },
  {
    brand: 'French Connection',
    title: 'Mozart Heartleaf Pointelle Cotton Cardigan',
    description: 'Light, feminine short-sleeve cardigan with all-over pointelle knit for a delicate, textured look. Cotton blend fabric for lightweight all-day comfort. Crew neck with contrast buttons and ribbed neckline and hem. A polished, versatile office staple in cream.',
    price: 118.00,
    image_url: 'https://n.nordstrommedia.com/it/bd60cdb7-27bf-4e31-b838-8e698ba3f402.jpeg?crop=pad&w=1950&h=2990',
    product_url: 'https://www.nordstrom.com/s/mozart-heartleaf-pointelle-cotton-cardigan/8856475?origin=category-personalizedsort&breadcrumb=Home%2FWomen%2FClothing%2FSweaters&color=120',
    verified_colors: ['cream', 'ivory', 'off white'],
    target_gender: 'women'
  }
];

// ─────────────────────────────────────────────────────────────────
// Refinement demo: button-front cardigans in cream/beige/ivory
// Triggered when user refines the main sweater demo with a query
// about buttons / button-front options
// ─────────────────────────────────────────────────────────────────
const buttonFrontCardigans = [
  {
    brand: 'Vince',
    title: 'Scallop-Trim Wool & Cashmere-Blend Cardigan',
    description: 'Luxurious wool-cashmere blend cardigan with a chic scalloped trim at collar, cuffs, and hem. Classic button-front closure with rib-knit accents — elegant layering for professional settings. In off white.',
    price: 398.00,
    image_url: 'https://cdn.media.amplience.net/i/vince/V182979865_101OWH_001/Scallop-Trim-Wool--Cashmere-Blend-Cardigan-101OWH/?w=800&h=1100&fmt=auto&qlt=default&bg=rgb(241%2C241%2C241)',
    product_url: 'https://www.vince.com/product/scallop-trim-wool-and-cashmere-blend-cardigan-V182979865.html?dwvar_V182979865_color=101OWH',
    verified_colors: ['ivory', 'off white', 'cream'],
    target_gender: 'women'
  },
  {
    brand: "C by Bloomingdale's",
    title: "Cashmere Crewneck Cardigan Sweater",
    description: "Classic 100% cashmere button-front cardigan with refined rib-knit trim. Elevated and versatile for any professional setting. Ivory/cream.",
    price: 175.00,
    image_url: 'https://images.bloomingdalesassets.com/is/image/BLM/products/4/optimized/14049374_fpx.tif?op_sharpen=1&wid=1500&fit=fit%2C1&fmt=webp',
    product_url: 'https://www.bloomingdales.com/shop/product/c-by-bloomingdales-cashmere-crewneck-cardigan-sweater-exclusive?ID=5561062&CategoryID=12374#COLOR_NORMAL/Ivory/Cream',
    verified_colors: ['ivory', 'cream'],
    target_gender: 'women'
  },
  {
    brand: 'Aritzia',
    title: 'Bare Cashmere Exemplar Cardigan',
    description: 'Lightweight, all-season 100% cashmere crewneck cardigan coveted for its signature softness and warmth. Classic button-front closure with a tailored, elegant silhouette perfect for layering at the office.',
    price: 178.00,
    image_url: 'https://assets.aritzia.com/image/upload/c_crop,ar_1920:2623,g_south/q_auto,f_auto,dpr_auto,w_1500/s26_a03_121635_4425_on_b',
    product_url: 'https://www.aritzia.com/us/en/product/bare-cashmere-exemplar-cardigan/121635.html?color=11420',
    verified_colors: ['cream', 'ivory', 'off white'],
    target_gender: 'women'
  },
  {
    brand: 'Aritzia',
    title: 'Bare Cashmere Laureate Cardigan',
    description: 'Elegant V-neck cashmere cardigan with a refined button-front closure. Crafted from lightweight all-season cashmere with a long, draped silhouette that pairs effortlessly with workwear trousers or skirts.',
    price: 178.00,
    image_url: 'https://assets.aritzia.com/image/upload/c_crop,ar_1920:2623,g_south/q_auto,f_auto,dpr_auto,w_1500/s26_a03_121957_36216_on_b',
    product_url: 'https://www.aritzia.com/us/en/product/bare-cashmere-laureate-cardigan/121957.html?color=19631',
    verified_colors: ['cream', 'ivory', 'beige'],
    target_gender: 'women'
  },
  {
    brand: 'French Connection',
    title: 'Mozart Heartleaf Pointelle Cotton Cardigan',
    description: 'Delicate all-over pointelle knit cardigan with a classic button-front closure. Cotton blend for lightweight, breathable all-day comfort at work. Cream.',
    price: 118.00,
    image_url: 'https://n.nordstrommedia.com/it/bd60cdb7-27bf-4e31-b838-8e698ba3f402.jpeg?crop=pad&w=1950&h=2990',
    product_url: 'https://www.nordstrom.com/s/mozart-heartleaf-pointelle-cotton-cardigan/8856475?origin=category-personalizedsort&breadcrumb=Home%2FWomen%2FClothing%2FSweaters&color=120',
    verified_colors: ['cream', 'ivory', 'off white'],
    target_gender: 'women'
  },
  {
    brand: 'Quince',
    title: "Women's Fine Gauge Cardigan",
    description: 'Lightweight fine-gauge cardigan with a classic button-front closure. Crafted from a soft, breathable knit in heather bone — a versatile neutral perfect for layering at work. An accessible luxury for everyday wear.',
    price: 60.00,
    image_url: 'https://images.quince.com/692hLBXmVc0rYkgUnuyZKR/a29e588c14a1c525214ec793f5475b8b/Back_To_Style_Editorial_02-411_EDITED.jpg?w=1600&q=50&h=2000&fm=webp&reqOrigin=website-ssr',
    product_url: 'https://www.quince.com/women/women-s-fine-gauge-cardigan?color=heather-bone&productPosition=1&searchQuery=cardigan&tracker=searchPage__search_section__search_results',
    verified_colors: ['bone', 'cream', 'ivory', 'off white'],
    target_gender: 'women'
  },
  {
    brand: 'Brooks Brothers',
    title: 'Wool-Cashmere Blend Cropped Cardigan',
    description: 'Impeccably crafted cropped V-neck cardigan in a premium wool-cashmere blend. Mother-of-pearl buttons for a luxurious finish. An ideal layer over collared shirts or camisoles at 20-inch length. In off-white.',
    price: 129.99,
    image_url: 'https://brooksbrothers.bynder.com/match/WebName/WY01198_OFF-WHITE/NULL_OFF_WHITE?preset=lg',
    product_url: 'https://www.brooksbrothers.com/wool-cashmere-blend-cropped-cardigan/WY01198_____WHIT_LG_______.html',
    verified_colors: ['off white', 'ivory', 'cream', 'white'],
    target_gender: 'women'
  },
  {
    brand: "Joe's Jeans",
    title: 'The Cable Dani Cashmere Cardigan',
    description: 'A wardrobe essential designed by Creative Director Dani Michelle. Premium 100% cashmere in a fine-gauge cable knit with a slightly shrunken fit, front button closure, and ribbed cuffs, hem, and neckline. In warm neutral oatmeal.',
    price: 238.00,
    image_url: 'https://www.joesjeans.com/cdn/shop/files/3c554423-1c4e-4c43-875a-ce30bce50b50_1024x.jpg?v=1751268617',
    product_url: 'https://www.neimanmarcus.com/p/joes-jeans-the-cable-dani-cashmere-cardigan-prod286660287?childItemId=NMT902J_&colorKey=Neutral&msid=5494959&navpath=cat000000_cat000001_cat58290731_cat41160752_cat62130793&page=0&position=4',
    verified_colors: ['oatmeal', 'beige', 'cream', 'tan'],
    target_gender: 'women'
  },
  {
    brand: 'Veronica Beard',
    title: 'Lira Pointelle Cardigan',
    description: 'Adaptable cardigan crafted from a premium stretch knit with an elegant all-over pointelle pattern. Slim fit with long sleeves, classic crew neckline, and button-front closure. Works as a standalone top or refined layering piece for tailored workwear. In ecru.',
    price: 186.00,
    image_url: 'https://veronicabeard.com/cdn/shop/files/cloudinary__veronicabeard__image__upload__J2511JY199T0616_ECRU_01__cld.jpg?v=1760734704',
    product_url: 'https://veronicabeard.com/products/lira-pointelle-cardigan-ecru',
    verified_colors: ['ecru', 'ivory', 'cream', 'off white'],
    target_gender: 'women'
  }
];

// ─────────────────────────────────────────────────────────────────
// Populate main sweater demo
// ─────────────────────────────────────────────────────────────────
async function populateMainSweaterDemo() {
  console.log('\n━━━ MAIN SWEATER DEMO ━━━');
  console.log(`Trigger: "${SWEATER_DEMO_TRIGGER}"\n`);

  // Fetch cream/beige/ivory sweaters from products table for filler
  console.log('Fetching cream/beige/ivory sweaters from database for filler products...');
  const { data: fillerCandidates, error: fillerError } = await supabase
    .from('products')
    .select('id, brand, title, description, price, image_url, product_url, verified_colors')
    .gt('price', 50)
    .order('price', { ascending: false })
    .limit(80);

  if (fillerError) {
    console.error('Error fetching filler sweaters:', fillerError);
    process.exit(1);
  }

  const curatedUrls = curatedSweaters.map(p => p.product_url);
  const creamColors = ['cream', 'ivory', 'beige', 'natural', 'off white', 'off-white', 'ecru', 'oatmeal', 'bone', 'eggshell'];

  const fillerSweaters = (fillerCandidates || [])
    .filter(p => {
      const isSweaterLike = (
        p.title?.toLowerCase().includes('sweater') ||
        p.title?.toLowerCase().includes('cardigan') ||
        p.title?.toLowerCase().includes('pullover') ||
        p.title?.toLowerCase().includes('cashmere') ||
        p.title?.toLowerCase().includes('knit')
      );
      const isCreamLike = p.verified_colors && Array.isArray(p.verified_colors) &&
        p.verified_colors.some(c => creamColors.includes(String(c).toLowerCase()));
      const notAlreadyAdded = !curatedUrls.includes(p.product_url);
      return isSweaterLike && isCreamLike && notAlreadyAdded;
    })
    .slice(0, 5);

  console.log(`Found ${fillerSweaters.length} filler sweaters from database\n`);

  const allMainProducts = [
    ...curatedSweaters,
    ...fillerSweaters.map(p => ({
      brand: p.brand,
      title: p.title,
      description: p.description || '',
      price: p.price,
      image_url: p.image_url,
      product_url: p.product_url,
      verified_colors: p.verified_colors || ['cream'],
      target_gender: 'women'
    }))
  ];

  // Clear existing
  console.log('Clearing existing main sweater demo products...');
  const { error: deleteError } = await supabase
    .from('demo_products')
    .delete()
    .eq('demo_trigger', SWEATER_DEMO_TRIGGER);

  if (deleteError) {
    console.warn('Warning clearing existing products:', deleteError.message);
  }

  // Insert
  console.log(`Inserting ${allMainProducts.length} main sweater demo products...`);
  const { error: insertError } = await supabase
    .from('demo_products')
    .insert(
      allMainProducts.map(p => ({
        brand: p.brand,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: 'USD',
        image_url: p.image_url,
        product_url: p.product_url,
        verified_colors: p.verified_colors,
        target_gender: p.target_gender,
        demo_trigger: SWEATER_DEMO_TRIGGER
      }))
    );

  if (insertError) {
    console.error('Error inserting main sweater demo products:', insertError);
    process.exit(1);
  }

  console.log(`✅ Inserted ${allMainProducts.length} main sweater demo products`);
  allMainProducts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.brand} - ${p.title} ($${p.price})`);
  });
}

// ─────────────────────────────────────────────────────────────────
// Populate button-front refinement demo
// ─────────────────────────────────────────────────────────────────
async function populateButtonFrontRefinementDemo() {
  console.log('\n━━━ BUTTON-FRONT REFINEMENT DEMO ━━━');
  console.log(`Trigger: "${BUTTONS_REFINEMENT_TRIGGER}"\n`);

  // Fetch cream/beige cardigans from products table for filler
  console.log('Fetching cream/beige cardigans from database for filler products...');
  const { data: fillerCandidates, error: fillerError } = await supabase
    .from('products')
    .select('id, brand, title, description, price, image_url, product_url, verified_colors')
    .gt('price', 40)
    .order('price', { ascending: false })
    .limit(80);

  if (fillerError) {
    console.error('Error fetching filler cardigans:', fillerError);
    process.exit(1);
  }

  const refinementUrls = buttonFrontCardigans.map(p => p.product_url);
  const creamColors = ['cream', 'ivory', 'beige', 'natural', 'off white', 'off-white', 'ecru', 'oatmeal', 'bone', 'eggshell'];

  const fillerCardigans = (fillerCandidates || [])
    .filter(p => {
      const isCardigan = (
        p.title?.toLowerCase().includes('cardigan') ||
        p.title?.toLowerCase().includes('button') ||
        (p.title?.toLowerCase().includes('cashmere') && p.title?.toLowerCase().includes('front'))
      );
      const isCreamLike = p.verified_colors && Array.isArray(p.verified_colors) &&
        p.verified_colors.some(c => creamColors.includes(String(c).toLowerCase()));
      const notAlreadyAdded = !refinementUrls.includes(p.product_url);
      return isCardigan && isCreamLike && notAlreadyAdded;
    })
    .slice(0, 3);

  console.log(`Found ${fillerCardigans.length} filler cardigans from database\n`);

  const allRefinementProducts = [
    ...buttonFrontCardigans,
    ...fillerCardigans.map(p => ({
      brand: p.brand,
      title: p.title,
      description: p.description || '',
      price: p.price,
      image_url: p.image_url,
      product_url: p.product_url,
      verified_colors: p.verified_colors || ['cream'],
      target_gender: 'women'
    }))
  ];

  // Clear existing
  console.log('Clearing existing button-front refinement demo products...');
  const { error: deleteError } = await supabase
    .from('demo_products')
    .delete()
    .eq('demo_trigger', BUTTONS_REFINEMENT_TRIGGER);

  if (deleteError) {
    console.warn('Warning clearing existing products:', deleteError.message);
  }

  // Insert
  console.log(`Inserting ${allRefinementProducts.length} button-front refinement demo products...`);
  const { error: insertError } = await supabase
    .from('demo_products')
    .insert(
      allRefinementProducts.map(p => ({
        brand: p.brand,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: 'USD',
        image_url: p.image_url,
        product_url: p.product_url,
        verified_colors: p.verified_colors,
        target_gender: p.target_gender,
        demo_trigger: BUTTONS_REFINEMENT_TRIGGER
      }))
    );

  if (insertError) {
    console.error('Error inserting refinement demo products:', insertError);
    process.exit(1);
  }

  console.log(`✅ Inserted ${allRefinementProducts.length} button-front refinement demo products`);
  allRefinementProducts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.brand} - ${p.title} ($${p.price})`);
  });
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('Setting up sweater demo products...');

  await populateMainSweaterDemo();
  await populateButtonFrontRefinementDemo();

  console.log('\n✅ Sweater demo setup complete!');
  console.log('\nHow to use:');
  console.log(`  Main search:   "${SWEATER_DEMO_TRIGGER}"`);
  console.log(`  Refinement:    "Please show me more options that have buttons in the front"`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
