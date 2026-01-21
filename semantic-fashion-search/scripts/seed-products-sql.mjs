import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate embedding
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const json = await response.json();
  return json.data[0]?.embedding;
}

// First, clear existing products
console.log('Clearing existing products...');
const { error: deleteError } = await supabase
  .from('products')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

if (deleteError) {
  console.error('Error clearing products:', deleteError);
  process.exit(1);
}

console.log('✅ Products cleared\n');

// Test with just one product first
const testProduct = {
  brand: 'Test Brand',
  title: 'Classic Black Sheath Dress',
  description: 'Elegant black sheath dress with a flattering silhouette. Perfect for professional settings and evening events.',
  price: 295.00,
  tags: ['black', 'dress', 'elegant', 'professional'],
  imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
};

console.log('Testing with one product...');
const combinedText = `${testProduct.title}. ${testProduct.description}. ${testProduct.tags.join(', ')}.`;
console.log('Combined text:', combinedText);

const embedding = await generateEmbedding(combinedText);
console.log('Embedding generated. Length:', embedding.length);
console.log('Sample:', embedding.slice(0, 5));

// Convert to vector string format
const vectorStr = `[${embedding.join(',')}]`;
console.log('Vector string length:', vectorStr.length);

// Use raw SQL with explicit vector casting
console.log('\nInserting with explicit vector casting...');
const { data: insertData, error: insertError } = await supabase.rpc('query', {
  sql: `
    INSERT INTO products (brand, title, description, tags, price, currency, image_url, product_url, combined_text, embedding)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector)
    RETURNING id, title;
  `,
  params: [
    testProduct.brand,
    testProduct.title,
    testProduct.description,
    testProduct.tags,
    testProduct.price,
    'USD',
    testProduct.imageUrl,
    `https://example.com/products/${testProduct.title.toLowerCase().replace(/\s+/g, '-')}`,
    combinedText,
    vectorStr
  ]
});

if (insertError) {
  console.error('Insert error:', insertError);
  console.log('\nThe query RPC function might not exist. Let me try using the standard insert method with explicit casting in the data...\n');

  // Try alternative approach - let Supabase handle the casting
  const { data: altData, error: altError } = await supabase
    .from('products')
    .insert({
      brand: testProduct.brand,
      title: testProduct.title,
      description: testProduct.description,
      tags: testProduct.tags,
      price: testProduct.price,
      currency: 'USD',
      image_url: testProduct.imageUrl,
      product_url: `https://example.com/products/${testProduct.title.toLowerCase().replace(/\s+/g, '-')}`,
      combined_text: combinedText,
      embedding: vectorStr,
    })
    .select();

  if (altError) {
    console.error('Alternative insert error:', altError);
    process.exit(1);
  }

  console.log('✅ Product inserted successfully:', altData[0].title);
  console.log('\nNow testing search...');

  // Test search
  const searchQuery = 'black dress';
  const searchEmbedding = await generateEmbedding(searchQuery);
  const searchVectorStr = `[${searchEmbedding.join(',')}]`;

  const { data: searchResults, error: searchError } = await supabase.rpc('match_products', {
    query_embedding: searchVectorStr,
    match_count: 10,
  });

  if (searchError) {
    console.error('Search error:', searchError);
  } else {
    console.log(`\n✅ Search results: ${searchResults.length} products found`);
    if (searchResults.length > 0) {
      console.log('\nTop result:');
      console.log(`- ${searchResults[0].title}`);
      console.log(`- Similarity: ${searchResults[0].similarity}`);

      if (searchResults[0].similarity > 0.3) {
        console.log('\n🎉 SUCCESS! Similarity score is good!');
      } else {
        console.log('\n⚠️  Similarity score is still low. This suggests embeddings are still not being stored as proper vectors.');
      }
    }
  }
}
