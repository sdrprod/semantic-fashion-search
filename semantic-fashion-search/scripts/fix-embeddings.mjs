import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbeddings() {
  console.log('\n🔍 Finding products without embeddings...\n');

  // Get products without embeddings from campaign 7187
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description, tags, combined_text')
    .eq('merchant_id', '7187')
    .is('embedding', null);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('✅ All products already have embeddings!');
    return;
  }

  console.log(`📊 Found ${products.length} products without embeddings\n`);

  let generated = 0;
  const batchSize = 10; // Smaller batches for better rate limiting

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}...`);

    for (const product of batch) {
      try {
        // Use combined_text if available, otherwise create it
        const textToEmbed = product.combined_text ||
          `${product.title} ${product.description} ${product.tags?.join(' ') || ''}`.trim();

        if (!textToEmbed) {
          console.log(`  ⚠️  Skipping ${product.id} - no text to embed`);
          continue;
        }

        // Generate embedding
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: textToEmbed,
        });

        const embedding = response.data[0].embedding;

        // Update product with embedding
        const { error: updateError } = await supabase
          .from('products')
          .update({ embedding })
          .eq('id', product.id);

        if (updateError) {
          console.error(`  ❌ Error updating ${product.id}:`, updateError);
        } else {
          generated++;
          process.stdout.write(`  ✓ Generated ${generated}/${products.length}\r`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`  ❌ Error processing ${product.id}:`, err.message);
      }
    }
  }

  console.log(`\n\n✅ Done! Generated ${generated} embeddings`);
}

generateEmbeddings().catch(console.error);
