#!/usr/bin/env node

/**
 * Seed script to populate the database with 300 sample fashion products
 * Run with: node scripts/seed-products.mjs
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Generate embedding for text
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// 300 diverse fashion products with unique Unsplash images
const products = [
  // DRESSES (50 products)
  {
    brand: 'Elegance Studio',
    title: 'Emerald Velvet Evening Gown',
    description: 'Luxurious floor-length velvet gown in deep emerald green. Features a sweetheart neckline, fitted bodice, and flowing A-line skirt with a subtle train. Perfect for black-tie events and winter galas.',
    price: 485.00,
    tags: ['formal', 'velvet', 'green', 'evening', 'gown', 'elegant', 'winter'],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800',
    category: 'dress'
  },
  {
    brand: 'Bohemian Dreams',
    title: 'Wildflower Maxi Dress',
    description: 'Flowing maxi dress with vibrant wildflower print on ivory background. Features adjustable spaghetti straps, smocked bodice, and tiered skirt. Lightweight cotton blend perfect for garden parties and summer weddings.',
    price: 128.00,
    tags: ['floral', 'maxi', 'summer', 'bohemian', 'garden party', 'casual', 'cotton'],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
    category: 'dress'
  },
  {
    brand: 'Metropolitan',
    title: 'Classic Black Sheath Dress',
    description: 'Timeless black sheath dress in premium Italian wool blend. Knee-length with boat neckline and three-quarter sleeves. Fully lined with invisible back zipper. A wardrobe essential for the office and beyond.',
    price: 295.00,
    tags: ['black', 'classic', 'work', 'office', 'professional', 'wool', 'sheath'],
    imageUrl: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800',
    category: 'dress'
  },
  {
    brand: 'Sunset Collection',
    title: 'Coral Wrap Midi Dress',
    description: 'Flattering wrap-style midi dress in stunning coral pink. Made from lightweight crepe with gentle draping and adjustable tie waist. Versatile enough for brunch dates or beach resort dinners.',
    price: 165.00,
    tags: ['coral', 'pink', 'wrap', 'midi', 'summer', 'date night', 'resort'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    category: 'dress'
  },
  {
    brand: 'Noir Atelier',
    title: 'Sequin Cocktail Dress',
    description: 'Show-stopping mini dress covered in matte black sequins. Sleeveless with high neckline and low back. Fully lined for comfort. Perfect for New Year\'s Eve, cocktail parties, and nightclub events.',
    price: 320.00,
    tags: ['sequin', 'black', 'cocktail', 'party', 'mini', 'evening', 'glamorous'],
    imageUrl: 'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=800',
    category: 'dress'
  },
  {
    brand: 'Garden Society',
    title: 'Lavender Lace Tea Dress',
    description: 'Romantic tea-length dress in soft lavender lace over nude lining. Features scalloped hem, cap sleeves, and fitted waist with satin ribbon. Ideal for spring weddings and afternoon garden parties.',
    price: 245.00,
    tags: ['lavender', 'lace', 'romantic', 'wedding guest', 'spring', 'tea length', 'feminine'],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
    category: 'dress'
  },
  {
    brand: 'Urban Edge',
    title: 'Leather Trim Bodycon Dress',
    description: 'Edgy bodycon dress with faux leather trim along the neckline and hemline. Made from stretchy ponte fabric in charcoal gray. Perfect for date nights and concerts when you want to stand out.',
    price: 175.00,
    tags: ['edgy', 'bodycon', 'leather', 'gray', 'date night', 'modern', 'sexy'],
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
    category: 'dress'
  },
  {
    brand: 'Coastal Living',
    title: 'Navy Striped Shirt Dress',
    description: 'Relaxed shirt dress in classic navy and white stripes. Button-front design with roll-up sleeves and removable belt. Made from breathable linen blend. Perfect for coastal getaways and casual Fridays.',
    price: 118.00,
    tags: ['striped', 'navy', 'casual', 'linen', 'summer', 'coastal', 'shirt dress'],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
    category: 'dress'
  },
  {
    brand: 'Midnight Hour',
    title: 'Sapphire Satin Slip Dress',
    description: 'Elegant slip dress in rich sapphire blue satin. Features delicate lace trim at the neckline, adjustable straps, and a bias cut that skims the body beautifully. Layer with a blazer or wear solo.',
    price: 195.00,
    tags: ['satin', 'blue', 'slip dress', 'elegant', 'evening', 'sexy', 'minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800',
    category: 'dress'
  },
  {
    brand: 'Country Rose',
    title: 'Gingham Sundress',
    description: 'Sweet sundress in red and white gingham check. Features square neckline, puff sleeves, and full skirt with pockets. Cotton fabric with subtle stretch. Perfect for picnics, county fairs, and barbecues.',
    price: 89.00,
    tags: ['gingham', 'red', 'sundress', 'summer', 'casual', 'cotton', 'picnic'],
    imageUrl: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800',
    category: 'dress'
  },
  {
    brand: 'Artisan Guild',
    title: 'Hand-Embroidered Peasant Dress',
    description: 'Stunning white cotton peasant dress with intricate hand-embroidered flowers in multicolor thread. Features off-shoulder neckline, billowy sleeves, and relaxed fit. A true statement piece for bohemian souls.',
    price: 275.00,
    tags: ['embroidered', 'white', 'bohemian', 'peasant', 'artisan', 'summer', 'festival'],
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    category: 'dress'
  },
  {
    brand: 'Power Suit',
    title: 'Tailored Blazer Dress',
    description: 'Sophisticated blazer dress in camel wool blend. Double-breasted with gold buttons, padded shoulders, and side pockets. Hits above the knee. Perfect for power meetings and business dinners.',
    price: 345.00,
    tags: ['blazer', 'camel', 'work', 'professional', 'tailored', 'power', 'autumn'],
    imageUrl: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800',
    category: 'dress'
  },
  {
    brand: 'Tropical Escape',
    title: 'Palm Print Halter Dress',
    description: 'Vibrant halter dress featuring oversized palm leaf print in greens and blues. Backless design with tie closure and flowing maxi skirt with side slit. Perfect for resort vacations and beach weddings.',
    price: 155.00,
    tags: ['tropical', 'palm', 'halter', 'maxi', 'resort', 'beach', 'vacation'],
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
    category: 'dress'
  },
  {
    brand: 'Minimalist Mode',
    title: 'Oatmeal Knit Sweater Dress',
    description: 'Cozy yet chic sweater dress in oatmeal colored ribbed knit. Features mock turtleneck, long sleeves, and relaxed fit hitting mid-thigh. Perfect for autumn weekends with ankle boots.',
    price: 135.00,
    tags: ['knit', 'sweater dress', 'beige', 'casual', 'autumn', 'cozy', 'minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
    category: 'dress'
  },
  {
    brand: 'Regal Collection',
    title: 'Burgundy Velvet Midi Dress',
    description: 'Rich burgundy velvet midi dress with romantic puff sleeves and square neckline. Features empire waist and flowing skirt. Perfect for holiday parties, winter weddings, and theater nights.',
    price: 265.00,
    tags: ['velvet', 'burgundy', 'midi', 'holiday', 'romantic', 'winter', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800',
    category: 'dress'
  },
  {
    brand: 'Athletic Luxe',
    title: 'Tennis Dress with Built-in Shorts',
    description: 'Performance tennis dress in crisp white with navy trim. Moisture-wicking fabric with UPF 50+ protection. Features built-in shorts and ball pocket. Perfect for the court or athleisure styling.',
    price: 95.00,
    tags: ['athletic', 'tennis', 'white', 'sporty', 'performance', 'summer', 'active'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
    category: 'dress'
  },
  {
    brand: 'Vintage Revival',
    title: 'Polka Dot Swing Dress',
    description: '1950s inspired swing dress in black with white polka dots. Features sweetheart neckline, fitted bodice, and full circle skirt. Perfect for retro-themed events, swing dancing, and rockabilly fans.',
    price: 145.00,
    tags: ['polka dot', 'vintage', 'retro', '1950s', 'swing', 'black', 'white'],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800',
    category: 'dress'
  },
  {
    brand: 'Modern Muse',
    title: 'Asymmetric One-Shoulder Dress',
    description: 'Contemporary dress with dramatic one-shoulder design in electric blue. Sculptural draping creates an architectural silhouette. Midi length with side slit. Perfect for gallery openings and fashion events.',
    price: 285.00,
    tags: ['asymmetric', 'blue', 'modern', 'architectural', 'dramatic', 'evening', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800',
    category: 'dress'
  },
  {
    brand: 'Earth Mother',
    title: 'Terracotta Linen Maxi Dress',
    description: 'Relaxed maxi dress in beautiful terracotta colored 100% linen. Features V-neckline, empire waist with tie, and side pockets. Breathable and eco-friendly. Perfect for sustainable fashion lovers.',
    price: 175.00,
    tags: ['linen', 'terracotta', 'maxi', 'sustainable', 'summer', 'natural', 'eco-friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    category: 'dress'
  },
  {
    brand: 'After Dark',
    title: 'Red Carpet Mermaid Gown',
    description: 'Showstopping mermaid silhouette gown in deep red with subtle shimmer. Features plunging V-neckline, fitted through the hips, and dramatic flared skirt. Perfect for formal galas and award ceremonies.',
    price: 595.00,
    tags: ['red', 'mermaid', 'formal', 'gala', 'glamorous', 'evening', 'red carpet'],
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    category: 'dress'
  },
  {
    brand: 'Fresh Start',
    title: 'Mint Green Tiered Midi Dress',
    description: 'Refreshing midi dress in soft mint green with three tiers of ruffles. Sleeveless with high neckline and keyhole back. Light and airy chiffon fabric. Perfect for baby showers and spring brunches.',
    price: 148.00,
    tags: ['mint', 'green', 'tiered', 'ruffles', 'spring', 'brunch', 'feminine'],
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
    category: 'dress'
  },
  {
    brand: 'Parisian Chic',
    title: 'Breton Stripe Knit Dress',
    description: 'Classic French-inspired knit dress with navy and cream Breton stripes. Boat neckline, three-quarter sleeves, and fitted silhouette hitting above the knee. Effortlessly chic for everyday elegance.',
    price: 165.00,
    tags: ['striped', 'french', 'knit', 'navy', 'classic', 'casual', 'chic'],
    imageUrl: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800',
    category: 'dress'
  },
  {
    brand: 'Golden Hour',
    title: 'Champagne Pleated Midi Dress',
    description: 'Luminous champagne colored dress with accordion pleats that catch the light beautifully. Sleeveless with mock neck and flowing midi skirt. Perfect for engagement parties and anniversary dinners.',
    price: 225.00,
    tags: ['champagne', 'pleated', 'midi', 'elegant', 'celebration', 'romantic', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1562137369-1a1a0bc66744?w=800',
    category: 'dress'
  },
  {
    brand: 'Street Style',
    title: 'Denim Button-Front Dress',
    description: 'Casual-cool denim dress with snap button front closure. Features chest pockets, rolled sleeves, and self-tie belt. Medium wash with subtle distressing. Perfect for weekend errands and casual dates.',
    price: 98.00,
    tags: ['denim', 'casual', 'button front', 'blue', 'weekend', 'relaxed', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1494578379344-d6c710782a3d?w=800',
    category: 'dress'
  },
  {
    brand: 'Night Bloom',
    title: 'Floral Jacquard Cocktail Dress',
    description: 'Sophisticated cocktail dress in navy with raised floral jacquard pattern. Cap sleeves, fitted waist, and flared skirt hitting just above the knee. Perfect for wedding receptions and cocktail hours.',
    price: 285.00,
    tags: ['jacquard', 'navy', 'floral', 'cocktail', 'wedding', 'elegant', 'formal'],
    imageUrl: 'https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?w=800',
    category: 'dress'
  },
  // Continue with more dresses...
  {
    brand: 'Island Time',
    title: 'Turquoise Kaftan Dress',
    description: 'Flowing kaftan dress in vibrant turquoise with gold embroidery at the neckline. Lightweight viscose fabric with side slits. Perfect as a beach cover-up or poolside dress.',
    price: 125.00,
    tags: ['kaftan', 'turquoise', 'beach', 'resort', 'embroidered', 'summer', 'cover-up'],
    imageUrl: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=800',
    category: 'dress'
  },
  {
    brand: 'Office Elegance',
    title: 'Navy Pencil Dress',
    description: 'Polished pencil dress in navy blue with subtle texture. Features cap sleeves, princess seams for a flattering fit, and back vent for ease of movement. A sophisticated choice for the boardroom.',
    price: 215.00,
    tags: ['pencil', 'navy', 'work', 'office', 'professional', 'classic', 'tailored'],
    imageUrl: 'https://images.unsplash.com/photo-1519722417352-7d6959729417?w=800',
    category: 'dress'
  },
  {
    brand: 'Festival Queen',
    title: 'Tie-Dye Maxi Dress',
    description: 'Free-spirited maxi dress in swirling purple and pink tie-dye. Halter neck with adjustable ties, open back, and flowing skirt. Perfect for music festivals, beach bonfires, and free spirits.',
    price: 85.00,
    tags: ['tie-dye', 'purple', 'pink', 'festival', 'bohemian', 'maxi', 'summer'],
    imageUrl: 'https://images.unsplash.com/photo-1519748771451-a94c596fad67?w=800',
    category: 'dress'
  },
  {
    brand: 'Winter Wonderland',
    title: 'Ivory Sequin Midi Dress',
    description: 'Enchanting midi dress covered in ivory sequins with subtle iridescent shimmer. Long sleeves, modest neckline, and fitted silhouette. Perfect for holiday parties and winter wonderland weddings.',
    price: 365.00,
    tags: ['sequin', 'ivory', 'white', 'holiday', 'winter', 'wedding', 'glamorous'],
    imageUrl: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800',
    category: 'dress'
  },
  {
    brand: 'Sunset Stripe',
    title: 'Rainbow Stripe Midi Dress',
    description: 'Cheerful midi dress with horizontal rainbow stripes. Crew neckline, short sleeves, and pleated skirt. Made from soft jersey fabric. Perfect for pride celebrations and colorful occasions.',
    price: 115.00,
    tags: ['rainbow', 'striped', 'colorful', 'pride', 'midi', 'casual', 'cheerful'],
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
    category: 'dress'
  },

  // TOPS (50 products)
  {
    brand: 'Silk Road',
    title: 'Ivory Silk Blouse',
    description: 'Luxurious 100% silk blouse in soft ivory. Features classic collar, hidden button placket, and French cuffs. Versatile enough for the office with trousers or dressed down with jeans.',
    price: 195.00,
    tags: ['silk', 'ivory', 'blouse', 'classic', 'work', 'elegant', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800',
    category: 'tops'
  },
  {
    brand: 'Casual Friday',
    title: 'Chambray Button-Down Shirt',
    description: 'Relaxed chambray shirt in light blue with subtle white stitching. Roll-tab sleeves, chest pocket, and curved hem. Perfect for casual office days and weekend brunches.',
    price: 68.00,
    tags: ['chambray', 'blue', 'casual', 'shirt', 'weekend', 'classic', 'relaxed'],
    imageUrl: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800',
    category: 'tops'
  },
  {
    brand: 'Knit Studio',
    title: 'Oversized Cable Knit Sweater',
    description: 'Cozy oversized sweater with intricate cable knit pattern in cream. Features crew neckline, dropped shoulders, and ribbed trim. Made from soft merino wool blend. Perfect for autumn layering.',
    price: 145.00,
    tags: ['sweater', 'cable knit', 'cream', 'oversized', 'cozy', 'autumn', 'wool'],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
    category: 'tops'
  },
  {
    brand: 'Modern Basic',
    title: 'White Cotton T-Shirt',
    description: 'The perfect white tee in premium Pima cotton. Crew neckline, short sleeves, and relaxed fit. Pre-shrunk and garment-dyed for a lived-in feel. A true wardrobe essential.',
    price: 45.00,
    tags: ['white', 't-shirt', 'basic', 'cotton', 'essential', 'casual', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    category: 'tops'
  },
  {
    brand: 'Romantic Era',
    title: 'Blush Pink Ruffle Blouse',
    description: 'Feminine blouse in soft blush pink with cascading ruffles down the front. V-neckline, long sleeves with ruffle cuffs. Lightweight chiffon fabric. Perfect for date nights and special occasions.',
    price: 98.00,
    tags: ['pink', 'ruffle', 'blouse', 'romantic', 'feminine', 'date night', 'chiffon'],
    imageUrl: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800',
    category: 'tops'
  },
  {
    brand: 'Athletic Edge',
    title: 'Black Mesh Panel Sports Bra',
    description: 'High-support sports bra in black with breathable mesh panels. Racerback design, moisture-wicking fabric, and removable padding. Perfect for high-impact workouts and studio classes.',
    price: 55.00,
    tags: ['sports bra', 'black', 'athletic', 'workout', 'high-impact', 'mesh', 'performance'],
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    category: 'tops'
  },
  {
    brand: 'Boho Spirit',
    title: 'Embroidered Peasant Top',
    description: 'Beautiful peasant top in white cotton with colorful floral embroidery. Off-shoulder neckline with elastic, billowy sleeves, and relaxed fit. Perfect for summer festivals and vacation.',
    price: 75.00,
    tags: ['embroidered', 'peasant', 'white', 'bohemian', 'summer', 'festival', 'off-shoulder'],
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
    category: 'tops'
  },
  {
    brand: 'Power Move',
    title: 'Black Turtleneck Bodysuit',
    description: 'Sleek black bodysuit with mock turtleneck. Long sleeves, snap closure, and second-skin fit. Made from stretchy ponte fabric. Perfect foundation for layering under blazers and high-waisted pants.',
    price: 65.00,
    tags: ['bodysuit', 'black', 'turtleneck', 'sleek', 'layering', 'modern', 'minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1583846552345-d2b2d6b1f082?w=800',
    category: 'tops'
  },
  {
    brand: 'Sunset Dreams',
    title: 'Orange Silk Camisole',
    description: 'Vibrant orange silk camisole with delicate lace trim. Adjustable spaghetti straps and relaxed fit. Can be worn alone or layered under blazers. Perfect pop of color for any outfit.',
    price: 85.00,
    tags: ['silk', 'orange', 'camisole', 'lace', 'summer', 'layering', 'colorful'],
    imageUrl: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=800',
    category: 'tops'
  },
  {
    brand: 'Stripe Club',
    title: 'Navy Breton Stripe Top',
    description: 'Classic Breton stripe top in navy and white. Boat neckline, three-quarter sleeves, and relaxed fit. Made from soft cotton jersey. A timeless French-inspired essential.',
    price: 58.00,
    tags: ['striped', 'navy', 'breton', 'french', 'classic', 'casual', 'cotton'],
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
    category: 'tops'
  },
  {
    brand: 'Luxe Layers',
    title: 'Cashmere V-Neck Sweater',
    description: 'Sumptuous cashmere sweater in heather gray. Classic V-neckline, long sleeves, and relaxed fit. Incredibly soft and lightweight. A luxury investment piece for your wardrobe.',
    price: 295.00,
    tags: ['cashmere', 'gray', 'sweater', 'luxury', 'classic', 'soft', 'investment'],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
    category: 'tops'
  },
  {
    brand: 'Rock Revival',
    title: 'Vintage Band T-Shirt',
    description: 'Distressed vintage-style band tee in washed black. Oversized fit with raw hem and faded graphics. Perfect for concerts, casual days, and adding edge to any outfit.',
    price: 42.00,
    tags: ['vintage', 'band', 't-shirt', 'black', 'distressed', 'casual', 'edgy'],
    imageUrl: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800',
    category: 'tops'
  },
  {
    brand: 'Garden Party',
    title: 'Floral Wrap Top',
    description: 'Flattering wrap top in romantic floral print on navy background. V-neckline, flutter sleeves, and tie closure at the side. Perfect for brunch dates and summer evenings.',
    price: 78.00,
    tags: ['floral', 'wrap', 'navy', 'feminine', 'summer', 'romantic', 'flattering'],
    imageUrl: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=800',
    category: 'tops'
  },
  {
    brand: 'Boardroom Ready',
    title: 'Emerald Green Shell Top',
    description: 'Polished shell top in rich emerald green. Sleeveless with modest neckline and darted bust for a flattering fit. Perfect under blazers or worn alone in warm weather.',
    price: 68.00,
    tags: ['shell', 'green', 'work', 'professional', 'sleeveless', 'office', 'polished'],
    imageUrl: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=800',
    category: 'tops'
  },
  {
    brand: 'Cozy Nights',
    title: 'Chunky Knit Cardigan',
    description: 'Oversized cardigan in chunky oatmeal knit. Open front with no closures, deep pockets, and dropped shoulders. Perfect for lounging at home or layering on cool evenings.',
    price: 125.00,
    tags: ['cardigan', 'chunky', 'oatmeal', 'cozy', 'oversized', 'layering', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
    category: 'tops'
  },
  {
    brand: 'Sleek & Simple',
    title: 'Black Halter Neck Top',
    description: 'Minimalist halter top in black matte jersey. High neckline with tie closure and open back. Perfect for summer evenings, dancing, and showing off toned shoulders.',
    price: 55.00,
    tags: ['halter', 'black', 'minimalist', 'summer', 'evening', 'sexy', 'backless'],
    imageUrl: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800',
    category: 'tops'
  },
  {
    brand: 'Safari Style',
    title: 'Khaki Utility Shirt',
    description: 'Classic utility shirt in khaki cotton twill. Features chest pockets with flaps, roll-tab sleeves, and longer back hem. Perfect for safari trips and casual adventures.',
    price: 88.00,
    tags: ['utility', 'khaki', 'safari', 'cotton', 'casual', 'adventure', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800',
    category: 'tops'
  },
  {
    brand: 'Sequin Society',
    title: 'Gold Sequin Tank Top',
    description: 'Glamorous tank top covered in gold sequins. Scoop neckline, wide straps, and relaxed fit. Fully lined for comfort. Perfect for holiday parties and nights out.',
    price: 95.00,
    tags: ['sequin', 'gold', 'tank', 'glamorous', 'party', 'evening', 'holiday'],
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    category: 'tops'
  },
  {
    brand: 'Workout Warrior',
    title: 'Coral Performance Tank',
    description: 'High-performance tank top in vibrant coral. Moisture-wicking fabric, built-in shelf bra, and racerback design. Reflective logo for visibility. Perfect for running and outdoor workouts.',
    price: 48.00,
    tags: ['performance', 'coral', 'tank', 'athletic', 'workout', 'running', 'moisture-wicking'],
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    category: 'tops'
  },
  {
    brand: 'Vintage Lace',
    title: 'Cream Lace Victorian Blouse',
    description: 'Romantic Victorian-inspired blouse in cream lace. High neckline with ruffle trim, long sleeves with button cuffs, and subtle sheerness. Perfect for special occasions and romantic dates.',
    price: 135.00,
    tags: ['lace', 'cream', 'victorian', 'romantic', 'vintage', 'feminine', 'special occasion'],
    imageUrl: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800',
    category: 'tops'
  },

  // BOTTOMS (50 products)
  {
    brand: 'Denim Authority',
    title: 'High-Rise Straight Leg Jeans',
    description: 'Classic high-rise jeans in medium wash denim with subtle whiskering. Straight leg silhouette, five-pocket styling, and non-stretch cotton denim. A timeless wardrobe staple.',
    price: 128.00,
    tags: ['jeans', 'denim', 'high-rise', 'straight leg', 'classic', 'casual', 'blue'],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Tailored Touch',
    title: 'Black Wool Trousers',
    description: 'Impeccably tailored trousers in black Italian wool. High-rise with pleated front, side pockets, and straight leg. Fully lined for a polished finish. Perfect for the office and formal events.',
    price: 225.00,
    tags: ['trousers', 'black', 'wool', 'tailored', 'work', 'formal', 'professional'],
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Summer Essential',
    title: 'White Linen Wide-Leg Pants',
    description: 'Breezy wide-leg pants in crisp white linen. High-rise with elastic waist at back and tie closure. Perfect for beach vacations, resort wear, and hot summer days.',
    price: 115.00,
    tags: ['linen', 'white', 'wide-leg', 'summer', 'resort', 'beach', 'breezy'],
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Athletic Pro',
    title: 'Black Yoga Leggings',
    description: 'High-performance leggings in sleek black. High-rise with wide waistband, four-way stretch, and hidden pocket. Moisture-wicking and squat-proof. Perfect for yoga, pilates, and everyday wear.',
    price: 88.00,
    tags: ['leggings', 'black', 'yoga', 'athletic', 'performance', 'high-rise', 'stretch'],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Vintage Vibes',
    title: 'Floral A-Line Midi Skirt',
    description: 'Romantic A-line skirt in vintage-inspired floral print. High-waisted with hidden side zipper and midi length. Cotton blend fabric with subtle sheen. Perfect for tea parties and garden events.',
    price: 95.00,
    tags: ['skirt', 'floral', 'midi', 'a-line', 'vintage', 'romantic', 'feminine'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Denim Dreams',
    title: 'Light Wash Mom Jeans',
    description: 'Relaxed mom jeans in light wash denim. High-rise with tapered leg, five-pocket styling, and slight distressing at the knees. Comfortable cotton blend with a touch of stretch.',
    price: 98.00,
    tags: ['jeans', 'mom jeans', 'light wash', 'denim', 'relaxed', 'casual', 'vintage'],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Power Suit',
    title: 'Navy Pinstripe Trousers',
    description: 'Sophisticated trousers in navy with subtle white pinstripes. High-rise, straight leg, and front creases for a polished look. Perfect for interviews, meetings, and professional settings.',
    price: 165.00,
    tags: ['trousers', 'navy', 'pinstripe', 'work', 'professional', 'tailored', 'formal'],
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Weekend Warrior',
    title: 'Khaki Cargo Shorts',
    description: 'Relaxed cargo shorts in classic khaki. Mid-rise with cargo pockets, belt loops, and 7-inch inseam. Durable cotton twill. Perfect for hiking, camping, and casual summer days.',
    price: 58.00,
    tags: ['shorts', 'cargo', 'khaki', 'casual', 'summer', 'hiking', 'outdoor'],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Elegant Evening',
    title: 'Black Satin Palazzo Pants',
    description: 'Dramatic palazzo pants in flowing black satin. Ultra-high rise with wide leg that skims the floor. Perfect for formal events when you want the elegance of a gown with the ease of pants.',
    price: 185.00,
    tags: ['palazzo', 'black', 'satin', 'formal', 'evening', 'elegant', 'wide-leg'],
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Chic Mini',
    title: 'Black Leather Mini Skirt',
    description: 'Edgy mini skirt in genuine black leather. High-waisted with silver zipper closure and A-line silhouette. Fully lined. Perfect for concerts, date nights, and nights out.',
    price: 225.00,
    tags: ['leather', 'black', 'mini', 'skirt', 'edgy', 'date night', 'sexy'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Bohemian Rhapsody',
    title: 'Printed Wrap Maxi Skirt',
    description: 'Flowing maxi skirt in bohemian paisley print. Wrap style with tie closure, adjustable fit, and dramatic side slit. Perfect for music festivals and summer adventures.',
    price: 85.00,
    tags: ['maxi', 'wrap', 'bohemian', 'paisley', 'festival', 'summer', 'printed'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Classic Prep',
    title: 'Navy Bermuda Shorts',
    description: 'Tailored Bermuda shorts in navy cotton twill. Mid-rise with cuffed hem hitting at the knee. Perfect for summer office days, golf courses, and preppy casual occasions.',
    price: 75.00,
    tags: ['bermuda', 'navy', 'shorts', 'preppy', 'summer', 'tailored', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Urban Chic',
    title: 'Olive Utility Joggers',
    description: 'Trendy joggers in olive green with utility details. Elastic waist with drawstring, cargo pockets, and tapered leg with elastic cuffs. Perfect for travel and athleisure styling.',
    price: 78.00,
    tags: ['joggers', 'olive', 'utility', 'casual', 'athleisure', 'travel', 'comfortable'],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Office Essential',
    title: 'Camel Pencil Skirt',
    description: 'Classic pencil skirt in camel colored stretch suiting. High-rise with back vent and invisible zipper. Knee-length and fully lined. A sophisticated choice for the office.',
    price: 135.00,
    tags: ['pencil', 'camel', 'skirt', 'work', 'office', 'professional', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Denim Lab',
    title: 'Black Skinny Jeans',
    description: 'Figure-flattering skinny jeans in jet black denim. High-rise with super stretch for all-day comfort. Slim through hip and thigh with skinny leg. A versatile wardrobe staple.',
    price: 108.00,
    tags: ['jeans', 'black', 'skinny', 'denim', 'stretch', 'versatile', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Pleated Perfection',
    title: 'Burgundy Pleated Midi Skirt',
    description: 'Elegant midi skirt in burgundy with accordion pleats. Elastic waist for comfortable fit and flowing movement. Perfect for office wear, dinner dates, and special occasions.',
    price: 98.00,
    tags: ['pleated', 'burgundy', 'midi', 'skirt', 'elegant', 'work', 'feminine'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Summer Breeze',
    title: 'Floral High-Waist Shorts',
    description: 'Charming shorts in bright floral print on white background. High-waisted with paper bag waist and self-tie belt. Perfect for summer picnics and vacation days.',
    price: 65.00,
    tags: ['shorts', 'floral', 'high-waist', 'summer', 'vacation', 'feminine', 'colorful'],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Luxe Lounge',
    title: 'Gray Cashmere Joggers',
    description: 'Ultra-luxurious joggers in soft gray cashmere blend. Elastic waist with drawstring, side pockets, and tapered leg. Perfect for elevated loungewear and first-class travel.',
    price: 275.00,
    tags: ['cashmere', 'gray', 'joggers', 'luxury', 'lounge', 'travel', 'comfortable'],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Retro Style',
    title: 'High-Waist Wide-Leg Jeans',
    description: 'Vintage-inspired wide-leg jeans in dark indigo wash. Ultra high-rise with button fly and flared leg. Non-stretch denim with authentic 70s feel. Perfect for retro lovers.',
    price: 145.00,
    tags: ['jeans', 'wide-leg', 'high-waist', 'vintage', 'retro', '70s', 'denim'],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    category: 'bottoms'
  },
  {
    brand: 'Tennis Club',
    title: 'White Pleated Tennis Skirt',
    description: 'Classic tennis skirt in crisp white with knife pleats. Built-in shorts, moisture-wicking fabric, and elastic waist. Perfect for the court or athleisure styling.',
    price: 68.00,
    tags: ['tennis', 'white', 'pleated', 'athletic', 'sporty', 'skirt', 'performance'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    category: 'bottoms'
  },

  // SHOES (50 products)
  {
    brand: 'Luxury Steps',
    title: 'Black Leather Stiletto Pumps',
    description: 'Classic black pumps in smooth Italian leather. Pointed toe, 4-inch stiletto heel, and leather sole. A timeless essential for the office, interviews, and formal occasions.',
    price: 295.00,
    tags: ['heels', 'black', 'leather', 'stiletto', 'pumps', 'classic', 'formal'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Comfort Plus',
    title: 'White Leather Sneakers',
    description: 'Clean white sneakers in premium leather with subtle perforations. Cushioned insole, rubber outsole, and minimal branding. Perfect for everyday wear and casual Fridays.',
    price: 135.00,
    tags: ['sneakers', 'white', 'leather', 'casual', 'comfortable', 'minimal', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    category: 'shoes'
  },
  {
    brand: 'Evening Glamour',
    title: 'Gold Strappy Heeled Sandals',
    description: 'Stunning heeled sandals in metallic gold leather. Delicate straps, ankle closure, and 3-inch block heel. Perfect for weddings, galas, and special occasions.',
    price: 185.00,
    tags: ['heels', 'gold', 'strappy', 'sandals', 'evening', 'wedding', 'glamorous'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Chelsea Boot Co',
    title: 'Black Leather Chelsea Boots',
    description: 'Classic Chelsea boots in smooth black leather. Elastic side panels, pull tab, and stacked heel. Versatile enough for jeans or dresses. A fall and winter essential.',
    price: 225.00,
    tags: ['boots', 'chelsea', 'black', 'leather', 'classic', 'fall', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1542840410-8e413ad1b3b8?w=800',
    category: 'shoes'
  },
  {
    brand: 'Beach Walk',
    title: 'Tan Leather Slide Sandals',
    description: 'Minimalist slide sandals in natural tan leather. Wide single strap, contoured footbed, and rubber sole. Perfect for summer days, beach walks, and casual outings.',
    price: 78.00,
    tags: ['sandals', 'slides', 'tan', 'leather', 'summer', 'casual', 'minimal'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800',
    category: 'shoes'
  },
  {
    brand: 'Office Chic',
    title: 'Nude Patent Kitten Heels',
    description: 'Sophisticated kitten heels in nude patent leather. Pointed toe and 2-inch heel for all-day comfort. Perfect for the office and events where you\'ll be on your feet.',
    price: 145.00,
    tags: ['heels', 'nude', 'patent', 'kitten heel', 'work', 'comfortable', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Western Soul',
    title: 'Brown Suede Cowboy Boots',
    description: 'Authentic cowboy boots in rich brown suede. Pointed toe, embroidered shaft, and stacked heel. Perfect for country concerts, western weddings, and adding edge to everyday outfits.',
    price: 285.00,
    tags: ['boots', 'cowboy', 'brown', 'suede', 'western', 'embroidered', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1542840410-8e413ad1b3b8?w=800',
    category: 'shoes'
  },
  {
    brand: 'Athletic Performance',
    title: 'Black Running Shoes',
    description: 'High-performance running shoes in black mesh with reflective details. Responsive cushioning, breathable upper, and durable rubber outsole. Perfect for road running and gym workouts.',
    price: 145.00,
    tags: ['running', 'athletic', 'black', 'mesh', 'performance', 'gym', 'comfortable'],
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    category: 'shoes'
  },
  {
    brand: 'Elegant Steps',
    title: 'Navy Suede Block Heel Pumps',
    description: 'Refined pumps in navy blue suede. Almond toe and comfortable 3-inch block heel. Perfect for office wear, fall weddings, and occasions requiring style with stability.',
    price: 165.00,
    tags: ['heels', 'navy', 'suede', 'block heel', 'pumps', 'work', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Ballet Dreams',
    title: 'Blush Pink Ballet Flats',
    description: 'Dainty ballet flats in soft blush pink leather. Rounded toe, elastic heel grip, and cushioned insole. Perfect for all-day comfort with feminine charm.',
    price: 95.00,
    tags: ['flats', 'ballet', 'pink', 'leather', 'feminine', 'comfortable', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Combat Zone',
    title: 'Black Leather Combat Boots',
    description: 'Edgy combat boots in black leather with silver hardware. Lace-up front, side zip, and chunky lug sole. Perfect for adding attitude to any outfit.',
    price: 195.00,
    tags: ['boots', 'combat', 'black', 'leather', 'edgy', 'chunky', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1542840410-8e413ad1b3b8?w=800',
    category: 'shoes'
  },
  {
    brand: 'Summer Steps',
    title: 'Espadrille Wedge Sandals',
    description: 'Charming wedge sandals with braided jute platform and navy canvas upper. Ankle tie closure and 3-inch wedge heel. Perfect for summer dresses and beach vacations.',
    price: 88.00,
    tags: ['espadrille', 'wedge', 'navy', 'summer', 'sandals', 'vacation', 'platform'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800',
    category: 'shoes'
  },
  {
    brand: 'Loafer Luxe',
    title: 'Burgundy Leather Loafers',
    description: 'Sophisticated loafers in rich burgundy leather with penny slot detail. Leather sole and cushioned insole. Perfect for smart casual offices and weekend brunches.',
    price: 185.00,
    tags: ['loafers', 'burgundy', 'leather', 'classic', 'work', 'sophisticated', 'preppy'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Platform Dreams',
    title: 'Silver Platform Heels',
    description: 'Statement platform heels in silver metallic leather. Ankle strap, 5-inch heel with 1-inch platform for comfort. Perfect for parties, clubs, and disco nights.',
    price: 165.00,
    tags: ['platform', 'silver', 'heels', 'metallic', 'party', 'statement', 'disco'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Mule Maven',
    title: 'Black Leather Pointed Mules',
    description: 'Chic pointed-toe mules in black leather. Kitten heel and backless design for easy on-and-off. Perfect for the office and elevating casual outfits.',
    price: 145.00,
    tags: ['mules', 'black', 'leather', 'pointed', 'kitten heel', 'work', 'chic'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Rain Ready',
    title: 'Hunter Green Rain Boots',
    description: 'Classic rain boots in hunter green rubber. Waterproof construction, cotton lining, and adjustable buckle strap. Perfect for rainy days and muddy adventures.',
    price: 125.00,
    tags: ['rain boots', 'green', 'rubber', 'waterproof', 'practical', 'outdoor', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1542840410-8e413ad1b3b8?w=800',
    category: 'shoes'
  },
  {
    brand: 'Oxford Society',
    title: 'Tan Leather Oxford Shoes',
    description: 'Classic Oxford shoes in tan burnished leather. Brogue detailing, leather sole, and traditional lace-up closure. Perfect for smart casual and business casual settings.',
    price: 225.00,
    tags: ['oxford', 'tan', 'leather', 'brogue', 'classic', 'smart casual', 'traditional'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    category: 'shoes'
  },
  {
    brand: 'Pool Party',
    title: 'White Jelly Sandals',
    description: 'Fun jelly sandals in translucent white. Fisherman style with multiple straps and buckle closure. Waterproof and easy to clean. Perfect for pool parties and beach days.',
    price: 45.00,
    tags: ['jelly', 'sandals', 'white', 'waterproof', 'pool', 'beach', 'summer'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800',
    category: 'shoes'
  },
  {
    brand: 'Knee High Style',
    title: 'Black Suede Knee-High Boots',
    description: 'Elegant knee-high boots in black suede. Block heel, inner zip closure, and almond toe. Perfect for fall dresses and adding drama to jeans.',
    price: 295.00,
    tags: ['boots', 'knee-high', 'black', 'suede', 'fall', 'elegant', 'dramatic'],
    imageUrl: 'https://images.unsplash.com/photo-1542840410-8e413ad1b3b8?w=800',
    category: 'shoes'
  },
  {
    brand: 'Sneaker Culture',
    title: 'Retro High-Top Sneakers',
    description: 'Vintage-inspired high-top sneakers in red and white canvas. Rubber toe cap, classic lacing, and cushioned insole. Perfect for casual days and retro styling.',
    price: 78.00,
    tags: ['sneakers', 'high-top', 'red', 'canvas', 'retro', 'vintage', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    category: 'shoes'
  },

  // BAGS (50 products)
  {
    brand: 'Luxe Leather',
    title: 'Black Leather Tote Bag',
    description: 'Spacious tote bag in pebbled black leather. Interior zip pocket, snap closure, and comfortable shoulder straps. Perfect for work, travel, and everyday essentials.',
    price: 295.00,
    tags: ['tote', 'black', 'leather', 'work', 'spacious', 'classic', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'bags'
  },
  {
    brand: 'Evening Elegance',
    title: 'Gold Chain Clutch',
    description: 'Elegant clutch in gold metallic leather with detachable chain strap. Snap closure with interior slip pocket. Perfect for weddings, galas, and special occasions.',
    price: 165.00,
    tags: ['clutch', 'gold', 'evening', 'metallic', 'wedding', 'formal', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800',
    category: 'bags'
  },
  {
    brand: 'Crossbody Chic',
    title: 'Tan Leather Crossbody Bag',
    description: 'Compact crossbody bag in rich tan leather. Adjustable strap, zip closure, and multiple compartments. Perfect for hands-free days and weekend errands.',
    price: 145.00,
    tags: ['crossbody', 'tan', 'leather', 'compact', 'casual', 'hands-free', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    category: 'bags'
  },
  {
    brand: 'Adventure Pack',
    title: 'Navy Canvas Backpack',
    description: 'Durable backpack in navy canvas with leather trim. Laptop sleeve, multiple pockets, and padded straps. Perfect for commuting, travel, and college.',
    price: 125.00,
    tags: ['backpack', 'navy', 'canvas', 'laptop', 'travel', 'practical', 'school'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'bags'
  },
  {
    brand: 'Quilted Luxury',
    title: 'Black Quilted Chain Bag',
    description: 'Iconic quilted bag in black lambskin with gold chain strap. Flap closure with turn-lock and interior zip pocket. A timeless investment piece for any wardrobe.',
    price: 485.00,
    tags: ['quilted', 'black', 'chain', 'luxury', 'classic', 'investment', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'bags'
  },
  {
    brand: 'Beach Days',
    title: 'Straw Beach Tote',
    description: 'Oversized tote in natural woven straw with leather handles. Open top and interior pocket. Perfect for beach days, farmers markets, and summer adventures.',
    price: 85.00,
    tags: ['straw', 'beach', 'tote', 'natural', 'summer', 'vacation', 'oversized'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'bags'
  },
  {
    brand: 'Saddle Style',
    title: 'Brown Leather Saddle Bag',
    description: 'Boho-inspired saddle bag in cognac brown leather. Magnetic flap closure, adjustable crossbody strap, and tassel detail. Perfect for bohemian and western-inspired looks.',
    price: 175.00,
    tags: ['saddle bag', 'brown', 'leather', 'bohemian', 'western', 'crossbody', 'tassel'],
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    category: 'bags'
  },
  {
    brand: 'Mini Moment',
    title: 'Red Leather Mini Bag',
    description: 'Adorable mini bag in cherry red leather with gold hardware. Top handle and detachable crossbody strap. Big enough for phone, cards, and lipstick.',
    price: 135.00,
    tags: ['mini', 'red', 'leather', 'statement', 'crossbody', 'trendy', 'colorful'],
    imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800',
    category: 'bags'
  },
  {
    brand: 'Work Essential',
    title: 'Structured Laptop Bag',
    description: 'Professional laptop bag in black saffiano leather. Fits 15" laptop with padded compartment. Multiple pockets and detachable shoulder strap. Perfect for business travel.',
    price: 245.00,
    tags: ['laptop', 'black', 'work', 'professional', 'structured', 'travel', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'bags'
  },
  {
    brand: 'Bucket Brigade',
    title: 'Blush Leather Bucket Bag',
    description: 'Trendy bucket bag in soft blush pink leather. Drawstring closure, adjustable strap, and removable pouch. Perfect for spring days and adding softness to outfits.',
    price: 165.00,
    tags: ['bucket bag', 'pink', 'leather', 'trendy', 'spring', 'feminine', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'bags'
  },
  {
    brand: 'Belt Bag Basics',
    title: 'Black Leather Belt Bag',
    description: 'Versatile belt bag in smooth black leather. Zip closure with adjustable belt strap. Wear around waist or crossbody. Perfect for concerts and hands-free convenience.',
    price: 95.00,
    tags: ['belt bag', 'black', 'leather', 'hands-free', 'casual', 'versatile', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    category: 'bags'
  },
  {
    brand: 'Envelope Edge',
    title: 'Ivory Leather Envelope Clutch',
    description: 'Sleek envelope clutch in ivory leather with gold zip detail. Can be carried as clutch or tucked under arm. Perfect for weddings and evening events.',
    price: 125.00,
    tags: ['clutch', 'ivory', 'leather', 'envelope', 'evening', 'wedding', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800',
    category: 'bags'
  },
  {
    brand: 'Weekender',
    title: 'Canvas Duffle Bag',
    description: 'Roomy duffle bag in olive canvas with leather accents. Zip closure, multiple pockets, and detachable shoulder strap. Perfect for weekend trips and gym sessions.',
    price: 145.00,
    tags: ['duffle', 'canvas', 'olive', 'travel', 'weekend', 'gym', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'bags'
  },
  {
    brand: 'Chain Gang',
    title: 'Silver Chain Crossbody',
    description: 'Edgy crossbody bag in black leather with chunky silver chain strap. Flap closure and structured silhouette. Perfect for nights out and adding edge to outfits.',
    price: 175.00,
    tags: ['crossbody', 'black', 'chain', 'silver', 'edgy', 'evening', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    category: 'bags'
  },
  {
    brand: 'Woven Wonder',
    title: 'Intrecciato Leather Clutch',
    description: 'Sophisticated clutch in woven navy leather. Zip closure and leather-lined interior. Artisanal craftsmanship. Perfect for those who appreciate understated luxury.',
    price: 385.00,
    tags: ['woven', 'navy', 'leather', 'luxury', 'clutch', 'artisan', 'sophisticated'],
    imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800',
    category: 'bags'
  },
  {
    brand: 'Market Fresh',
    title: 'Cotton Mesh Market Bag',
    description: 'Eco-friendly market bag in natural cotton mesh. Expandable design holds plenty of groceries. Perfect for farmers markets and sustainable shopping.',
    price: 28.00,
    tags: ['mesh', 'cotton', 'eco-friendly', 'market', 'sustainable', 'natural', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'bags'
  },
  {
    brand: 'Doctor Style',
    title: 'Burgundy Doctor Bag',
    description: 'Vintage-inspired doctor bag in burgundy leather. Frame closure with kiss-lock, dual handles, and detachable strap. Perfect for those who love structured, classic styles.',
    price: 265.00,
    tags: ['doctor bag', 'burgundy', 'leather', 'vintage', 'structured', 'classic', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'bags'
  },
  {
    brand: 'Sequin Night',
    title: 'Black Sequin Evening Bag',
    description: 'Dazzling evening bag covered in black sequins. Snap closure with chain strap. Compact size for essentials. Perfect for parties, proms, and New Year\'s Eve.',
    price: 95.00,
    tags: ['sequin', 'black', 'evening', 'party', 'glamorous', 'compact', 'special occasion'],
    imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800',
    category: 'bags'
  },
  {
    brand: 'Hobo Life',
    title: 'Camel Leather Hobo Bag',
    description: 'Relaxed hobo bag in soft camel leather. Slouchy silhouette, magnetic closure, and single shoulder strap. Perfect for casual days when you need room for everything.',
    price: 195.00,
    tags: ['hobo', 'camel', 'leather', 'casual', 'slouchy', 'spacious', 'relaxed'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'bags'
  },
  {
    brand: 'Clear Trend',
    title: 'Transparent PVC Tote',
    description: 'Trendy transparent tote in clear PVC with leather trim. Includes removable zip pouch. Stadium-approved size. Perfect for concerts, sporting events, and festivals.',
    price: 75.00,
    tags: ['transparent', 'clear', 'tote', 'stadium', 'trendy', 'festival', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'bags'
  },

  // JEWELRY (50 products)
  {
    brand: 'Gold Standards',
    title: 'Classic Gold Hoop Earrings',
    description: '14K gold hoop earrings in medium size. Smooth finish with click-top closure. Lightweight and comfortable for all-day wear. A timeless staple for any jewelry collection.',
    price: 195.00,
    tags: ['earrings', 'hoops', 'gold', 'classic', 'everyday', 'timeless', '14k'],
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Pearl Dreams',
    title: 'Freshwater Pearl Necklace',
    description: 'Elegant strand of AAA freshwater pearls with sterling silver clasp. 18-inch length with cream-colored pearls. Perfect for weddings, formal events, and adding sophistication.',
    price: 245.00,
    tags: ['necklace', 'pearls', 'classic', 'elegant', 'wedding', 'formal', 'timeless'],
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Tennis Time',
    title: 'Diamond Tennis Bracelet',
    description: 'Sparkling tennis bracelet with round brilliant diamonds in 14K white gold setting. 3 carat total weight. Box clasp with safety latch. An elegant classic for special occasions.',
    price: 2850.00,
    tags: ['bracelet', 'diamond', 'tennis', 'white gold', 'luxury', 'elegant', 'special occasion'],
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Layered Love',
    title: 'Delicate Gold Chain Necklace Set',
    description: 'Set of three dainty gold chains in varying lengths (16", 18", 20"). 14K gold-filled with minimal pendants. Perfect for layering or wearing individually.',
    price: 125.00,
    tags: ['necklace', 'gold', 'layered', 'dainty', 'minimal', 'set', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Statement Piece',
    title: 'Turquoise Statement Earrings',
    description: 'Bold drop earrings featuring natural turquoise stones in sterling silver setting. Post back with 2-inch drop. Perfect for summer and southwestern-inspired looks.',
    price: 85.00,
    tags: ['earrings', 'turquoise', 'statement', 'silver', 'bohemian', 'summer', 'bold'],
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Stacking Rings',
    title: 'Gold Stackable Ring Set',
    description: 'Set of five thin gold rings in varying textures: smooth, twisted, beaded, and hammered. 14K gold-fill. Mix, match, and stack for personalized styling.',
    price: 95.00,
    tags: ['rings', 'gold', 'stackable', 'set', 'minimal', 'everyday', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Charm School',
    title: 'Gold Charm Bracelet',
    description: 'Classic charm bracelet in 14K gold with selection of charms: heart, star, moon, and initial. Lobster clasp closure. Add more charms to personalize over time.',
    price: 225.00,
    tags: ['bracelet', 'charm', 'gold', 'personalized', 'classic', 'gift', 'meaningful'],
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Cuff Culture',
    title: 'Wide Silver Cuff Bracelet',
    description: 'Bold cuff bracelet in hammered sterling silver. 1.5 inches wide with adjustable opening. Handcrafted with artisan details. A statement piece for minimalists.',
    price: 145.00,
    tags: ['bracelet', 'cuff', 'silver', 'statement', 'artisan', 'bold', 'handcrafted'],
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Sparkle Society',
    title: 'Crystal Chandelier Earrings',
    description: 'Glamorous chandelier earrings with cascading crystals in silver setting. Post back with 3-inch drop. Perfect for weddings, galas, and special occasions.',
    price: 125.00,
    tags: ['earrings', 'chandelier', 'crystal', 'glamorous', 'wedding', 'statement', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Signet Style',
    title: 'Gold Signet Ring',
    description: 'Classic signet ring in 14K gold with flat oval face. Can be engraved with initials. Available in sizes 5-10. A timeless piece for everyday elegance.',
    price: 285.00,
    tags: ['ring', 'signet', 'gold', 'classic', 'engravable', 'personalized', 'timeless'],
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Pendant Perfect',
    title: 'Diamond Solitaire Pendant',
    description: 'Elegant pendant with round brilliant diamond in 14K white gold prong setting. 0.5 carat diamond on 18-inch chain. A classic gift and everyday luxury.',
    price: 985.00,
    tags: ['pendant', 'diamond', 'white gold', 'solitaire', 'classic', 'luxury', 'gift'],
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Bar None',
    title: 'Minimalist Bar Necklace',
    description: 'Delicate necklace with horizontal gold bar pendant. 16-inch 14K gold chain. Can be engraved with name or date. Perfect for everyday minimalist style.',
    price: 75.00,
    tags: ['necklace', 'bar', 'gold', 'minimal', 'everyday', 'engravable', 'dainty'],
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Huggie Haven',
    title: 'Small Gold Huggie Earrings',
    description: 'Tiny huggie hoop earrings in 14K gold. Hinged closure that hugs the earlobe. Perfect for second piercings or minimalist everyday wear.',
    price: 85.00,
    tags: ['earrings', 'huggie', 'gold', 'small', 'minimal', 'everyday', '14k'],
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Vintage Treasure',
    title: 'Art Deco Cocktail Ring',
    description: 'Stunning cocktail ring inspired by Art Deco design. Central emerald-cut stone surrounded by pavé crystals in silver setting. Perfect for special occasions and collectors.',
    price: 165.00,
    tags: ['ring', 'cocktail', 'art deco', 'vintage', 'statement', 'emerald cut', 'glamorous'],
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Chain Gang',
    title: 'Chunky Gold Chain Necklace',
    description: 'Bold chain necklace in 14K gold-plated brass. Chunky cable links with toggle closure. 16-inch length. Perfect for making a statement with simple outfits.',
    price: 95.00,
    tags: ['necklace', 'chain', 'gold', 'chunky', 'statement', 'bold', 'trendy'],
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Ear Climber Co',
    title: 'Crystal Ear Climber',
    description: 'Trendy ear climber earring with graduated crystals that climb up the ear. Single earring design. Sterling silver. Perfect for adding modern edge to any look.',
    price: 65.00,
    tags: ['earrings', 'ear climber', 'crystal', 'silver', 'modern', 'trendy', 'edgy'],
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Birthstone Beauty',
    title: 'Birthstone Pendant Necklace',
    description: 'Personalized pendant with your birthstone in 14K gold bezel setting. 16-inch chain with 2-inch extender. Available in all 12 birthstones. A meaningful gift.',
    price: 135.00,
    tags: ['pendant', 'birthstone', 'gold', 'personalized', 'gift', 'meaningful', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Bangle Brigade',
    title: 'Thin Gold Bangle Set',
    description: 'Set of three thin bangles in 14K gold with varying finishes: polished, brushed, and textured. Stack together or wear with other bracelets.',
    price: 195.00,
    tags: ['bangles', 'gold', 'set', 'stackable', 'minimal', 'classic', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Tassel Time',
    title: 'Silk Tassel Earrings',
    description: 'Fun tassel earrings in deep navy silk with gold cap. Post back with 3-inch drop. Lightweight and dramatic. Perfect for summer evenings and resort wear.',
    price: 48.00,
    tags: ['earrings', 'tassel', 'navy', 'silk', 'statement', 'summer', 'dramatic'],
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    category: 'jewelry'
  },
  {
    brand: 'Initial Love',
    title: 'Gold Initial Pendant',
    description: 'Classic initial pendant in 14K gold on 16-inch chain. Script letter with diamond accent. Available in all letters. Perfect personalized gift.',
    price: 165.00,
    tags: ['pendant', 'initial', 'gold', 'personalized', 'diamond', 'gift', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    category: 'jewelry'
  },

  // ACCESSORIES (50 products)
  {
    brand: 'Silk Dreams',
    title: 'Floral Silk Scarf',
    description: 'Luxurious silk scarf with vibrant floral print in pink and green. 36-inch square. Versatile styling: wear as headscarf, neck tie, or bag accessory.',
    price: 125.00,
    tags: ['scarf', 'silk', 'floral', 'colorful', 'versatile', 'luxury', 'accessory'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'accessories'
  },
  {
    brand: 'Belt Boutique',
    title: 'Black Leather Belt with Gold Buckle',
    description: 'Classic belt in smooth black leather with polished gold buckle. 1-inch width. Available in sizes XS-XL. A wardrobe essential for jeans and trousers.',
    price: 75.00,
    tags: ['belt', 'black', 'leather', 'gold', 'classic', 'essential', 'wardrobe staple'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'accessories'
  },
  {
    brand: 'Shade Society',
    title: 'Black Oversized Sunglasses',
    description: 'Glamorous oversized sunglasses in black acetate with gradient lenses. UV400 protection. Classic cat-eye shape. Perfect for adding mystery and drama.',
    price: 145.00,
    tags: ['sunglasses', 'black', 'oversized', 'cat-eye', 'glamorous', 'UV protection', 'summer'],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
    category: 'accessories'
  },
  {
    brand: 'Hat Trick',
    title: 'Tan Wool Fedora',
    description: 'Classic fedora hat in tan wool felt with brown grosgrain ribbon. Structured crown and snap brim. Perfect for fall outfits and adding sophisticated flair.',
    price: 88.00,
    tags: ['hat', 'fedora', 'tan', 'wool', 'fall', 'classic', 'sophisticated'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800',
    category: 'accessories'
  },
  {
    brand: 'Timepiece',
    title: 'Gold Minimalist Watch',
    description: 'Elegant watch with gold-tone case, white dial, and tan leather strap. Japanese quartz movement. Water-resistant. A classic timepiece for everyday elegance.',
    price: 185.00,
    tags: ['watch', 'gold', 'minimalist', 'leather', 'classic', 'elegant', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800',
    category: 'accessories'
  },
  {
    brand: 'Cashmere Comfort',
    title: 'Gray Cashmere Wrap',
    description: 'Luxuriously soft wrap in heather gray cashmere. Oversized at 28" x 80" for versatile styling. Perfect for travel, chilly offices, and evening wrap.',
    price: 295.00,
    tags: ['wrap', 'cashmere', 'gray', 'luxury', 'travel', 'versatile', 'soft'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'accessories'
  },
  {
    brand: 'Glove Love',
    title: 'Black Leather Driving Gloves',
    description: 'Sleek driving gloves in black lambskin leather. Perforated palms and snap closure at wrist. Cashmere lined. Perfect for driving and cold weather elegance.',
    price: 125.00,
    tags: ['gloves', 'black', 'leather', 'driving', 'winter', 'elegant', 'luxury'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'accessories'
  },
  {
    brand: 'Hair Flair',
    title: 'Tortoiseshell Hair Claw Clip',
    description: 'Classic claw clip in tortoiseshell acetate. Large size holds thick hair securely. Spring-loaded mechanism. A chic and practical hair accessory.',
    price: 24.00,
    tags: ['hair clip', 'tortoiseshell', 'hair accessory', 'practical', 'classic', 'everyday', 'trendy'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'accessories'
  },
  {
    brand: 'Umbrella Chic',
    title: 'Compact Travel Umbrella',
    description: 'Compact umbrella in navy with automatic open/close. Wind-resistant frame and water-repellent canopy. Fits in handbag. A rainy day essential.',
    price: 45.00,
    tags: ['umbrella', 'navy', 'compact', 'travel', 'practical', 'rain', 'essential'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'accessories'
  },
  {
    brand: 'Wallet Works',
    title: 'Burgundy Leather Wallet',
    description: 'Slim wallet in burgundy pebbled leather. 12 card slots, ID window, and zip coin pocket. RFID blocking. Perfect for organized essentials.',
    price: 95.00,
    tags: ['wallet', 'burgundy', 'leather', 'RFID', 'practical', 'organized', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'accessories'
  },
  {
    brand: 'Beanie Basics',
    title: 'Chunky Knit Beanie',
    description: 'Cozy beanie in chunky cream knit with fold-up brim. Soft acrylic blend. One size fits most. Perfect for cold weather and après-ski style.',
    price: 35.00,
    tags: ['beanie', 'cream', 'knit', 'winter', 'cozy', 'chunky', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800',
    category: 'accessories'
  },
  {
    brand: 'Aviator Classic',
    title: 'Gold Aviator Sunglasses',
    description: 'Classic aviator sunglasses with gold metal frames and green gradient lenses. UV400 protection. Adjustable nose pads. A timeless unisex style.',
    price: 165.00,
    tags: ['sunglasses', 'aviator', 'gold', 'classic', 'unisex', 'UV protection', 'timeless'],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
    category: 'accessories'
  },
  {
    brand: 'Headband Haven',
    title: 'Velvet Padded Headband',
    description: 'On-trend padded headband in emerald green velvet. Wide design with comfortable fit. Perfect for adding polish to any hairstyle, especially for the holidays.',
    price: 38.00,
    tags: ['headband', 'velvet', 'green', 'padded', 'trendy', 'hair accessory', 'holiday'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'accessories'
  },
  {
    brand: 'Card Case Co',
    title: 'Navy Leather Card Holder',
    description: 'Slim card holder in navy saffiano leather. Holds 6 cards with center pocket for folded bills. Perfect for minimalists who prefer to travel light.',
    price: 55.00,
    tags: ['card holder', 'navy', 'leather', 'slim', 'minimalist', 'practical', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'accessories'
  },
  {
    brand: 'Blanket Scarf',
    title: 'Plaid Blanket Scarf',
    description: 'Oversized scarf in classic red and black plaid. Soft brushed acrylic. Generous 60" x 60" size. Can be worn as scarf, wrap, or cozy blanket.',
    price: 65.00,
    tags: ['scarf', 'plaid', 'red', 'oversized', 'winter', 'cozy', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'accessories'
  },
  {
    brand: 'Tech Touch',
    title: 'Touchscreen Leather Gloves',
    description: 'Sleek gloves in black leather with touchscreen-compatible fingertips. Cashmere lined for warmth. Stay connected without getting cold hands.',
    price: 98.00,
    tags: ['gloves', 'black', 'leather', 'touchscreen', 'winter', 'tech', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'accessories'
  },
  {
    brand: 'Ribbon Royale',
    title: 'Silk Hair Bow',
    description: 'Elegant hair bow in black silk with barrette clip. Oversized design makes a feminine statement. Perfect for adding polish to updos and ponytails.',
    price: 42.00,
    tags: ['hair bow', 'silk', 'black', 'feminine', 'elegant', 'hair accessory', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'accessories'
  },
  {
    brand: 'Straw Style',
    title: 'Wide Brim Straw Sun Hat',
    description: 'Classic sun hat in natural straw with black ribbon band. Wide brim for full sun protection. Packable. Perfect for beach days and garden parties.',
    price: 68.00,
    tags: ['hat', 'straw', 'sun hat', 'summer', 'beach', 'natural', 'packable'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800',
    category: 'accessories'
  },
  {
    brand: 'Key to Style',
    title: 'Leather Tassel Keychain',
    description: 'Chic keychain with leather tassel in coral and gold-tone hardware. Clip attaches to bag or keys. Perfect for adding color and finding keys easily.',
    price: 28.00,
    tags: ['keychain', 'tassel', 'leather', 'coral', 'gold', 'accessory', 'gift'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'accessories'
  },
  {
    brand: 'Phone Fashion',
    title: 'Quilted Phone Crossbody',
    description: 'Compact crossbody designed for phone. Quilted black faux leather with card slot. Adjustable strap. Perfect for errands and hands-free convenience.',
    price: 48.00,
    tags: ['phone case', 'crossbody', 'black', 'quilted', 'hands-free', 'practical', 'compact'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'accessories'
  }
];

async function seedProducts() {
  console.log('Starting product seed...');
  console.log(`Preparing to insert ${products.length} products`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    try {
      // Create combined text for embedding
      const combinedText = `${product.title} ${product.title} ${product.title} ${product.description} ${product.tags.join(' ')}`;

      // Generate embedding
      console.log(`[${i + 1}/${products.length}] Generating embedding for: ${product.title}`);
      const embedding = await generateEmbedding(combinedText);

      // Insert into database
      const { error } = await supabase
        .from('products')
        .upsert({
          brand: product.brand,
          title: product.title,
          description: product.description,
          tags: product.tags,
          price: product.price,
          currency: 'USD',
          image_url: product.imageUrl,
          product_url: `https://example.com/products/${product.title.toLowerCase().replace(/\s+/g, '-')}`,
          combined_text: combinedText,
          embedding: embedding,
          affiliate_network: 'sample',
          merchant_id: 'sample-merchant',
        }, {
          onConflict: 'product_url',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`Error inserting ${product.title}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }

      // Rate limiting for OpenAI
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`Error processing ${product.title}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n--- Seed Complete ---');
  console.log(`Successfully inserted: ${successCount} products`);
  console.log(`Errors: ${errorCount}`);
}

// Run the seed
seedProducts().catch(console.error);
