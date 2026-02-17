import fs from 'fs';
import path from 'path';

// Load .env.local
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

console.log('🧪 Testing Rainforest API Connection\n');
console.log('API Key loaded:', RAINFOREST_API_KEY ? '✓' : '✗');
console.log('API Base URL:', API_BASE);
console.log('');

async function testAPI() {
  try {
    const url = new URL(API_BASE);
    url.searchParams.append('api_key', RAINFOREST_API_KEY);
    url.searchParams.append('type', 'search');
    url.searchParams.append('search_term', 'footwear sneakers');
    url.searchParams.append('amazon_domain', 'amazon.com');
    url.searchParams.append('page', '1');

    console.log('Making request to:', url.toString().substring(0, 100) + '...\n');

    const response = await fetch(url.toString());
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
    });

    const data = await response.json();

    console.log('\nFull API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.request_info?.credits_used_this_request) {
      console.log('\n✅ API call succeeded!');
      console.log('Credits used:', data.request_info.credits_used_this_request);
    } else if (data.error) {
      console.log('\n❌ API returned error:', data.error);
    } else if (!response.ok) {
      console.log('\n❌ HTTP error:', response.statusText);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  }
}

testAPI();
