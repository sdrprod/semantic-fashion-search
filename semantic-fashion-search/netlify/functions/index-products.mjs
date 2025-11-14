import { supabase } from './supabaseClient.mjs';
import { readFileSync } from 'fs';
import { join } from 'path';

async function embedText(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const embedding = json.data[0]?.embedding;
  if (!embedding) {
    throw new Error('No embedding returned from OpenAI');
  }

  return embedding;
}

export const handler = async (event) => {
  try {
    const indexSecret = event.headers['x-index-secret'];
    if (!indexSecret || indexSecret !== process.env.INDEX_SECRET) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden: Invalid or missing x-index-secret header' })
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }

    const productsPath = join(process.cwd(), 'data', 'products.json');
    const productsData = JSON.parse(readFileSync(productsPath, 'utf-8'));

    console.log(`Loading ${productsData.length} products for indexing...`);

    let indexed = 0;
    const batchSize = 50;

    for (let i = 0; i < productsData.length; i += batchSize) {
      const batch = productsData.slice(i, i + batchSize);
      const productsToInsert = [];

      for (const product of batch) {
        try {
        const combinedText = [
		product.title,
		product.title,
		product.title,
		product.description,
		...product.tags
		].join(" ");

          const embedding = await embedText(combinedText);

          productsToInsert.push({
            brand: product.brand,
            title: product.title,
            description: product.description,
            tags: product.tags,
            price: product.price,
            currency: product.currency,
            image_url: product.imageUrl,
            product_url: product.productUrl,
            combined_text: combinedText,
            embedding: JSON.stringify(embedding)
          });

          indexed++;
        } catch (err) {
          console.error(`Error processing product "${product.title}":`, err);
        }
      }

      if (productsToInsert.length > 0) {
        const { error } = await supabase
		.from("products")
		.insert(productsToInsert);

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
      }

      console.log(`Indexed batch ${i / batchSize + 1}: ${productsToInsert.length} products`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        indexed,
        message: `Successfully indexed ${indexed} products`
      })
    };
  } catch (err) {
    console.error('Indexing error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error during indexing.',
        details: err.message
      })
    };
  }
};