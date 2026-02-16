import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo trigger phrase
const DEMO_TRIGGER = 'Modern long black dress with a romantic neckline for a formal evening event';

// The 7 designer products we extracted
const designerProducts = [
  {
    brand: 'Dress the Population',
    title: 'Eliana Dress',
    description: 'Dramatic gown featuring a sultry cowl neckline, deep V back, and curve-skimming mermaid silhouette. Sleek stretch fabric with full lining and structured bodice with side seam boning for support.',
    price: 198.00,
    image_url: 'https://www.dressthepopulation.com/cdn/shop/files/ELIANA_DDRN98-K315_BLACK_1.jpg?v=1767199724',
    product_url: 'https://www.dressthepopulation.com/products/ddro65-k315001?variant=42957341458474',
    verified_colors: ['black'],
    target_gender: 'women'
  },
  {
    brand: 'Ieena for Mac Duggal',
    title: 'Black Metallic Faux Wrap Spaghetti Strap Gown',
    description: 'Striking metallic jersey spaghetti strap gown with a faux-wrap bodice, plunging v-neckline, and floor-length skirt with sweeping train. 100% polyester, fully lined with bust pads.',
    price: 169.00,
    image_url: 'https://macduggal.com/cdn/shop/files/26408-Black-AB.jpg?v=1752005186',
    product_url: 'https://macduggal.com/products/26408_black?variant=44277184954547',
    verified_colors: ['black'],
    target_gender: 'women'
  },
  {
    brand: 'Rachel Gilbert',
    title: 'Laira Corset Dress',
    description: 'Sophisticated strapless column dress with internal corset to define shape and delicate fringing embellishment across the bust. Crepe back satin with light stretch through hips.',
    price: 1795.00,
    image_url: 'https://www.rachelgilbert.us/cdn/shop/files/26RRG62345.BLK.jpg?v=1766983629',
    product_url: 'https://www.rachelgilbert.us/collections/dress/products/laira-corset-dress-black',
    verified_colors: ['black'],
    target_gender: 'women'
  },
  {
    brand: 'RetroFête',
    title: 'Olivine Dress',
    description: 'Form-fitting evening dress ideal for black-tie events, featuring modern knotted detail at the bust. Crafted from silky fabric. Made in China.',
    price: 598.00,
    image_url: 'https://retrofete.com/cdn/shop/files/Ecommerce_Crop-25-07-10_Oivine_Dress_Black__1136_ECOMM.jpg?v=1753110150',
    product_url: 'https://retrofete.com/products/olivine-dress-blk',
    verified_colors: ['black'],
    target_gender: 'women'
  },
  {
    brand: 'Shoshanna',
    title: 'Midnight Gala Dress',
    description: 'Beautiful and timeless stretch crepe dress with velvet bow detail at the neck & straps. Floor-length gown with inside bustier for support and unlined skirt. Center back invisible zip closure.',
    price: 625.00,
    image_url: 'https://shoshanna.com/cdn/shop/files/122_SHOT_3385_5f4b2e82-52ba-4b9b-a605-311bd2b10d06.jpg?v=1757434824',
    product_url: 'https://shoshanna.com/products/midnight-gala-dress-1',
    verified_colors: ['black'],
    target_gender: 'women'
  },
  {
    brand: 'Tadashi Shoji',
    title: 'Verrier One-Shoulder Illusion Gown',
    description: 'One-shoulder crepe gown with illusion embroidery forming asymmetric band across bodice. Softly flared A-line silhouette with elegant balance of structure and fluidity. Concealed side zip.',
    price: 458.00,
    image_url: 'https://www.tadashishoji.com/pub/media/catalog/product/cache/a3568de7c62f35b86f3f6597a579f335/c/i/cin25503l_black_nude_front.jpg',
    product_url: 'https://www.tadashishoji.com/verrier-one-shoulder-illusion-gown-bk-nd',
    verified_colors: ['black', 'nude'],
    target_gender: 'women'
  }
];

