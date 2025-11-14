import { supabase } from './supabaseClient.mjs';

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
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const query = body.query;
    let limit = body.limit ?? 20;

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query must be at least 3 characters.' })
      };
    }

    if (limit > 50) limit = 50;
    if (limit < 1) limit = 20;

    const embedding = await embedText(query);

    const { data, error } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      match_count: limit
    });

    if (error) {
      console.error('Supabase match_products error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Search failed.' })
      };
    }

const results = (data || []).map((row) => ({
  id: row.id,
  imageUrl: row.image_url,
  brand: row.brand,
  title: row.title,
  description: row.description,
  price: row.price,
  currency: row.currency,
  productUrl: row.product_url
}));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, results })
    };
  } catch (err) {
    console.error('Search error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error.' })
    };
  }
};