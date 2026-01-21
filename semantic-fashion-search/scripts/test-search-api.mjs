#!/usr/bin/env node

/**
 * Test the search API endpoint directly
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testSearchAPI() {
  console.log('='.repeat(70));
  console.log('TESTING SEARCH API ENDPOINT');
  console.log('='.repeat(70));
  console.log('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const testQuery = 'black dress for date night';

  console.log(`API URL: ${API_URL}`);
  console.log(`Test query: "${testQuery}"`);
  console.log('');

  console.log('Calling /api/search...');
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        limit: 10,
        page: 1,
      }),
    });

    const elapsed = Date.now() - startTime;
    console.log(`Response received in ${elapsed}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:');
      console.log(errorText);
      return;
    }

    const data = await response.json();

    console.log('✅ Search completed successfully!');
    console.log('');
    console.log('Response summary:');
    console.log(`  Query: ${data.query}`);
    console.log(`  Results: ${data.results?.length || 0}`);
    console.log(`  Total count: ${data.totalCount || 0}`);
    console.log(`  Page: ${data.page}/${data.pageSize}`);
    console.log('');

    if (data.intent) {
      console.log('Intent extraction:');
      console.log(`  Summary: ${data.intent.summary || 'N/A'}`);
      console.log(`  Search queries: ${data.intent.searchQueries?.length || 0}`);
      if (data.intent.searchQueries && data.intent.searchQueries.length > 0) {
        data.intent.searchQueries.slice(0, 3).forEach((sq, i) => {
          console.log(`    ${i + 1}. "${sq.query}" (weight: ${sq.weight})`);
        });
      }
      console.log('');
    }

    if (data.results && data.results.length > 0) {
      console.log('First 3 results:');
      data.results.slice(0, 3).forEach((product, i) => {
        console.log(`  ${i + 1}. ${product.brand} - ${product.title.slice(0, 60)}...`);
        console.log(`     Price: ${product.currency} ${product.price}`);
        console.log(`     Similarity: ${(product.similarity * 100).toFixed(2)}%`);
      });
    } else {
      console.log('⚠️  NO RESULTS RETURNED');
      console.log('');
      console.log('Debug info from response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }

  console.log('');
  console.log('='.repeat(70));
}

testSearchAPI()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
