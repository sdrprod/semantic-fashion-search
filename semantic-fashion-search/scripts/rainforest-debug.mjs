import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envLines = envFile.split('\n');

for (const line of envLines) {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
}

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;
const API_BASE = 'https://api.rainforestapi.com/request';

console.log('Loaded API Key:', RAINFOREST_API_KEY ? '✓ Loaded' : '✗ Not found');

// Test one category to see what the API returns
async function testSingleCategory() {
  console.log('🔍 Testing Rainforest API with single category...\n');

  const categoryId = '1045024'; // Dresses - we know this works from your original file

  try {
    const params = new URLSearchParams({
      api_key: RAINFOREST_API_KEY,
      type: 'bestsellers',
      category_id: categoryId,
      amazon_domain: 'amazon.com',
      max_page: '1',
    });

    const url = `${API_BASE}?${params.toString()}`;
    console.log(`URL: ${url}\n`);

    const response = await fetch(url);
    console.log(`Response Status: ${response.status}`);
    console.log(`Response OK: ${response.ok}\n`);

    const data = await response.json();

    console.log('Full API Response:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n\n=== KEY INFO ===');
    console.log(`Has bestsellers array: ${!!data.bestsellers}`);
    console.log(`Bestsellers count: ${data.bestsellers?.length || 0}`);
    console.log(`Request info:`, data.request_info);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSingleCategory();
