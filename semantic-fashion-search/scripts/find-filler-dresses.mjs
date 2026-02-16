import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findFillerDresses() {
  console.log('Finding high-priced black dresses to fill demo page...\n');

  const { data, error } = await supabase
    .from('products')
    .select('id, brand, title, description, price, image_url, product_url, verified_colors')
    .gt('price', 100)
    .filter('product_url', 'like', '%amazon%')
    .order('price', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No Amazon products found');
    process.exit(1);
  }

  // Filter for dresses with black color
  const blackDresses = data.filter(p => {
    const isBlack = p.verified_colors && Array.isArray(p.verified_colors) && p.verified_colors.includes('black');
    const isDress =
      p.title?.toLowerCase().includes('dress') ||
      p.description?.toLowerCase().includes('dress');

    return isBlack && isDress;
  });

  console.log(`Found ${blackDresses.length} black dresses:\n`);
  blackDresses.forEach((p, i) => {
    console.log(`${i + 1}. ${p.brand} - ${p.title}`);
    console.log(`   Price: $${p.price}`);
    console.log(`   ID: ${p.id}`);
    console.log();
  });

  // Export as JSON for easy copy-paste
  console.log('\nJSON for insertion (first 5):');
  console.log(JSON.stringify(blackDresses.slice(0, 5).map(p => ({
    id: p.id,
    brand: p.brand,
    title: p.title,
    description: p.description,
    price: p.price,
    image_url: p.image_url,
    product_url: p.product_url,
    verified_colors: p.verified_colors
  })), null, 2));
}

findFillerDresses().catch(console.error);
