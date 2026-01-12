#!/usr/bin/env node

/**
 * Seed script to populate the database with 300 sample fashion products
 * Run with: node scripts/seed-products.mjs
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

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
{
    brand: 'Elegance Studio',
    title: 'Emerald Velvet Evening Gown',
    description: 'Luxurious floor-length velvet gown in deep emerald green. Features a sweetheart neckline, fitted bodice, and flowing A-line skirt with a subtle train. Perfect for black-tie events and winter galas.',
    price: 485.00,
    tags: ['formal', 'velvet', 'green', 'evening', 'gown', 'elegant', 'winter'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Bohemian Dreams',
    title: 'Wildflower Maxi Dress',
    description: 'Flowing maxi dress with vibrant wildflower print on ivory background. Features adjustable spaghetti straps, smocked bodice, and tiered skirt. Lightweight cotton blend perfect for garden parties and summer weddings.',
    price: 128.00,
    tags: ['floral', 'maxi', 'summer', 'bohemian', 'garden party', 'casual', 'cotton'],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Metropolitan',
    title: 'Classic Black Sheath Dress',
    description: 'Timeless black sheath dress in premium Italian wool blend. Knee-length with boat neckline and three-quarter sleeves. Fully lined with invisible back zipper. A wardrobe essential for the office and beyond.',
    price: 295.00,
    tags: ['black', 'classic', 'work', 'office', 'professional', 'wool', 'sheath'],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Sunset Collection',
    title: 'Coral Wrap Midi Dress',
    description: 'Flattering wrap-style midi dress in stunning coral pink. Made from lightweight crepe with gentle draping and adjustable tie waist. Versatile enough for brunch dates or beach resort dinners.',
    price: 165.00,
    tags: ['coral', 'pink', 'wrap', 'midi', 'summer', 'date night', 'resort'],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Noir Atelier',
    title: 'Sequin Cocktail Dress',
    description: 'Show-stopping mini dress covered in matte black sequins. Sleeveless with high neckline and low back. Fully lined for comfort. Perfect for New Year\'s Eve, cocktail parties, and nightclub events.',
    price: 320.00,
    tags: ['sequin', 'black', 'cocktail', 'party', 'mini', 'evening', 'glamorous'],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Garden Society',
    title: 'Lavender Lace Tea Dress',
    description: 'Romantic tea-length dress in soft lavender lace over nude lining. Features scalloped hem, cap sleeves, and fitted waist with satin ribbon. Ideal for spring weddings and afternoon garden parties.',
    price: 245.00,
    tags: ['lavender', 'lace', 'romantic', 'wedding guest', 'spring', 'tea length', 'feminine'],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Urban Edge',
    title: 'Leather Trim Bodycon Dress',
    description: 'Edgy bodycon dress with faux leather trim along the neckline and hemline. Made from stretchy ponte fabric in charcoal gray. Perfect for date nights and concerts when you want to stand out.',
    price: 175.00,
    tags: ['edgy', 'bodycon', 'leather', 'gray', 'date night', 'modern', 'sexy'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Coastal Living',
    title: 'Navy Striped Shirt Dress',
    description: 'Relaxed shirt dress in classic navy and white stripes. Button-front design with roll-up sleeves and removable belt. Made from breathable linen blend. Perfect for coastal getaways and casual Fridays.',
    price: 118.00,
    tags: ['striped', 'navy', 'casual', 'linen', 'summer', 'coastal', 'shirt dress'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Midnight Hour',
    title: 'Sapphire Satin Slip Dress',
    description: 'Elegant slip dress in rich sapphire blue satin. Features delicate lace trim at the neckline, adjustable straps, and a bias cut that skims the body beautifully. Layer with a blazer or wear solo.',
    price: 195.00,
    tags: ['satin', 'blue', 'slip dress', 'elegant', 'evening', 'sexy', 'minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Country Rose',
    title: 'Gingham Sundress',
    description: 'Sweet sundress in red and white gingham check. Features square neckline, puff sleeves, and full skirt with pockets. Cotton fabric with subtle stretch. Perfect for picnics, county fairs, and barbecues.',
    price: 89.00,
    tags: ['gingham', 'red', 'sundress', 'summer', 'casual', 'cotton', 'picnic'],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Artisan Guild',
    title: 'Hand-Embroidered Peasant Dress',
    description: 'Stunning white cotton peasant dress with intricate hand-embroidered flowers in multicolor thread. Features off-shoulder neckline, billowy sleeves, and relaxed fit. A true statement piece for bohemian souls.',
    price: 275.00,
    tags: ['embroidered', 'white', 'bohemian', 'peasant', 'artisan', 'summer', 'festival'],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Power Suit',
    title: 'Tailored Blazer Dress',
    description: 'Sophisticated blazer dress in camel wool blend. Double-breasted with gold buttons, padded shoulders, and side pockets. Hits above the knee. Perfect for power meetings and business dinners.',
    price: 345.00,
    tags: ['blazer', 'camel', 'work', 'professional', 'tailored', 'power', 'autumn'],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Tropical Escape',
    title: 'Palm Print Halter Dress',
    description: 'Vibrant halter dress featuring oversized palm leaf print in greens and blues. Backless design with tie closure and flowing maxi skirt with side slit. Perfect for resort vacations and beach weddings.',
    price: 155.00,
    tags: ['tropical', 'palm', 'halter', 'maxi', 'resort', 'beach', 'vacation'],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Minimalist Mode',
    title: 'Oatmeal Knit Sweater Dress',
    description: 'Cozy yet chic sweater dress in oatmeal colored ribbed knit. Features mock turtleneck, long sleeves, and relaxed fit hitting mid-thigh. Perfect for autumn weekends with ankle boots.',
    price: 135.00,
    tags: ['knit', 'sweater dress', 'beige', 'casual', 'autumn', 'cozy', 'minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Regal Collection',
    title: 'Burgundy Velvet Midi Dress',
    description: 'Rich burgundy velvet midi dress with romantic puff sleeves and square neckline. Features empire waist and flowing skirt. Perfect for holiday parties, winter weddings, and theater nights.',
    price: 265.00,
    tags: ['velvet', 'burgundy', 'midi', 'holiday', 'romantic', 'winter', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Athletic Luxe',
    title: 'Tennis Dress with Built-in Shorts',
    description: 'Performance tennis dress in crisp white with navy trim. Moisture-wicking fabric with UPF 50+ protection. Features built-in shorts and ball pocket. Perfect for the court or athleisure styling.',
    price: 95.00,
    tags: ['athletic', 'tennis', 'white', 'sporty', 'performance', 'summer', 'active'],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Vintage Revival',
    title: 'Polka Dot Swing Dress',
    description: '1950s inspired swing dress in black with white polka dots. Features sweetheart neckline, fitted bodice, and full circle skirt. Perfect for retro-themed events, swing dancing, and rockabilly fans.',
    price: 145.00,
    tags: ['polka dot', 'vintage', 'retro', '1950s', 'swing', 'black', 'white'],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Modern Muse',
    title: 'Asymmetric One-Shoulder Dress',
    description: 'Contemporary dress with dramatic one-shoulder design in electric blue. Sculptural draping creates an architectural silhouette. Midi length with side slit. Perfect for gallery openings and fashion events.',
    price: 285.00,
    tags: ['asymmetric', 'blue', 'modern', 'architectural', 'dramatic', 'evening', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Earth Mother',
    title: 'Terracotta Linen Maxi Dress',
    description: 'Relaxed maxi dress in beautiful terracotta colored 100% linen. Features V-neckline, empire waist with tie, and side pockets. Breathable and eco-friendly. Perfect for sustainable fashion lovers.',
    price: 175.00,
    tags: ['linen', 'terracotta', 'maxi', 'sustainable', 'summer', 'natural', 'eco-friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'After Dark',
    title: 'Red Carpet Mermaid Gown',
    description: 'Showstopping mermaid silhouette gown in deep red with subtle shimmer. Features plunging V-neckline, fitted through the hips, and dramatic flared skirt. Perfect for formal galas and award ceremonies.',
    price: 595.00,
    tags: ['red', 'mermaid', 'formal', 'gala', 'glamorous', 'evening', 'red carpet'],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Fresh Start',
    title: 'Mint Green Tiered Midi Dress',
    description: 'Refreshing midi dress in soft mint green with three tiers of ruffles. Sleeveless with high neckline and keyhole back. Light and airy chiffon fabric. Perfect for baby showers and spring brunches.',
    price: 148.00,
    tags: ['mint', 'green', 'tiered', 'ruffles', 'spring', 'brunch', 'feminine'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Parisian Chic',
    title: 'Breton Stripe Knit Dress',
    description: 'Classic French-inspired knit dress with navy and cream Breton stripes. Boat neckline, three-quarter sleeves, and fitted silhouette hitting above the knee. Effortlessly chic for everyday elegance.',
    price: 165.00,
    tags: ['striped', 'french', 'knit', 'navy', 'classic', 'casual', 'chic'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Golden Hour',
    title: 'Champagne Pleated Midi Dress',
    description: 'Luminous champagne colored dress with accordion pleats that catch the light beautifully. Sleeveless with mock neck and flowing midi skirt. Perfect for engagement parties and anniversary dinners.',
    price: 225.00,
    tags: ['champagne', 'pleated', 'midi', 'elegant', 'celebration', 'romantic', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Street Style',
    title: 'Denim Button-Front Dress',
    description: 'Casual-cool denim dress with snap button front closure. Features chest pockets, rolled sleeves, and self-tie belt. Medium wash with subtle distressing. Perfect for weekend errands and casual dates.',
    price: 98.00,
    tags: ['denim', 'casual', 'button front', 'blue', 'weekend', 'relaxed', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Night Bloom',
    title: 'Floral Jacquard Cocktail Dress',
    description: 'Sophisticated cocktail dress in navy with raised floral jacquard pattern. Cap sleeves, fitted waist, and flared skirt hitting just above the knee. Perfect for wedding receptions and cocktail hours.',
    price: 285.00,
    tags: ['jacquard', 'navy', 'floral', 'cocktail', 'wedding', 'elegant', 'formal'],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Island Time',
    title: 'Turquoise Kaftan Dress',
    description: 'Flowing kaftan dress in vibrant turquoise with gold embroidery at the neckline. Lightweight viscose fabric with side slits. Perfect as a beach cover-up or poolside dress.',
    price: 125.00,
    tags: ['kaftan', 'turquoise', 'beach', 'resort', 'embroidered', 'summer', 'cover-up'],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Office Elegance',
    title: 'Navy Pencil Dress',
    description: 'Polished pencil dress in navy blue with subtle texture. Features cap sleeves, princess seams for a flattering fit, and back vent for ease of movement. A sophisticated choice for the boardroom.',
    price: 215.00,
    tags: ['pencil', 'navy', 'work', 'office', 'professional', 'classic', 'tailored'],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Festival Queen',
    title: 'Tie-Dye Maxi Dress',
    description: 'Free-spirited maxi dress in swirling purple and pink tie-dye. Halter neck with adjustable ties, open back, and flowing skirt. Perfect for music festivals, beach bonfires, and free spirits.',
    price: 85.00,
    tags: ['tie-dye', 'purple', 'pink', 'festival', 'bohemian', 'maxi', 'summer'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Winter Wonderland',
    title: 'Ivory Sequin Midi Dress',
    description: 'Enchanting midi dress covered in ivory sequins with subtle iridescent shimmer. Long sleeves, modest neckline, and fitted silhouette. Perfect for holiday parties and winter wonderland weddings.',
    price: 365.00,
    tags: ['sequin', 'ivory', 'white', 'holiday', 'winter', 'wedding', 'glamorous'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Sunset Stripe',
    title: 'Rainbow Stripe Midi Dress',
    description: 'Cheerful midi dress with horizontal rainbow stripes. Crew neckline, short sleeves, and pleated skirt. Made from soft jersey fabric. Perfect for pride celebrations and colorful occasions.',
    price: 115.00,
    tags: ['rainbow', 'striped', 'colorful', 'pride', 'midi', 'casual', 'cheerful'],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Silk Road',
    title: 'Ivory Silk Blouse',
    description: 'Luxurious 100% silk blouse in soft ivory. Features classic collar, hidden button placket, and French cuffs. Versatile enough for the office with trousers or dressed down with jeans.',
    price: 195.00,
    tags: ['silk', 'ivory', 'blouse', 'classic', 'work', 'elegant', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Casual Friday',
    title: 'Chambray Button-Down Shirt',
    description: 'Relaxed chambray shirt in light blue with subtle white stitching. Roll-tab sleeves, chest pocket, and curved hem. Perfect for casual office days and weekend brunches.',
    price: 68.00,
    tags: ['chambray', 'blue', 'casual', 'shirt', 'weekend', 'classic', 'relaxed'],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Knit Studio',
    title: 'Oversized Cable Knit Sweater',
    description: 'Cozy oversized sweater with intricate cable knit pattern in cream. Features crew neckline, dropped shoulders, and ribbed trim. Made from soft merino wool blend. Perfect for autumn layering.',
    price: 145.00,
    tags: ['sweater', 'cable knit', 'cream', 'oversized', 'cozy', 'autumn', 'wool'],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Modern Basic',
    title: 'White Cotton T-Shirt',
    description: 'The perfect white tee in premium Pima cotton. Crew neckline, short sleeves, and relaxed fit. Pre-shrunk and garment-dyed for a lived-in feel. A true wardrobe essential.',
    price: 45.00,
    tags: ['white', 't-shirt', 'basic', 'cotton', 'essential', 'casual', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Romantic Era',
    title: 'Blush Pink Ruffle Blouse',
    description: 'Feminine blouse in soft blush pink with cascading ruffles down the front. V-neckline, long sleeves with ruffle cuffs. Lightweight chiffon fabric. Perfect for date nights and special occasions.',
    price: 98.00,
    tags: ['pink', 'ruffle', 'blouse', 'romantic', 'feminine', 'date night', 'chiffon'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Athletic Edge',
    title: 'Black Mesh Panel Sports Bra',
    description: 'High-support sports bra in black with breathable mesh panels. Racerback design, moisture-wicking fabric, and removable padding. Perfect for high-impact workouts and studio classes.',
    price: 55.00,
    tags: ['sports bra', 'black', 'athletic', 'workout', 'high-impact', 'mesh', 'performance'],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Boho Spirit',
    title: 'Embroidered Peasant Top',
    description: 'Beautiful peasant top in white cotton with colorful floral embroidery. Off-shoulder neckline with elastic, billowy sleeves, and relaxed fit. Perfect for summer festivals and vacation.',
    price: 75.00,
    tags: ['embroidered', 'peasant', 'white', 'bohemian', 'summer', 'festival', 'off-shoulder'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Power Move',
    title: 'Black Turtleneck Bodysuit',
    description: 'Sleek black bodysuit with mock turtleneck. Long sleeves, snap closure, and second-skin fit. Made from stretchy ponte fabric. Perfect foundation for layering under blazers and high-waisted pants.',
    price: 65.00,
    tags: ['bodysuit', 'black', 'turtleneck', 'sleek', 'layering', 'modern', 'minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Sunset Dreams',
    title: 'Orange Silk Camisole',
    description: 'Vibrant orange silk camisole with delicate lace trim. Adjustable spaghetti straps and relaxed fit. Can be worn alone or layered under blazers. Perfect pop of color for any outfit.',
    price: 85.00,
    tags: ['silk', 'orange', 'camisole', 'lace', 'summer', 'layering', 'colorful'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Stripe Club',
    title: 'Navy Breton Stripe Top',
    description: 'Classic Breton stripe top in navy and white. Boat neckline, three-quarter sleeves, and relaxed fit. Made from soft cotton jersey. A timeless French-inspired essential.',
    price: 58.00,
    tags: ['striped', 'navy', 'breton', 'french', 'classic', 'casual', 'cotton'],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luxe Layers',
    title: 'Cashmere V-Neck Sweater',
    description: 'Sumptuous cashmere sweater in heather gray. Classic V-neckline, long sleeves, and relaxed fit. Incredibly soft and lightweight. A luxury investment piece for your wardrobe.',
    price: 295.00,
    tags: ['cashmere', 'gray', 'sweater', 'luxury', 'classic', 'soft', 'investment'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Rock Revival',
    title: 'Vintage Band T-Shirt',
    description: 'Distressed vintage-style band tee in washed black. Oversized fit with raw hem and faded graphics. Perfect for concerts, casual days, and adding edge to any outfit.',
    price: 42.00,
    tags: ['vintage', 'band', 't-shirt', 'black', 'distressed', 'casual', 'edgy'],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Garden Party',
    title: 'Floral Wrap Top',
    description: 'Flattering wrap top in romantic floral print on navy background. V-neckline, flutter sleeves, and tie closure at the side. Perfect for brunch dates and summer evenings.',
    price: 78.00,
    tags: ['floral', 'wrap', 'navy', 'feminine', 'summer', 'romantic', 'flattering'],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Boardroom Ready',
    title: 'Emerald Green Shell Top',
    description: 'Polished shell top in rich emerald green. Sleeveless with modest neckline and darted bust for a flattering fit. Perfect under blazers or worn alone in warm weather.',
    price: 68.00,
    tags: ['shell', 'green', 'work', 'professional', 'sleeveless', 'office', 'polished'],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Cozy Nights',
    title: 'Chunky Knit Cardigan',
    description: 'Oversized cardigan in chunky oatmeal knit. Open front with no closures, deep pockets, and dropped shoulders. Perfect for lounging at home or layering on cool evenings.',
    price: 125.00,
    tags: ['cardigan', 'chunky', 'oatmeal', 'cozy', 'oversized', 'layering', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Sleek & Simple',
    title: 'Black Halter Neck Top',
    description: 'Minimalist halter top in black matte jersey. High neckline with tie closure and open back. Perfect for summer evenings, dancing, and showing off toned shoulders.',
    price: 55.00,
    tags: ['halter', 'black', 'minimalist', 'summer', 'evening', 'sexy', 'backless'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Safari Style',
    title: 'Khaki Utility Shirt',
    description: 'Classic utility shirt in khaki cotton twill. Features chest pockets with flaps, roll-tab sleeves, and longer back hem. Perfect for safari trips and casual adventures.',
    price: 88.00,
    tags: ['utility', 'khaki', 'safari', 'cotton', 'casual', 'adventure', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Sequin Society',
    title: 'Gold Sequin Tank Top',
    description: 'Glamorous tank top covered in gold sequins. Scoop neckline, wide straps, and relaxed fit. Fully lined for comfort. Perfect for holiday parties and nights out.',
    price: 95.00,
    tags: ['sequin', 'gold', 'tank', 'glamorous', 'party', 'evening', 'holiday'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Workout Warrior',
    title: 'Coral Performance Tank',
    description: 'High-performance tank top in vibrant coral. Moisture-wicking fabric, built-in shelf bra, and racerback design. Reflective logo for visibility. Perfect for running and outdoor workouts.',
    price: 48.00,
    tags: ['performance', 'coral', 'tank', 'athletic', 'workout', 'running', 'moisture-wicking'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Vintage Lace',
    title: 'Cream Lace Victorian Blouse',
    description: 'Romantic Victorian-inspired blouse in cream lace. High neckline with ruffle trim, long sleeves with button cuffs, and subtle sheerness. Perfect for special occasions and romantic dates.',
    price: 135.00,
    tags: ['lace', 'cream', 'victorian', 'romantic', 'vintage', 'feminine', 'special occasion'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Denim Authority',
    title: 'High-Rise Straight Leg Jeans',
    description: 'Classic high-rise jeans in medium wash denim with subtle whiskering. Straight leg silhouette, five-pocket styling, and non-stretch cotton denim. A timeless wardrobe staple.',
    price: 128.00,
    tags: ['jeans', 'denim', 'high-rise', 'straight leg', 'classic', 'casual', 'blue'],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Tailored Touch',
    title: 'Black Wool Trousers',
    description: 'Impeccably tailored trousers in black Italian wool. High-rise with pleated front, side pockets, and straight leg. Fully lined for a polished finish. Perfect for the office and formal events.',
    price: 225.00,
    tags: ['trousers', 'black', 'wool', 'tailored', 'work', 'formal', 'professional'],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Summer Essential',
    title: 'White Linen Wide-Leg Pants',
    description: 'Breezy wide-leg pants in crisp white linen. High-rise with elastic waist at back and tie closure. Perfect for beach vacations, resort wear, and hot summer days.',
    price: 115.00,
    tags: ['linen', 'white', 'wide-leg', 'summer', 'resort', 'beach', 'breezy'],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Athletic Pro',
    title: 'Black Yoga Leggings',
    description: 'High-performance leggings in sleek black. High-rise with wide waistband, four-way stretch, and hidden pocket. Moisture-wicking and squat-proof. Perfect for yoga, pilates, and everyday wear.',
    price: 88.00,
    tags: ['leggings', 'black', 'yoga', 'athletic', 'performance', 'high-rise', 'stretch'],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Vintage Vibes',
    title: 'Floral A-Line Midi Skirt',
    description: 'Romantic A-line skirt in vintage-inspired floral print. High-waisted with hidden side zipper and midi length. Cotton blend fabric with subtle sheen. Perfect for tea parties and garden events.',
    price: 95.00,
    tags: ['skirt', 'floral', 'midi', 'a-line', 'vintage', 'romantic', 'feminine'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Denim Dreams',
    title: 'Light Wash Mom Jeans',
    description: 'Relaxed mom jeans in light wash denim. High-rise with tapered leg, five-pocket styling, and slight distressing at the knees. Comfortable cotton blend with a touch of stretch.',
    price: 98.00,
    tags: ['jeans', 'mom jeans', 'light wash', 'denim', 'relaxed', 'casual', 'vintage'],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Power Suit',
    title: 'Navy Pinstripe Trousers',
    description: 'Sophisticated trousers in navy with subtle white pinstripes. High-rise, straight leg, and front creases for a polished look. Perfect for interviews, meetings, and professional settings.',
    price: 165.00,
    tags: ['trousers', 'navy', 'pinstripe', 'work', 'professional', 'tailored', 'formal'],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Weekend Warrior',
    title: 'Khaki Cargo Shorts',
    description: 'Relaxed cargo shorts in classic khaki. Mid-rise with cargo pockets, belt loops, and 7-inch inseam. Durable cotton twill. Perfect for hiking, camping, and casual summer days.',
    price: 58.00,
    tags: ['shorts', 'cargo', 'khaki', 'casual', 'summer', 'hiking', 'outdoor'],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elegant Evening',
    title: 'Black Satin Palazzo Pants',
    description: 'Dramatic palazzo pants in flowing black satin. Ultra-high rise with wide leg that skims the floor. Perfect for formal events when you want the elegance of a gown with the ease of pants.',
    price: 185.00,
    tags: ['palazzo', 'black', 'satin', 'formal', 'evening', 'elegant', 'wide-leg'],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Chic Mini',
    title: 'Black Leather Mini Skirt',
    description: 'Edgy mini skirt in genuine black leather. High-waisted with silver zipper closure and A-line silhouette. Fully lined. Perfect for concerts, date nights, and nights out.',
    price: 225.00,
    tags: ['leather', 'black', 'mini', 'skirt', 'edgy', 'date night', 'sexy'],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Bohemian Rhapsody',
    title: 'Printed Wrap Maxi Skirt',
    description: 'Flowing maxi skirt in bohemian paisley print. Wrap style with tie closure, adjustable fit, and dramatic side slit. Perfect for music festivals and summer adventures.',
    price: 85.00,
    tags: ['maxi', 'wrap', 'bohemian', 'paisley', 'festival', 'summer', 'printed'],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Classic Prep',
    title: 'Navy Bermuda Shorts',
    description: 'Tailored Bermuda shorts in navy cotton twill. Mid-rise with cuffed hem hitting at the knee. Perfect for summer office days, golf courses, and preppy casual occasions.',
    price: 75.00,
    tags: ['bermuda', 'navy', 'shorts', 'preppy', 'summer', 'tailored', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Chic',
    title: 'Olive Utility Joggers',
    description: 'Trendy joggers in olive green with utility details. Elastic waist with drawstring, cargo pockets, and tapered leg with elastic cuffs. Perfect for travel and athleisure styling.',
    price: 78.00,
    tags: ['joggers', 'olive', 'utility', 'casual', 'athleisure', 'travel', 'comfortable'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Office Essential',
    title: 'Camel Pencil Skirt',
    description: 'Classic pencil skirt in camel colored stretch suiting. High-rise with back vent and invisible zipper. Knee-length and fully lined. A sophisticated choice for the office.',
    price: 135.00,
    tags: ['pencil', 'camel', 'skirt', 'work', 'office', 'professional', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Denim Lab',
    title: 'Black Skinny Jeans',
    description: 'Figure-flattering skinny jeans in jet black denim. High-rise with super stretch for all-day comfort. Slim through hip and thigh with skinny leg. A versatile wardrobe staple.',
    price: 108.00,
    tags: ['jeans', 'black', 'skinny', 'denim', 'stretch', 'versatile', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Pleated Perfection',
    title: 'Burgundy Pleated Midi Skirt',
    description: 'Elegant midi skirt in burgundy with accordion pleats. Elastic waist for comfortable fit and flowing movement. Perfect for office wear, dinner dates, and special occasions.',
    price: 98.00,
    tags: ['pleated', 'burgundy', 'midi', 'skirt', 'elegant', 'work', 'feminine'],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Summer Breeze',
    title: 'Floral High-Waist Shorts',
    description: 'Charming shorts in bright floral print on white background. High-waisted with paper bag waist and self-tie belt. Perfect for summer picnics and vacation days.',
    price: 65.00,
    tags: ['shorts', 'floral', 'high-waist', 'summer', 'vacation', 'feminine', 'colorful'],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Luxe Lounge',
    title: 'Gray Cashmere Joggers',
    description: 'Ultra-luxurious joggers in soft gray cashmere blend. Elastic waist with drawstring, side pockets, and tapered leg. Perfect for elevated loungewear and first-class travel.',
    price: 275.00,
    tags: ['cashmere', 'gray', 'joggers', 'luxury', 'lounge', 'travel', 'comfortable'],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Retro Style',
    title: 'High-Waist Wide-Leg Jeans',
    description: 'Vintage-inspired wide-leg jeans in dark indigo wash. Ultra high-rise with button fly and flared leg. Non-stretch denim with authentic 70s feel. Perfect for retro lovers.',
    price: 145.00,
    tags: ['jeans', 'wide-leg', 'high-waist', 'vintage', 'retro', '70s', 'denim'],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Tennis Club',
    title: 'White Pleated Tennis Skirt',
    description: 'Classic tennis skirt in crisp white with knife pleats. Built-in shorts, moisture-wicking fabric, and elastic waist. Perfect for the court or athleisure styling.',
    price: 68.00,
    tags: ['tennis', 'white', 'pleated', 'athletic', 'sporty', 'skirt', 'performance'],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Luxury Steps',
    title: 'Black Leather Stiletto Pumps',
    description: 'Classic black pumps in smooth Italian leather. Pointed toe, 4-inch stiletto heel, and leather sole. A timeless essential for the office, interviews, and formal occasions.',
    price: 295.00,
    tags: ['heels', 'black', 'leather', 'stiletto', 'pumps', 'classic', 'formal'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Comfort Plus',
    title: 'White Leather Sneakers',
    description: 'Clean white sneakers in premium leather with subtle perforations. Cushioned insole, rubber outsole, and minimal branding. Perfect for everyday wear and casual Fridays.',
    price: 135.00,
    tags: ['sneakers', 'white', 'leather', 'casual', 'comfortable', 'minimal', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Evening Glamour',
    title: 'Gold Strappy Heeled Sandals',
    description: 'Stunning heeled sandals in metallic gold leather. Delicate straps, ankle closure, and 3-inch block heel. Perfect for weddings, galas, and special occasions.',
    price: 185.00,
    tags: ['heels', 'gold', 'strappy', 'sandals', 'evening', 'wedding', 'glamorous'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Chelsea Boot Co',
    title: 'Black Leather Chelsea Boots',
    description: 'Classic Chelsea boots in smooth black leather. Elastic side panels, pull tab, and stacked heel. Versatile enough for jeans or dresses. A fall and winter essential.',
    price: 225.00,
    tags: ['boots', 'chelsea', 'black', 'leather', 'classic', 'fall', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Beach Walk',
    title: 'Tan Leather Slide Sandals',
    description: 'Minimalist slide sandals in natural tan leather. Wide single strap, contoured footbed, and rubber sole. Perfect for summer days, beach walks, and casual outings.',
    price: 78.00,
    tags: ['sandals', 'slides', 'tan', 'leather', 'summer', 'casual', 'minimal'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Office Chic',
    title: 'Nude Patent Kitten Heels',
    description: 'Sophisticated kitten heels in nude patent leather. Pointed toe and 2-inch heel for all-day comfort. Perfect for the office and events where you\'ll be on your feet.',
    price: 145.00,
    tags: ['heels', 'nude', 'patent', 'kitten heel', 'work', 'comfortable', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Western Soul',
    title: 'Brown Suede Cowboy Boots',
    description: 'Authentic cowboy boots in rich brown suede. Pointed toe, embroidered shaft, and stacked heel. Perfect for country concerts, western weddings, and adding edge to everyday outfits.',
    price: 285.00,
    tags: ['boots', 'cowboy', 'brown', 'suede', 'western', 'embroidered', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Athletic Performance',
    title: 'Black Running Shoes',
    description: 'High-performance running shoes in black mesh with reflective details. Responsive cushioning, breathable upper, and durable rubber outsole. Perfect for road running and gym workouts.',
    price: 145.00,
    tags: ['running', 'athletic', 'black', 'mesh', 'performance', 'gym', 'comfortable'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Elegant Steps',
    title: 'Navy Suede Block Heel Pumps',
    description: 'Refined pumps in navy blue suede. Almond toe and comfortable 3-inch block heel. Perfect for office wear, fall weddings, and occasions requiring style with stability.',
    price: 165.00,
    tags: ['heels', 'navy', 'suede', 'block heel', 'pumps', 'work', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Ballet Dreams',
    title: 'Blush Pink Ballet Flats',
    description: 'Dainty ballet flats in soft blush pink leather. Rounded toe, elastic heel grip, and cushioned insole. Perfect for all-day comfort with feminine charm.',
    price: 95.00,
    tags: ['flats', 'ballet', 'pink', 'leather', 'feminine', 'comfortable', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Combat Zone',
    title: 'Black Leather Combat Boots',
    description: 'Edgy combat boots in black leather with silver hardware. Lace-up front, side zip, and chunky lug sole. Perfect for adding attitude to any outfit.',
    price: 195.00,
    tags: ['boots', 'combat', 'black', 'leather', 'edgy', 'chunky', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Summer Steps',
    title: 'Espadrille Wedge Sandals',
    description: 'Charming wedge sandals with braided jute platform and navy canvas upper. Ankle tie closure and 3-inch wedge heel. Perfect for summer dresses and beach vacations.',
    price: 88.00,
    tags: ['espadrille', 'wedge', 'navy', 'summer', 'sandals', 'vacation', 'platform'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Loafer Luxe',
    title: 'Burgundy Leather Loafers',
    description: 'Sophisticated loafers in rich burgundy leather with penny slot detail. Leather sole and cushioned insole. Perfect for smart casual offices and weekend brunches.',
    price: 185.00,
    tags: ['loafers', 'burgundy', 'leather', 'classic', 'work', 'sophisticated', 'preppy'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Platform Dreams',
    title: 'Silver Platform Heels',
    description: 'Statement platform heels in silver metallic leather. Ankle strap, 5-inch heel with 1-inch platform for comfort. Perfect for parties, clubs, and disco nights.',
    price: 165.00,
    tags: ['platform', 'silver', 'heels', 'metallic', 'party', 'statement', 'disco'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Mule Maven',
    title: 'Black Leather Pointed Mules',
    description: 'Chic pointed-toe mules in black leather. Kitten heel and backless design for easy on-and-off. Perfect for the office and elevating casual outfits.',
    price: 145.00,
    tags: ['mules', 'black', 'leather', 'pointed', 'kitten heel', 'work', 'chic'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Rain Ready',
    title: 'Hunter Green Rain Boots',
    description: 'Classic rain boots in hunter green rubber. Waterproof construction, cotton lining, and adjustable buckle strap. Perfect for rainy days and muddy adventures.',
    price: 125.00,
    tags: ['rain boots', 'green', 'rubber', 'waterproof', 'practical', 'outdoor', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Oxford Society',
    title: 'Tan Leather Oxford Shoes',
    description: 'Classic Oxford shoes in tan burnished leather. Brogue detailing, leather sole, and traditional lace-up closure. Perfect for smart casual and business casual settings.',
    price: 225.00,
    tags: ['oxford', 'tan', 'leather', 'brogue', 'classic', 'smart casual', 'traditional'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Pool Party',
    title: 'White Jelly Sandals',
    description: 'Fun jelly sandals in translucent white. Fisherman style with multiple straps and buckle closure. Waterproof and easy to clean. Perfect for pool parties and beach days.',
    price: 45.00,
    tags: ['jelly', 'sandals', 'white', 'waterproof', 'pool', 'beach', 'summer'],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Knee High Style',
    title: 'Black Suede Knee-High Boots',
    description: 'Elegant knee-high boots in black suede. Block heel, inner zip closure, and almond toe. Perfect for fall dresses and adding drama to jeans.',
    price: 295.00,
    tags: ['boots', 'knee-high', 'black', 'suede', 'fall', 'elegant', 'dramatic'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Sneaker Culture',
    title: 'Retro High-Top Sneakers',
    description: 'Vintage-inspired high-top sneakers in red and white canvas. Rubber toe cap, classic lacing, and cushioned insole. Perfect for casual days and retro styling.',
    price: 78.00,
    tags: ['sneakers', 'high-top', 'red', 'canvas', 'retro', 'vintage', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Luxe Leather',
    title: 'Black Leather Tote Bag',
    description: 'Spacious tote bag in pebbled black leather. Interior zip pocket, snap closure, and comfortable shoulder straps. Perfect for work, travel, and everyday essentials.',
    price: 295.00,
    tags: ['tote', 'black', 'leather', 'work', 'spacious', 'classic', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Evening Elegance',
    title: 'Gold Chain Clutch',
    description: 'Elegant clutch in gold metallic leather with detachable chain strap. Snap closure with interior slip pocket. Perfect for weddings, galas, and special occasions.',
    price: 165.00,
    tags: ['clutch', 'gold', 'evening', 'metallic', 'wedding', 'formal', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Crossbody Chic',
    title: 'Tan Leather Crossbody Bag',
    description: 'Compact crossbody bag in rich tan leather. Adjustable strap, zip closure, and multiple compartments. Perfect for hands-free days and weekend errands.',
    price: 145.00,
    tags: ['crossbody', 'tan', 'leather', 'compact', 'casual', 'hands-free', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Adventure Pack',
    title: 'Navy Canvas Backpack',
    description: 'Durable backpack in navy canvas with leather trim. Laptop sleeve, multiple pockets, and padded straps. Perfect for commuting, travel, and college.',
    price: 125.00,
    tags: ['backpack', 'navy', 'canvas', 'laptop', 'travel', 'practical', 'school'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Quilted Luxury',
    title: 'Black Quilted Chain Bag',
    description: 'Iconic quilted bag in black lambskin with gold chain strap. Flap closure with turn-lock and interior zip pocket. A timeless investment piece for any wardrobe.',
    price: 485.00,
    tags: ['quilted', 'black', 'chain', 'luxury', 'classic', 'investment', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Beach Days',
    title: 'Straw Beach Tote',
    description: 'Oversized tote in natural woven straw with leather handles. Open top and interior pocket. Perfect for beach days, farmers markets, and summer adventures.',
    price: 85.00,
    tags: ['straw', 'beach', 'tote', 'natural', 'summer', 'vacation', 'oversized'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Saddle Style',
    title: 'Brown Leather Saddle Bag',
    description: 'Boho-inspired saddle bag in cognac brown leather. Magnetic flap closure, adjustable crossbody strap, and tassel detail. Perfect for bohemian and western-inspired looks.',
    price: 175.00,
    tags: ['saddle bag', 'brown', 'leather', 'bohemian', 'western', 'crossbody', 'tassel'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Mini Moment',
    title: 'Red Leather Mini Bag',
    description: 'Adorable mini bag in cherry red leather with gold hardware. Top handle and detachable crossbody strap. Big enough for phone, cards, and lipstick.',
    price: 135.00,
    tags: ['mini', 'red', 'leather', 'statement', 'crossbody', 'trendy', 'colorful'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Work Essential',
    title: 'Structured Laptop Bag',
    description: 'Professional laptop bag in black saffiano leather. Fits 15" laptop with padded compartment. Multiple pockets and detachable shoulder strap. Perfect for business travel.',
    price: 245.00,
    tags: ['laptop', 'black', 'work', 'professional', 'structured', 'travel', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Bucket Brigade',
    title: 'Blush Leather Bucket Bag',
    description: 'Trendy bucket bag in soft blush pink leather. Drawstring closure, adjustable strap, and removable pouch. Perfect for spring days and adding softness to outfits.',
    price: 165.00,
    tags: ['bucket bag', 'pink', 'leather', 'trendy', 'spring', 'feminine', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Belt Bag Basics',
    title: 'Black Leather Belt Bag',
    description: 'Versatile belt bag in smooth black leather. Zip closure with adjustable belt strap. Wear around waist or crossbody. Perfect for concerts and hands-free convenience.',
    price: 95.00,
    tags: ['belt bag', 'black', 'leather', 'hands-free', 'casual', 'versatile', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Envelope Edge',
    title: 'Ivory Leather Envelope Clutch',
    description: 'Sleek envelope clutch in ivory leather with gold zip detail. Can be carried as clutch or tucked under arm. Perfect for weddings and evening events.',
    price: 125.00,
    tags: ['clutch', 'ivory', 'leather', 'envelope', 'evening', 'wedding', 'elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Weekender',
    title: 'Canvas Duffle Bag',
    description: 'Roomy duffle bag in olive canvas with leather accents. Zip closure, multiple pockets, and detachable shoulder strap. Perfect for weekend trips and gym sessions.',
    price: 145.00,
    tags: ['duffle', 'canvas', 'olive', 'travel', 'weekend', 'gym', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Chain Gang',
    title: 'Silver Chain Crossbody',
    description: 'Edgy crossbody bag in black leather with chunky silver chain strap. Flap closure and structured silhouette. Perfect for nights out and adding edge to outfits.',
    price: 175.00,
    tags: ['crossbody', 'black', 'chain', 'silver', 'edgy', 'evening', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Woven Wonder',
    title: 'Intrecciato Leather Clutch',
    description: 'Sophisticated clutch in woven navy leather. Zip closure and leather-lined interior. Artisanal craftsmanship. Perfect for those who appreciate understated luxury.',
    price: 385.00,
    tags: ['woven', 'navy', 'leather', 'luxury', 'clutch', 'artisan', 'sophisticated'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Market Fresh',
    title: 'Cotton Mesh Market Bag',
    description: 'Eco-friendly market bag in natural cotton mesh. Expandable design holds plenty of groceries. Perfect for farmers markets and sustainable shopping.',
    price: 28.00,
    tags: ['mesh', 'cotton', 'eco-friendly', 'market', 'sustainable', 'natural', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Doctor Style',
    title: 'Burgundy Doctor Bag',
    description: 'Vintage-inspired doctor bag in burgundy leather. Frame closure with kiss-lock, dual handles, and detachable strap. Perfect for those who love structured, classic styles.',
    price: 265.00,
    tags: ['doctor bag', 'burgundy', 'leather', 'vintage', 'structured', 'classic', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Sequin Night',
    title: 'Black Sequin Evening Bag',
    description: 'Dazzling evening bag covered in black sequins. Snap closure with chain strap. Compact size for essentials. Perfect for parties, proms, and New Year\'s Eve.',
    price: 95.00,
    tags: ['sequin', 'black', 'evening', 'party', 'glamorous', 'compact', 'special occasion'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Hobo Life',
    title: 'Camel Leather Hobo Bag',
    description: 'Relaxed hobo bag in soft camel leather. Slouchy silhouette, magnetic closure, and single shoulder strap. Perfect for casual days when you need room for everything.',
    price: 195.00,
    tags: ['hobo', 'camel', 'leather', 'casual', 'slouchy', 'spacious', 'relaxed'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Clear Trend',
    title: 'Transparent PVC Tote',
    description: 'Trendy transparent tote in clear PVC with leather trim. Includes removable zip pouch. Stadium-approved size. Perfect for concerts, sporting events, and festivals.',
    price: 75.00,
    tags: ['transparent', 'clear', 'tote', 'stadium', 'trendy', 'festival', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Gold Standards',
    title: 'Classic Gold Hoop Earrings',
    description: '14K gold hoop earrings in medium size. Smooth finish with click-top closure. Lightweight and comfortable for all-day wear. A timeless staple for any jewelry collection.',
    price: 195.00,
    tags: ['earrings', 'hoops', 'gold', 'classic', 'everyday', 'timeless', '14k'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Pearl Dreams',
    title: 'Freshwater Pearl Necklace',
    description: 'Elegant strand of AAA freshwater pearls with sterling silver clasp. 18-inch length with cream-colored pearls. Perfect for weddings, formal events, and adding sophistication.',
    price: 245.00,
    tags: ['necklace', 'pearls', 'classic', 'elegant', 'wedding', 'formal', 'timeless'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Tennis Time',
    title: 'Diamond Tennis Bracelet',
    description: 'Sparkling tennis bracelet with round brilliant diamonds in 14K white gold setting. 3 carat total weight. Box clasp with safety latch. An elegant classic for special occasions.',
    price: 2850.00,
    tags: ['bracelet', 'diamond', 'tennis', 'white gold', 'luxury', 'elegant', 'special occasion'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Layered Love',
    title: 'Delicate Gold Chain Necklace Set',
    description: 'Set of three dainty gold chains in varying lengths (16", 18", 20"). 14K gold-filled with minimal pendants. Perfect for layering or wearing individually.',
    price: 125.00,
    tags: ['necklace', 'gold', 'layered', 'dainty', 'minimal', 'set', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Statement Piece',
    title: 'Turquoise Statement Earrings',
    description: 'Bold drop earrings featuring natural turquoise stones in sterling silver setting. Post back with 2-inch drop. Perfect for summer and southwestern-inspired looks.',
    price: 85.00,
    tags: ['earrings', 'turquoise', 'statement', 'silver', 'bohemian', 'summer', 'bold'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Stacking Rings',
    title: 'Gold Stackable Ring Set',
    description: 'Set of five thin gold rings in varying textures: smooth, twisted, beaded, and hammered. 14K gold-fill. Mix, match, and stack for personalized styling.',
    price: 95.00,
    tags: ['rings', 'gold', 'stackable', 'set', 'minimal', 'everyday', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Charm School',
    title: 'Gold Charm Bracelet',
    description: 'Classic charm bracelet in 14K gold with selection of charms: heart, star, moon, and initial. Lobster clasp closure. Add more charms to personalize over time.',
    price: 225.00,
    tags: ['bracelet', 'charm', 'gold', 'personalized', 'classic', 'gift', 'meaningful'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Cuff Culture',
    title: 'Wide Silver Cuff Bracelet',
    description: 'Bold cuff bracelet in hammered sterling silver. 1.5 inches wide with adjustable opening. Handcrafted with artisan details. A statement piece for minimalists.',
    price: 145.00,
    tags: ['bracelet', 'cuff', 'silver', 'statement', 'artisan', 'bold', 'handcrafted'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Sparkle Society',
    title: 'Crystal Chandelier Earrings',
    description: 'Glamorous chandelier earrings with cascading crystals in silver setting. Post back with 3-inch drop. Perfect for weddings, galas, and special occasions.',
    price: 125.00,
    tags: ['earrings', 'chandelier', 'crystal', 'glamorous', 'wedding', 'statement', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Signet Style',
    title: 'Gold Signet Ring',
    description: 'Classic signet ring in 14K gold with flat oval face. Can be engraved with initials. Available in sizes 5-10. A timeless piece for everyday elegance.',
    price: 285.00,
    tags: ['ring', 'signet', 'gold', 'classic', 'engravable', 'personalized', 'timeless'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Pendant Perfect',
    title: 'Diamond Solitaire Pendant',
    description: 'Elegant pendant with round brilliant diamond in 14K white gold prong setting. 0.5 carat diamond on 18-inch chain. A classic gift and everyday luxury.',
    price: 985.00,
    tags: ['pendant', 'diamond', 'white gold', 'solitaire', 'classic', 'luxury', 'gift'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Bar None',
    title: 'Minimalist Bar Necklace',
    description: 'Delicate necklace with horizontal gold bar pendant. 16-inch 14K gold chain. Can be engraved with name or date. Perfect for everyday minimalist style.',
    price: 75.00,
    tags: ['necklace', 'bar', 'gold', 'minimal', 'everyday', 'engravable', 'dainty'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Huggie Haven',
    title: 'Small Gold Huggie Earrings',
    description: 'Tiny huggie hoop earrings in 14K gold. Hinged closure that hugs the earlobe. Perfect for second piercings or minimalist everyday wear.',
    price: 85.00,
    tags: ['earrings', 'huggie', 'gold', 'small', 'minimal', 'everyday', '14k'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Vintage Treasure',
    title: 'Art Deco Cocktail Ring',
    description: 'Stunning cocktail ring inspired by Art Deco design. Central emerald-cut stone surrounded by pavé crystals in silver setting. Perfect for special occasions and collectors.',
    price: 165.00,
    tags: ['ring', 'cocktail', 'art deco', 'vintage', 'statement', 'emerald cut', 'glamorous'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Chain Gang',
    title: 'Chunky Gold Chain Necklace',
    description: 'Bold chain necklace in 14K gold-plated brass. Chunky cable links with toggle closure. 16-inch length. Perfect for making a statement with simple outfits.',
    price: 95.00,
    tags: ['necklace', 'chain', 'gold', 'chunky', 'statement', 'bold', 'trendy'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Ear Climber Co',
    title: 'Crystal Ear Climber',
    description: 'Trendy ear climber earring with graduated crystals that climb up the ear. Single earring design. Sterling silver. Perfect for adding modern edge to any look.',
    price: 65.00,
    tags: ['earrings', 'ear climber', 'crystal', 'silver', 'modern', 'trendy', 'edgy'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Birthstone Beauty',
    title: 'Birthstone Pendant Necklace',
    description: 'Personalized pendant with your birthstone in 14K gold bezel setting. 16-inch chain with 2-inch extender. Available in all 12 birthstones. A meaningful gift.',
    price: 135.00,
    tags: ['pendant', 'birthstone', 'gold', 'personalized', 'gift', 'meaningful', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Bangle Brigade',
    title: 'Thin Gold Bangle Set',
    description: 'Set of three thin bangles in 14K gold with varying finishes: polished, brushed, and textured. Stack together or wear with other bracelets.',
    price: 195.00,
    tags: ['bangles', 'gold', 'set', 'stackable', 'minimal', 'classic', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Tassel Time',
    title: 'Silk Tassel Earrings',
    description: 'Fun tassel earrings in deep navy silk with gold cap. Post back with 3-inch drop. Lightweight and dramatic. Perfect for summer evenings and resort wear.',
    price: 48.00,
    tags: ['earrings', 'tassel', 'navy', 'silk', 'statement', 'summer', 'dramatic'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Initial Love',
    title: 'Gold Initial Pendant',
    description: 'Classic initial pendant in 14K gold on 16-inch chain. Script letter with diamond accent. Available in all letters. Perfect personalized gift.',
    price: 165.00,
    tags: ['pendant', 'initial', 'gold', 'personalized', 'diamond', 'gift', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Silk Dreams',
    title: 'Floral Silk Scarf',
    description: 'Luxurious silk scarf with vibrant floral print in pink and green. 36-inch square. Versatile styling: wear as headscarf, neck tie, or bag accessory.',
    price: 125.00,
    tags: ['scarf', 'silk', 'floral', 'colorful', 'versatile', 'luxury', 'accessory'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Belt Boutique',
    title: 'Black Leather Belt with Gold Buckle',
    description: 'Classic belt in smooth black leather with polished gold buckle. 1-inch width. Available in sizes XS-XL. A wardrobe essential for jeans and trousers.',
    price: 75.00,
    tags: ['belt', 'black', 'leather', 'gold', 'classic', 'essential', 'wardrobe staple'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Shade Society',
    title: 'Black Oversized Sunglasses',
    description: 'Glamorous oversized sunglasses in black acetate with gradient lenses. UV400 protection. Classic cat-eye shape. Perfect for adding mystery and drama.',
    price: 145.00,
    tags: ['sunglasses', 'black', 'oversized', 'cat-eye', 'glamorous', 'UV protection', 'summer'],
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Hat Trick',
    title: 'Tan Wool Fedora',
    description: 'Classic fedora hat in tan wool felt with brown grosgrain ribbon. Structured crown and snap brim. Perfect for fall outfits and adding sophisticated flair.',
    price: 88.00,
    tags: ['hat', 'fedora', 'tan', 'wool', 'fall', 'classic', 'sophisticated'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Timepiece',
    title: 'Gold Minimalist Watch',
    description: 'Elegant watch with gold-tone case, white dial, and tan leather strap. Japanese quartz movement. Water-resistant. A classic timepiece for everyday elegance.',
    price: 185.00,
    tags: ['watch', 'gold', 'minimalist', 'leather', 'classic', 'elegant', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Cashmere Comfort',
    title: 'Gray Cashmere Wrap',
    description: 'Luxuriously soft wrap in heather gray cashmere. Oversized at 28" x 80" for versatile styling. Perfect for travel, chilly offices, and evening wrap.',
    price: 295.00,
    tags: ['wrap', 'cashmere', 'gray', 'luxury', 'travel', 'versatile', 'soft'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Glove Love',
    title: 'Black Leather Driving Gloves',
    description: 'Sleek driving gloves in black lambskin leather. Perforated palms and snap closure at wrist. Cashmere lined. Perfect for driving and cold weather elegance.',
    price: 125.00,
    tags: ['gloves', 'black', 'leather', 'driving', 'winter', 'elegant', 'luxury'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Hair Flair',
    title: 'Tortoiseshell Hair Claw Clip',
    description: 'Classic claw clip in tortoiseshell acetate. Large size holds thick hair securely. Spring-loaded mechanism. A chic and practical hair accessory.',
    price: 24.00,
    tags: ['hair clip', 'tortoiseshell', 'hair accessory', 'practical', 'classic', 'everyday', 'trendy'],
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Umbrella Chic',
    title: 'Compact Travel Umbrella',
    description: 'Compact umbrella in navy with automatic open/close. Wind-resistant frame and water-repellent canopy. Fits in handbag. A rainy day essential.',
    price: 45.00,
    tags: ['umbrella', 'navy', 'compact', 'travel', 'practical', 'rain', 'essential'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Wallet Works',
    title: 'Burgundy Leather Wallet',
    description: 'Slim wallet in burgundy pebbled leather. 12 card slots, ID window, and zip coin pocket. RFID blocking. Perfect for organized essentials.',
    price: 95.00,
    tags: ['wallet', 'burgundy', 'leather', 'RFID', 'practical', 'organized', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Beanie Basics',
    title: 'Chunky Knit Beanie',
    description: 'Cozy beanie in chunky cream knit with fold-up brim. Soft acrylic blend. One size fits most. Perfect for cold weather and après-ski style.',
    price: 35.00,
    tags: ['beanie', 'cream', 'knit', 'winter', 'cozy', 'chunky', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Aviator Classic',
    title: 'Gold Aviator Sunglasses',
    description: 'Classic aviator sunglasses with gold metal frames and green gradient lenses. UV400 protection. Adjustable nose pads. A timeless unisex style.',
    price: 165.00,
    tags: ['sunglasses', 'aviator', 'gold', 'classic', 'unisex', 'UV protection', 'timeless'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Headband Haven',
    title: 'Velvet Padded Headband',
    description: 'On-trend padded headband in emerald green velvet. Wide design with comfortable fit. Perfect for adding polish to any hairstyle, especially for the holidays.',
    price: 38.00,
    tags: ['headband', 'velvet', 'green', 'padded', 'trendy', 'hair accessory', 'holiday'],
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Card Case Co',
    title: 'Navy Leather Card Holder',
    description: 'Slim card holder in navy saffiano leather. Holds 6 cards with center pocket for folded bills. Perfect for minimalists who prefer to travel light.',
    price: 55.00,
    tags: ['card holder', 'navy', 'leather', 'slim', 'minimalist', 'practical', 'everyday'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Blanket Scarf',
    title: 'Plaid Blanket Scarf',
    description: 'Oversized scarf in classic red and black plaid. Soft brushed acrylic. Generous 60" x 60" size. Can be worn as scarf, wrap, or cozy blanket.',
    price: 65.00,
    tags: ['scarf', 'plaid', 'red', 'oversized', 'winter', 'cozy', 'versatile'],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Tech Touch',
    title: 'Touchscreen Leather Gloves',
    description: 'Sleek gloves in black leather with touchscreen-compatible fingertips. Cashmere lined for warmth. Stay connected without getting cold hands.',
    price: 98.00,
    tags: ['gloves', 'black', 'leather', 'touchscreen', 'winter', 'tech', 'practical'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Ribbon Royale',
    title: 'Silk Hair Bow',
    description: 'Elegant hair bow in black silk with barrette clip. Oversized design makes a feminine statement. Perfect for adding polish to updos and ponytails.',
    price: 42.00,
    tags: ['hair bow', 'silk', 'black', 'feminine', 'elegant', 'hair accessory', 'statement'],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Straw Style',
    title: 'Wide Brim Straw Sun Hat',
    description: 'Classic sun hat in natural straw with black ribbon band. Wide brim for full sun protection. Packable. Perfect for beach days and garden parties.',
    price: 68.00,
    tags: ['hat', 'straw', 'sun hat', 'summer', 'beach', 'natural', 'packable'],
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Key to Style',
    title: 'Leather Tassel Keychain',
    description: 'Chic keychain with leather tassel in coral and gold-tone hardware. Clip attaches to bag or keys. Perfect for adding color and finding keys easily.',
    price: 28.00,
    tags: ['keychain', 'tassel', 'leather', 'coral', 'gold', 'accessory', 'gift'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Phone Fashion',
    title: 'Quilted Phone Crossbody',
    description: 'Compact crossbody designed for phone. Quilted black faux leather with card slot. Adjustable strap. Perfect for errands and hands-free convenience.',
    price: 48.00,
    tags: ['phone case', 'crossbody', 'black', 'quilted', 'hands-free', 'practical', 'compact'],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Elysian Couture',
    title: 'Midnight Elegance Gown',
    description: 'The Midnight Elegance Gown is crafted from a luxurious silk blend that drapes beautifully, featuring intricate hand-embroidered floral patterns along the neckline. Perfect for evening galas or sophisticated cocktail parties, this all-season dress boasts a sleeveless design with a flattering A-line silhouette and a hidden back zipper for a seamless fit.',
    price: 810.85,
    tags: ["evening dress","silk gown","black tie","all-season","floral embroidery","A-line","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Autumn Atelier',
    title: 'Cinnamon Twill Shift Dress',
    description: 'The Cinnamon Twill Shift Dress is crafted from a luxurious blend of cotton and modal, providing a soft, breathable feel perfect for fall. Featuring a tailored silhouette with three-quarter sleeves and subtle side pockets, this dress is ideal for business casual settings and can easily transition from office meetings to evening gatherings. The rich cinnamon hue adds a warm touch to your autumn wardrobe, making it a versatile staple.',
    price: 142.45,
    tags: ["business casual","fall fashion","shift dress","modular style","warm colors","office wear"],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Cielo & Co.',
    title: 'Lavender Breeze A-Line Dress',
    description: 'The Lavender Breeze A-Line Dress is crafted from lightweight, breathable cotton-silk blend, perfect for spring occasions. With its delicate floral embroidery and a cinched waist, this dress not only flatters a variety of body types but also adds a touch of elegance to garden parties or formal brunches. The soft lavender hue and flutter sleeves make it a delightful choice for any fashion-forward woman looking to embrace the season.',
    price: 179.44,
    tags: ["formal","spring","A-line","cotton-silk","floral","elegant","Cielo & Co."],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Earth & Echo',
    title: 'Wanderlust Boho Maxi Dress',
    description: 'The Wanderlust Boho Maxi Dress features a flowing silhouette crafted from a lightweight organic cotton-linen blend, perfect for warm spring days. Adorned with intricate embroidered patterns and delicate lace trim, this dress is designed for outdoor gatherings or sunny brunches, offering both comfort and style. Its adjustable waist tie and side slits enhance movement, making it a versatile addition to your spring wardrobe.',
    price: 1220.09,
    tags: ["bohemian","spring fashion","maxi dress","sustainable","outdoor","casual elegance","embroidery"],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Luna & Lark',
    title: 'Serenity Silk Wrap Dress',
    description: 'This exquisite Serenity Silk Wrap Dress is crafted from 100% lightweight silk, making it perfect for spring events. Its elegant wrap design flatters the figure while the delicate floral print adds a touch of whimsy, ideal for garden parties or formal brunches. The dress features subtle ruffle details along the sleeves and hem, enhancing its romantic appeal.',
    price: 439.12,
    tags: ["spring","formal","silk","floral","wrap dress","elegant","Luna & Lark"],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Velvet & Vine',
    title: 'Charcoal Chic Midi Dress',
    description: 'Elevate your winter workwear with the Charcoal Chic Midi Dress from Velvet & Vine. Crafted from a luxurious blend of merino wool and soft viscose, this dress features a tailored silhouette with structured shoulders and a flattering A-line skirt. Perfect for business meetings or elegant evening events, it combines warmth with sophistication, while its knee-length cut ensures a polished look in any setting.',
    price: 264.12,
    tags: ["business casual","winter fashion","midi dress","office wear","sophisticated","merino wool","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Urban Nomad',
    title: 'Horizon Layered Maxi Dress',
    description: 'The Horizon Layered Maxi Dress combines urban edge with winter warmth, featuring a unique blend of recycled polyester and soft wool for insulation. Its asymmetrical hem and oversized hood offer a contemporary silhouette, making it perfect for both casual outings and winter festivals. This dress is designed to be layered, allowing for versatility in your streetwear wardrobe.',
    price: 590.37,
    tags: ["streetwear","winter","maxi dress","layered","urban fashion","recycled materials","trendy"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Urban Threads',
    title: 'Chloe Utility Midi Dress',
    description: 'The Chloe Utility Midi Dress combines function and style for the perfect spring streetwear look. Made from a breathable cotton-linen blend, this dress features oversized pockets, adjustable straps, and a relaxed fit, making it ideal for casual outings or urban adventures. Pair it with sneakers for a day in the park or elevate it with chunky sandals for a night out.',
    price: 247.37,
    tags: ["spring","streetwear","utility","midi dress","casual","urban","sustainable fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'LuxeEvening',
    title: 'Midnight Velvet Wrap Dress',
    description: 'The Midnight Velvet Wrap Dress is an exquisite evening gown made from a sumptuous blend of velvet and silk, providing a soft and luxurious feel against the skin. Its flattering wrap design cinches at the waist and features long sleeves, making it perfect for winter soirées. Ideal for cocktail parties or formal gatherings, this elegant dress combines comfort with sophistication.',
    price: 28.02,
    tags: ["evening dress","winter fashion","velvet","cocktail attire","formal wear","LuxeEvening","wrap dress"],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Vintage Vogue',
    title: 'Retro Floral Velvet Midi Dress',
    description: 'Embrace the charm of yesteryear with the Retro Floral Velvet Midi Dress, crafted from soft, luxurious velvet that offers both warmth and style for the winter season. This stunning dress features a classic A-line silhouette, long bell sleeves, and intricate floral patterns, making it perfect for holiday parties or cozy gatherings. Pair it with your favorite boots and a statement necklace for a complete vintage look.',
    price: 34.01,
    tags: ["vintage","winter","velvet","midi dress","floral","retro","holiday"],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Luxe Atelier',
    title: 'Silk Chiffon Elegance Cocktail Dress',
    description: 'Crafted from premium silk chiffon, this exquisite cocktail dress drapes beautifully, offering a flattering silhouette for all body types. With its delicate, hand-embroidered floral appliqués and an adjustable tie-back detail, it\'s perfect for sophisticated evening events or upscale gatherings year-round.',
    price: 1245.67,
    tags: ["cocktail","silk","all-season","elegant","hand-embroidered","evening wear","luxury"],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Elysian Couture',
    title: 'Spring Elegance A-Line Dress',
    description: 'Embrace the charm of spring with the Spring Elegance A-Line Dress by Elysian Couture. Crafted from a lightweight blend of cotton and polyester, this dress features delicate floral embroidery and a flattering cinched waist, perfect for garden parties or formal brunches. Its soft pastel colors and breathable fabric make it an ideal choice for warm weather occasions.',
    price: 29.9,
    tags: ["formal","spring","A-line","floral","cotton blend","Elysian Couture","brunch"],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'LuxeLine',
    title: 'Pinnacle Shift Dress',
    description: 'The Pinnacle Shift Dress by LuxeLine is crafted from a breathable blend of cotton and spandex, providing ultimate comfort for all-day wear. Featuring a tailored silhouette with three-quarter sleeves and subtle side pockets, this dress transitions effortlessly from office meetings to after-work gatherings. Its versatile navy hue and elegant stitch detailing make it a timeless addition to any business casual wardrobe.',
    price: 48.96,
    tags: ["business casual","all-season","shift dress","navy","comfortable","elegant","office wear"],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Vintage Vogue',
    title: 'Evelyn Floral Midi Dress',
    description: 'The Evelyn Floral Midi Dress is a stunning piece crafted from a lightweight cotton-linen blend, perfect for year-round wear. Its vintage-inspired silhouette features a fitted bodice with delicate lace trim, flowing into a flared skirt adorned with a charming floral print, making it ideal for garden parties or afternoon tea. With its versatile design, this dress easily transitions from day to night with the addition of statement accessories.',
    price: 599.97,
    tags: ["vintage","floral","midi dress","all-season","cotton-linen","garden party","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'La Belle Époque',
    title: 'Floral Chiffon Tea Dress',
    description: 'This enchanting vintage-inspired tea dress features a delicate floral print on lightweight chiffon, perfect for warm summer days. With its flattering A-line silhouette, short puff sleeves, and a cinched waist, it offers both comfort and elegance, making it ideal for garden parties or afternoon tea gatherings. The dress is fully lined for added comfort and has a subtle back zipper for easy wear.',
    price: 127.68,
    tags: ["vintage","summer dress","floral print","chiffon","A-line","tea party","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Vintage Vogue',
    title: 'Evelyn Floral Midi Dress',
    description: 'The Evelyn Floral Midi Dress is a stunning vintage-inspired piece crafted from a soft blend of cotton and rayon, ensuring comfort and breathability for all seasons. Featuring a flattering A-line silhouette with delicate lace trim and an elegant scoop neckline, this dress is perfect for garden parties, brunches, or casual outings. The vibrant floral print adds a touch of timeless charm, making it a versatile addition to any wardrobe.',
    price: 164.3,
    tags: ["vintage","floral","midi dress","all-season","brunch","A-line","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'LuxeNoir',
    title: 'Midnight Velvet Gown',
    description: 'The Midnight Velvet Gown by LuxeNoir is an exquisite evening dress crafted from sumptuous velvet fabric, perfect for winter soirées. This floor-length gown features a plunging neckline and elegant long sleeves, accented with delicate lace trim to enhance its sophisticated allure. Ideal for formal occasions, this dress promises to keep you warm while making a striking impression.',
    price: 289.56,
    tags: ["evening dress","winter fashion","velvet gown","formal wear","LuxeNoir","elegant style","party attire"],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Nordic Threads',
    title: 'Sienna Wool-Blend Turtleneck Dress',
    description: 'The Sienna Wool-Blend Turtleneck Dress combines elegance and warmth, featuring a sleek silhouette crafted from a soft wool and acrylic blend. Its minimalist design includes a high turtleneck and long sleeves, making it perfect for layering during chilly winter events or casual outings. Pair it with knee-high boots for a chic, effortless look.',
    price: 100.76,
    tags: ["winter","minimalist","wool blend","turtleneck","elegant","casual","chic"],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Vintage Vogue',
    title: 'Autumn Enchantment Midi Dress',
    description: 'Embrace the charm of fall with the Autumn Enchantment Midi Dress, crafted from a luxurious blend of soft cotton and silk for a comfortable yet elegant fit. The dress features a classic A-line silhouette with delicate lace accents, long puff sleeves, and a rich burgundy color adorned with intricate floral prints, making it perfect for a cozy evening out or a festive gathering. Pair it with ankle boots for a chic, vintage-inspired look.',
    price: 588.26,
    tags: ["vintage","fall fashion","elegant","midi dress","floral print","cotton silk blend","bohemian"],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Willow & Oak',
    title: 'Autumn Breeze Midi Dress',
    description: 'The Autumn Breeze Midi Dress is crafted from a soft, breathable blend of modal and cotton, perfect for layering during the cooler months. Its tailored silhouette features a subtle A-line cut, a chic v-neck, and three-quarter sleeves, making it ideal for business casual settings or weekend brunches. Available in a warm ochre hue, this dress effortlessly combines style and comfort, ensuring you look polished while staying cozy.',
    price: 64.02,
    tags: ["business casual","fall fashion","midi dress","layering","modal blend","ochre","chic"],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'LuxeVerve',
    title: 'Spring Blossom A-Line Dress',
    description: 'The Spring Blossom A-Line Dress by LuxeVerve is crafted from a luxurious blend of silk and chiffon, featuring a delicate floral print that embodies the essence of spring. This elegant piece is designed with a fitted bodice, flowing skirt, and subtle cap sleeves, making it perfect for formal occasions such as garden weddings or upscale brunches. The dress is fully lined for comfort and boasts a hidden zip closure for a seamless look.',
    price: 1225.07,
    tags: ["formal","spring","A-line","floral","luxury","wedding","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'LuxeEver',
    title: 'Evelyn Silk Blend Cocktail Dress',
    description: 'The Evelyn Silk Blend Cocktail Dress combines elegance and versatility, crafted from a luxurious silk-cotton blend that drapes beautifully on all body types. Featuring a timeless A-line silhouette, delicate cap sleeves, and a cinched waist adorned with a satin belt, this dress is perfect for cocktail parties, weddings, or any special occasion throughout the year. Available in deep emerald green, it effortlessly transitions from day to night with the right accessories.',
    price: 268.86,
    tags: ["cocktail","all-season","elegant","silk blend","A-line","wedding guest","LuxeEver"],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Urban Elegance',
    title: 'Versatile Wrap Dress',
    description: 'The Urban Elegance Versatile Wrap Dress is designed for the modern professional who seeks comfort without sacrificing style. Crafted from a soft, breathable blend of cotton and spandex, this dress features a flattering wrap silhouette that accentuates the waist, three-quarter sleeves, and a knee-length hem, making it perfect for meetings or after-work gatherings. Ideal for all seasons, it easily transitions from day to night with the right accessories.',
    price: 51.44,
    tags: ["business casual","all-season","wrap dress","comfortable","professional","versatile","urban style"],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'LuxeFit',
    title: 'Spring Breeze Athleisure Dress',
    description: 'The Spring Breeze Athleisure Dress by LuxeFit combines comfort with style, crafted from a lightweight blend of 65% cotton and 35% spandex for ultimate stretch and breathability. Featuring a racerback design and side pockets, this versatile dress is perfect for a casual day out or a post-workout brunch. Ideal for spring, it drapes beautifully while providing ease of movement, making it a must-have for your active wardrobe.',
    price: 70.82,
    tags: ["athleisure","spring fashion","casual dress","fitness wear","everyday style","lightweight","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Luna & Lace',
    title: 'Spring Breeze Floral Midi Dress',
    description: 'Embrace the essence of spring with the Spring Breeze Floral Midi Dress from Luna & Lace. Crafted from a lightweight blend of organic cotton and linen, this dress features a vibrant floral print with delicate ruffle detailing along the sleeves and hem. Perfect for outdoor brunches or garden parties, it combines comfort and style with a flattering A-line silhouette that drapes beautifully over the body.',
    price: 582.86,
    tags: ["floral","midi dress","spring fashion","casual style","organic materials","outdoor events","Luna & Lace"],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Urban Nomad',
    title: 'Breezy Graphic Shift Dress',
    description: 'Embrace the summer vibes with the Breezy Graphic Shift Dress from Urban Nomad. Made from a lightweight blend of organic cotton and recycled polyester, this dress features bold, hand-drawn graphics that capture the essence of street art. Perfect for casual outings or music festivals, its loose fit and breathable fabric ensure comfort while you stay stylish under the sun.',
    price: 63.24,
    tags: ["summer","streetwear","graphic","casual","festival","lightweight","sustainable"],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Luna & Co.',
    title: 'Florence Everyday Midi Dress',
    description: 'The Florence Everyday Midi Dress from Luna & Co. is crafted from a luxurious blend of organic cotton and Tencel, ensuring a soft, breathable feel that’s perfect for any season. This versatile dress features a relaxed silhouette with adjustable waist ties, side pockets, and a unique watercolor floral print that adds a touch of elegance, making it suitable for casual outings or a relaxed day at home.',
    price: 811.75,
    tags: ["casual","all-season","midi dress","floral print","sustainable fashion","relaxed fit","ladies fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Elysian Threads',
    title: 'Luna Breeze Midi Dress',
    description: 'The Luna Breeze Midi Dress is crafted from a lightweight, breathable linen-blend fabric, perfect for warm summer days. Its minimalist silhouette features a delicate square neckline and flowing A-line skirt, making it an ideal choice for garden parties or casual brunches. Subtle side pockets add a practical touch without compromising the elegant design.',
    price: 678,
    tags: ["minimalist","summer dress","linen blend","elegant","casual","garden party","A-line"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'UrbanNomad',
    title: 'Sunkissed Utility Dress',
    description: 'The Sunkissed Utility Dress from UrbanNomad is your perfect companion for summer adventures. Crafted from lightweight, breathable cotton blend fabric, this dress features a stylish cargo design with adjustable straps, a cinched waist for a flattering silhouette, and multiple pockets for practicality. Ideal for casual outings or music festivals, it seamlessly blends functionality with a trendy streetwear aesthetic.',
    price: 194.8,
    tags: ["summer","streetwear","utility","casual","fashion","lightweight","adventure"],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'UrbanThreads',
    title: 'Luna Breeze Midi Dress',
    description: 'Embrace the summer vibes with the Luna Breeze Midi Dress, crafted from lightweight, breathable cotton and linen blend. This streetwear-inspired dress features a relaxed fit, adjustable spaghetti straps, and a playful side slit for added flair. Perfect for casual outings or beach parties, this dress combines comfort with style, making it a must-have for your summer wardrobe.',
    price: 66.15,
    tags: ["summer dress","streetwear","casual","lightweight","beachwear","adjustable straps","midi length"],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Ava & Co.',
    title: 'Classic Chambray Midi Dress',
    description: 'The Classic Chambray Midi Dress by Ava & Co. combines effortless style with everyday comfort. Made from a lightweight cotton blend, this dress features a relaxed fit, adjustable waist tie, and side pockets, making it perfect for casual outings or weekend brunches. With its versatile design, this dress transitions seamlessly from spring to winter when layered with a cozy cardigan.',
    price: 62.73,
    tags: ["casual","all-season","midi dress","chambray","comfortable","versatile","weekend wear"],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Luna Atelier',
    title: 'Elysian Garden Midi Dress',
    description: 'The Elysian Garden Midi Dress from Luna Atelier is a stunning embodiment of minimalist elegance, crafted from a luxurious blend of organic cotton and Tencel. This dress features a timeless A-line silhouette, subtle side pockets, and delicate flutter sleeves, making it perfect for both casual brunches and garden parties in the spring. Its soft, breathable fabric ensures comfort while maintaining an effortlessly chic appearance.',
    price: 1283.26,
    tags: ["minimalist","spring","elegant","organic","A-line","sustainable","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Celestria Couture',
    title: 'Midnight Elegance Cocktail Dress',
    description: 'The Midnight Elegance Cocktail Dress is crafted from a luxurious blend of silk and chiffon, offering a soft drape and a flattering silhouette. This versatile piece features intricate lace detailing along the bodice and a subtle A-line skirt that moves gracefully with every step, making it perfect for cocktail parties, upscale dinners, or intimate gatherings year-round.',
    price: 1088.13,
    tags: ["cocktail dress","all-season","silk","elegant","lace detail","Celestria Couture","luxury"],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Elara Couture',
    title: 'Spring Chiffon Elegance Dress',
    description: 'Elevate your formal wardrobe with the Spring Chiffon Elegance Dress by Elara Couture, crafted from lightweight, breathable chiffon in a soft pastel hue perfect for the season. This dress features a fitted bodice with delicate lace overlays and flowing A-line skirts that gracefully cascade to the knee, making it ideal for spring weddings or elegant garden parties. The intricate detailing and comfortable fit ensure you look stunning while feeling at ease throughout the day.',
    price: 583.29,
    tags: ["formal","spring","chiffon","elegant","wedding","garden party","lace"],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Elysian Couture',
    title: 'Midnight Velvet Cocktail Dress',
    description: 'This luxurious cocktail dress features a rich midnight blue velvet fabric that drapes beautifully, accentuating the figure while providing warmth for winter events. With an elegant off-the-shoulder neckline and intricate lace detailing at the cuffs, this dress is perfect for formal gatherings, holiday parties, or upscale dinners. The fully lined interior ensures comfort, while the concealed zipper at the back allows for a seamless fit.',
    price: 1381.57,
    tags: ["cocktail","winter","velvet","elegant","formal","luxury","off-the-shoulder"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Elysian Couture',
    title: 'Midnight Blossom Cocktail Dress',
    description: 'The Midnight Blossom Cocktail Dress is crafted from a luxurious blend of lightweight silk and soft chiffon, ensuring comfort and elegance for any occasion. Its enchanting floral print combined with a flattering A-line silhouette makes it perfect for cocktail parties or formal gatherings year-round. Features include a delicate lace trim at the neckline and a cinched waist for a graceful fit.',
    price: 111.36,
    tags: ["cocktail","elegant","all-season","floral","A-line","formal","Elysian Couture"],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Urban Muse',
    title: 'Layered Utility Midi Dress',
    description: 'The Layered Utility Midi Dress by Urban Muse is crafted from a lightweight organic cotton blend, featuring oversized pockets and adjustable straps for a customizable fit. This streetwear-inspired dress is perfect for casual outings or a laid-back day in the city, allowing you to layer it with a tee or wear it solo. Its versatile design makes it suitable for all seasons, pairing effortlessly with sneakers or ankle boots.',
    price: 63.86,
    tags: ["streetwear","midi dress","all-season","urban fashion","casual wear","sustainable","adjustable"],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'UrbanFlair',
    title: 'Chic Utility Midi Dress',
    description: 'The Chic Utility Midi Dress from UrbanFlair combines streetwear vibes with functional elegance. Crafted from a lightweight, breathable cotton blend, this dress features oversized pockets and an adjustable drawstring waist for a customizable fit. Perfect for casual outings or a brunch date in the spring, it effortlessly blends comfort with style.',
    price: 47.09,
    tags: ["streetwear","spring","midi dress","utility fashion","casual","UrbanFlair","trendy"],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Maple & Co.',
    title: 'Autumn Breeze Midi Dress',
    description: 'Embrace the cozy charm of fall with the Autumn Breeze Midi Dress by Maple & Co. Crafted from a soft, lightweight cotton blend with a hint of stretch, this dress features a flattering A-line silhouette, long sleeves, and a playful leaf print that captures the essence of the season. Perfect for casual outings or weekend brunches, it pairs beautifully with ankle boots and a chunky cardigan.',
    price: 127.78,
    tags: ["fall fashion","casual dress","autumn style","leaf print","comfortable","A-line","weekend wear"],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Elysian Threads',
    title: 'Cascading Elegance Midi Dress',
    description: 'Crafted from a luxurious blend of organic cotton and Tencel, the Cascading Elegance Midi Dress features a subtle A-line silhouette that flatters all body types. The minimalist design is accentuated by a unique asymmetrical hemline, making it perfect for both casual outings and more formal occasions this fall. With its warm taupe color and soft texture, this dress seamlessly transitions from day to night.',
    price: 326.02,
    tags: ["minimalist","fall fashion","midi dress","sustainable","casual elegance","organic materials","asymmetrical"],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Lune Atelier',
    title: 'Elysian Shift Dress',
    description: 'The Elysian Shift Dress is crafted from a lightweight, breathable blend of organic cotton and linen, making it perfect for spring outings. Its minimalist silhouette features subtle side pockets and a delicate, asymmetric hemline that adds an element of surprise, while the soft pastel color palette embodies the essence of the season. Ideal for brunch with friends or a leisurely afternoon stroll, this dress seamlessly blends comfort and elegance.',
    price: 1174.51,
    tags: ["minimalist","spring","shift dress","sustainable fashion","casual elegance","organic materials","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Willow & Sage',
    title: 'Spring Breeze Midi Dress',
    description: 'Embrace the fresh air of spring with the Spring Breeze Midi Dress from Willow & Sage. Crafted from a lightweight blend of cotton and linen, this dress features a vibrant floral print, a flattering A-line silhouette, and delicate ruffled sleeves. Perfect for brunch dates or garden parties, it offers both comfort and style for any casual occasion.',
    price: 35.35,
    tags: ["spring","casual","floral","midi dress","lightweight","brunch","garden party"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Autumn Vogue',
    title: 'Velvet Elegance Cocktail Dress',
    description: 'Step into the season with the Velvet Elegance Cocktail Dress, crafted from a luxurious blend of soft polyester and rich velvet. This stunning dress features a flattering A-line silhouette, three-quarter sleeves, and an elegant scoop neckline, making it perfect for evening gatherings or festive parties. The deep burgundy hue adds a touch of sophistication, ideal for fall occasions.',
    price: 30.58,
    tags: ["cocktail dress","fall fashion","velvet","evening wear","A-line","sophisticated","burgundy"],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'UrbanChic',
    title: 'Spring Breeze Utility Dress',
    description: 'The Spring Breeze Utility Dress combines streetwear aesthetics with functional design, crafted from a lightweight, breathable cotton blend that ensures comfort throughout the day. Featuring oversized pockets, adjustable belt ties, and a unique asymmetrical hem, this dress is perfect for casual outings or weekend brunches under the sun. Its vibrant pastel colors evoke the spirit of spring, making it a must-have piece for your wardrobe.',
    price: 250.92,
    tags: ["spring fashion","streetwear","utility dress","casual","pastel colors","urban style","oversized"],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Elegance & Co.',
    title: 'Sophisticated Velvet A-Line Dress',
    description: 'This stunning A-line dress by Elegance & Co. is crafted from luxurious deep navy velvet, perfect for formal winter events. Featuring a high neckline and intricate lace detailing at the sleeves, this dress combines sophistication with comfort, making it ideal for holiday parties or elegant dinners. The lined interior ensures warmth while maintaining a flattering silhouette.',
    price: 372.32,
    tags: ["formal","winter","velvet dress","elegant","holiday","A-line","dinner party"],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Luna & Sol',
    title: 'Elysian Midi Dress',
    description: 'The Elysian Midi Dress by Luna & Sol is a perfect blend of elegance and simplicity, crafted from a lightweight organic cotton-linen blend. Designed with a flattering A-line silhouette, it features subtle side pockets and a delicate adjustable tie at the waist, making it suitable for both casual outings and sophisticated events. This dress transitions effortlessly across all seasons, pairing beautifully with sandals in summer or layered with a cardigan in winter.',
    price: 176.19,
    tags: ["minimalist","all-season","organic cotton","A-line","adjustable","sustainable fashion","casual elegance"],
    imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Elysian Threads',
    title: 'Desert Blossom Maxi Dress',
    description: 'The Desert Blossom Maxi Dress is crafted from a lightweight, breathable cotton-linen blend, making it perfect for all-season wear. This bohemian-inspired piece features intricate floral embroidery along the bodice and flowing bell sleeves, along with a tiered skirt that dances with every step. Ideal for beach outings, garden parties, or cozy brunches, this dress effortlessly combines comfort with style.',
    price: 188.1,
    tags: ["bohemian","maxi dress","embroidered","all-season","casual","eclectic","Elysian Threads"],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Luna & Sol',
    title: 'Everyday Chic Midi Dress',
    description: 'The Everyday Chic Midi Dress by Luna & Sol is crafted from a soft, breathable blend of cotton and modal, making it perfect for all-season wear. This versatile piece features a flattering A-line silhouette, adjustable spaghetti straps, and side pockets, ensuring both style and functionality for casual outings or brunch dates. Dress it up with accessories or keep it simple for everyday comfort.',
    price: 49.03,
    tags: ["casual","midi dress","all-season","comfortable","versatile","everyday wear","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Vintage Charm',
    title: 'Classic Velvet Tea-Length Dress',
    description: 'Embrace the elegance of winter with our Classic Velvet Tea-Length Dress, crafted from sumptuous deep burgundy velvet. This vintage-inspired piece features a fitted bodice and a flowing skirt that elegantly falls just below the knee, complemented by delicate lace trim at the neckline and sleeves. Perfect for holiday gatherings or formal soirées, this dress combines classic style with contemporary comfort.',
    price: 276.42,
    tags: ["vintage","winter","velvet","tea-length","elegant","formal","holiday"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Luxe Atelier',
    title: 'Elysian Elegance Midi Dress',
    description: 'Elevate your wardrobe with the Elysian Elegance Midi Dress, crafted from a luxurious blend of silk and lightweight chiffon. This versatile piece features a flattering wrap silhouette, subtle pleating at the waist, and delicate cap sleeves, making it perfect for formal events or sophisticated gatherings year-round. Its timeless design and rich navy color ensure you\'ll make a stunning impression on any occasion.',
    price: 262.32,
    tags: ["formal","all-season","midi dress","luxurious","elegant","versatile","Luxe Atelier"],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
    category: 'dress'
  },
  {
    brand: 'Gypsy Heart',
    title: 'Elysian Dreamer Boho Blouse',
    description: 'Crafted from a lightweight blend of organic cotton and hemp, the Elysian Dreamer Boho Blouse is designed for the free spirit in every woman. Featuring delicate lace trims and intricate embroidered patterns, this versatile top can effortlessly transition from a sunny day at a festival to a cozy evening gathering. The adjustable tie sleeves and relaxed fit ensure comfort while maintaining a chic, bohemian vibe all year round.',
    price: 556.96,
    tags: ["bohemian","all-season","blouse","embroidered","sustainable","festival","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Nordic Elegance',
    title: 'Cashmere Blend Turtleneck Sweater',
    description: 'Crafted from a luxurious cashmere-wool blend, this turtleneck sweater features a soft, ribbed texture that provides both warmth and style during the colder months. The tailored fit and elegant draping make it ideal for business casual settings, pairing perfectly with tailored trousers or pencil skirts for meetings or dinner events.',
    price: 272.13,
    tags: ["business casual","winter fashion","cashmere","sweater","turtleneck","elegant","Nordic Elegance"],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeThreads',
    title: 'Silk Blend Button-Up Shirt',
    description: 'This exquisite silk blend button-up shirt is tailored for a polished look that transitions seamlessly from day to night. Crafted from a lightweight, breathable fabric, it features a subtle sheen and elegant cuffed sleeves, making it perfect for formal occasions such as business meetings or upscale dinners. Available in classic navy and crisp white, this versatile piece is an essential addition to any wardrobe, suitable for all seasons.',
    price: 146.71,
    tags: ["formal","silk","button-up","all-season","elegant","lightweight","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Heritage Threads',
    title: 'Vintage Cable Knit Sweater',
    description: 'This charming Vintage Cable Knit Sweater is crafted from a luxurious blend of soft merino wool and cashmere, ensuring warmth and comfort during the chilly winter months. Featuring a classic crew neckline and intricate cable detailing, it adds a timeless touch to any wardrobe, making it perfect for cozy gatherings or casual outings. Pair it with high-waisted jeans or a pleated skirt for a chic, retro-inspired look.',
    price: 188.32,
    tags: ["vintage","winter","sweater","cable knit","casual","chic","cozy"],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Nordique Athleisure',
    title: 'Frosted Performance Hoodie',
    description: 'The Frosted Performance Hoodie is crafted from a blend of ultra-soft merino wool and high-tech moisture-wicking fabric, ensuring warmth without sacrificing breathability. Designed with a fitted silhouette and thumbholes for added comfort, it\'s perfect for chilly morning runs or cozy afternoons at the café. This stylish yet functional piece transitions seamlessly from workout to casual outings, making it a versatile staple for your winter wardrobe.',
    price: 1468.49,
    tags: ["athleisure","winter","hoodie","performance","merinowool","casual","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'AeroAthletic',
    title: 'ThermoFlex Performance Hoodie',
    description: 'The AeroAthletic ThermoFlex Performance Hoodie is crafted from a high-tech blend of recycled polyester and spandex, offering both warmth and stretch for maximum comfort during cold weather workouts. Featuring a moisture-wicking finish, thumbholes for added coverage, and a sleek zippered pocket for essentials, this hoodie is perfect for outdoor runs or casual outings in chilly temperatures.',
    price: 270.87,
    tags: ["athleisure","winter wear","hoodie","activewear","eco-friendly","moisture-wicking","performance"],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeLane',
    title: 'Silk Blend Short Sleeve Shirt',
    description: 'Elevate your summer business casual wardrobe with the LuxeLane Silk Blend Short Sleeve Shirt. Crafted from a lightweight silk-cotton blend, this shirt features a subtle sheen and breathable fabric, ensuring comfort during warm days. The tailored fit and elegant collar make it perfect for office meetings or brunch with clients.',
    price: 219.55,
    tags: ["business casual","summer","silk blend","elegant","tailored fit","office wear","LuxeLane"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Urban Elegance',
    title: 'Silk Blend Twill Button-Up Shirt',
    description: 'Crafted from a luxurious silk-blend twill, this button-up shirt offers a sleek silhouette perfect for business casual settings. Featuring a classic collar and subtle cuff detailing, it transitions seamlessly from the office to after-hours gatherings, making it an essential piece for any stylish wardrobe. Its breathable fabric ensures comfort in all seasons.',
    price: 28.57,
    tags: ["business casual","all-season","silk blend","button-up","versatile","office wear","modern"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'NaturaLuxe',
    title: 'Essential Knit Crew Sweater',
    description: 'Crafted from a soft, breathable blend of organic cotton and recycled polyester, the Essential Knit Crew Sweater offers a minimalist silhouette perfect for fall layering. Its lightweight design features subtle ribbed detailing at the cuffs and hem, making it versatile enough for casual outings or cozy evenings at home. Pair it with your favorite jeans or a tailored skirt for an effortlessly chic look.',
    price: 33.3,
    tags: ["minimalist","fall fashion","sustainable","knitwear","versatile","everyday wear","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luxe Atelier',
    title: 'Ember Silk Wrap Top',
    description: 'The Ember Silk Wrap Top is a stunning evening wear piece crafted from 100% luxurious silk that drapes beautifully, ideal for winter soirées. It features an elegant wrap design with a deep V-neckline and intricate embroidery along the sleeves, making it perfect for formal gatherings or upscale events. The rich burgundy hue adds a touch of warmth and sophistication to your wardrobe.',
    price: 1272.42,
    tags: ["evening wear","winter fashion","luxury silk","wrap top","formal attire","sophisticated","Luxe Atelier"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Nimbus Activewear',
    title: 'Skyline Wrap Hoodie',
    description: 'The Skyline Wrap Hoodie is crafted from a luxurious blend of recycled polyester and organic cotton, providing both comfort and sustainability. This versatile piece features a unique asymmetrical hem and thumbholes for added warmth, making it perfect for autumn strolls or cozying up at a café. Pair it with leggings for an effortless athleisure look or layer it over your favorite workout gear.',
    price: 361.06,
    tags: ["athleisure","fall fashion","sustainable","comfortable","versatile","hoodie","activewear"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Sundrift Collective',
    title: 'Elysian Breeze Tunic',
    description: 'The Elysian Breeze Tunic is a lightweight, bohemian-inspired top crafted from a blend of organic cotton and airy linen, perfect for the warm days of spring. Featuring intricate hand-embroidered designs along the neckline and flowing bell sleeves, this tunic embodies effortless elegance that\'s suitable for casual outings or garden parties. Its relaxed silhouette ensures comfort while maintaining a chic, laid-back vibe.',
    price: 415.13,
    tags: ["bohemian","spring fashion","tunic","handmade","organic materials","relaxed fit","casual elegance"],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luna & Lark',
    title: 'Satin Blossom Cocktail Top',
    description: 'The Satin Blossom Cocktail Top features a delicate floral print on a luxurious satin fabric, perfect for spring soirées. With its elegant off-the-shoulder design and billowing puff sleeves, this top adds a touch of sophistication to any outfit. Ideal for cocktail parties or evening gatherings, it pairs beautifully with high-waisted skirts or tailored trousers.',
    price: 72.96,
    tags: ["spring fashion","cocktail top","floral print","satin","evening wear","off-the-shoulder","Luna & Lark"],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Elysian Threads',
    title: 'Autumn Whisper Cashmere Turtleneck',
    description: 'Crafted from the finest 100% Grade A cashmere, the Autumn Whisper Turtleneck features a relaxed fit and ribbed detailing that offers both warmth and elegance. This minimalist piece is perfect for layering during crisp fall days, making it suitable for everything from casual outings to sophisticated office wear.',
    price: 1284.29,
    tags: ["cashmere","turtleneck","minimalist","fall fashion","luxury","layering","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Urban Threads',
    title: 'Luxe Linen Blend Henley',
    description: 'Elevate your casual wardrobe with the Luxe Linen Blend Henley from Urban Threads. Crafted from a premium blend of breathable linen and soft cotton, this top features a relaxed fit with a three-button placket and subtle ribbing at the cuffs, making it perfect for layering. Ideal for brunches or weekend outings, this versatile piece can be easily styled with jeans or chinos for a polished yet laid-back look.',
    price: 74.46,
    tags: ["casual","all-season","henley","linen blend","urban fashion","versatile","relaxed fit"],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luxe Heritage',
    title: 'Vintage Wool Blend Turtleneck',
    description: 'This exquisite Vintage Wool Blend Turtleneck from Luxe Heritage is crafted from a luxurious blend of merino wool and cashmere, providing unparalleled warmth and comfort for the winter months. The intricate cable knit design and oversized silhouette make it a perfect statement piece for cozy gatherings or casual outings, while its rich emerald green color adds a touch of sophistication to any ensemble.',
    price: 1167.71,
    tags: ["vintage","winter","turtleneck","luxury","cable knit","emerald green","sustainable fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Elan Couture',
    title: 'Velvet Wrap Cocktail Top',
    description: 'Elevate your winter wardrobe with the Elan Couture Velvet Wrap Cocktail Top, crafted from sumptuous deep burgundy velvet that shines with elegance. Featuring a sophisticated wrap design, long sleeves, and a flattering plunge neckline, this top is perfect for cocktail parties or festive gatherings. Pair it with tailored trousers or a sleek skirt for a chic, polished look.',
    price: 172.93,
    tags: ["cocktail","winter fashion","velvet","elegant","sophisticated","party wear","wrap top"],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luna & Lark',
    title: 'Sleek Spring Blouse',
    description: 'Crafted from a lightweight blend of Tencel and organic cotton, the Sleek Spring Blouse offers a breathable, eco-friendly option for warmer days. Its minimalist design features a subtle asymmetrical hem and delicate cap sleeves, making it perfect for both casual outings and sophisticated brunches. Available in soft pastel hues, this blouse seamlessly integrates into any spring wardrobe.',
    price: 155.11,
    tags: ["minimalist","spring fashion","eco-friendly","blouse","lightweight","pastel","casual chic"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Elysian Couture',
    title: 'Luna Silhouette Blouse',
    description: 'The Luna Silhouette Blouse is a stunning cocktail top crafted from a luxurious blend of silk and chiffon, offering an elegant drape that flatters all body types. Featuring delicate lace accents along the neckline and flowing sleeves, this versatile piece is perfect for transitioning from a sophisticated dinner party to an upscale brunch. Designed for all seasons, the blouse is lightweight yet warm enough for cooler evenings.',
    price: 337.83,
    tags: ["cocktail","silk","elegant","all-season","lace","blouse","designer"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Athleisure Luxe',
    title: 'Cozy Layered Pullover',
    description: 'This Cozy Layered Pullover from Athleisure Luxe is crafted from a premium blend of organic cotton and recycled polyester, providing ultimate comfort while being eco-friendly. Designed with a high neckline and thumbhole cuffs, it’s perfect for brisk fall walks or lounging at home. The stylish color-blocking and soft texture make it a versatile choice for both casual outings and cozy nights in.',
    price: 487.51,
    tags: ["fall fashion","athleisure","sustainable","layering","comfortable","casual","eco-friendly"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'UrbanNomad',
    title: 'Canyon Windbreaker Hoodie',
    description: 'The Canyon Windbreaker Hoodie is crafted from a lightweight, water-resistant nylon blend, making it perfect for unpredictable spring weather. Featuring a stylish oversized fit, adjustable drawstring hood, and multiple utility pockets, this hoodie effortlessly combines functionality with street style. Ideal for casual outings, festivals, or urban adventures, it keeps you comfortable while looking effortlessly cool.',
    price: 282.2,
    tags: ["streetwear","hoodie","spring","water-resistant","oversized","urban","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Trendy Threads',
    title: 'Elegant Charcoal Blazer',
    description: 'This elegant charcoal blazer is crafted from a luxurious blend of wool and polyester, providing warmth and sophistication for the fall season. Featuring a tailored fit, satin lapels, and functional pockets, it\'s perfect for both office meetings and evening events. Pair it with tailored trousers or a chic skirt for a polished look.',
    price: 65.34,
    tags: ["formal","blazer","fall fashion","sophisticated","office wear","elegant","Trendy Threads"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Wanderlust Threads',
    title: 'Ember Glow Boho Blouse',
    description: 'The Ember Glow Boho Blouse is crafted from a soft, lightweight cotton-linen blend that is perfect for layering this fall. Featuring intricate hand-embroidered details along the neckline and billowy sleeves, this top effortlessly combines comfort with bohemian elegance, making it ideal for casual outings or cozy get-togethers. Pair it with high-waisted jeans or a flowing maxi skirt for a chic autumn look.',
    price: 72.43,
    tags: ["bohemian","fall fashion","embroidered","lightweight","casual","layering","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Urban Nomad',
    title: 'Asher Hooded Utility Jacket',
    description: 'The Asher Hooded Utility Jacket is crafted from a lightweight, water-resistant nylon blend, perfect for unpredictable spring weather. Featuring multiple oversized pockets and adjustable drawstrings, this jacket combines functionality with a trendy streetwear aesthetic, making it an ideal choice for casual outings or urban adventures. Pair it effortlessly with joggers or layered over a graphic tee for a laid-back vibe.',
    price: 294.08,
    tags: ["streetwear","spring","utility","jacket","urban","casual","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeLine',
    title: 'Silk Blend Button-Up Blouse',
    description: 'The LuxeLine Silk Blend Button-Up Blouse is crafted from a lightweight silk-cotton blend, offering a luxurious feel while remaining breathable for all-season wear. Featuring tailored cuffs and a slightly relaxed fit, this blouse is perfect for both office meetings and after-work gatherings. Its versatile design is enhanced with subtle pinstripe detailing, making it a sophisticated choice for any business casual occasion.',
    price: 117.69,
    tags: ["business casual","silk blend","versatile","office wear","sophisticated","all-season","tailored"],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Nordic Elegance',
    title: 'Cashmere Blend Mock Neck Sweater',
    description: 'Embrace sophistication this winter with the Nordic Elegance Cashmere Blend Mock Neck Sweater. Crafted from a luxurious cashmere-wool blend, this sweater features a refined mock neck for added warmth and style. Perfect for business casual settings, it pairs seamlessly with tailored trousers or a chic pencil skirt, making it an ideal choice for office meetings or lunch dates.',
    price: 75.6,
    tags: ["business casual","winter fashion","mock neck","cashmere blend","sweater","elegant","office wear"],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Cavari Couture',
    title: 'Luxe Linen Blazer Top',
    description: 'Elevate your summer wardrobe with the Luxe Linen Blazer Top by Cavari Couture. This tailored piece is crafted from a breathable linen blend, featuring a lightweight structure that drapes beautifully, making it perfect for garden parties or formal brunches. The soft pastel hues and subtle shoulder pads add a touch of sophistication, while the single-button closure ensures a polished look.',
    price: 90.11,
    tags: ["summer fashion","formal","linen","blazer","Cavari Couture","elegant","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luna Belle',
    title: 'Spring Blossom Cocktail Top',
    description: 'Embrace the essence of spring with the Spring Blossom Cocktail Top by Luna Belle. Crafted from a lightweight blend of sustainable cotton and modal, this elegant top features a delicate floral print, puff sleeves, and a flattering peplum waist that enhances your silhouette. Perfect for garden parties or evening outings, it pairs beautifully with high-waisted skirts or tailored trousers.',
    price: 33.73,
    tags: ["cocktail","spring fashion","floral","sustainable","peplum","elegant","evening wear"],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Verve Couture',
    title: 'Spring Blossom Silk Camisole',
    description: 'Elevate your cocktail attire with the Spring Blossom Silk Camisole, crafted from luxurious lightweight silk that flows gracefully with your movements. This elegant top features intricate floral embroidery and a delicate lace trim, making it perfect for spring soirées or evening gatherings. Pair it with tailored trousers or a chic skirt for a sophisticated look.',
    price: 113.98,
    tags: ["cocktail","spring fashion","silk","embroidery","elegant","night out"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Evergreen Threads',
    title: 'Luxe Knit Pullover',
    description: 'The Luxe Knit Pullover from Evergreen Threads is crafted from a premium blend of merino wool and cashmere, offering unparalleled warmth and softness for those chilly winter days. Its relaxed fit and ribbed cuffs provide a comfortable yet stylish silhouette, making it perfect for casual outings or cozy evenings by the fireplace. Pair it with jeans or tailored trousers for a chic, effortless look.',
    price: 270.89,
    tags: ["winter fashion","casual wear","sweater","merino wool","comfortable","chic","cozy"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeSpring',
    title: 'Silk Chiffon Blouse',
    description: 'Elevate your spring wardrobe with the LuxeSpring Silk Chiffon Blouse, expertly crafted from lightweight, breathable silk that drapes elegantly on the body. This formal blouse features delicate ruffles along the sleeves and a subtle V-neckline, making it perfect for both office meetings and upscale gatherings. Pair it with tailored trousers or a pencil skirt for a polished look.',
    price: 218.74,
    tags: ["formal","spring","silk","chiffon","blouse","elegant","office wear"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Aveline Couture',
    title: 'Charcoal Wool Blend Turtleneck',
    description: 'This sophisticated charcoal grey turtleneck is crafted from a luxurious wool blend, ensuring warmth and comfort throughout the winter months. Featuring an elegant ribbed design and a fitted silhouette, it pairs beautifully with tailored trousers for formal occasions or office wear, making it a versatile addition to your winter wardrobe.',
    price: 568.6,
    tags: ["winter fashion","formal wear","turtleneck","wool blend","luxury","office attire","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Wildflower Collective',
    title: 'Ember Breeze Bohemian Tunic',
    description: 'Embrace the spirit of autumn with the Ember Breeze Bohemian Tunic, crafted from a luxurious blend of organic cotton and viscose. This flowy top features intricate hand-embroidered floral patterns, billowy sleeves, and a flattering high-low hem that makes it perfect for both casual outings and cozy gatherings around the fire. Pair it with your favorite denim or leggings to create a stunning fall ensemble.',
    price: 545.35,
    tags: ["bohemian","fall fashion","handcrafted","organic materials","floral embroidery","casual wear","tunic"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeAvenue',
    title: 'Silk Chiffon Draped Top',
    description: 'Crafted from the finest silk chiffon, this draped top features an elegant asymmetrical hemline and delicate ruffle detailing that flows beautifully with every movement. Perfect for evening events in spring, it pairs effortlessly with tailored trousers or a sleek pencil skirt, making it a versatile addition to any sophisticated wardrobe.',
    price: 537.05,
    tags: ["eveningwear","spring fashion","silk chiffon","elegant tops","luxury","draped design","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Elysian Threads',
    title: 'Wanderlust Embroidered Tunic',
    description: 'Embrace the spirit of spring with the Wanderlust Embroidered Tunic from Elysian Threads. Crafted from soft, breathable cotton and adorned with intricate floral embroidery, this bohemian-style top features a relaxed fit and flowing bell sleeves, making it perfect for weekend brunches or outdoor festivals. The tunic\'s lightweight fabric ensures comfort and style as temperatures rise.',
    price: 55.69,
    tags: ["bohemian","spring fashion","embroidered","tunic","casual wear","festival style","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Elysian Threads',
    title: 'Merino Wool Blend Wrap Sweater',
    description: 'Elevate your winter wardrobe with the Elysian Threads Merino Wool Blend Wrap Sweater, a perfect fusion of style and comfort. Crafted from a luxurious blend of 70% merino wool and 30% cashmere, this sweater features a sophisticated wrap design that can be adjusted for a personalized fit. Ideal for business casual occasions, it pairs beautifully with tailored trousers or a chic pencil skirt, making it a versatile staple for any professional setting.',
    price: 591.37,
    tags: ["business casual","winter fashion","merino wool","cashmere","wrap sweater","Elysian Threads","luxury"],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Wanderlust Apparel',
    title: 'Elysian Dreams Peasant Top',
    description: 'The Elysian Dreams Peasant Top is crafted from lightweight, breathable organic cotton, featuring intricate hand-embroidered floral patterns on the sleeves. This bohemian-inspired top is perfect for summer outings, providing a relaxed fit that pairs beautifully with denim shorts or flowy skirts for a whimsical look.',
    price: 158.82,
    tags: ["bohemian","summer","peasant top","organic cotton","floral embroidery","casual wear","Wanderlust Apparel"],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Rust & Relics',
    title: 'Vintage Floral Velvet Blouse',
    description: 'Embrace the essence of fall with the Vintage Floral Velvet Blouse from Rust & Relics. Crafted from a luxurious blend of soft cotton and plush velvet, this blouse features an intricate vintage floral pattern that adds a touch of nostalgia to your wardrobe. Perfect for a cozy evening out or a casual gathering, this top is adorned with delicate button details and billowy sleeves, making it a stylish choice for the season.',
    price: 128.97,
    tags: ["vintage","fall fashion","velvet","floral print","boho chic","casual elegance","Rust & Relics"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Boho Bliss',
    title: 'Sunset Dreamer Layered Top',
    description: 'Embrace the essence of bohemian elegance with the Sunset Dreamer Layered Top. Crafted from a lightweight blend of organic cotton and linen, this versatile piece features delicate lace detailing and flowing sleeves, making it perfect for any season. Whether you\'re enjoying a beach bonfire or attending a garden party, this top effortlessly combines comfort and style.',
    price: 81.57,
    tags: ["bohemian","layered","organic cotton","versatile","lace detail","all-season"],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Nordic Threads',
    title: 'Canyon Knit Pullover',
    description: 'The Canyon Knit Pullover is crafted from a luxurious blend of soft Merino wool and recycled polyester, making it not only warm but also eco-friendly. This casual yet stylish top features a relaxed fit, ribbed cuffs, and a unique cable knit pattern, perfect for layering during winter outings or cozy weekends at home. Pair it with your favorite jeans or a skirt for a chic, laid-back look.',
    price: 84.37,
    tags: ["winter fashion","casual wear","sustainable","knitwear","pullover","Merino wool","everyday style"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Cavalli & Co.',
    title: 'Silk Chiffon Bow Blouse',
    description: 'Elevate your spring wardrobe with the Silk Chiffon Bow Blouse from Cavalli & Co. Crafted from a luxurious blend of silk and chiffon, this top features a delicate bow tie at the neck and billowing sleeves for a refined yet feminine silhouette. Perfect for formal occasions or a sophisticated evening out, this blouse combines elegance with comfort.',
    price: 645.13,
    tags: ["formal","spring","silk","chiffon","elegant","blouse","designer"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'UrbanNomad',
    title: 'Asymmetric Layered Hoodie',
    description: 'The Asymmetric Layered Hoodie from UrbanNomad is a bold streetwear staple designed for all-season wear. Crafted from a blend of premium organic cotton and recycled polyester, it features an avant-garde silhouette with an asymmetric hem and multiple pockets for functionality. Perfect for urban explorations or casual outings, this hoodie combines style with comfort effortlessly.',
    price: 289.47,
    tags: ["streetwear","hoodie","asymmetric","layered","urban","sustainable","all-season"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Drifted Threads',
    title: 'Urban Nomad Oversized Hoodie',
    description: 'Crafted from a premium blend of organic cotton and recycled polyester, the Urban Nomad Oversized Hoodie combines comfort with sustainability. Featuring a striking graphic print inspired by urban landscapes, this piece is perfect for layering during fall outings or cozy evenings by the fire. The oversized fit and kangaroo pocket provide both style and functionality, making it a versatile addition to any streetwear enthusiast\'s wardrobe.',
    price: 436.63,
    tags: ["streetwear","hoodie","fall fashion","sustainable","urban style","oversized","graphic print"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luna & Co.',
    title: 'Spring Breeze Linen Blouse',
    description: 'The Spring Breeze Linen Blouse is crafted from lightweight, breathable linen, perfect for those sunny spring days. It features delicate ruffle sleeves and a modern, relaxed fit, making it ideal for brunch outings or casual office wear. Available in a soft pastel palette, this blouse combines style with comfort for effortless layering.',
    price: 300.89,
    tags: ["spring fashion","linen blouse","casual wear","brunch outfit","pastel colors","ruffle sleeves","comfortable fit"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'ElevateActive',
    title: 'Seamless Technical Crop Top',
    description: 'The Seamless Technical Crop Top from ElevateActive is designed for the modern athlete who values both style and performance. Crafted from a lightweight, moisture-wicking blend of recycled polyester and spandex, this top features four-way stretch for ultimate flexibility during workouts and daily wear. With its breathable mesh panels and a chic, cropped silhouette, it\'s perfect for layering or wearing solo at the gym, yoga studio, or out on the town.',
    price: 499.68,
    tags: ["athleisure","crop top","sustainable fashion","activewear","all-season","performance","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Gypsy Dreamers',
    title: 'Sunset Horizon Bohemian Top',
    description: 'Embrace the warmth of summer with the Sunset Horizon Bohemian Top, crafted from lightweight, breathable cotton blend to keep you cool on sunny days. This stunning piece features intricate hand-stitched embroidery along the neckline and flowy bell sleeves that enhance its free-spirited appeal, making it perfect for beach outings or music festivals. Pair it with denim shorts or a flowing maxi skirt for an effortlessly chic look.',
    price: 949.87,
    tags: ["bohemian","summer","embroidered","lightweight","flowy","festival","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Boho Bliss',
    title: 'Wanderlust Embroidered Tunic',
    description: 'Embrace your free spirit with the Wanderlust Embroidered Tunic from Boho Bliss. This stunning top is crafted from a breathable blend of organic cotton and linen, featuring intricate hand-stitched floral embroidery along the neckline and sleeves. Perfect for layering in cooler months or wearing solo in the summer, this versatile piece transitions effortlessly from a beach day to an evening out with friends.',
    price: 152.78,
    tags: ["bohemian","embroidered","organic cotton","all-season","casual","tunic","sustainable fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Gypsy Breeze',
    title: 'Embroidered Bohemian Bliss Tunic',
    description: 'The Embroidered Bohemian Bliss Tunic is a stunning addition to your spring wardrobe, crafted from a lightweight blend of organic cotton and linen for breathability and comfort. This tunic features intricate hand-stitched floral embroidery and a relaxed fit, making it perfect for a sunny day out or a casual brunch with friends. Pair it effortlessly with denim shorts or flowy skirts to embrace the boho spirit.',
    price: 563.09,
    tags: ["bohemian","spring fashion","tunic","embroidered","sustainable","casual wear","unique design"],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Athleisure Luxe',
    title: 'Performance Knit Long Sleeve Top',
    description: 'Crafted from a premium blend of moisture-wicking bamboo and recycled polyester, the Performance Knit Long Sleeve Top offers unparalleled comfort and breathability. Designed with a sleek, fitted silhouette and thumbholes, it transitions seamlessly from yoga class to casual outings. Perfect for layering in cooler weather or wearing on its own in warmer conditions, this top is your go-to for all-season versatility.',
    price: 298.72,
    tags: ["athleisure","long sleeve","bamboo fabric","sustainable","performance wear","versatile","active lifestyle"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Aether & Co.',
    title: 'Linen Breeze Boxy Top',
    description: 'Crafted from premium lightweight linen, the Linen Breeze Boxy Top offers an effortless silhouette perfect for warm summer days. Its minimalist design features a subtle boat neckline and side slits for added breathability, making it ideal for both casual outings and relaxed office settings. Available in soft pastel hues, this top pairs beautifully with high-waisted shorts or tailored trousers.',
    price: 203.18,
    tags: ["minimalist","summer","linen","breezy","versatile","casual","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'AeroFit',
    title: 'ThermoFlex High-Performance Hoodie',
    description: 'Stay warm and stylish this winter with the AeroFit ThermoFlex High-Performance Hoodie, crafted from a luxurious blend of moisture-wicking merino wool and breathable stretch fabric. Featuring a zippered front pocket, thumbhole cuffs, and a sleek, fitted silhouette, this hoodie is perfect for both outdoor workouts and cozy evenings by the fire. Ideal for those who value both performance and sophistication in their athleisure wear.',
    price: 1051.59,
    tags: ["athleisure","winter fashion","performance wear","merino wool","fitness","luxury","hiking"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Nordic Threads',
    title: 'Essential Cashmere Blend Turtleneck',
    description: 'Crafted from a luxurious cashmere-wool blend, this minimalist turtleneck offers unparalleled warmth and softness, making it perfect for chilly winter days. Its fitted design and ribbed cuffs provide a sleek silhouette, while the subtle neutral tones make it versatile enough for both casual outings and elegant occasions. Pair it with tailored trousers for a sophisticated look or with jeans for a cozy weekend vibe.',
    price: 60.74,
    tags: ["minimalist","winter fashion","turtleneck","cashmere blend","sustainable","wardrobe essential","Nordic style"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeMotion',
    title: 'Breezy Performance Tank',
    description: 'The Breezy Performance Tank from LuxeMotion is designed for the active summer lifestyle, featuring a lightweight blend of moisture-wicking recycled polyester and soft Lycra. Its racerback design and mesh panels provide maximum breathability and freedom of movement, making it perfect for outdoor workouts or casual brunches. This stylish tank combines functionality with a sleek silhouette that transitions effortlessly from gym to street.',
    price: 480.06,
    tags: ["athleisure","summer","activewear","lightweight","moisture-wicking","stylish","breathable"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Elara Couture',
    title: 'Silk Charmeuse Blouse',
    description: 'The Silk Charmeuse Blouse by Elara Couture is an elegant addition to your fall wardrobe, crafted from luxurious 100% silk for a soft, lustrous finish. Featuring subtle pleating along the shoulders and delicate button detailing at the cuffs, this blouse is perfect for upscale gatherings or formal meetings. Its rich emerald green hue adds a touch of sophistication, making it a versatile piece that can be paired with tailored trousers or a chic pencil skirt.',
    price: 472.57,
    tags: ["formal","fall fashion","silk blouse","elegant","luxury","workwear","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Boho Chic Atelier',
    title: 'Whimsical Floral Embroidered Blouse',
    description: 'This enchanting blouse is crafted from a lightweight, breathable cotton-linen blend, making it perfect for those warm summer days. With intricate floral embroidery and delicate lace detailing along the sleeves, it adds a touch of elegance to any bohemian-inspired outfit. Ideal for beach outings or casual garden parties, this top effortlessly combines comfort with style.',
    price: 513.36,
    tags: ["bohemian","summer","embroidered","lightweight","floral","casual","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeActive',
    title: 'ThermoFlex Long Sleeve Hoodie',
    description: 'The LuxeActive ThermoFlex Long Sleeve Hoodie is crafted from a blend of recycled polyester and spandex, providing both warmth and flexibility for your winter workouts. Featuring a high-neck design with a lightweight, moisture-wicking fabric, this hoodie is perfect for layering during outdoor activities or cozying up after a gym session. Its sleek silhouette and thumbholes add functionality without compromising style, making it ideal for both athletic and casual occasions.',
    price: 93.99,
    tags: ["athleisure","winter wear","hoodie","activewear","sustainable","moisture-wicking","layering"],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeThreads',
    title: 'Breezy Linen Blouse',
    description: 'The Breezy Linen Blouse by LuxeThreads is crafted from premium lightweight linen, ensuring breathability and comfort during the warm summer months. This versatile piece features a relaxed fit with elegant cap sleeves and a subtle V-neckline, making it perfect for both office settings and casual outings. Pair it with tailored trousers for a polished look or denim shorts for a laid-back vibe.',
    price: 265.97,
    tags: ["business casual","summer fashion","linen blouse","versatile","relaxed fit","office wear","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'WinterWaves',
    title: 'Cozy Knit Turtleneck Sweater',
    description: 'The Cozy Knit Turtleneck Sweater by WinterWaves is crafted from a plush blend of 60% organic cotton and 40% recycled polyester, making it both soft and eco-friendly. This casual yet chic piece features a relaxed fit, ribbed cuffs, and a stylish high neck, perfect for layering during chilly winter outings or cozy nights by the fireplace. Ideal for casual gatherings or a day out in the city, this sweater combines comfort with modern style.',
    price: 48.76,
    tags: ["winter fashion","casual style","turtleneck","eco-friendly","sweater","warmth","layering"],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Velvet & Vine',
    title: 'Chic Velvet Wrap Top',
    description: 'Elevate your winter cocktail wardrobe with the Chic Velvet Wrap Top from Velvet & Vine. Crafted from a luxurious blend of soft velvet and polyester, this top features an elegant deep V-neckline and long sleeves, perfect for layering under a tailored blazer. Ideal for holiday parties or upscale gatherings, its rich emerald hue and flattering wrap design ensure you\'ll make a stunning impression.',
    price: 83.86,
    tags: ["cocktail","winter fashion","velvet","wrap top","evening wear","elegant","holiday style"],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luna & Sol',
    title: 'Silk Chiffon Evening Blouse',
    description: 'Elevate your summer evenings with the Silk Chiffon Evening Blouse from Luna & Sol. Crafted from lightweight, breathable silk chiffon, this elegant top features delicate ruffles along the neckline and sleeves, adding a touch of femininity. Perfect for outdoor cocktail parties or intimate dinners, it pairs beautifully with tailored trousers or a flowing skirt.',
    price: 50.13,
    tags: ["evening wear","summer fashion","silk blouse","chiffon top","elegant","feminine","Luna & Sol"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Elysian Elegance',
    title: 'Chesterfield Cashmere Blouse',
    description: 'The Chesterfield Cashmere Blouse is an exquisite addition to your fall wardrobe, crafted from luxurious blend of 70% cashmere and 30% silk for a soft, warm feel. This tailored piece features a sophisticated high neck and delicate balloon sleeves, making it perfect for both office meetings and evening gatherings. Pair it with tailored trousers or a pencil skirt for a polished look that embodies elegance and comfort.',
    price: 307.74,
    tags: ["cashmere","formal","fall fashion","elegant","high neck","balloon sleeves","office wear"],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Heritage & Co.',
    title: 'Vintage Velvet Button-Up Blouse',
    description: 'This exquisite vintage-style button-up blouse is crafted from luxurious deep burgundy velvet, perfect for the crisp autumn air. Featuring delicate lace cuffs and a classic collar, it adds a touch of elegance to any casual or semi-formal occasion. Pair it with high-waisted trousers or a pencil skirt for a timeless look that exudes sophistication and warmth.',
    price: 462.82,
    tags: ["vintage","velvet","fall fashion","elegant","blouse","luxury","autumn"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Vintage Vogue',
    title: 'Classic Linen Button-Up Blouse',
    description: 'This exquisite linen button-up blouse from Vintage Vogue combines timeless elegance with modern versatility. Crafted from 100% premium Italian linen, it features a delicate lace trim along the collar and cuffs, making it perfect for both casual outings and more formal occasions. With its lightweight fabric, this blouse can easily transition through all seasons, providing comfort and style year-round.',
    price: 1144.62,
    tags: ["vintage","linen","button-up","elegant","all-season","dressy","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Verve & Co.',
    title: 'Luxe Everyday Crew Neck Sweater',
    description: 'Crafted from a premium blend of merino wool and cashmere, this Luxe Everyday Crew Neck Sweater offers unparalleled softness and warmth, making it perfect for layering in any season. It features a relaxed fit with ribbed cuffs and hem, ensuring both comfort and style whether you\'re at a casual brunch or a cozy night in. The versatile color options allow for easy pairing with any outfit, making it a staple in your wardrobe.',
    price: 366.3,
    tags: ["sweater","casual","all-season","merino wool","luxury","layering","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Cedar & Oak',
    title: 'Cascading Charcoal Blouse',
    description: 'Elevate your business casual wardrobe with the Cascading Charcoal Blouse from Cedar & Oak. Crafted from a luxurious blend of modal and silk, this lightweight top features a graceful draped neckline and long sleeves, making it perfect for layering in the crisp fall air. Ideal for office meetings or after-work gatherings, its sophisticated silhouette pairs beautifully with tailored trousers or a chic pencil skirt.',
    price: 294.82,
    tags: ["business casual","fall fashion","elegant blouse","modal silk blend","office wear","layering piece","sophisticated style"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'UrbanNomad',
    title: 'Retro Vibe Tie-Dye Crop Top',
    description: 'Embrace the summer sun in the Retro Vibe Tie-Dye Crop Top from UrbanNomad. Crafted from a lightweight blend of organic cotton and recycled polyester, this top features a unique spiral tie-dye pattern that brings a playful touch to your streetwear aesthetic. With its relaxed fit and breathable fabric, it\'s perfect for casual outings, music festivals, or a day at the beach.',
    price: 279.61,
    tags: ["streetwear","summer fashion","tie-dye","crop top","urban style","eco-friendly","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Elysian Atelier',
    title: 'Charcoal Wool Blend Blazer',
    description: 'Elevate your autumn wardrobe with the Elysian Atelier Charcoal Wool Blend Blazer, crafted from a luxurious blend of merino wool and cashmere for unparalleled warmth and softness. This tailored blazer features a double-breasted front, notched lapels, and intricate stitching details, making it perfect for formal occasions or a polished office look. Pair it with tailored trousers or a pencil skirt for a sophisticated ensemble that stands out.',
    price: 467.56,
    tags: ["formal","blazer","fall fashion","wool blend","office wear","sophisticated","Elysian Atelier"],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Nordic Threads',
    title: 'Luxe Wool-Blend Oversized Sweater',
    description: 'Embrace the winter chill with the Luxe Wool-Blend Oversized Sweater from Nordic Threads. Crafted from a sumptuous blend of merino wool and cashmere, this piece features a relaxed fit and a stylish boat neckline, making it perfect for both cozy days at home and casual outings with friends. The soft texture and rich charcoal grey color ensure you\'ll stay warm while looking effortlessly chic, making it a staple for any winter wardrobe.',
    price: 1417.43,
    tags: ["winter","casual","sweater","oversized","luxury","wool-blend","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeLine',
    title: 'Silk Blend Button-Up Blouse',
    description: 'Crafted from a luxurious silk-cotton blend, this elegant button-up blouse features subtle pleating along the sleeves and a tailored fit that flatters all body types. Perfect for springtime office wear or upscale brunch gatherings, its breathable material ensures comfort without sacrificing style.',
    price: 127.83,
    tags: ["formal","spring fashion","silk blend","elegant","office wear","brunch","tailored"],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Frost & Flare',
    title: 'Canyon Ridge Cable Knit Sweater',
    description: 'Stay cozy and stylish this winter with the Canyon Ridge Cable Knit Sweater from Frost & Flare. Crafted from a luxurious blend of merino wool and cashmere, this piece features intricate cable-knit patterns and a relaxed fit, making it perfect for casual outings or cozy nights in. Pair it with your favorite jeans for a laid-back look or layer it over a collared shirt for a touch of sophistication.',
    price: 294.72,
    tags: ["winter","cable knit","sweater","casual","cozy","merino wool","layering"],
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeLayer',
    title: 'Spring Breeze Button-Up Blouse',
    description: 'The Spring Breeze Button-Up Blouse from LuxeLayer is crafted from a lightweight, breathable cotton-linen blend, making it perfect for transitional weather. Featuring a tailored fit, subtle pastel stripes, and elegant roll-up sleeves, this blouse is designed for a polished yet comfortable look, ideal for business meetings or casual brunches. Pair it effortlessly with tailored trousers or a chic skirt for a sophisticated ensemble.',
    price: 58.88,
    tags: ["business casual","spring fashion","lightweight","pastel stripes","versatile","sustainable materials","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Vintage Vogue',
    title: 'Belle Époque Lace Blouse',
    description: 'Embrace the elegance of the past with the Belle Époque Lace Blouse, crafted from a luxurious blend of silk and cotton, featuring intricate hand-embroidered floral patterns. This vintage-inspired top showcases delicate lace trim along the sleeves and neckline, making it perfect for spring garden parties or afternoon tea gatherings. Pair it with high-waisted trousers or a flowing skirt for a timeless look.',
    price: 1046.37,
    tags: ["vintage","spring fashion","lace blouse","elegant","feminine","handmade","bohemian"],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luna Chic',
    title: 'Elysian Breeze Cocktail Top',
    description: 'Elevate your summer soirées with the Elysian Breeze Cocktail Top by Luna Chic. This stunning piece is crafted from lightweight, flowy chiffon with delicate lace trim, featuring adjustable spaghetti straps for a customizable fit. Perfect for garden parties or evening cocktails, it combines elegance and comfort, ensuring you stand out in any crowd.',
    price: 259.73,
    tags: ["summer fashion","cocktail top","chiffon","elegant attire","garden party","lace details","adjustable straps"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeFit',
    title: 'ThermoFlex Pullover',
    description: 'The LuxeFit ThermoFlex Pullover combines cutting-edge thermal technology with a sleek athleisure design, perfect for winter workouts or casual outings. Crafted from a premium blend of recycled polyester and spandex, this pullover features moisture-wicking properties and a soft brushed interior for ultimate comfort. Designed with a high neck and zippered front, it allows for adjustable ventilation, making it versatile for both intense training sessions and relaxed weekend wear.',
    price: 794.94,
    tags: ["athleisure","winter wear","thermal","high neck","sustainable materials","workout","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'UrbanCrest',
    title: 'Wanderer Pullover Hoodie',
    description: 'The Wanderer Pullover Hoodie is crafted from a plush cotton-polyester blend, offering both warmth and breathability for those crisp fall days. Featuring a relaxed fit, oversized kangaroo pocket, and unique graphic prints inspired by urban art, this hoodie is perfect for casual outings or cozy nights in. Pair it with your favorite jeans or joggers for a laid-back streetwear look.',
    price: 67.77,
    tags: ["streetwear","hoodie","fall","casual","urban","graphic","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'LuxeBreeze',
    title: 'Silk Chiffon Ruffle Top',
    description: 'The Silk Chiffon Ruffle Top by LuxeBreeze is a stunning cocktail style piece that’s perfect for summer soirées. Crafted from lightweight, breathable silk chiffon, it features delicate ruffles cascading down the sleeves and a flattering V-neckline, making it ideal for elegant evening events or upscale brunches. The soft blush color and feminine silhouette ensure you’ll make a memorable impression wherever you go.',
    price: 363.31,
    tags: ["cocktail","summer","fashion","elegant","silk","ruffle","eveningwear"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'AeroActive',
    title: 'BreezeFlow Tank Top',
    description: 'The BreezeFlow Tank Top is designed for hot summer days, featuring a lightweight blend of recycled polyester and organic cotton that ensures breathability and moisture-wicking properties. With a racerback design and strategically placed mesh panels, this tank offers both style and functionality, making it perfect for outdoor yoga classes or casual outings with friends.',
    price: 52.23,
    tags: ["athleisure","summer","tank top","breathable","yoga","eco-friendly","activewear"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Urban Nomad',
    title: 'Frostbite Utility Hoodie',
    description: 'The Frostbite Utility Hoodie combines streetwear aesthetics with winter functionality, crafted from a premium blend of recycled polyester and organic cotton for warmth and breathability. Featuring oversized pockets, a reinforced hood, and adjustable drawstrings, this hoodie is perfect for urban adventures or cozy gatherings. Its unique reflective detailing adds a stylish touch while enhancing visibility in low light conditions.',
    price: 1310.3,
    tags: ["streetwear","hoodie","winter","urban","sustainable","fashion","utility"],
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Luna & Lark',
    title: 'Sundrenched Silk Camisole',
    description: 'Elevate your summer evenings with our Sundrenched Silk Camisole, crafted from luxurious 100% silk that drapes elegantly against the skin. This cocktail-style top features delicate lace trim along the neckline and adjustable spaghetti straps for a customizable fit, making it perfect for dining al fresco or attending a rooftop soirée. Pair it effortlessly with high-waisted trousers or a flowing skirt for a chic, sophisticated look.',
    price: 59.45,
    tags: ["cocktail","summer","silk","elegant","night out","dressy","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Heritage Threads',
    title: 'Rustic Charm Knit Sweater',
    description: 'The Rustic Charm Knit Sweater from Heritage Threads is a cozy and stylish addition to your fall wardrobe. Made from a luxurious blend of organic cotton and recycled wool, this vintage-inspired sweater features a textured knit and oversized fit, perfect for layering over your favorite vintage blouse. Ideal for casual outings or cozy evenings by the fireplace.',
    price: 58.14,
    tags: ["vintage","fall fashion","cozy","sustainable","oversized","sweater","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
    category: 'tops'
  },
  {
    brand: 'Café Couture',
    title: 'Luxe Linen Joggers',
    description: 'Elevate your casual wardrobe with the Luxe Linen Joggers from Café Couture. Crafted from a breathable blend of 70% linen and 30% cotton, these joggers feature a relaxed fit with an adjustable drawstring waist and stylish cuffed ankles, making them perfect for both lounging and casual outings. Ideal for year-round wear, they effortlessly combine comfort and chic, whether paired with a simple tee or a tailored blouse.',
    price: 348.8,
    tags: ["casual","joggers","linen","all-season","comfortable","chic","relaxed fit"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Threads',
    title: 'Eco-Blend Wide-Leg Trousers',
    description: 'The Eco-Blend Wide-Leg Trousers from Urban Threads are crafted from a soft, sustainable cotton-linen blend, perfect for those crisp fall days. Featuring a high-waisted design and a relaxed fit, these trousers are ideal for casual outings or cozy brunches with friends. Pair them with a fitted turtleneck for a chic, effortless fall look.',
    price: 76.39,
    tags: ["fall fashion","wide-leg","sustainable","casual","urban style","eco-friendly","trendy"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Lark & Willow',
    title: 'High-Waisted Floral Pleated Trousers',
    description: 'Embrace the charm of spring with these exquisite high-waisted floral pleated trousers from Lark & Willow. Made from a lightweight blend of sustainable cotton and linen, these trousers feature a vibrant vintage floral print that adds a touch of nostalgia to any outfit. Perfect for garden parties or casual brunches, they offer both comfort and style with their breathable fabric and elegant pleats.',
    price: 194.87,
    tags: ["vintage","floral","spring","high-waisted","sustainable","trousers","Lark & Willow"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanThreads',
    title: 'Tailored Stretch Chinos',
    description: 'Crafted from a premium blend of cotton and spandex, these tailored stretch chinos offer both comfort and sophistication, making them ideal for business casual settings. Featuring a sleek design with subtle pleats and a classic five-pocket style, these chinos easily transition from day to night, perfect for meetings or after-work events. The all-season fabric ensures breathability and warmth, making them a versatile addition to your wardrobe.',
    price: 237.28,
    tags: ["business casual","chinos","all-season","tailored fit","UrbanThreads","premium fabric","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeVibe',
    title: 'Spring Blossom Silk Shorts',
    description: 'Elevate your cocktail attire with the Spring Blossom Silk Shorts by LuxeVibe. Crafted from luxurious 100% silk, these high-waisted shorts feature a delicate floral print, perfect for the vibrant spirit of spring. The tailored fit and elegant draping ensure a flattering silhouette, making them ideal for garden parties and upscale brunches alike.',
    price: 717.95,
    tags: ["cocktail","spring","silk","high-waisted","floral","luxury","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Cypress & Co.',
    title: 'Navy Twill Chinos',
    description: 'Elevate your business casual wardrobe with the Navy Twill Chinos from Cypress & Co. Crafted from a durable blend of cotton and elastane, these chinos offer a perfect balance of style and comfort, featuring a tailored fit that enhances your silhouette. Ideal for office meetings or weekend brunches, they are versatile enough to be dressed up with a blazer or kept casual with a crisp white shirt.',
    price: 52.81,
    tags: ["business casual","chinos","all-season","navy","comfortable","tailored fit","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeLine',
    title: 'Chic Tailored Ankle Trousers',
    description: 'Elevate your business casual wardrobe with LuxeLine\'s Chic Tailored Ankle Trousers. Crafted from a breathable blend of cotton and polyester, these trousers feature a sleek silhouette with a mid-rise waist and tailored fit, perfect for all-day comfort in any season. With subtle stretch for ease of movement and functional pockets, they are ideal for office meetings or after-work outings.',
    price: 91.48,
    tags: ["business casual","ankle trousers","all-season","tailored fit","comfortable","office wear","LuxeLine"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elysian Threads',
    title: 'Chesterfield Wool Trousers',
    description: 'The Chesterfield Wool Trousers are crafted from a luxurious blend of fine Merino wool and cashmere, providing unparalleled warmth and comfort during the winter months. Featuring a tailored fit and a sleek silhouette, these trousers are perfect for business casual settings, allowing you to transition seamlessly from the office to after-work gatherings. With classic details like a flat front, side pockets, and a subtle herringbone pattern, these trousers exude sophistication while ensuring you stay cozy.',
    price: 375.63,
    tags: ["business casual","winter wear","wool trousers","sophisticated","tailored fit","Elysian Threads","herringbone pattern"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Midnight Atelier',
    title: 'Silk Satin Wide-Leg Trousers',
    description: 'Elevate your evening wardrobe with these luxurious silk satin wide-leg trousers from Midnight Atelier. Crafted from high-quality, lightweight silk, they drape beautifully and feature a subtle sheen that catches the light, perfect for fall events. The trousers are designed with a high waist and elegant pleats, making them ideal for formal occasions or sophisticated dinners.',
    price: 454.09,
    tags: ["evening wear","wide-leg","silk","fall fashion","luxury","formal","Midnight Atelier"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Vitality Activewear',
    title: 'EliteFlex Joggers',
    description: 'The EliteFlex Joggers from Vitality Activewear are designed for the modern multitasker, seamlessly blending style and comfort. Made from a breathable, moisture-wicking fabric that features 4-way stretch technology, these joggers are perfect for everything from morning workouts to casual brunches. With a tapered fit, adjustable waistband, and reflective detailing, they ensure you stay stylish and visible, no matter the occasion.',
    price: 271.48,
    tags: ["athleisure","joggers","breathable","flexible","reflective","all-season","modern"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Cypress & Co.',
    title: 'Luxe Spring Chino Trousers',
    description: 'Crafted from a lightweight cotton-linen blend, the Luxe Spring Chino Trousers offer breathability and comfort perfect for sunny days. Featuring a tailored fit, subtle pleats, and an adjustable waistband, these chinos are ideal for casual outings or brunch dates in the park. Their versatile design allows for easy pairing with both casual tees and dressy blouses.',
    price: 299.36,
    tags: ["chinos","spring fashion","casual wear","lightweight","tailored fit","brunch outfit","cotton-linen"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Heritage Threads',
    title: 'Vintage Corduroy Wide-Leg Trousers',
    description: 'Step into autumn with these vintage-inspired corduroy wide-leg trousers, crafted from a soft cotton blend that offers both comfort and style. Featuring a high-waisted cut and front pleats, these trousers are perfect for casual outings or dressed-up occasions, pairing effortlessly with your favorite knits or blouses. The rich mustard hue captures the essence of fall, making them a standout addition to your wardrobe.',
    price: 44.48,
    tags: ["vintage","corduroy","wide-leg","autumn","high-waisted","casual","trousers"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Cedar & Oak',
    title: 'Heritage Wool Wide-Leg Trousers',
    description: 'Crafted from a luxurious blend of Italian merino wool and cashmere, the Heritage Wool Wide-Leg Trousers offer a perfect balance of comfort and sophistication for the fall season. Featuring a high waist and tailored wide legs, these trousers are designed to flatter any silhouette while providing warmth for autumn outings. Ideal for casual gatherings or a stylish day at the office, they pair beautifully with both chunky knits and fitted blouses.',
    price: 1285.56,
    tags: ["fall fashion","wide-leg","wool trousers","casual style","luxury clothing","Cedar & Oak","autumn essentials"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeVibe',
    title: 'Breezy Chic Culottes',
    description: 'The Breezy Chic Culottes from LuxeVibe are a must-have for your summer cocktail parties. Crafted from lightweight, breathable linen with a subtle sheen, these wide-leg culottes feature an elastic waistband for a comfortable fit and stylish side pockets for added convenience. Pair them with a fitted top and statement earrings for a perfect evening look.',
    price: 70.1,
    tags: ["summer fashion","cocktail attire","culottes","linen","wide-leg","elegant","LuxeVibe"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Verve & Vogue',
    title: 'Classic Tailored Chino Trousers',
    description: 'Elevate your wardrobe with the Classic Tailored Chino Trousers from Verve & Vogue. Crafted from a luxurious blend of cotton and elastane, these trousers offer a comfortable stretch fit while maintaining a polished silhouette. Perfect for business casual occasions, they feature a sleek, tapered leg and subtle detailing that makes them versatile enough for all-season wear.',
    price: 208.33,
    tags: ["business casual","chinos","tailored","all-season","comfortable","versatile","luxury"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeWave',
    title: 'Istanbul Nights Silk Culottes',
    description: 'Elevate your summer soirée with the Istanbul Nights Silk Culottes, crafted from luxurious 100% silk that drapes beautifully. These high-waisted culottes feature a vibrant paisley print reminiscent of Mediterranean nights, complete with a wide leg for effortless movement. Perfect for cocktail parties or rooftop gatherings, these pants will keep you cool and stylish all evening long.',
    price: 110.52,
    tags: ["summer","cocktail","silk","culottes","vibrant","fashion","LuxeWave"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elysian Attire',
    title: 'Tailored Linen Blend Chinos',
    description: 'Elevate your spring wardrobe with our Tailored Linen Blend Chinos, crafted from a lightweight, breathable fabric that combines 60% linen and 40% cotton for ultimate comfort. Featuring a sleek, tapered fit and subtle side pockets, these chinos effortlessly transition from office meetings to after-work gatherings, making them a versatile staple for your business casual collection.',
    price: 146.05,
    tags: ["business casual","spring fashion","linen blend","tailored fit","versatile","chinos","Elysian Attire"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Nordic Thread',
    title: 'Essential Wool Blend Trousers',
    description: 'Crafted from a luxurious blend of merino wool and cashmere, these Essential Wool Blend Trousers offer unparalleled warmth and comfort for the winter months. Featuring a minimalist silhouette with a tailored fit, they are designed with discreet side pockets and a subtle elastic waistband, making them perfect for both casual outings and sophisticated gatherings. Pair them with a fitted turtleneck for a chic and cozy look.',
    price: 1367.85,
    tags: ["minimalist","winter fashion","wool trousers","luxury","sustainable","tailored fit","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Luxe Avenue',
    title: 'Velvet High-Waisted Tapered Pants',
    description: 'Elevate your evening look with Luxe Avenue\'s Velvet High-Waisted Tapered Pants, crafted from sumptuous stretch velvet that offers both comfort and elegance. Featuring a flattering high-waisted design and tailored tapered leg, these pants are perfect for winter soirées, making them a versatile addition to your wardrobe. Pair them with a sleek blouse and statement heels for a sophisticated ensemble that exudes confidence.',
    price: 898.04,
    tags: ["evening wear","winter fashion","velvet pants","high-waisted","tapered leg","luxury","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Vintage Vibe Co.',
    title: 'High-Waisted Floral Print Culottes',
    description: 'Step into summer with these stunning high-waisted floral print culottes, crafted from a lightweight blend of cotton and linen for breathability. Featuring a wide-leg silhouette and a playful, vibrant print, these culottes are perfect for brunches, garden parties, or leisurely strolls through the park. The chic side pockets add both functionality and style, making them a versatile addition to your vintage-inspired wardrobe.',
    price: 667.82,
    tags: ["vintage","summer","culottes","floral","high-waisted","brunch","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Vintage Vogue',
    title: 'High-Waisted Cotton Twill Culottes',
    description: 'These High-Waisted Cotton Twill Culottes from Vintage Vogue are the perfect blend of retro charm and modern comfort. Crafted from lightweight, breathable cotton twill, they feature a flattering high waist and wide leg design that allows for easy movement, making them ideal for summer picnics or garden parties. With their unique floral embroidery along the hem, these culottes add a touch of vintage elegance to any casual outfit.',
    price: 651.56,
    tags: ["vintage","summer","culottes","floral","high-waisted","elegant","cotton"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'SunnyWave',
    title: 'Linen Breeze Culottes',
    description: 'Experience effortless style this summer with the Linen Breeze Culottes from SunnyWave. Crafted from lightweight, breathable linen, these culottes feature a wide-leg design that offers both comfort and elegance, making them perfect for beach outings or casual brunches. The elastic waistband and side pockets add practicality while the vibrant tropical print brings a touch of fun to your warm-weather wardrobe.',
    price: 63.55,
    tags: ["summer","casual","culottes","linen","beachwear","vibrant","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Tailored Essence',
    title: 'Springtime Elegance Trousers',
    description: 'Crafted from a luxurious blend of lightweight cotton and linen, these trousers offer breathability and comfort perfect for spring occasions. The tailored fit features a subtle pinstripe pattern, enhancing the sophisticated look for formal events or business meetings. With a mid-rise waist and elegant ankle length, these trousers seamlessly combine style and functionality.',
    price: 649.6,
    tags: ["formal","spring","tailored","elegant","business casual","luxury","designer"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Velvet & Co.',
    title: 'Midnight Velvet Trousers',
    description: 'Elevate your winter cocktail wardrobe with our Midnight Velvet Trousers, crafted from luxurious, soft-touch velvet that drapes beautifully on the body. Featuring a high-waisted silhouette and elegant tapered legs, these trousers are adorned with subtle gold piping along the side seams, making them perfect for festive soirées or elegant evenings out. Pair them with a silk blouse for a sophisticated look that turns heads.',
    price: 422.4,
    tags: ["winter fashion","cocktail attire","velvet trousers","evening wear","luxury","high-waisted","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeSilhouette',
    title: 'Velvet High-Waisted Tapered Trousers',
    description: 'Elevate your evening wear with these chic high-waisted tapered trousers crafted from sumptuous Italian velvet. The rich burgundy hue and elegant drape create a flattering silhouette, perfect for winter soirées or formal gatherings. Features include a tailored fit, side pockets, and a concealed zipper for a seamless look.',
    price: 291.76,
    tags: ["eveningwear","winterfashion","velvet","highwaisted","chic","formal","LuxeSilhouette"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elysian Threads',
    title: 'Luxe Linen Tapered Trousers',
    description: 'Crafted from a premium blend of sustainable linen and organic cotton, these Luxe Linen Tapered Trousers offer a breezy, breathable fit perfect for spring outings. Featuring a minimalist design with a high-rise waist and subtle pleating, they seamlessly transition from casual brunches to elegant evening events, ensuring you look effortlessly chic. Available in a soft, muted sage green, these trousers are designed for comfort without sacrificing style.',
    price: 449.4,
    tags: ["minimalist","spring fashion","sustainable","linen trousers","chic","elevated basics","tapered fit"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Velvet & Vine',
    title: 'Satin Wide-Leg Trousers',
    description: 'Elevate your evening wardrobe with our Satin Wide-Leg Trousers, crafted from luxurious silk-blend satin that drapes beautifully and adds a touch of elegance. These high-waisted trousers feature a soft sheen, subtle pleating, and side pockets for both style and functionality, making them perfect for fall cocktail parties or upscale dinners. Pair them with a fitted blouse or a chic sweater to create a stunning silhouette.',
    price: 55.12,
    tags: ["eveningwear","fallfashion","satin","wideleg","cocktail","luxury","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Tailor',
    title: 'Chic Olive Tapered Trousers',
    description: 'Crafted from a soft, breathable blend of cotton and spandex, the Chic Olive Tapered Trousers offer a flattering silhouette perfect for the office or after-work gatherings. Featuring a tailored fit, subtle pleats, and an elasticized waistband for added comfort, these versatile trousers pair beautifully with blouses or blazers, making them an ideal choice for fall business casual wear.',
    price: 99.15,
    tags: ["business casual","fall fashion","tapered trousers","Urban Tailor","office wear","comfortable","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanNomad',
    title: 'Rebel Cargo Joggers',
    description: 'Crafted from a durable, water-resistant blend of cotton and polyester, the Rebel Cargo Joggers combine functionality with street style. Featuring adjustable ankle cuffs, multiple cargo pockets, and a relaxed fit, these joggers are perfect for urban adventures in chilly weather. Ideal for casual outings or laid-back streetwear looks, they offer both comfort and edgy design.',
    price: 293.37,
    tags: ["streetwear","winter fashion","cargo pants","urban style","comfortable","edgy","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanNomad',
    title: 'Asphalt Cargo Shorts',
    description: 'Crafted from lightweight, breathable cotton-blend fabric, the Asphalt Cargo Shorts are designed for urban adventurers seeking style and functionality this summer. Featuring oversized utility pockets and a relaxed fit, these shorts are perfect for street festivals, skate sessions, or casual outings. The unique faded wash and subtle embroidered logo add a distinctive edge to your streetwear ensemble.',
    price: 838.06,
    tags: ["streetwear","summer","cargo shorts","urban fashion","lightweight","utility","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Muted Elegance',
    title: 'Forest Grove Tapered Trousers',
    description: 'Crafted from a luxurious blend of organic cotton and sustainable Tencel, the Forest Grove Tapered Trousers feature a high-waisted design that flatters the silhouette while offering comfort for all-day wear. With their minimalist aesthetic, these trousers are perfect for autumn outings, effortlessly transitioning from a casual lunch to an evening event with ease and style.',
    price: 747.47,
    tags: ["minimalist","autumn fashion","sustainable","high-waisted","tapered","luxury","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeVogue',
    title: 'Midnight Velvet Palazzo Pants',
    description: 'Elevate your evening attire with these Midnight Velvet Palazzo Pants from LuxeVogue. Crafted from sumptuous, soft-touch velvet, they feature a high-waisted design and a flowing wide-leg silhouette that adds an elegant flair to any winter soirée. Perfect for cocktail parties or formal gatherings, these pants offer both comfort and sophistication, ensuring you stand out while keeping warm.',
    price: 87.87,
    tags: ["evening wear","velvet","palazzo pants","winter fashion","elegant","formal","LuxeVogue"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Luna Grove',
    title: 'Ember Flow Maxi Skirt',
    description: 'The Ember Flow Maxi Skirt from Luna Grove is a stunning addition for your spring wardrobe. Crafted from lightweight organic cotton and adorned with intricate floral embroidery, this bohemian-style skirt features a tiered design that gracefully moves with you. Perfect for outdoor festivals, beach strolls, or casual brunches, it combines comfort with a free-spirited vibe.',
    price: 183.72,
    tags: ["bohemian","maxi skirt","spring fashion","organic cotton","floral","comfortable","festival wear"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanNomad',
    title: 'Cargo Jogger Pants',
    description: 'The UrbanNomad Cargo Jogger Pants combine comfort and utility, crafted from a durable cotton-twill blend that’s perfect for fall weather. Featuring multiple oversized pockets and adjustable ankle cuffs, these joggers are ideal for streetwear enthusiasts looking for versatility and style during casual outings or weekend adventures.',
    price: 26.3,
    tags: ["streetwear","joggers","fall fashion","utility","casual","urban style","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanNomad',
    title: 'Asphalt Cargo Trousers',
    description: 'Crafted from a durable yet breathable blend of organic cotton and recycled polyester, the Asphalt Cargo Trousers feature an oversized fit with articulated knees for enhanced mobility. Designed with multiple utility pockets and adjustable ankle cuffs, these trousers are perfect for urban adventurers seeking both style and functionality this fall.',
    price: 563.64,
    tags: ["streetwear","fall fashion","cargo trousers","urban style","sustainable","utility","oversized"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'RetroRevive',
    title: 'High-Waisted Floral Print Culottes',
    description: 'Embrace the essence of spring with our High-Waisted Floral Print Culottes from RetroRevive. Made from a lightweight blend of cotton and linen, these breezy culottes feature a vibrant floral pattern that adds a touch of vintage charm to any outfit. Perfect for picnics in the park or brunch with friends, these versatile bottoms are designed with a flattering high waist and wide leg for ultimate comfort and style.',
    price: 63.42,
    tags: ["vintage","spring","culottes","floral","high-waisted","retro","bohemian"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Vibe',
    title: 'Nomad Cargo Shorts',
    description: 'The Nomad Cargo Shorts are crafted from lightweight, breathable cotton twill, perfect for summer adventures. Featuring multiple oversized pockets and a relaxed fit, these shorts blend functionality with street style, making them ideal for outdoor festivals or casual hangouts. The adjustable waist drawstring ensures a comfortable fit for all-day wear.',
    price: 32.97,
    tags: ["streetwear","summer","cargo shorts","casual","urban","lightweight","adventure"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Savoy & Co.',
    title: 'Tailored Wool-Blend Trousers',
    description: 'Crafted from a premium wool-blend fabric, these tailored trousers offer both comfort and sophistication, making them an ideal choice for formal occasions or business meetings. The sleek design features a flat front, precisely pressed creases, and a classic fit that flatters all body types, ensuring you look polished year-round.',
    price: 511.56,
    tags: ["formal","trousers","wool-blend","tailored","business","all-season","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Maple & Oak',
    title: 'Chardonnay Corduroy Pants',
    description: 'Step into fall with the Chardonnay Corduroy Pants, crafted from soft, eco-friendly cotton corduroy that provides warmth and comfort. Featuring a high-waisted design and tapered legs, these pants are perfect for casual outings or cozy gatherings, easily paired with your favorite oversized knit sweaters. The rich burgundy hue adds a pop of seasonal color to your wardrobe while the functional pockets make them both stylish and practical.',
    price: 59.06,
    tags: ["corduroy","fall fashion","high-waisted","casual wear","eco-friendly","burgundy","tapered pants"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Luxe Atelier',
    title: 'Silk Chiffon Cocktail Trousers',
    description: 'Elevate your spring wardrobe with Luxe Atelier\'s Silk Chiffon Cocktail Trousers. Crafted from the finest lightweight silk chiffon, these trousers feature a high-waisted design with elegant pleats and a flowing silhouette, perfect for a sophisticated evening out or an upscale garden party. The semi-sheer overlay adds a touch of ethereal charm, while the hidden side pockets provide practicality without sacrificing style.',
    price: 1237.31,
    tags: ["cocktail","spring fashion","silk trousers","evening wear","luxury","chiffon","high-waisted"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Tailored Threads',
    title: 'Chic Flexi-Trousers',
    description: 'Elevate your business casual wardrobe with the Chic Flexi-Trousers from Tailored Threads. Crafted from a premium blend of stretch cotton and elastane, these trousers offer exceptional comfort and shape retention, making them perfect for all-day wear. Featuring a sleek, tapered fit and subtle side pockets, they are versatile enough for office meetings or after-work networking events.',
    price: 61.98,
    tags: ["business casual","flexible fit","all-season","comfortable","tapered","office wear","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanThreads',
    title: 'Spring Flex Cargo Joggers',
    description: 'These Spring Flex Cargo Joggers from UrbanThreads are designed for ultimate comfort and style, featuring a lightweight, breathable cotton-poly blend that\'s perfect for the warmer months. With multiple utility pockets and adjustable ankle cuffs, these joggers effortlessly combine functionality with a sleek streetwear aesthetic, making them ideal for casual outings or weekend adventures. The vibrant color palette is inspired by urban art, adding a fresh pop to your spring wardrobe.',
    price: 127.32,
    tags: ["streetwear","joggers","spring fashion","urban style","cargo pants","casual wear","men's fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Nordic Threads',
    title: 'Elysian Wide-Leg Trousers',
    description: 'Crafted from a luxurious blend of organic cotton and Tencel, the Elysian Wide-Leg Trousers offer unparalleled comfort and breathability, making them perfect for any season. With a minimalist silhouette and subtle pleat detailing, these trousers effortlessly transition from casual daywear to sophisticated evening attire. Pair them with a tucked-in blouse or an oversized knit for a chic, contemporary look.',
    price: 121.56,
    tags: ["minimalist","all-season","wide-leg","sustainable","chic","versatile","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Wildflower Collective',
    title: 'Luna Maxi Skirt',
    description: 'The Luna Maxi Skirt from Wildflower Collective embodies bohemian elegance, crafted from a lightweight organic cotton blend that flows beautifully in the spring breeze. Adorned with intricate hand-embroidered floral motifs and a tiered design, this skirt is perfect for both beach outings and garden parties. Its adjustable waist and side pockets add functionality without sacrificing style, making it a versatile addition to any boho-inspired wardrobe.',
    price: 1319.64,
    tags: ["bohemian","maxi skirt","spring fashion","organic cotton","hand-embroidered","versatile","floral"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'WinterWoven',
    title: 'Tailored Wool Blend Trousers',
    description: 'Crafted from a luxurious wool blend, these tailored trousers are perfect for formal winter occasions. Featuring a sleek, tapered fit and a classic plaid pattern, they are designed with a comfortable high waist and side pockets for added functionality. Pair them with a crisp button-up for an elegant look at the office or seasonal events.',
    price: 30.78,
    tags: ["formal","winter","trousers","wool blend","tailored","plaid","office wear"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanVibe',
    title: 'Cargo Joggers',
    description: 'The UrbanVibe Cargo Joggers are crafted from a lightweight, breathable cotton-blend fabric, perfect for those breezy spring days. Featuring multiple utility pockets and an adjustable drawstring waistband, these joggers combine functionality with style, making them ideal for casual outings or streetwear events. The relaxed fit and tapered ankles ensure comfort while maintaining a trendy silhouette.',
    price: 94.64,
    tags: ["streetwear","joggers","cargo","spring fashion","urban style","casual wear","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Nomad',
    title: 'Distressed Cargo Joggers',
    description: 'Embrace the essence of streetwear with these Distressed Cargo Joggers from Urban Nomad. Crafted from a lightweight blend of organic cotton and recycled polyester, these joggers feature oversized pockets and stylish frayed detailing, perfect for a laid-back spring outing or a casual day in the city. The elastic waistband with adjustable drawstrings ensures a comfortable fit, while the tapered leg design keeps the overall look sleek and modern.',
    price: 193.34,
    tags: ["streetwear","spring","cargo","joggers","sustainable","casual","urban"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Vintage Vibe Co.',
    title: 'Classic High-Waisted Denim Culottes',
    description: 'Step back in time with our Classic High-Waisted Denim Culottes, crafted from 100% organic cotton for a sustainable yet stylish choice. Featuring a relaxed fit, side pockets, and a chic, wide-leg silhouette, these culottes are perfect for casual outings or semi-formal gatherings throughout the year. Pair them with a vintage tee or a tailored blouse for an effortlessly cool look.',
    price: 150.6,
    tags: ["vintage","denim","culottes","high-waisted","sustainable","all-season","retro"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Aveline & Co.',
    title: 'Tailored Ankle Trousers',
    description: 'These tailored ankle trousers are crafted from a premium blend of breathable cotton and a touch of elastane for comfort and flexibility. With a sleek silhouette and subtle pinstripe detailing, they are perfect for both office settings and after-work events. The versatile design features a mid-rise waist and side pockets, making them an essential addition to your year-round business casual wardrobe.',
    price: 152.88,
    tags: ["business casual","ankle trousers","tailored","all-season","office wear","sophisticated","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Luna & Co.',
    title: 'Elysian Silk Midi Skirt',
    description: 'The Elysian Silk Midi Skirt from Luna & Co. is crafted from lightweight, 100% mulberry silk, making it perfect for those warm summer evenings. This elegant cocktail-style skirt features a flowing A-line silhouette with a high waist and delicate pleats, ensuring a flattering fit for any occasion, whether you\'re attending a garden party or a chic summer soirée.',
    price: 61.34,
    tags: ["silk","midi skirt","summer fashion","cocktail attire","elegant","flowy","high waist"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeWave',
    title: 'Silk Chiffon Midi Skirt',
    description: 'The LuxeWave Silk Chiffon Midi Skirt is a sophisticated cocktail piece ideal for summer soirées. Crafted from lightweight, breathable silk chiffon, this skirt features a flowing silhouette with an elegant high-low hem and delicate pleats that create movement with every step. Perfect for evening events or garden parties, it pairs beautifully with both heels and flats.',
    price: 291.46,
    tags: ["summer","cocktail","midi skirt","silk chiffon","elegant","flowy","occasion wear"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanNest',
    title: 'Navy Twill Tapered Trousers',
    description: 'Crafted from a soft, breathable cotton-twill blend, these tapered trousers feature a minimalist silhouette that pairs effortlessly with both casual and dressy ensembles. The adjustable waistband ensures a comfortable fit, making them ideal for transitional fall weather, while the deep navy hue adds a touch of sophistication. Perfect for weekend brunches or casual office days.',
    price: 34.17,
    tags: ["minimalist","fall fashion","tapered trousers","cotton blend","urban style","adjustable waistband","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elysian Threads',
    title: 'Luxe Twill Ankle Trousers',
    description: 'Elevate your spring wardrobe with the Luxe Twill Ankle Trousers by Elysian Threads. Crafted from a breathable cotton-linen blend, these tailored trousers feature a sleek fit with a cropped ankle length, making them perfect for transitioning from office meetings to after-work gatherings. The understated plaid pattern adds a touch of sophistication to your business casual ensemble.',
    price: 131.99,
    tags: ["business casual","spring fashion","ankle trousers","cotton-linen","tailored fit","plaid pattern","Elysian Threads"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Gypsy Soul',
    title: 'Ethereal Maxi Skirt',
    description: 'The Ethereal Maxi Skirt by Gypsy Soul is a stunning piece crafted from lightweight, breathable cotton and linen blend, making it perfect for summer days. Featuring an intricate paisley print and a flowing silhouette, this skirt adds a touch of bohemian flair to any casual outing or festival. With an elastic waistband and tiered design, it offers both comfort and style for those warm, sun-soaked adventures.',
    price: 384.75,
    tags: ["bohemian","maxi skirt","summer fashion","festival wear","paisley print","lightweight","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Earthy Threads',
    title: 'Gypsy Wanderer Wide-Leg Pants',
    description: 'Embrace the spirit of fall with the Gypsy Wanderer Wide-Leg Pants, crafted from a soft blend of organic cotton and linen. These bohemian-inspired trousers feature intricate paisley prints and an elastic waistband for added comfort, making them perfect for a casual day out or a cozy evening gathering. Pair them with a chunky knit sweater and ankle boots for an effortlessly chic look.',
    price: 35.14,
    tags: ["bohemian","wide-leg","fall fashion","earthy tones","casual wear","eco-friendly","trendy"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Lumière Essentials',
    title: 'Linen Breeze Culottes',
    description: 'Crafted from 100% organic linen, the Linen Breeze Culottes offer a breezy and lightweight feel, perfect for warm summer days. Featuring a high-waisted design and wide-leg silhouette, these culottes provide both comfort and style, making them ideal for casual outings or relaxed gatherings with friends.',
    price: 65.58,
    tags: ["minimalist","summer","culottes","organic","lightweight","comfortable","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Aether & Co.',
    title: 'Linen Pleat Trousers',
    description: 'Elevate your summer wardrobe with the Aether & Co. Linen Pleat Trousers, crafted from 100% breathable linen for superior comfort and style. Featuring a tailored fit with subtle pleating and an elasticized waistband, these trousers are perfect for casual outings or relaxed gatherings under the sun. Their minimalist design ensures versatility, easily pairing with both fitted tops and loose blouses.',
    price: 473.43,
    tags: ["minimalist","linen","summer","tailored","casual","breathable","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Tailored & Co.',
    title: 'Luxe Linen Trousers',
    description: 'These Luxe Linen Trousers from Tailored & Co. are crafted from a premium blend of 100% Italian linen, ensuring breathability and comfort for warm summer days. Featuring a tailored fit with a subtle crease down the front, these trousers are perfect for business casual settings, making them ideal for office meetings or outdoor networking events. With an elegant contour and lightweight feel, they offer both style and functionality for the modern professional.',
    price: 1156.99,
    tags: ["business casual","summer fashion","linen trousers","tailored fit","office wear","lightweight","premium quality"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Verve & Vogue',
    title: 'Chic Tailored Ankle Trousers',
    description: 'Elevate your spring wardrobe with the Chic Tailored Ankle Trousers from Verve & Vogue. Crafted from a luxurious blend of lightweight stretch cotton and breathable linen, these trousers offer exceptional comfort and a flattering silhouette. Featuring a crisp pleated front, tailored fit, and subtle side pockets, they are ideal for business casual settings or smart gatherings.',
    price: 1464.93,
    tags: ["business casual","spring fashion","ankle trousers","tailored fit","luxury materials","workwear","Versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elysian Couture',
    title: 'Autumn Elegance Silk Midi Skirt',
    description: 'Elevate your cocktail attire with the Autumn Elegance Silk Midi Skirt from Elysian Couture. Crafted from luxurious silk satin, this skirt features a delicate drape and an asymmetrical hemline that flatters every figure. Perfect for fall gatherings and evening events, it combines sophistication with a touch of whimsy, making it an essential addition to your seasonal wardrobe.',
    price: 592.2,
    tags: ["silk","midi skirt","cocktail","fall fashion","luxury","evening wear","Elysian Couture"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Vintage Vogue',
    title: 'High-Waisted Floral Print Culottes',
    description: 'Step into spring with these High-Waisted Floral Print Culottes from Vintage Vogue. Made from a lightweight blend of cotton and linen, they feature a playful floral pattern that exudes retro charm. Perfect for brunch dates or casual outings, these culottes combine comfort and style, offering a flattering silhouette and easy movement.',
    price: 29.08,
    tags: ["vintage","culottes","spring fashion","floral print","high-waisted","casual","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elysian Threads',
    title: 'Essential Tapered Trousers',
    description: 'Crafted from a breathable blend of organic cotton and Tencel, the Essential Tapered Trousers offer a sleek silhouette that transitions seamlessly from casual gatherings to professional settings. Featuring an elastic waistband for added comfort and discreet side pockets, these minimalist trousers are designed to be your go-to for all-season versatility.',
    price: 26.48,
    tags: ["minimalist","tapered","organic cotton","all-season","versatile","comfortable","Elysian Threads"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elysian Couture',
    title: 'Midnight Velvet Tapered Trousers',
    description: 'Elevate your evening attire with the Midnight Velvet Tapered Trousers, crafted from sumptuous stretch velvet that provides both comfort and sophistication. Featuring a high-waisted design with elegant pleats and a tapered leg, these trousers are perfect for upscale dinners or winter galas. Pair them with a sparkling blouse for a chic look that radiates elegance and warmth.',
    price: 144.68,
    tags: ["evening wear","winter fashion","velvet trousers","formal attire","chic style","high-waisted","tapered fit"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Maison Verity',
    title: 'Elysian Tailored Trousers',
    description: 'Crafted from a luxurious blend of Italian wool and silk, the Elysian Tailored Trousers boast a refined silhouette that effortlessly transitions from office meetings to evening events. Featuring a delicate pinstripe pattern, a mid-rise fit, and a subtle ankle taper, these trousers exude sophistication while providing all-day comfort. Ideal for business casual occasions, they pair beautifully with both blazers and casual shirts.',
    price: 1258.04,
    tags: ["business casual","tailored trousers","Italian wool","luxury fashion","all-season","sophisticated style","professional wear"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'ActiveFusion',
    title: 'FlexiFit High-Waisted Joggers',
    description: 'The FlexiFit High-Waisted Joggers are designed for ultimate comfort and style, crafted from a lightweight blend of organic cotton and recycled polyester. Featuring moisture-wicking technology and a flattering high waistband, these joggers are perfect for a workout at the gym or a casual day out. With their versatile design, they transition seamlessly from studio to street, making them an essential addition to your all-season wardrobe.',
    price: 73.02,
    tags: ["athleisure","joggers","activewear","sustainable fashion","all-season","high-waisted","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'UrbanNomad',
    title: 'Breezy Cargo Shorts',
    description: 'The Breezy Cargo Shorts by UrbanNomad are designed for the urban explorer. Crafted from lightweight, breathable cotton twill, these shorts feature multiple utility pockets and adjustable drawstring hems for a customizable fit. Perfect for summer adventures or casual hangouts, they combine functionality with street style effortlessly.',
    price: 209.78,
    tags: ["streetwear","summer","cargo shorts","urban style","lightweight","functional","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeStrive',
    title: 'Tailored Linen Blend Trousers',
    description: 'Elevate your summer business casual wardrobe with LuxeStrive\'s Tailored Linen Blend Trousers. Crafted from a breathable linen-cotton blend, these trousers feature a lightweight feel with a polished silhouette, making them perfect for warm weather office days. The tailored fit and subtle stretch ensure all-day comfort while maintaining a sharp, professional look, ideal for business meetings or after-work events.',
    price: 295.34,
    tags: ["business casual","summer fashion","linen trousers","tailored fit","office wear","LuxeStrive","professional attire"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Luna Atelier',
    title: 'Elysian Tapered Trousers',
    description: 'Crafted from a lightweight blend of organic cotton and Tencel, the Elysian Tapered Trousers offer a breathable and luxurious feel perfect for spring outings. Featuring a minimalist silhouette with subtle pleats and a high-rise waist, these trousers are designed to flatter any figure while providing comfort and style. Ideal for both casual brunches and semi-formal gatherings, they pair beautifully with simple tops or oversized blazers.',
    price: 378.26,
    tags: ["minimalist","spring fashion","organic materials","tapered trousers","eco-friendly","versatile","luxury"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Luna Nightwear',
    title: 'Silk Satin Wide-Leg Trousers',
    description: 'Elevate your evening ensemble with our Silk Satin Wide-Leg Trousers, crafted from luxurious 100% mulberry silk for an ultra-soft feel. Featuring a high-waisted design and a flowing silhouette, these trousers offer both comfort and elegance, making them perfect for formal gatherings or sophisticated dinner parties. Their versatile style ensures you can wear them year-round, pairing effortlessly with a chic blouse or a fitted top.',
    price: 313.69,
    tags: ["eveningwear","satin","wide-leg","luxury","formal","all-season","high-waisted"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeBreeze',
    title: 'Floral Chiffon Midi Skirt',
    description: 'The Floral Chiffon Midi Skirt from LuxeBreeze exudes elegance with its flowing silhouette and vibrant spring floral prints. Crafted from lightweight, breathable chiffon, this skirt features a delicate high waist and a hidden side zipper for a seamless fit. Perfect for cocktail parties or springtime brunches, it pairs beautifully with a fitted top and strappy heels.',
    price: 536.89,
    tags: ["cocktail","spring","midi skirt","floral","chiffon","elegant","party"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Boho Bliss',
    title: 'Elysian Flare Pants',
    description: 'The Elysian Flare Pants are crafted from a soft, breathable blend of organic cotton and modal, ensuring comfort and versatility for any season. With their intricate paisley print and high-waisted design, these pants flow beautifully, making them perfect for both casual outings and festive gatherings. Pair them with a fitted top or an oversized sweater for a complete bohemian look.',
    price: 64.3,
    tags: ["bohemian","flared","organic cotton","casual","versatile","paisley print","all-season"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Velvet & Vine',
    title: 'Midnight Velvet Tapered Trousers',
    description: 'Elevate your cocktail attire this winter with the Midnight Velvet Tapered Trousers from Velvet & Vine. Crafted from a luxurious blend of soft velvet and elastane, these trousers feature a high-waisted design that flatters the silhouette and side pockets for added convenience. Perfect for an evening out or holiday parties, they effortlessly pair with a fitted blouse or an oversized sweater for a chic yet cozy look.',
    price: 255.38,
    tags: ["cocktail","winter fashion","velvet","tapered trousers","evening wear","luxurious","high-waisted"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'AeroFlex',
    title: 'BreezeFit High-Waisted Joggers',
    description: 'The BreezeFit High-Waisted Joggers are crafted from a lightweight, breathable blend of organic cotton and moisture-wicking polyester, making them the perfect choice for summer workouts or casual outings. Featuring a stylish high waist with a cinched drawstring and deep side pockets, these joggers provide both comfort and functionality. Ideal for yoga sessions, running errands, or lounging at home, they offer a chic athleisure look without compromising on performance.',
    price: 418.01,
    tags: ["athleisure","summer","joggers","high-waisted","organic cotton","lightweight","activewear"],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'LuxeLine',
    title: 'Silk Blend Tailored Culottes',
    description: 'Elevate your summer business casual wardrobe with our Silk Blend Tailored Culottes from LuxeLine. Crafted from a lightweight and breathable silk-cotton blend, these culottes feature a high-rise waist and crisp front pleats, ensuring a sharp yet comfortable silhouette. Perfect for warm weather meetings or casual Fridays, they pair beautifully with both structured blazers and relaxed tops.',
    price: 212.12,
    tags: ["business casual","summer fashion","culottes","silk blend","LuxeLine","tailored","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1624206112918-feb53c415ccb?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Elysian Threads',
    title: 'Wanderlust Velvet Palazzo Pants',
    description: 'Embrace the spirit of adventure this winter with our Wanderlust Velvet Palazzo Pants, crafted from luxurious, eco-friendly bamboo velvet. Featuring intricate hand-embroidered details along the hem and an elasticized high waist, these pants offer both comfort and style for your winter gatherings, bohemian festivals, or cozy evenings by the fire. Pair them with a soft knit sweater or a flowing blouse for an effortlessly chic look.',
    price: 298.77,
    tags: ["bohemian","winter fashion","palazzo pants","sustainable","luxury","handmade","festive wear"],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Heritage & Co.',
    title: 'High-Waisted Corduroy Trousers',
    description: 'Embrace vintage charm with our High-Waisted Corduroy Trousers made from premium, soft-washed cotton corduroy. Featuring a flattering silhouette that cinches at the waist and flares slightly at the ankle, these trousers are perfect for winter outings or cozy indoor gatherings. Pair them with a chunky knit sweater for a timeless look that combines comfort and style.',
    price: 96.51,
    tags: ["vintage","winter","corduroy","high-waisted","trousers","retro","cozy"],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Nomad',
    title: 'City Explorer Cargo Joggers',
    description: 'Stay warm and stylish this winter with the City Explorer Cargo Joggers. Crafted from a premium blend of recycled polyester and organic cotton, these joggers feature insulated lining and multiple utility pockets for practicality. Perfect for a casual day out in the city or a weekend adventure, they combine comfort and functionality seamlessly.',
    price: 78.42,
    tags: ["streetwear","winter","joggers","cargo","urban","functional","eco-friendly"],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Nomad',
    title: 'Tech Fleece Cargo Pants',
    description: 'Crafted from a premium blend of high-density polyester and soft-spun fleece, the Tech Fleece Cargo Pants offer unparalleled warmth and comfort for urban explorers this winter. Equipped with multiple utility pockets and an adjustable drawstring waistband, these pants combine functionality with a stylish streetwear aesthetic, making them perfect for both casual outings and outdoor adventures.',
    price: 316.27,
    tags: ["streetwear","winter fashion","cargo pants","urban style","comfortable","stylish","functional"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Thread',
    title: 'Chic Tailored Cropped Trousers',
    description: 'Elevate your business casual wardrobe with the Urban Thread Chic Tailored Cropped Trousers. Made from a lightweight blend of breathable cotton and stretch fabric, these trousers feature a flattering high-waisted design, side pockets, and a subtle pinstripe pattern, perfect for the spring season. Ideal for meetings or brunch with colleagues, these pants combine comfort and sophistication effortlessly.',
    price: 148.02,
    tags: ["business casual","spring fashion","tailored pants","cropped trousers","urban style","workwear","pinstripe"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'Urban Nomad',
    title: 'Luxe Comfort Chino Pants',
    description: 'Crafted from a blend of organic cotton and Tencel, the Luxe Comfort Chino Pants are designed for the modern wanderer who values both style and sustainability. Featuring a tailored fit with a slightly tapered leg, these versatile chinos are perfect for casual outings or relaxed office environments. With moisture-wicking properties and a soft finish, they offer year-round comfort whether paired with a tee or a button-down shirt.',
    price: 1154.86,
    tags: ["casual","chino","sustainable","all-season","urban","comfortable","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop',
    category: 'bottoms'
  },
  {
    brand: 'NaturaFoot',
    title: 'EcoSleek Minimalist Sneakers',
    description: 'The EcoSleek Minimalist Sneakers by NaturaFoot are crafted from premium, sustainably sourced leather and feature a sleek, aerodynamic design. Designed for versatility, these shoes blend effortlessly into both casual and semi-formal occasions, making them an ideal choice for year-round wear. The cushioned insole provides comfort for all-day use, while the eco-friendly rubber outsole ensures durability and traction.',
    price: 985.81,
    tags: ["minimalist","sustainable","all-season","luxury","casual","eco-friendly","premium"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Stalwart Elegance',
    title: 'Winter Formal Oxford Boots',
    description: 'Crafted from premium full-grain leather, the Winter Formal Oxford Boots combine a sleek design with functionality, featuring a waterproof finish that keeps your feet dry during snowy commutes. With a cushioned insole and a durable rubber outsole, these boots provide all-day comfort and grip, making them perfect for formal occasions in chilly weather.',
    price: 61.38,
    tags: ["formal","winter","leather","waterproof","oxford","boots","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'AeroStride',
    title: 'BreezeFlex Summer Runners',
    description: 'The AeroStride BreezeFlex Summer Runners are designed for maximum comfort and breathability during warm weather. Crafted with a lightweight mesh upper and cushioned EVA sole, these shoes provide excellent support whether you\'re hitting the trails or enjoying a casual day out. Perfect for athleisure enthusiasts, they combine style and function, making them ideal for both workouts and relaxed outings.',
    price: 82.29,
    tags: ["athleisure","summer shoes","lightweight","breathable","running","casual footwear","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Solstice Footwear',
    title: 'Boreal Minimalist Sneakers',
    description: 'The Boreal Minimalist Sneakers are crafted from premium Italian leather with a soft suede lining, designed for both comfort and style. Featuring a lightweight EVA sole for superior cushioning, these shoes are perfect for crisp autumn strolls or casual outings, embodying a sleek yet functional aesthetic. Their understated elegance makes them a versatile addition to any fall wardrobe.',
    price: 244.06,
    tags: ["minimalist","fall fashion","Italian leather","casual","sneakers","autumn style","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Allegra Noir',
    title: 'Midnight Velvet Heels',
    description: 'Step into elegance with the Midnight Velvet Heels from Allegra Noir, crafted from sumptuous black velvet and accented with delicate crystal embellishments. Perfectly designed for winter soirées, these heels feature a luxurious padded insole for comfort and a sturdy block heel for stability on frosty surfaces. Elevate your evening attire with a touch of glamour that ensures you shine at every occasion.',
    price: 1095.67,
    tags: ["evening","winter","velvet","luxury","heels","fashion","formal"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Stride & Flex',
    title: 'All-Season Performance Sneakers',
    description: 'The Stride & Flex All-Season Performance Sneakers are crafted from a breathable mesh upper with durable synthetic overlays, ensuring optimal ventilation and support. Featuring a cushioned EVA midsole for enhanced comfort, these shoes are perfect for both workouts and casual outings. Designed with a stylish yet functional tread, they provide excellent grip on various surfaces, making them an ideal choice for year-round wear.',
    price: 87.38,
    tags: ["athleisure","sneakers","breathable","all-season","performance","comfortable","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'SleekStep',
    title: 'Crestwood Leather Loafers',
    description: 'The Crestwood Leather Loafers by SleekStep combine elegance and comfort, crafted from premium water-resistant leather perfect for winter. Featuring a cushioned insole and a durable rubber outsole, these loafers are ideal for business casual occasions, providing style without sacrificing practicality. The classic design is complemented by subtle stitching details, making them a versatile addition to any wardrobe.',
    price: 37.75,
    tags: ["business casual","winter shoes","leather loafers","comfortable footwear","water-resistant","stylish","premium quality"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Urban Mettle',
    title: 'Spring Street Vibe Sneakers',
    description: 'Step into the season with the Spring Street Vibe Sneakers, crafted from breathable cotton canvas and reinforced with durable rubber outsoles for optimal grip. These sneakers feature a modern aesthetic with vibrant color blocking and an eco-friendly insole, making them perfect for casual outings or urban adventures this spring.',
    price: 102.28,
    tags: ["streetwear","sneakers","spring","urban","casual","fashion","eco-friendly"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStep',
    title: 'Velvet Evening Pumps',
    description: 'Crafted from sumptuous midnight blue velvet, the LuxeStep Evening Pumps feature a sleek pointed toe and a delicate ankle strap for added elegance. Perfect for fall soirées, these shoes offer a plush padded insole for comfort while enhancing your silhouette with a 3-inch stiletto heel. The rich texture and sophisticated design make them an ideal choice for any evening gathering.',
    price: 73.18,
    tags: ["eveningwear","fall fashion","velvet","pumps","stiletto","luxury","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'FrostStep',
    title: 'Urban Winter Sneakers',
    description: 'The FrostStep Urban Winter Sneakers blend style and functionality with their water-resistant nylon upper and warm fleece lining. Designed for urban adventures, these shoes feature a cushioned insole and a durable rubber outsole for superior traction on slippery surfaces. Perfect for casual outings or winter strolls in the city.',
    price: 43.69,
    tags: ["winter","casual","sneakers","water-resistant","urban","fashion","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'RetroStep',
    title: 'Vintage Summer Canvas Sneakers',
    description: 'Step into summer with the RetroStep Vintage Summer Canvas Sneakers, designed for style and comfort. Crafted from breathable cotton canvas and featuring a cushioned footbed, these shoes provide all-day support, making them perfect for picnics or beach outings. The retro-inspired design is completed with a classic rubber sole and vibrant color options, ensuring you stand out during sunny adventures.',
    price: 80.98,
    tags: ["vintage","canvas","summer","sneakers","retro","breathable","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Firenze Luxe',
    title: 'Velvet Night Stiletto Boots',
    description: 'Step into elegance with the Velvet Night Stiletto Boots by Firenze Luxe. Crafted from sumptuous deep navy velvet, these boots feature a sleek silhouette accented by a pointed toe and a glamorous 4-inch stiletto heel. Perfect for winter evening events, they are lined with a soft thermal fabric and adorned with subtle crystal embellishments that catch the light beautifully.',
    price: 565.38,
    tags: ["evening shoes","winter fashion","stiletto heels","velvet boots","luxury footwear","formal wear","Firenze Luxe"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStride',
    title: 'Elysian Oxford Shoes',
    description: 'The Elysian Oxford Shoes from LuxeStride are crafted from premium perforated leather, offering a perfect blend of style and breathability ideal for spring occasions. With a classic lace-up design and cushioned insole, these shoes provide all-day comfort while maintaining a polished look for formal events or office wear.',
    price: 33.56,
    tags: ["formal","Oxford","spring","leather","cushioned","business","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'UrbanStride',
    title: 'Spring Breeze LX Sneakers',
    description: 'The Spring Breeze LX Sneakers feature a lightweight, breathable mesh upper combined with premium suede overlays for a sleek, modern look. Designed for comfort, they incorporate a cushioned EVA midsole and a grippy rubber outsole, making them perfect for urban exploration or casual outings. Ideal for the spring season, these sneakers blend style with functionality, ensuring you stay on-trend while enjoying the warmer weather.',
    price: 644.62,
    tags: ["streetwear","sneakers","spring","urban","fashion","comfortable","premium"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'BohoNest',
    title: 'Wanderlust Winter Ankle Boots',
    description: 'Experience the essence of bohemian style with the Wanderlust Winter Ankle Boots. Crafted from premium distressed leather and lined with plush faux fur, these boots feature intricate embroidered patterns that evoke a sense of wander and adventure. With a sturdy rubber sole for traction, they are perfect for winter outings, whether you\'re exploring a snowy market or enjoying a cozy gathering by the fire.',
    price: 139.74,
    tags: ["bohemian","winter","ankle boots","leather","embroidered","plush","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'UrbanStride',
    title: 'Nexus Flex Oxford Shoes',
    description: 'The Nexus Flex Oxford Shoes by UrbanStride are designed for the modern professional seeking comfort without compromising on style. Crafted from premium full-grain leather and featuring a breathable mesh lining, these shoes provide a perfect blend of durability and ventilation. With their lightweight yet supportive sole, they are ideal for all-day wear in business casual settings, making them suitable for everything from board meetings to evening events.',
    price: 141.78,
    tags: ["business casual","all-season","Oxford shoes","premium leather","urban style","comfortable","professional"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Vera Bella',
    title: 'Luna Luxe Heels',
    description: 'The Luna Luxe Heels are a stunning pair of cocktail shoes designed for summer soirées. Crafted from a blend of soft, breathable Italian leather and adorned with delicate hand-embroidered floral patterns, these heels feature a comfortable padded insole and a graceful stiletto that elevates your style while ensuring all-day comfort. Perfect for garden parties or elegant evening events, these shoes will make you the center of attention.',
    price: 1156.76,
    tags: ["summer","cocktail","heels","luxury","Italian leather","hand-embroidered","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStride',
    title: 'Breeze Oxford Loafers',
    description: 'Step into spring with the LuxeStride Breeze Oxford Loafers, crafted from premium Italian leather that offers both durability and a polished look. Featuring a cushioned insole for all-day comfort and a lightweight rubber sole that provides excellent traction, these loafers are perfect for business casual settings or brunch with friends. The breathable lining ensures your feet stay cool even in warmer weather.',
    price: 284.43,
    tags: ["business casual","spring shoes","leather loafers","comfortable","lightweight","stylish","durable"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'UrbanStep',
    title: 'BreezeRunner 2.0',
    description: 'The BreezeRunner 2.0 combines lightweight mesh and durable synthetic overlays for optimal breathability and support, perfect for summer urban explorations. Featuring a cushioned sole for all-day comfort and a slip-on design for easy wear, these shoes are ideal for casual outings or street festivals. Available in vibrant colorways, they make a bold statement while keeping your feet cool and stylish.',
    price: 189.29,
    tags: ["streetwear","summer","lightweight","casual","breathable","fashion-forward"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Aventis',
    title: 'Spring Luxe Oxford Shoes',
    description: 'Elevate your business casual wardrobe with the Spring Luxe Oxford Shoes by Aventis. Crafted from premium Italian leather and featuring a cushioned insole for all-day comfort, these shoes are designed for the modern professional who values both style and functionality. Perfect for spring meetings or outdoor brunches, they combine elegance and practicality with a lightweight, breathable construction.',
    price: 994.81,
    tags: ["business casual","spring fashion","leather shoes","men's footwear","formal","comfortable","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Valley Walker',
    title: 'Autumn Breeze Sneakers',
    description: 'The Autumn Breeze Sneakers by Valley Walker are crafted from premium suede and breathable mesh, providing both comfort and style for the crisp fall days. Featuring a cushioned insole and lightweight rubber outsole, these shoes are perfect for casual outings or weekend adventures in the park. The earthy tones and stylish silhouette make them a versatile addition to your autumn wardrobe.',
    price: 348.94,
    tags: ["casual","fall fashion","sneakers","suede","comfortable","weekend wear","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Heritage Footwear Co.',
    title: 'Vintage Walker Ankle Boots',
    description: 'Step into the season with the Vintage Walker Ankle Boots, crafted from premium distressed leather that offers a rustic charm perfect for fall. Featuring a cushioned insole and a rubber outsole for comfort and durability, these boots are ideal for weekend outings or cozy gatherings. The lace-up design with brass eyelets adds a touch of classic elegance, making them a versatile addition to your wardrobe.',
    price: 89.74,
    tags: ["vintage","ankle boots","fall fashion","leather","rustic","casual wear","Heritage Footwear"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'MapleStep',
    title: 'Autumn Breeze Loafers',
    description: 'The Autumn Breeze Loafers by MapleStep combine comfort and style with their premium suede upper and plush memory foam insole. Designed for casual outings, these loafers feature a durable rubber outsole for excellent grip on fall days, making them perfect for strolls in the park or coffee dates with friends. With their earthy tones and sleek silhouette, they effortlessly elevate any autumn wardrobe.',
    price: 68.76,
    tags: ["casual","fall fashion","loafers","comfortable","suede","everyday wear"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Elysian Footwear',
    title: 'Nocturne Luxe Heels',
    description: 'Step into elegance with the Nocturne Luxe Heels, crafted from premium Italian leather and adorned with subtle metallic accents. These evening stilettos feature a cushioned insole for comfort, making them perfect for fall gala events or sophisticated dinners. The sleek silhouette and 4-inch heel offer a timeless look that pairs beautifully with both formal dresses and tailored trousers.',
    price: 235.45,
    tags: ["eveningwear","fall fashion","Italian leather","ladies heels","elegant shoes","gala","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'AeroStep',
    title: 'Luxe Breeze Runner',
    description: 'The Luxe Breeze Runner combines ultra-lightweight mesh with sustainable bamboo fibers, ensuring breathability and comfort perfect for summer activities. Featuring a cushioned midsole and a slip-on design, these shoes are ideal for both casual outings and athletic endeavors, providing style without sacrificing performance. The vibrant color palette reflects the energy of summer, making them a standout addition to any athleisure wardrobe.',
    price: 1254.47,
    tags: ["athleisure","summer","lightweight","sustainable","casual","running","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStep',
    title: 'Velvet Elegance Evening Pumps',
    description: 'Step into sophistication with the Velvet Elegance Evening Pumps by LuxeStep. Crafted from premium crushed velvet, these pointed-toe pumps feature intricate hand-stitched detailing and a delicate satin bow accent, making them perfect for formal gatherings or upscale events. The cushioned insole provides all-night comfort, while the sleek 4-inch heel adds just the right amount of height for an elegant silhouette this fall.',
    price: 832.04,
    tags: ["evening wear","fall fashion","velvet","high heels","luxury","formal shoes","designer"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LunaStride',
    title: 'Minimalist Spring Slip-Ons',
    description: 'The LunaStride Minimalist Spring Slip-Ons combine elegance and comfort with their sleek, low-profile design. Crafted from premium eco-friendly canvas and featuring a cushioned insole made of recycled materials, these shoes offer breathability and flexibility for all-day wear. Perfect for casual outings or leisurely strolls in the park, their understated aesthetic makes them a versatile addition to any spring wardrobe.',
    price: 174.97,
    tags: ["minimalist","spring","eco-friendly","comfortable","casual","slip-ons","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStride',
    title: 'Breezy Business Loafers',
    description: 'The LuxeStride Breezy Business Loafers are designed for the modern professional seeking comfort without sacrificing style. Crafted from breathable canvas with a cushioned insole, these loafers feature a slip-on design perfect for warm summer days in the office or casual outings. Their versatile tan color and subtle detailing make them an ideal choice for business casual attire.',
    price: 48.59,
    tags: ["business casual","summer shoes","loafers","breathable","comfortable","professional","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Verdi Luxe',
    title: 'Palladino Leather Loafers',
    description: 'Crafted from premium Italian leather, the Palladino Leather Loafers feature a sleek silhouette with subtle stitching details that elevate their elegance. Designed for business casual settings, these loafers offer a cushioned insole for all-day comfort and a durable rubber outsole for enhanced grip, making them perfect for spring outings or office meetings. The sophisticated navy hue complements a variety of outfits, ensuring you step out in style.',
    price: 700.94,
    tags: ["business casual","leather shoes","spring fashion","luxury footwear","Versatile style","office ready","Italian craftsmanship"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'SoleEase',
    title: 'Luna Minimalist Slip-Ons',
    description: 'The Luna Minimalist Slip-Ons are crafted from lightweight, breathable canvas that keeps your feet cool during hot summer days. Featuring a sleek, no-lace design and a padded insole for comfort, these shoes are perfect for casual outings, beach trips, or relaxed afternoons in the park. Their understated elegance makes them easy to pair with any summer outfit.',
    price: 41.97,
    tags: ["minimalist","summer shoes","casual wear","breathable","stylish","lightweight","slip-ons"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'NordicStride',
    title: 'Winter Minimalist High-Top Sneakers',
    description: 'Crafted from premium water-resistant suede and lined with soft merino wool, the NordicStride Winter Minimalist High-Top Sneakers are designed for both style and comfort. Featuring a sleek silhouette with a cushioned insole and durable rubber outsole, these shoes are perfect for urban adventures or cozy winter outings. Their understated elegance makes them suitable for both casual and semi-formal occasions.',
    price: 298.41,
    tags: ["minimalist","winter shoes","high-top","sustainable materials","urban style","casual wear","water-resistant"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'UrbanStride',
    title: 'Nebula Breeze Sneakers',
    description: 'The Nebula Breeze Sneakers are crafted with a breathable mesh upper and a lightweight, cushioned sole designed for maximum comfort during the summer months. Featuring a unique iridescent finish and reflective accents, these shoes are perfect for streetwear enthusiasts looking to make a statement while staying cool. Ideal for casual outings and music festivals, they blend style with functionality effortlessly.',
    price: 1425.12,
    tags: ["summer","streetwear","sneakers","breathable","urban fashion","festival gear","limited edition"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Windflower Collective',
    title: 'Bohemian Winter Ankle Boots',
    description: 'Embrace the season with the Windflower Collective Bohemian Winter Ankle Boots, crafted from premium suede and lined with cozy faux fur for ultimate warmth. Featuring intricate embroidery and a durable rubber sole, these boots are perfect for casual outings and can easily transition from day to night, adding a touch of bohemian flair to any winter wardrobe.',
    price: 198.62,
    tags: ["bohemian","winter","ankle boots","suede","embroidered","casual","faux fur"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'UrbanStride',
    title: 'AeroFlex Summer Sneakers',
    description: 'The AeroFlex Summer Sneakers by UrbanStride are designed for the urban explorer who values both style and comfort. Crafted from breathable mesh and lightweight synthetic materials, these shoes feature a cushioned insole and a flexible outsole for all-day wear. Perfect for casual outings, festivals, or street-style looks, they blend functionality with edgy aesthetics.',
    price: 1463.14,
    tags: ["summer","streetwear","sneakers","urban","fashion","lightweight","breathable"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Nordic Stride',
    title: 'Fjord Minimalist Winter Boots',
    description: 'The Fjord Minimalist Winter Boots are crafted from premium waterproof leather and lined with breathable merino wool for ultimate warmth and comfort. Featuring a sleek silhouette with a slip-resistant sole, these boots are perfect for both urban commuting and outdoor adventures. Designed for those who appreciate understated elegance, these boots effortlessly combine style and functionality for the colder months.',
    price: 588.19,
    tags: ["minimalist","winter","boots","waterproof","luxury","urban","functional"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Heritage Walk',
    title: 'Vintage Leather Winter Boots',
    description: 'Crafted from premium, distressed leather, the Vintage Leather Winter Boots by Heritage Walk combine timeless style with modern comfort. Featuring a plush shearling lining and a rugged rubber sole, these boots are perfect for both casual outings and winter adventures. The unique lace-up design and brass eyelets add a touch of elegance to any vintage-inspired wardrobe.',
    price: 581.68,
    tags: ["vintage","winter","leather","boots","shearling","casual","rugged"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStep',
    title: 'Velvet Evening Heels',
    description: 'Step into sophistication with the LuxeStep Velvet Evening Heels, crafted from rich navy blue velvet that offers a luxurious touch perfect for fall gatherings. Featuring a sleek pointed toe and an elegant stiletto heel, these shoes are designed to elevate your cocktail attire while providing comfort with padded insoles. Ideal for evening events or upscale cocktail parties, these heels are a statement piece for any fashion-forward wardrobe.',
    price: 356.82,
    tags: ["fall fashion","cocktail shoes","luxury","velvet","evening wear","stiletto","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Elysian Footwear',
    title: 'Mira Nomad Sandals',
    description: 'The Mira Nomad Sandals are the perfect blend of comfort and bohemian flair, crafted from premium, ethically sourced leather with intricate hand-stitched detailing. Featuring a cushioned footbed and adjustable ankle strap, these sandals are ideal for summer outings, festivals, or beach strolls, offering both style and support for the free-spirited adventurer.',
    price: 307.96,
    tags: ["bohemian","summer","sandals","handcrafted","eco-friendly","fashion","footwear"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStride',
    title: 'Elysian Evening Sandals',
    description: 'Step into elegance with the Elysian Evening Sandals by LuxeStride. Crafted from premium Italian leather, these strappy sandals feature a delicate woven design and a cushioned footbed for all-night comfort. Perfect for summer weddings or upscale garden parties, they effortlessly elevate any evening ensemble.',
    price: 259.92,
    tags: ["evening wear","summer sandals","Italian leather","wedding shoes","fashionable","luxury footwear","strappy design"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'SoleMates',
    title: 'Luna Breeze Sandals',
    description: 'Elevate your summer style with the Luna Breeze Sandals from SoleMates. Crafted from premium vegan leather and breathable mesh, these minimalist sandals feature a cushioned footbed for all-day comfort and an adjustable strap for a perfect fit. Ideal for beach outings or casual brunches, they combine sophistication with ease for the modern minimalist.',
    price: 183.77,
    tags: ["minimalist","summer","sandals","vegan","beach","casual","comfort"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Crescendo Couture',
    title: 'Velvet Elegance Heels',
    description: 'Step into sophistication with the Velvet Elegance Heels from Crescendo Couture. Crafted from sumptuous navy velvet, these evening-style shoes feature a delicate ankle strap and a subtly elevated block heel for both comfort and style. Perfect for fall events, these heels effortlessly complement both dresses and tailored trousers, adding a touch of opulence to your ensemble.',
    price: 56.94,
    tags: ["evening wear","fall fashion","velvet heels","block heels","dress shoes","Crescendo Couture","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'UrbanStride',
    title: 'Fall Fusion High-Top Sneakers',
    description: 'The Fall Fusion High-Top Sneakers from UrbanStride are designed for the modern streetwear enthusiast. Crafted with a blend of premium suede and breathable mesh, these shoes offer both style and comfort, perfect for those crisp autumn days. With their padded collar, durable rubber outsole, and a unique camouflage pattern, they\'re ideal for casual outings or urban adventures.',
    price: 59.21,
    tags: ["streetwear","fall fashion","high-top","urban","casual","sneakers","trendy"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'SoleMates',
    title: 'AeroLight Sandal',
    description: 'The AeroLight Sandal features a sleek, minimalist design crafted from premium vegan leather and breathable mesh. Ideal for summer outings, its cushioned footbed and lightweight sole provide all-day comfort, whether you\'re strolling through the city or relaxing at the beach. The adjustable straps ensure a perfect fit, making these sandals a versatile choice for casual gatherings or weekend getaways.',
    price: 231.48,
    tags: ["minimalist","summer","sandals","vegan leather","lightweight","comfortable","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'StrideFlex',
    title: 'AeroLite Fall Sneakers',
    description: 'The AeroLite Fall Sneakers by StrideFlex are designed for optimal comfort and style during the autumn months. Crafted from a breathable, water-resistant mesh upper with reflective accents, these shoes feature a cushioned memory foam insole for all-day support. Ideal for a casual day out or a cozy coffee run, they seamlessly combine functionality with modern aesthetics.',
    price: 134.97,
    tags: ["athleisure","fall fashion","sneakers","comfortable","water-resistant","casual","memory foam"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Cedar & Oak',
    title: 'Harper Slip-On Loafers',
    description: 'The Harper Slip-On Loafers from Cedar & Oak are crafted from premium soft-grain leather, offering a polished yet comfortable fit perfect for all-day wear. With a cushioned insole and a flexible rubber outsole, these loafers seamlessly transition from office meetings to casual outings. Available in classic black and rich mahogany, they\'re an ideal addition for business casual attire in any season.',
    price: 27.14,
    tags: ["business casual","loafers","all-season","premium leather","comfortable","versatile","Cedar & Oak"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'UrbanStride',
    title: 'All-Weather Casual Sneakers',
    description: 'The UrbanStride All-Weather Casual Sneakers are designed for versatile wear in any season. Made with a breathable mesh upper and a durable rubber sole, these shoes provide comfort and grip, making them perfect for running errands, casual outings, or light outdoor activities. Featuring a cushioned insole and water-resistant finish, these sneakers combine style and functionality effortlessly.',
    price: 41.62,
    tags: ["casual","sneakers","all-season","breathable","urban","comfortable","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Luna Vintage',
    title: 'Spring Blossom Mary Janes',
    description: 'Embrace the charm of spring with the Luna Vintage Spring Blossom Mary Janes. These exquisite shoes feature a delicate floral-embroidered canvas upper, complemented by a soft leather lining for ultimate comfort. Perfect for garden parties or casual brunches, they showcase a classic buckle strap and a cushioned footbed, making them both stylish and practical.',
    price: 509.14,
    tags: ["vintage","spring","mary janes","floral","handcrafted","casual","leather"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Coastal Breeze',
    title: 'Luxe Canvas Slip-Ons',
    description: 'The Luxe Canvas Slip-Ons by Coastal Breeze are designed for effortless summer style. Crafted from breathable organic cotton canvas, these shoes feature a cushioned insole and a lightweight rubber outsole for all-day comfort. Perfect for beach outings or casual brunches, they offer a laid-back yet polished look that complements any summer wardrobe.',
    price: 291.03,
    tags: ["summer","casual","canvas","slip-ons","beachwear","comfortable","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Heritage Footwear Co.',
    title: 'Classic Leather Lace-Up Boots',
    description: 'Introducing the Classic Leather Lace-Up Boots from Heritage Footwear Co., crafted from premium full-grain leather for a luxurious feel and exceptional durability. These vintage-style boots feature a warm shearling lining and a sturdy rubber sole, making them perfect for winter adventures or a polished look on casual outings. With their timeless design and quality materials, they seamlessly blend comfort and style for any occasion.',
    price: 206.11,
    tags: ["vintage","winter","leather","boots","classic","casual","durable"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Luna & Co.',
    title: 'Celestial Satin Slides',
    description: 'The Celestial Satin Slides are a stunning addition to any summer evening ensemble. Crafted from luxurious satin with a delicate crisscross strap design, these slides feature a cushioned footbed for all-night comfort. Perfect for garden parties or casual dinners, they effortlessly blend elegance with ease.',
    price: 27.15,
    tags: ["eveningwear","summer","slides","satin","casual","comfortable","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStep',
    title: 'Elysian Velvet Heels',
    description: 'Step into elegance with the Elysian Velvet Heels by LuxeStep, crafted from sumptuous velvet and complemented by a sleek patent leather heel. These cocktail-style shoes feature a cushioned insole for all-day comfort, making them perfect for evening events or upscale gatherings. With a timeless design that transcends seasons, these heels are ideal for pairing with both dresses and tailored trousers.',
    price: 299.56,
    tags: ["cocktail","heels","velvet","all-season","luxury","evening wear","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Aurelia Luxe',
    title: 'Brixton Leather Loafers',
    description: 'The Brixton Leather Loafers from Aurelia Luxe are the perfect blend of sophistication and comfort for summer formal occasions. Crafted from premium Italian leather, these loafers feature a breathable perforated design, ensuring your feet stay cool, while the cushioned insole provides all-day comfort. Ideal for weddings, garden parties, or business events, their sleek silhouette complements both tailored trousers and chinos.',
    price: 224.31,
    tags: ["formal shoes","summer footwear","leather loafers","elegant style","Aurelia Luxe","business casual","wedding shoes"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStride',
    title: 'Celestial Evening Boots',
    description: 'The Celestial Evening Boots by LuxeStride are a stunning blend of elegance and comfort, perfect for winter soirées. Crafted from premium water-resistant suede and lined with soft shearling, these knee-high boots feature a tapered heel and intricate embroidery that elevates any evening outfit. Ideal for holiday gatherings or upscale events, they combine style with functionality to keep your feet warm and chic.',
    price: 421.66,
    tags: ["eveningwear","winterfashion","luxuryboots","suede","embroidery","formal","LuxeStride"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStep',
    title: 'Elysian Bloom Heels',
    description: 'Elevate your spring wardrobe with the Elysian Bloom Heels by LuxeStep. Crafted from high-quality, eco-friendly faux leather, these cocktail-style shoes feature a delicate floral embroidery detail and a comfortable padded insole, ensuring you can dance the night away. Perfect for garden parties or evening events, these heels combine elegance with a touch of whimsy to make every outfit blossom.',
    price: 42.93,
    tags: ["cocktail","spring","floral","heels","LuxeStep","evening wear","eco-friendly"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Gypsy Wanderlust',
    title: 'Nomadic Spirit Ankle Boots',
    description: 'The Nomadic Spirit Ankle Boots are handcrafted from premium distressed leather and adorned with intricate hand-stitched tribal patterns and colorful woven accents. Designed for comfort and style, these all-season boots feature a cushioned insole and rugged rubber outsole, making them perfect for both casual outings and adventurous travels. Embrace your free-spirited lifestyle with these versatile boots that effortlessly elevate any bohemian-inspired ensemble.',
    price: 750.07,
    tags: ["bohemian","all-season","ankle boots","handcrafted","leather","fashion","unique"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Nomadic Soles',
    title: 'Caravan Wanderer Ankle Boots',
    description: 'Crafted for the free spirit, the Caravan Wanderer Ankle Boots blend supple tan leather with handwoven textile accents, embodying true bohemian spirit. These boots feature a cushioned insole for comfort on long walks and a durable rubber outsole for traction, making them perfect for autumn excursions or casual gatherings. Pair them with your favorite flowing skirts or distressed denim for an effortless fall look.',
    price: 518.71,
    tags: ["bohemian","fall fashion","ankle boots","handcrafted","leather","artisan","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Heritage Steps',
    title: 'Vintage Canvas Slip-Ons',
    description: 'Step into summer with the Heritage Steps Vintage Canvas Slip-Ons, crafted from premium cotton canvas for breathability and comfort. Featuring a retro floral pattern and a cushioned footbed, these shoes are perfect for casual outings and warm-weather adventures, combining style with functionality. The eco-friendly rubber outsole ensures durability while providing excellent grip on various surfaces.',
    price: 324.78,
    tags: ["vintage","canvas","summer","slip-ons","eco-friendly","casual","floral"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Elysian Steps',
    title: 'Luxe Summer Oxford',
    description: 'The Luxe Summer Oxford by Elysian Steps is crafted from premium Italian leather, featuring a breathable perforated design ideal for warm weather. With its lightweight construction and cushioned insole, this shoe provides exceptional comfort and elegance, making it perfect for formal summer events like weddings or business meetings.',
    price: 1317.56,
    tags: ["formal","summer","oxford","luxury","leather","comfortable","Italian"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Velvet Stride',
    title: 'Autumn Chic Heeled Booties',
    description: 'Step into the season with the Autumn Chic Heeled Booties from Velvet Stride. Crafted from premium vegan leather with a soft suede finish, these cocktail-style booties feature a sleek pointed toe and a stylish 3-inch stiletto heel, making them perfect for evening outings or festive gatherings. The cushioned insole ensures all-day comfort while the trendy ankle height pairs beautifully with both dresses and tailored pants.',
    price: 28.25,
    tags: ["fall fashion","cocktail shoes","heel booties","vegan leather","evening wear","trendy","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Nordin & Co.',
    title: 'Evergreen Leather Oxford Boots',
    description: 'Crafted from premium full-grain leather, the Evergreen Leather Oxford Boots feature a water-resistant finish that keeps your feet dry during winter. With a cushioned insole and shock-absorbing outsole, these boots provide all-day comfort and are perfect for both office meetings and casual gatherings. The sleek design and versatile dark brown color make them a stylish addition to any business casual wardrobe.',
    price: 171.41,
    tags: ["business casual","winter shoes","leather boots","water-resistant","Oxford style","comfortable","premium"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Sole & Style',
    title: 'Minimalist Spring Slip-Ons',
    description: 'The Minimalist Spring Slip-Ons by Sole & Style feature a sleek and understated design, crafted from lightweight organic cotton canvas for breathability and comfort. Perfect for casual outings or a day in the park, these shoes are designed with a cushioned insole and flexible rubber sole, ensuring a pleasant walking experience throughout the spring season.',
    price: 60.07,
    tags: ["minimalist","spring shoes","eco-friendly","slip-ons","casual wear","comfortable","lightweight"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LuxeStep',
    title: 'Spring Blossom Ankle Straps',
    description: 'Step into spring with the LuxeStep Spring Blossom Ankle Straps, crafted from supple, eco-friendly suede in a soft pastel pink. These chic cocktail shoes feature a delicate ankle strap for added support and a cushioned insole for all-day comfort, making them perfect for garden parties or evening soirees. The elegant 3-inch heel adds just the right amount of lift to enhance your silhouette without sacrificing comfort.',
    price: 155.02,
    tags: ["cocktail","spring","ankle straps","pastel","fashion","chic","LuxeStep"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Maple & Co.',
    title: 'Autumn Drift Casual Sneakers',
    description: 'Step into fall with the Autumn Drift Casual Sneakers, crafted from premium suede and breathable canvas. These lightweight shoes feature a cushioned insole for all-day comfort, perfect for strolls in the park or casual meet-ups with friends. With their earthy tones and stylish design, they\'re an ideal match for any autumn wardrobe.',
    price: 79.06,
    tags: ["fall fashion","casual shoes","sneakers","suede","lightweight","autumn style","everyday wear"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Aurelia Luxe',
    title: 'Celestial Evening Sandals',
    description: 'Step into summer elegance with the Celestial Evening Sandals from Aurelia Luxe. These stunning shoes are crafted from soft, ethically-sourced satin and feature intricate lace detailing along the straps, providing a touch of sophistication. Perfect for formal events or romantic dinners, they offer both comfort and style with a cushioned insole and a chic, minimalist design.',
    price: 103.36,
    tags: ["eveningwear","summer","sandals","luxury","satin","formal","weddings"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'LunaStride',
    title: 'Essence Minimalist Sneakers',
    description: 'Crafted from premium Italian leather and featuring a lightweight, breathable mesh upper, the Essence Minimalist Sneakers are designed for versatility and comfort in any season. With a sleek silhouette and cushioned insole, these shoes are perfect for both casual outings and more formal occasions, making them a staple in any wardrobe. The minimalist design incorporates subtle stitching and a refined color palette, ensuring they effortlessly complement any outfit.',
    price: 735.46,
    tags: ["minimalist","all-season","leather","breathable","versatile","sneakers","luxury"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'FrostStride',
    title: 'WinterFlex Urban Sneakers',
    description: 'The WinterFlex Urban Sneakers are designed for those who embrace the chill without sacrificing style. Made with a water-resistant nylon upper and a plush fleece lining, these shoes provide comfort and warmth during cold, wet conditions. Featuring a cushioned EVA midsole and a rugged rubber outsole for superior traction, they\'re perfect for casual outings or light winter workouts.',
    price: 85.68,
    tags: ["athleisure","winter","sneakers","water-resistant","urban","casual","comfortable"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'VintageStride',
    title: 'Eleanor Classic Oxfords',
    description: 'The Eleanor Classic Oxfords combine timeless elegance with modern comfort, crafted from premium full-grain leather with a soft suede lining. Featuring a retro brogue design, these shoes are perfect for both casual outings and formal events, making them a versatile addition to any wardrobe. With a durable rubber sole for year-round wear, they ensure comfort on every step, no matter the season.',
    price: 276.4,
    tags: ["vintage","oxfords","leather","all-season","classic","formal","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'FrostFit',
    title: 'Arctic Glide Sneakers',
    description: 'The Arctic Glide Sneakers by FrostFit combine style and functionality for the winter athlete. Crafted with a waterproof nubuck upper and insulated lining, these shoes keep your feet warm and dry, while the cushioned, slip-resistant sole provides excellent traction on icy surfaces. Perfect for casual outings or outdoor fitness sessions, these sneakers are designed for those who refuse to let winter slow them down.',
    price: 227.52,
    tags: ["athleisure","winter shoes","waterproof","insulated","casual","fitness","trendy"],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Velvet & Vine',
    title: 'Midnight Velvet Ankle Boots',
    description: 'Step into fall with the stunning Midnight Velvet Ankle Boots from Velvet & Vine. Crafted from luxurious black velvet, these cocktail-style boots feature a sleek pointed toe and a chic block heel, making them perfect for evening gatherings or formal events. With a cushioned insole and a smooth leather lining, they provide both style and comfort for hours of wear.',
    price: 84.92,
    tags: ["ankle boots","velvet","cocktail shoes","fall fashion","evening wear","chic","block heel"],
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Wanderlust Footwear',
    title: 'Boho Dreamer Ankle Boots',
    description: 'Step into effortless style with the Boho Dreamer Ankle Boots, crafted from soft, ethically sourced suede and featuring intricate hand-stitched detailing. These boots are designed with a cushioned insole for comfort throughout the day, making them perfect for everything from music festivals to casual outings. Their versatile design allows for easy pairing with both dresses and jeans, ensuring you\'ll wear them all year round.',
    price: 60.3,
    tags: ["bohemian","ankle boots","suede","ethically sourced","all-season","casual","festival"],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop',
    category: 'shoes'
  },
  {
    brand: 'Luna & Co.',
    title: 'Breezy Canvas Tote',
    description: 'The Breezy Canvas Tote by Luna & Co. is the perfect companion for summer jaunts to the beach or casual weekend outings. Crafted from durable, lightweight cotton canvas with a vibrant tropical print, this tote features eco-friendly leather straps and an interior pocket for organizing your essentials. Its spacious design and stylish aesthetic make it a must-have for any casual summer event.',
    price: 242.35,
    tags: ["tote","summer","casual","beach","canvas","eco-friendly","handbag"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'UrbanEcho',
    title: 'Winter Luxe Tote',
    description: 'The Winter Luxe Tote by UrbanEcho is crafted from premium water-resistant canvas, featuring a cozy fleece-lined interior for added warmth. With its spacious design, leather-trimmed handles, and multiple pockets, this tote is perfect for business casual settings or weekend outings during the colder months.',
    price: 95.74,
    tags: ["business casual","winter fashion","tote bag","water-resistant","spacious","leather trim","urban style"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Aveline Couture',
    title: 'Classic Élan Leather Tote',
    description: 'The Classic Élan Leather Tote by Aveline Couture is crafted from premium Italian saffiano leather, known for its durability and luxurious finish. With its structured silhouette, gold-tone hardware, and a spacious interior featuring multiple pockets, this tote is perfect for both professional meetings and elegant evening events. Its timeless design ensures it complements any outfit, making it a versatile accessory for all seasons.',
    price: 528.09,
    tags: ["formal","leather","tote","luxury","all-season","Aveline Couture","professional"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Elysian Chic',
    title: 'Tropique Glam Clutch',
    description: 'The Tropique Glam Clutch by Elysian Chic is a stunning cocktail bag crafted from luxurious handwoven raffia with intricate metallic thread details. Designed for summer soirées, this striking clutch features a chic, detachable gold chain strap and a vibrant, handmade floral embellishment that adds a touch of whimsy. Perfect for evening events or beachside parties, it offers both style and functionality with its spacious interior for essentials.',
    price: 1121.32,
    tags: ["cocktail","summer","handwoven","luxury","clutch","floral","evening"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'UrbanNomad',
    title: 'Metro Sling Bag',
    description: 'The Metro Sling Bag from UrbanNomad is crafted from durable, weather-resistant nylon, making it perfect for all-season wear. Featuring multiple compartments for organization and an adjustable strap for comfort, this stylish bag seamlessly transitions from day to night, whether you\'re commuting or hitting the streets. Its sleek design and understated colors make it a versatile accessory for any streetwear outfit.',
    price: 80.72,
    tags: ["streetwear","sling bag","all-season","urban fashion","casual","weather-resistant","accessory"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'LuxeCouture',
    title: 'Aqua Elegance Cocktail Clutch',
    description: 'The Aqua Elegance Cocktail Clutch is a stunning summer accessory, crafted from premium Italian leather with a smooth, glossy finish. Featuring a unique hand-painted ombre design that transitions from ocean blue to sunset coral, this clutch is adorned with a delicate gold chain strap and a magnetic flap closure for added security. Perfect for evening soirées or cocktail parties, its spacious interior comfortably holds essentials while adding a splash of color to your summer wardrobe.',
    price: 1451.6,
    tags: ["cocktail","summer","clutch","luxury","handcrafted","Italian leather","statement piece"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'LuxeSpring',
    title: 'Celeste Evening Clutch',
    description: 'The Celeste Evening Clutch is a stunning accessory crafted from soft, pastel-hued satin with delicate floral embroidery. Perfect for cocktail events in the spring, this elegant bag features a gold-tone chain strap that can be tucked inside for a chic handheld option, and a secure magnetic closure to keep your essentials safe. Its refined design and lightweight structure make it an ideal companion for evening outings or garden parties.',
    price: 252.73,
    tags: ["clutch","evening bag","spring fashion","cocktail","floral design","satin","luxury"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'LuxeAvenue',
    title: 'Autumn Velvet Clutch',
    description: 'The Autumn Velvet Clutch by LuxeAvenue is an exquisite cocktail accessory crafted from rich, deep burgundy velvet. This elegant bag features a sleek silhouette adorned with a gold-tone chain strap and a detachable tassel, making it the perfect statement piece for fall soirées. With ample space for essentials, it\'s ideal for evening events or intimate gatherings, ensuring you carry a touch of sophistication wherever you go.',
    price: 953.9,
    tags: ["velvet","clutch","cocktail","fall fashion","luxury","evening wear","statement piece"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'UrbanNest',
    title: 'Eco-Chic Canvas Tote',
    description: 'The Eco-Chic Canvas Tote is crafted from 100% organic cotton canvas, making it both stylish and sustainable. Featuring reinforced stitching, a spacious interior with a zip pocket for essentials, and durable leather straps, this bag is perfect for a day at the market or a casual outing with friends. Its versatile design and earthy tones ensure it complements any outfit, all year round.',
    price: 178.55,
    tags: ["canvas","sustainable","casual","tote bag","eco-friendly","everyday use","UrbanNest"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Luna & Co.',
    title: 'Celestial Evening Clutch',
    description: 'The Celestial Evening Clutch by Luna & Co. is a stunning accessory for your fall soirées. Crafted from luxurious midnight blue velvet, it features intricate gold embroidery that mimics twinkling stars. Its compact design includes a delicate chain strap for versatility, making it the perfect companion for evening events or intimate gatherings.',
    price: 91.8,
    tags: ["evening bag","clutch","fall fashion","luxury","velvet","gold embroidery","night out"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'UrbanStride',
    title: 'Autumn Breeze Sling Bag',
    description: 'The Autumn Breeze Sling Bag is crafted from durable, water-resistant nylon with genuine leather accents, perfect for the unpredictable fall weather. Its sleek, minimalist design features an adjustable strap for comfort and a spacious interior with multiple pockets to keep your essentials organized while you\'re on the go. Ideal for outdoor adventures or casual city outings, this bag seamlessly combines style with functionality.',
    price: 361.95,
    tags: ["athleisure","fall fashion","sling bag","water-resistant","urban style","leather accents","everyday carry"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Aurelia & Co.',
    title: 'Summer Breeze Tote',
    description: 'The Summer Breeze Tote by Aurelia & Co. is a chic, oversized bag crafted from lightweight, water-resistant canvas featuring a vibrant botanical print. Designed with spacious compartments and a secure zip closure, this stylish tote is perfect for beach outings or casual brunches, making it a versatile accessory for your summer wardrobe.',
    price: 486.04,
    tags: ["tote bag","summer fashion","casual style","beach ready","botanical print","lightweight","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'UrbanNomad',
    title: 'Canvas Explorer Backpack',
    description: 'The Canvas Explorer Backpack is crafted from durable, water-resistant cotton canvas, making it perfect for fall adventures. Featuring multiple compartments for organization and a padded laptop sleeve, this backpack combines functionality with urban style. Ideal for students or weekend explorers, it effortlessly complements any streetwear outfit with its sleek design and adjustable straps.',
    price: 263.31,
    tags: ["streetwear","fall fashion","backpack","urban style","exploration","durable materials","functional"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'UrbanNomad',
    title: 'Versatile All-Weather Crossbody Bag',
    description: 'The UrbanNomad Versatile All-Weather Crossbody Bag is crafted from premium, water-resistant recycled nylon, ensuring durability and eco-friendliness. With multiple compartments, including a padded section for tech gadgets, it seamlessly transitions from gym to brunch or urban exploring. Featuring an adjustable strap and reflective accents, this bag is designed for both style and functionality in any season.',
    price: 886.27,
    tags: ["athleisure","crossbody","eco-friendly","urban","all-season","stylish","tech-friendly"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'LuxeVogue',
    title: 'Starlit Elegance Clutch',
    description: 'The Starlit Elegance Clutch from LuxeVogue is a stunning evening bag crafted from premium Italian leather and adorned with hand-stitched crystal embellishments. Its sleek silhouette is designed to transition seamlessly from gala events to intimate dinners, featuring a detachable gold chain strap for versatile styling. With a luxurious satin-lined interior, this clutch offers just enough space for your essentials while making a bold statement.',
    price: 1024.21,
    tags: ["evening bag","luxury","leather","clutch","handcrafted","stylish","all-season"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'LuxeMettle',
    title: 'Elysian Spring Tote',
    description: 'The Elysian Spring Tote by LuxeMettle is crafted from premium vegan leather, featuring an elegant floral embossed pattern that embodies the spirit of spring. This sophisticated bag includes a spacious interior with a zippered pocket for essentials and soft, gold-tone hardware accents, making it perfect for formal gatherings or brunch outings. Its lightweight design and durable construction ensure it remains a staple accessory throughout the season.',
    price: 133.85,
    tags: ["formal","spring","tote","vegan leather","designer","elegant","luxe"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Wanderlust Co.',
    title: 'Terracotta Dreamer Tote',
    description: 'The Terracotta Dreamer Tote is crafted from ethically sourced, hand-dyed leather with intricate macramé detailing, embodying the essence of bohemian style. Its spacious interior is perfect for carrying essentials during autumn outings or weekend getaways, while the adjustable strap allows for versatile wear. This tote features a whimsical fringe along the edges, adding a playful touch to your fall wardrobe.',
    price: 252.65,
    tags: ["bohemian","tote bag","fall fashion","handcrafted","ethically sourced","leather","fringe"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'AeroStyle',
    title: 'Summer Breeze Sling Bag',
    description: 'Crafted from lightweight, water-resistant nylon, the Summer Breeze Sling Bag is designed for the active urbanite. Featuring a breathable mesh back panel and adjustable straps, it offers unparalleled comfort while seamlessly transitioning from beach days to casual outings. With multiple zippered compartments, including a hidden pocket for valuables, it\'s perfect for summer adventures.',
    price: 178.12,
    tags: ["athleisure","summer","sling bag","water-resistant","urban","lightweight","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Aether Athletics',
    title: 'Breeze Sport Tote',
    description: 'The Breeze Sport Tote by Aether Athletics is crafted from lightweight, water-resistant ripstop nylon, making it the perfect companion for summer adventures. Featuring a spacious main compartment with a secure zip closure, dual side pockets for easy access to your essentials, and breathable mesh panels for ventilation, this tote seamlessly transitions from gym to beach. With its vibrant color palette and sleek design, it’s ideal for your active lifestyle, whether you’re heading to a workout or a picnic in the park.',
    price: 260.11,
    tags: ["athleisure","summer","tote","water-resistant","gym","beach","activewear"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Nordic Haven',
    title: 'Essential Minimalist Tote',
    description: 'Crafted from premium water-resistant nylon, the Essential Minimalist Tote offers both functionality and style for the colder months. With its sleek, unadorned design, this tote features a spacious interior, perfect for carrying your essentials, and leather-accented handles for added durability. Ideal for winter outings or daily commutes, it effortlessly combines simplicity with practicality.',
    price: 87.1,
    tags: ["minimalist","tote bag","winter fashion","water-resistant","everyday carry","Nordic design","sleek style"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Autumn & Co.',
    title: 'Chic Pumpkin Velvet Clutch',
    description: 'Elevate your fall wardrobe with the Chic Pumpkin Velvet Clutch from Autumn & Co. This luxurious clutch is crafted from soft, crushed velvet in a warm pumpkin hue, perfect for adding a pop of color to your cocktail attire. Featuring a sleek gold chain strap and a hidden magnetic closure, it\'s designed for both style and functionality, making it an ideal accessory for evening gatherings or seasonal celebrations.',
    price: 93.46,
    tags: ["fall fashion","cocktail clutch","velvet bag","evening wear","autumn style","luxury accessories","statement piece"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'LuxeSpring',
    title: 'Eco-Chic Canvas Tote',
    description: 'The Eco-Chic Canvas Tote from LuxeSpring is your perfect companion for sunny spring outings. Crafted from durable, organic cotton canvas, this tote features a vibrant floral print and sturdy leather handles for easy carrying. Ideal for picnics, farmers\' markets, or a day at the beach, it combines fashion with sustainability effortlessly.',
    price: 58.98,
    tags: ["spring","tote","canvas","eco-friendly","casual","floral","stylish"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'UrbanEdge',
    title: 'Summer Vibes Sling Bag',
    description: 'Crafted from durable, lightweight nylon, the UrbanEdge Summer Vibes Sling Bag features a vibrant tie-dye pattern perfect for sunny outings. It includes a spacious main compartment with a secure zip closure, an adjustable strap for versatile wear, and multiple pockets for easy organization. Ideal for music festivals, beach days, or casual strolls around town, this bag combines style and functionality effortlessly.',
    price: 39.68,
    tags: ["sling bag","summer","streetwear","festival","lightweight","colorful","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'AeroStyle',
    title: 'Breeze Tote Bag',
    description: 'The AeroStyle Breeze Tote Bag is crafted from lightweight, water-resistant nylon, making it perfect for summer outings. Its spacious interior features multiple pockets for organization, while the breathable mesh side panels ensure ventilation during outdoor adventures. Ideal for beach days or casual picnics, this tote blends style and functionality effortlessly.',
    price: 26.85,
    tags: ["tote bag","summer","athleisure","beach","lightweight","water-resistant","casual"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Heritage Leather Co.',
    title: 'Vintage Leather Satchel',
    description: 'Crafted from premium, ethically sourced full-grain leather, the Vintage Leather Satchel features a rich chestnut hue that deepens with age. Designed with a spacious interior and antique brass hardware, this bag is perfect for winter outings, easily accommodating your essentials while adding a touch of nostalgic charm. Its adjustable strap allows for versatility, whether you wear it crossbody or on your shoulder.',
    price: 269.44,
    tags: ["vintage","leather","winter","satchel","handcrafted","stylish","accessory"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Autumn & Co.',
    title: 'The Maple Leaf Tote',
    description: 'Crafted from premium pebbled leather, the Maple Leaf Tote features a rich burgundy hue perfect for fall. Its spacious interior is lined with soft, recycled cotton and includes a detachable zip pouch for organization, making it ideal for both the office and weekend outings. With sturdy, brass hardware and an elegant silhouette, this bag embodies both style and functionality.',
    price: 130.37,
    tags: ["business casual","fall fashion","leather tote","autumn","stylish","eco-friendly","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Urban Threads',
    title: 'Autumn Drift Crossbody Bag',
    description: 'The Autumn Drift Crossbody Bag is crafted from durable, water-resistant canvas, featuring an eye-catching plaid pattern that perfectly complements fall attire. Designed with multiple compartments, adjustable straps, and a secure magnetic closure, this stylish bag is ideal for casual outings in the city or outdoor adventures with friends.',
    price: 48.12,
    tags: ["streetwear","crossbody","fall fashion","water-resistant","plaid","casual","urban"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Aurelia Couture',
    title: 'Maven Leather Satchel',
    description: 'The Maven Leather Satchel is crafted from premium Italian calfskin, offering a luxurious touch and exceptional durability perfect for the winter season. Featuring a spacious interior with multiple compartments, this bag effortlessly combines style and functionality, making it an ideal choice for business casual outings or daily commutes. Its chic, structured silhouette is complemented by elegant gold-tone hardware and a detachable shoulder strap for versatility.',
    price: 1078.93,
    tags: ["business casual","winter fashion","luxury bag","leather satchel","Aurelia Couture","elegant","versatile"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Willow & Sage',
    title: 'Bohemian Dreamweaver Tote',
    description: 'The Bohemian Dreamweaver Tote is a handcrafted masterpiece featuring artisanal macramé detailing made from sustainable cotton and natural jute. Perfect for spring outings, this spacious tote is designed with a vibrant, hand-painted interior and includes a detachable pouch for essentials, making it a chic choice for picnics, festivals, or beach days. With its earthy tones and whimsical style, it\'s sure to elevate any boho-inspired ensemble.',
    price: 1234.31,
    tags: ["bohemian","spring fashion","handcrafted","sustainable","tote bag","artisan","macramé"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'Urban Heritage',
    title: 'Harrington Leather Tote',
    description: 'The Harrington Leather Tote is crafted from premium full-grain leather, offering a sophisticated yet durable accessory for your winter wardrobe. Featuring a spacious interior with a padded laptop compartment and multiple pockets for organization, this tote is perfect for business meetings or casual outings. The rich mahogany finish and gold-tone hardware add a timeless elegance, making it a versatile choice for the modern professional.',
    price: 310.27,
    tags: ["business casual","winter fashion","leather tote","professional","urban style","laptop bag","sophisticated"],
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    category: 'bags'
  },
  {
    brand: 'LuxePetal',
    title: 'Spring Blossom Crystal Earrings',
    description: 'The Spring Blossom Crystal Earrings by LuxePetal are a stunning accessory for any formal occasion this spring. Crafted from high-quality sterling silver and adorned with hand-set, ethically sourced Swarovski crystals, these earrings feature a delicate floral design that captures the essence of blooming flowers. Perfect for weddings, garden parties, or elegant dinners, they add a touch of refined glamour to your ensemble.',
    price: 98.56,
    tags: ["jewelry","earrings","formal","spring","floral","luxury","Swarovski"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'WanderLuxe',
    title: 'Winter Moonstone Cascade Earrings',
    description: 'Embrace the ethereal beauty of winter with our Winter Moonstone Cascade Earrings. Crafted from sterling silver, each earring features a stunning array of hand-selected, ethically sourced moonstones that shimmer like the winter moon. Ideal for festive gatherings or cozy nights by the fireplace, these earrings are designed to complement bohemian styles while adding a touch of elegance to any winter ensemble.',
    price: 339.87,
    tags: ["bohemian","moonstone","winter","handcrafted","ethically sourced","sterling silver","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'LunaLuxe',
    title: 'Starlight Crystal Drop Earrings',
    description: 'The Starlight Crystal Drop Earrings by LunaLuxe are a stunning addition to any evening ensemble. Crafted from high-quality silver-plated metal and adorned with shimmering cubic zirconia crystals, these earrings catch the light beautifully, making them perfect for formal occasions or a night out. Their elegant design ensures they can be worn year-round, adding a touch of sophistication to any outfit.',
    price: 28.23,
    tags: ["eveningwear","jewelry","earrings","crystal","silver-plated","sophisticated","all-season"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Luxe Aurora',
    title: 'Celestial Cocktail Ring',
    description: 'Elevate your evening ensemble with the Celestial Cocktail Ring from Luxe Aurora. Crafted from high-quality sterling silver and adorned with a stunning blue topaz centerpiece surrounded by shimmering white sapphires, this statement piece is designed to captivate. Perfect for cocktail parties or formal events, its versatile design ensures it complements any outfit throughout the year.',
    price: 129.11,
    tags: ["cocktail","ring","blue topaz","sterling silver","statement jewelry","formal wear","all-season"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Nordic Essence',
    title: 'Icy Elegance Pendant',
    description: 'The Icy Elegance Pendant features a sleek, minimalist design crafted from sustainably sourced sterling silver and adorned with a single, ethically-sourced aquamarine stone. Its cool tones and clean lines make it an ideal accessory for winter gatherings, effortlessly enhancing both casual and formal outfits with a touch of serene sophistication.',
    price: 1191.26,
    tags: ["minimalist","jewelry","winter","sustainable","aquamarine","elegant","pendant"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Lumière Bijoux',
    title: 'Elysian Breeze Pendant Necklace',
    description: 'The Elysian Breeze Pendant Necklace features a delicate, hand-forged sterling silver chain adorned with a minimalist pendant crafted from ethically-sourced aquamarine. This stunning piece captures the essence of summer with its subtle hues that resemble the serene ocean, making it perfect for casual beach outings or elegant evening gatherings. Lightweight and versatile, it effortlessly complements any outfit while adding a touch of elegance.',
    price: 990.83,
    tags: ["minimalist","summer jewelry","aquamarine","sterling silver","handcrafted","elegant","beachwear"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Boho Luxe',
    title: 'Sunset Dreamer Beaded Necklace',
    description: 'The Sunset Dreamer Beaded Necklace features a stunning array of hand-crafted, ethically sourced turquoise and coral beads, strung together with a delicate gold-plated chain. Perfect for spring, this piece captures the essence of bohemian elegance, making it ideal for outdoor festivals or casual brunches. Its adjustable length ensures a comfortable fit for any neckline, allowing you to layer it with other pieces for a more personalized style.',
    price: 108.22,
    tags: ["bohemian","handcrafted","ethically sourced","turquoise","spring fashion","necklace","layering"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Elysian Glam',
    title: 'Autumn Radiance Statement Necklace',
    description: 'Elevate your evening attire with the Autumn Radiance Statement Necklace from Elysian Glam. Crafted from polished gold-plated brass, this stunning piece features a cascade of hand-cut citrine and smoky quartz gemstones that reflect the warm hues of fall. Perfect for formal gatherings or intimate dinners, this necklace adds a touch of elegance and sophistication to any outfit.',
    price: 108.06,
    tags: ["evening wear","fall fashion","statement necklace","gemstone jewelry","sustainable materials","elegant","formal occasions"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Gilded Elegance',
    title: 'Autumn Twilight Choker',
    description: 'The Autumn Twilight Choker features a delicate arrangement of hand-faceted smoky quartz and deep amber crystals, all set in a brushed gold-plated chain that captures the rich hues of fall evenings. This statement piece is designed for elegant occasions, perfectly complementing a formal gown or a chic ensemble, making it an ideal accessory for gala events or sophisticated dinners.',
    price: 245.56,
    tags: ["jewelry","evening wear","fall fashion","choker","handcrafted","smoky quartz","statement piece"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Autumn Aura',
    title: 'Golden Leaf Drop Earrings',
    description: 'Crafted from high-quality gold-plated brass, these elegant drop earrings feature intricate leaf designs that capture the essence of fall. Perfect for business casual attire, they add a touch of sophistication and warmth to any outfit, making them ideal for office settings or evening gatherings.',
    price: 40,
    tags: ["jewelry","autumn","business casual","earrings","gold-plated","fashion accessory","fall style"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Sunset Gypsy',
    title: 'Wanderlust Bohemian Charm Necklace',
    description: 'Embrace the spirit of summer with the Wanderlust Bohemian Charm Necklace, featuring a stunning array of hand-crafted charms made from natural stones, including turquoise and labradorite. This eye-catching piece is strung on a delicate gold-plated chain adorned with intricate beadwork, perfect for layering or wearing solo on beach outings or music festivals.',
    price: 95.09,
    tags: ["bohemian","summer","jewelry","necklace","handmade","charm","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Boho Luxe',
    title: 'Ocean Breeze Multi-Stone Necklace',
    description: 'Embrace the spirit of summer with the Ocean Breeze Multi-Stone Necklace by Boho Luxe. This exquisite piece features a medley of hand-selected turquoise, coral, and shell stones, delicately strung on a fine, adjustable gold-plated chain. Perfect for beach outings or music festivals, this necklace adds a vibrant touch to any bohemian ensemble.',
    price: 530.4,
    tags: ["bohemian","summer","necklace","handmade","jewelry","colorful","beachwear"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Wanderlust Treasures',
    title: 'Sunset Dreamer Beaded Necklace',
    description: 'Embrace the essence of spring with the Sunset Dreamer Beaded Necklace, crafted from natural stone beads in vibrant hues of orange, pink, and turquoise. This bohemian-style piece features a delicate gold-plated chain adorned with a rustic tassel, making it perfect for festivals, beach outings, or casual brunches. Handmade with love, each necklace is unique, reflecting the beauty of nature\'s palette.',
    price: 72.5,
    tags: ["bohemian","handmade","spring jewelry","natural stones","tassel necklace","festival fashion","unique gift"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Lumen & Co.',
    title: 'Elysian Gold Threaded Earrings',
    description: 'The Elysian Gold Threaded Earrings are a stunning addition to your summer wardrobe, crafted from high-quality 14k gold-filled material that ensures both durability and elegance. These minimalist earrings feature a delicate, lightweight thread design that gracefully sways with movement, making them perfect for casual outings or special occasions alike.',
    price: 73.78,
    tags: ["minimalist","earrings","jewelry","summer","gold-filled","fashion","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Elysian Jewel Co.',
    title: 'Spring Blossom Pendant Necklace',
    description: 'The Spring Blossom Pendant Necklace features a delicate 14k gold chain adorned with a handcrafted glass pendant, shaped like a blooming cherry blossom. This lightweight piece combines elegance with a touch of whimsy, making it perfect for casual outings or spring celebrations. Its vibrant hues of pink and green are reminiscent of a serene spring garden, making it an ideal accessory for day or night.',
    price: 231.48,
    tags: ["spring jewelry","casual style","handcrafted","gold necklace","floral design","Elysian Jewel","cherry blossom"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'UrbanLux',
    title: 'Neon Vibe Beaded Choker',
    description: 'The Neon Vibe Beaded Choker from UrbanLux features an eclectic mix of vibrant acrylic beads and polished stainless steel accents, perfect for adding a pop of color to your summer streetwear. This lightweight, adjustable choker is designed to be worn with casual outfits or layered with other necklaces for a trendy, festival-ready look. Ideal for music festivals or beach parties, it showcases a playful aesthetic that celebrates individuality.',
    price: 150.82,
    tags: ["summer fashion","streetwear","jewelry","choker","festival style","colorful","unique design"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Urban Alloy',
    title: 'Winter Grit Layered Chain Necklace',
    description: 'The Winter Grit Layered Chain Necklace features a unique combination of brushed stainless steel and blackened brass, creating a striking contrast perfect for streetwear enthusiasts. Each layer is designed to drape elegantly, making it an ideal statement piece for winter outings or casual gatherings. This accessory not only enhances your style but also ensures durability against the elements.',
    price: 74.09,
    tags: ["streetwear","jewelry","winter fashion","layered necklace","urban style","statement piece","durable"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'LuxeBloom',
    title: 'Spring Blossom Cocktail Earrings',
    description: 'Embrace the essence of spring with the Spring Blossom Cocktail Earrings by LuxeBloom. Crafted from sterling silver and adorned with hand-painted enamel flowers in vibrant pastel hues, these statement earrings feature shimmering cubic zirconia accents that capture the light beautifully. Perfect for cocktail parties or garden weddings, these earrings are designed to add a touch of whimsy and elegance to any spring ensemble.',
    price: 216.09,
    tags: ["cocktail","earrings","spring","floral","enamel","statement","jewelry"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Elysian Elegance',
    title: 'Spring Blossom Cocktail Ring',
    description: 'This stunning cocktail ring features a delicate arrangement of hand-painted enamel flowers in pastel shades of pink and lavender, set against a shimmering gold-plated band. Made with hypoallergenic materials, it\'s perfect for any spring occasion, whether you\'re attending a garden party or celebrating a special event. The adjustable design ensures a comfortable fit for any finger, making it a versatile addition to your jewelry collection.',
    price: 63.25,
    tags: ["cocktail ring","spring fashion","hand-painted","pastel colors","gold-plated","floral design","Elysian Elegance"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Lumière Bijoux',
    title: 'Celeste Pearl Drop Earrings',
    description: 'Elevate your summer formal attire with the Celeste Pearl Drop Earrings from Lumière Bijoux. Crafted from high-quality sterling silver, these earrings feature lustrous freshwater pearls delicately suspended from a floral-inspired design, adding a touch of elegance to any evening event. Perfect for weddings, cocktail parties, or sophisticated gatherings, they effortlessly blend classic charm with contemporary style.',
    price: 71.67,
    tags: ["formal","jewelry","earrings","pearls","summer","elegant","occasion"],
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    category: 'jewelry'
  },
  {
    brand: 'Autumn Aura',
    title: 'Chesterfield Wool Blend Scarf',
    description: 'Wrap yourself in warmth and style with the Chesterfield Wool Blend Scarf from Autumn Aura. Crafted from a luxurious blend of merino wool and cashmere, this oversized scarf features a rich houndstooth pattern that adds a touch of sophistication to your casual fall wardrobe. Perfect for cozy afternoons at the park or a casual outing with friends, its soft texture and generous dimensions ensure you stay both fashionable and comfortable.',
    price: 254.82,
    tags: ["scarf","fall fashion","casual style","wool blend","accessories","houndstooth","cozy"],
    imageUrl: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'EcoMotion',
    title: 'Spring Breeze Performance Cap',
    description: 'The Spring Breeze Performance Cap from EcoMotion is designed for the active individual who values style and sustainability. Made from recycled polyester and featuring moisture-wicking technology, this cap is perfect for outdoor workouts or casual outings in the sun. Its lightweight, breathable fabric and adjustable strap ensure a comfortable fit, making it a versatile accessory for the spring season.',
    price: 303.47,
    tags: ["athleisure","spring fashion","sustainable","activewear","performance cap","outdoor","eco-friendly"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'LuxeVibe',
    title: 'Summer Twilight Beaded Clutch',
    description: 'Elevate your cocktail attire with the Summer Twilight Beaded Clutch from LuxeVibe, featuring intricate hand-embroidered floral patterns and shimmering glass beads. Crafted from durable, lightweight silk with a satin lining, this exquisite clutch is perfect for summer soirées or evening escapades under the stars. Its detachable chain strap offers versatile styling options, allowing you to carry it as a chic clutch or wear it as a crossbody.',
    price: 131.36,
    tags: ["summer","cocktail","clutch","beaded","accessories","evening wear","fashion"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Lunaria Luxe',
    title: 'Iris Evening Clutch',
    description: 'The Iris Evening Clutch is a stunning accessory crafted from soft, Italian leather and adorned with hand-embroidered floral appliqués that evoke the essence of spring. Its sleek silhouette features a delicate gold chain strap that can be worn on the shoulder or tucked inside for a chic handheld style, making it ideal for evening soirées or upscale events. With a satin-lined interior and a secure magnetic closure, this clutch balances elegance and functionality perfectly.',
    price: 193.15,
    tags: ["eveningwear","spring fashion","leather clutch","handcrafted","floral design","luxury accessories","Lunaria Luxe"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'UrbanNomad',
    title: 'Breeze Mesh Bucket Hat',
    description: 'The Breeze Mesh Bucket Hat is designed for the modern urban explorer, crafted from lightweight, breathable polyester mesh to keep you cool under the summer sun. Featuring a sleek, adjustable drawstring and a stylish embroidered logo, this hat is perfect for music festivals, beach days, or casual outings. Its packable design allows for easy storage in your bag, making it the ultimate accessory for spontaneous adventures.',
    price: 40.82,
    tags: ["streetwear","summer","bucket hat","urban fashion","lightweight","festival gear"],
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'NordicFlex',
    title: 'ChillGuard Beanie',
    description: 'The ChillGuard Beanie is crafted from a premium blend of recycled polyester and merino wool, offering exceptional warmth without sacrificing breathability. Its innovative moisture-wicking technology keeps you dry while the stylish ribbed knit design and faux fur pom pom add a touch of flair to your winter athleisure outfits. Perfect for outdoor adventures, casual coffee runs, or simply lounging around in the colder months.',
    price: 32.58,
    tags: ["winter fashion","athleisure","beanie","sustainable","outdoor","cozy","faux fur"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Cavendish & Co.',
    title: 'Autumn Elegance Wool Scarf',
    description: 'Wrap yourself in sophistication with the Autumn Elegance Wool Scarf from Cavendish & Co. Crafted from a luxurious blend of merino wool and cashmere, this scarf features a subtle houndstooth pattern that adds a touch of classic charm. Perfect for formal occasions or cozy evenings out, it effortlessly elevates any outfit while providing warmth in the crisp fall air.',
    price: 294.33,
    tags: ["scarf","luxury","wool","fall fashion","formal accessories","Cavendish & Co.","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Heritage Threads',
    title: 'Vintage Leather Flap Messenger Bag',
    description: 'Crafted from premium aged leather, the Vintage Leather Flap Messenger Bag combines timeless style with modern practicality. Featuring a spacious interior with multiple pockets for organization, this bag is perfect for everyday use or special occasions. The classic brass hardware and hand-stitched detailing add a touch of elegance, making it a versatile accessory for all seasons.',
    price: 363.5,
    tags: ["vintage","leather","messenger bag","handcrafted","all-season","accessory","Heritage Threads"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Wanderlust Co.',
    title: 'Azure Dreamcatcher Pendant Necklace',
    description: 'Embrace your free spirit with the Azure Dreamcatcher Pendant Necklace from Wanderlust Co. This stunning accessory features a handcrafted silver pendant adorned with intricate turquoise beads and natural feathers. Perfect for layering or wearing solo, it adds a bohemian touch to any outfit and is suitable for both casual outings and special occasions.',
    price: 67.26,
    tags: ["bohemian","necklace","handcrafted","turquoise","feathers","layering","unique"],
    imageUrl: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Autumn Aura',
    title: 'Woven Leather Crossbody Bag',
    description: 'The Woven Leather Crossbody Bag from Autumn Aura is the perfect accessory for your fall outings. Crafted from premium, sustainably sourced leather, this bag features an intricate hand-woven design that adds a touch of elegance to any casual outfit. It\'s spacious enough to hold your essentials, with an adjustable strap for comfort, making it ideal for weekend brunches or cozy afternoons at the park.',
    price: 248.31,
    tags: ["fall fashion","casual accessories","leather bag","crossbody","handcrafted","sustainable","weekend outings"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Alcott & Hayes',
    title: 'Cashmere Blend Infinity Scarf',
    description: 'Crafted from an exquisite blend of fine cashmere and silk, this infinity scarf from Alcott & Hayes is the epitome of luxury and warmth. Its elegant drape and subtle herringbone pattern make it a perfect accessory for formal winter occasions, effortlessly elevating any ensemble while providing snug comfort against the chill.',
    price: 1036.57,
    tags: ["cashmere","scarf","formal","winter","luxury","accessory","elegant"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Vibrant Motion',
    title: 'Spring Breeze Performance Headband',
    description: 'The Spring Breeze Performance Headband from Vibrant Motion is designed for the active woman who values both style and functionality. Made from a lightweight blend of recycled polyester and spandex, it features moisture-wicking technology to keep you dry during workouts, while the pastel floral print adds a touch of spring flair. Perfect for yoga sessions, running in the park, or casual outings, this headband ensures you stay fashionable and comfortable all season long.',
    price: 486.59,
    tags: ["athleisure","headband","spring fashion","activewear","moisture-wicking","floral print","sustainable"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Luminara',
    title: 'Soleil Minimalist Sun Hat',
    description: 'The Soleil Minimalist Sun Hat is a chic accessory crafted from 100% organic cotton with a lightweight, breathable design, perfect for summer outings. Its wide brim provides excellent sun protection while maintaining a sleek, understated aesthetic. Ideal for beach days, garden parties, or casual strolls in the park.',
    price: 1040.63,
    tags: ["sun hat","minimalist","summer accessories","organic cotton","sun protection","beachwear","chic"],
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'VintageVogue',
    title: 'Eleanor Art Deco Pearl Brooch',
    description: 'The Eleanor Art Deco Pearl Brooch is a stunning statement piece crafted from antique brass and adorned with genuine freshwater pearls. Inspired by the elegance of the 1920s, this vintage-style accessory features intricate geometric designs and a secure pin clasp, making it perfect for both casual and formal occasions. Whether worn on a lapel or as a hair accessory, it effortlessly elevates any outfit throughout the year.',
    price: 117.35,
    tags: ["vintage","brooch","pearl","Art Deco","statement piece","all-season","handcrafted"],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'AeroFlex',
    title: 'Reflective Performance Sweatband',
    description: 'The Reflective Performance Sweatband by AeroFlex is designed for both style and functionality. Made from a moisture-wicking blend of polyester and spandex, it features reflective accents for low-light visibility, making it perfect for early morning runs or evening workouts. Its sleek design ensures a comfortable fit for all-day wear, whether you\'re at the gym or running errands.',
    price: 105.28,
    tags: ["athleisure","sweatband","reflective","performance","all-season","fitness","activewear"],
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Heritage Timepieces',
    title: 'Vintage ChronoClassic Watch',
    description: 'The Vintage ChronoClassic Watch features a meticulously crafted stainless steel case and a genuine leather strap that ages beautifully over time. With its classic chronograph functionality and elegant cream dial adorned with retro numerals, this watch is perfect for both casual outings and formal events, making it a versatile piece for any season.',
    price: 144.49,
    tags: ["vintage","chronograph","leather strap","stainless steel","all-season","classic style","Heritage Timepieces"],
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Orion Timepieces',
    title: 'Luxe Classic Autumn Watch',
    description: 'The Luxe Classic Autumn Watch by Orion Timepieces is a sophisticated blend of elegance and functionality. Crafted with a polished stainless steel case and a rich brown leather strap, this timepiece features a minimalist dial with gold-toned hands and markers, making it ideal for both formal events and casual outings. Its water-resistant design ensures durability, while the autumnal color palette perfectly complements fall wardrobes.',
    price: 185.37,
    tags: ["formal","fall fashion","leather strap","minimalist","water-resistant","luxury watch","classic design"],
    imageUrl: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'AstraTime',
    title: 'Spring Breeze Casual Watch',
    description: 'The Spring Breeze Casual Watch by AstraTime features a lightweight aluminum case and a soft, pastel-hued silicone strap, perfect for the vibrant days of spring. With its minimalist dial adorned with delicate floral engravings and water resistance of up to 30 meters, this watch is ideal for both casual outings and relaxed weekend adventures. The chic design combines functionality with a playful touch, making it a versatile accessory for any spring wardrobe.',
    price: 138.65,
    tags: ["casual","spring","lightweight","floral","minimalist","water-resistant","trend"],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'Timeless Heritage',
    title: 'Vintage Wintertime Chronograph',
    description: 'The Vintage Wintertime Chronograph by Timeless Heritage features a hand-crafted leather strap with a rich mahogany finish, complemented by a polished brass case that exudes elegance. Its intricate dial showcases luminous hour markers and vintage-inspired sub-dials, making it a perfect accessory for both casual and formal winter occasions. Built to withstand the chill, this watch is water-resistant up to 50 meters and combines functionality with classic style.',
    price: 59.32,
    tags: ["vintage","winter","chronograph","leather","classic","accessory","timeless"],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop',
    category: 'accessories'
  },
  {
    brand: 'UrbanTime',
    title: 'ChronoFlex 3000',
    description: 'The ChronoFlex 3000 is a bold streetwear watch designed for the fall season, featuring a rugged matte black stainless steel case that is both durable and stylish. Its oversized dial showcases luminous hands and hour markers, complemented by a textured silicone strap that ensures a comfortable fit during outdoor adventures. This timepiece is perfect for casual outings or laid-back hangouts, making it a versatile accessory for any urban wardrobe.',
    price: 283.87,
    tags: ["streetwear","fall fashion","urban style","watches","accessories","matte black","silicone strap"],
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=600&fit=crop',
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
      // Create combined text for embedding (title once + description + tags)
      const combinedText = `${product.title}. ${product.description}. ${product.tags.join(', ')}.`;

      // Generate embedding
      console.log(`[${i + 1}/${products.length}] Generating embedding for: ${product.title}`);
      const embedding = await generateEmbedding(combinedText);

      // Convert embedding to PostgreSQL vector string format
      const vectorString = `[${embedding.join(',')}]`;

      // Insert into database
      const { error } = await supabase
        .from('products')
        .insert({
          brand: product.brand,
          title: product.title,
          description: product.description,
          tags: product.tags,
          price: product.price,
          currency: 'USD',
          image_url: product.imageUrl,
          product_url: `https://example.com/products/${product.title.toLowerCase().replace(/\s+/g, '-')}`,
          combined_text: combinedText,
          embedding: vectorString,
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
