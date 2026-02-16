import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAmazonGowns() {
  console.log('Searching for black formal gowns over $200 from Amazon...\n');

  const { data, error } = await supabase
    .from('products')
    .select('id, brand, title, description, price, image_url, product_url, verified_colors')
    .gt('price', 200)
    .filter('product_url', 'like', '%amazon%')
    .order('price', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No Amazon products found with price > $200');
    process.exit(1);
  }

  // Filter for black formal products
  const formalGowns = data.filter(p => {
    const isBlack = p.verified_colors && Array.isArray(p.verified_colors) && p.verified_colors.includes('black');
    const isFormal =
      p.title?.toLowerCase().includes('gown') ||
      p.title?.toLowerCase().includes('formal') ||
      p.title?.toLowerCase().includes('evening') ||
      p.description?.toLowerCase().includes('gown') ||
      p.description?.toLowerCase().includes('formal') ||
      p.description?.toLowerCase().includes('evening');

    return isBlack && isFormal;
  });

  if (formalGowns.length === 0) {
    console.log('No formal black gowns found. Showing all high-priced Amazon products:\n');
    data.slice(0, 4).forEach((p, i) => {
      console.log(`${i + 1}. ${p.brand} - ${p.title}`);
      console.log(`   Price: $${p.price}`);
      console.log(`   Colors: ${p.verified_colors || 'unknown'}`);
      console.log(`   URL: ${p.product_url}\n`);
    });
  } else {
    console.log(`Found ${formalGowns.length} formal black gowns. Using first 4:\n`);
    formalGowns.slice(0, 4).forEach((p, i) => {
      console.log(`${i + 1}. ${p.brand} - ${p.title}`);
      console.log(`   Price: $${p.price}`);
      console.log(`   Image: ${p.image_url}`);
      console.log(`   URL: ${p.product_url}`);
      console.log(`   ID: ${p.id}\n`);
    });
  }
}

findAmazonGowns().catch(console.error);