// The 1 Amazon product we found
const amazonProducts = [
  {
    brand: 'Dress the Population',
    title: 'Dress the Population Courtney Sequin Overlay Dress',
    description: 'Elegant sequin overlay dress perfect for formal events and special occasions.',
    price: 298.00,
    image_url: 'https://m.media-amazon.com/images/I/718ZAdcbhOL._AC_UL320_.jpg',
    product_url: 'https://www.amazon.com/Dress-Population-Courtney-Sleeveless-Blacknude/dp/B07WLSCGYH/',
    verified_colors: ['black', 'beige'],
    target_gender: 'women'
  }
];

async function createAndPopulateDemo() {
  try {
    console.log('Setting up demo products...\n');

    // First, get highest-priced black dresses from our products table to fill the page
    console.log('Fetching high-priced black dresses from database for filler products...');
    const { data: fillerDresses, error: fillerError } = await supabase
      .from('products')
      .select('id, brand, title, description, price, image_url, product_url, verified_colors')
      .gt('price', 100)
      .order('price', { ascending: false })
      .limit(30);

    if (fillerError) {
      console.error('Error fetching filler dresses:', fillerError);
      process.exit(1);
    }

    // Filter for black dresses and exclude ones we've already added
    const addedUrls = [
      ...designerProducts.map(p => p.product_url),
      ...amazonProducts.map(p => p.product_url)
    ];

    const blackDresses = fillerDresses
      .filter(p => {
        const isBlack = p.verified_colors && Array.isArray(p.verified_colors) && p.verified_colors.includes('black');
        const isDress = p.title?.toLowerCase().includes('dress') || p.title?.toLowerCase().includes('gown');
        const notAlreadyAdded = !addedUrls.includes(p.product_url);
        return isBlack && isDress && notAlreadyAdded;
      })
      .slice(0, 5);

    console.log(`Found ${blackDresses.length} additional filler dresses\n`);

    // Combine all products
    const allProducts = [
      ...designerProducts,
      ...amazonProducts,
      ...blackDresses.map(p => ({
        brand: p.brand,
        title: p.title,
        description: p.description || '',
        price: p.price,
        image_url: p.image_url,
        product_url: p.product_url,
        verified_colors: p.verified_colors || ['black'],
        target_gender: 'women'
      }))
    ];

    console.log(`Total products for demo: ${allProducts.length}\n`);

    // Delete existing demo products with this trigger
    console.log('Clearing existing demo products...');
    const { error: deleteError } = await supabase
      .from('demo_products')
      .delete()
      .eq('demo_trigger', DEMO_TRIGGER);

    if (deleteError) {
      console.error('Error deleting existing demo products:', deleteError);
      // Continue anyway - table might not exist yet
    }

    // Insert all products
    console.log(`Inserting ${allProducts.length} demo products...`);
    const { data, error } = await supabase
      .from('demo_products')
      .insert(
        allProducts.map(p => ({
          brand: p.brand,
          title: p.title,
          description: p.description,
          price: p.price,
          currency: 'USD',
          image_url: p.image_url,
          product_url: p.product_url,
          verified_colors: p.verified_colors,
          target_gender: p.target_gender,
          demo_trigger: DEMO_TRIGGER
        }))
      );

    if (error) {
      console.error('Error inserting demo products:', error);
      console.log('\nNote: If the demo_products table does not exist, you need to run the SQL migration first.');
      console.log('Run this in Supabase SQL Editor:');
      console.log('scripts/create-demo-products.sql');
      process.exit(1);
    }

    console.log(`\n✅ Successfully inserted ${allProducts.length} demo products!`);
    console.log(`\nDemo trigger phrase: "${DEMO_TRIGGER}"`);
    console.log('\nProducts:');
    allProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.brand} - ${p.title} ($${p.price})`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAndPopulateDemo().catch(console.error);
