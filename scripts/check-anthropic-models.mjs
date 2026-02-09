#!/usr/bin/env node

/**
 * Check which Anthropic models are available with your API key
 *
 * Usage:
 *   Set ANTHROPIC_API_KEY env var, then run:
 *   node scripts/check-anthropic-models.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local manually
let ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  try {
    const envPath = join(__dirname, '../semantic-fashion-search/.env.local');
    const envFile = readFileSync(envPath, 'utf8');
    const match = envFile.match(/ANTHROPIC_API_KEY=(.+)/);
    if (match) {
      ANTHROPIC_API_KEY = match[1].trim();
    }
  } catch (e) {
    console.error('Could not load .env.local file');
  }
}

if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not found in environment or .env.local');
  console.error('Please set it as an environment variable or add it to semantic-fashion-search/.env.local');
  process.exit(1);
}

// Models to test
const modelsToTest = [
  'claude-3-haiku-20240307',          // Haiku 3
  'claude-3-5-haiku-20241022',        // Haiku 3.5
  'claude-3-sonnet-20240229',         // Older Sonnet 3
  'claude-3-5-sonnet-20240620',       // Sonnet 3.5 (June)
  'claude-3-5-sonnet-20241022',       // Sonnet 3.5 (October)
  'claude-3-5-sonnet-latest',         // Sonnet latest
  'claude-3-opus-20240229',           // Opus 3
];

console.log('Testing Anthropic API key access to models...\n');
console.log(`API Key: ${ANTHROPIC_API_KEY?.slice(0, 20)}...${ANTHROPIC_API_KEY?.slice(-4)}\n`);

async function testModel(modelName) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        model: modelName,
        available: true,
        response: data.content[0].text,
      };
    } else {
      const errorData = await response.json();
      return {
        model: modelName,
        available: false,
        error: errorData.error?.message || 'Unknown error',
        status: response.status,
      };
    }
  } catch (error) {
    return {
      model: modelName,
      available: false,
      error: error.message,
      status: null,
    };
  }
}

// Test all models
console.log('Testing models (this may take 30-60 seconds)...\n');

const results = [];

for (const model of modelsToTest) {
  const result = await testModel(model);
  results.push(result);

  if (result.available) {
    console.log(`✅ ${result.model}`);
    console.log(`   Response: "${result.response}"`);
  } else {
    console.log(`❌ ${result.model}`);
    console.log(`   Error: ${result.error}`);
    if (result.status) {
      console.log(`   Status: ${result.status}`);
    }
  }
  console.log('');

  // Small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('\n=== SUMMARY ===');
console.log('\nAvailable models:');
const working = results.filter(r => r.available);
const notWorking = results.filter(r => !r.available);

if (working.length > 0) {
  working.forEach(r => console.log(`  ✅ ${r.model}`));
} else {
  console.log('  None - check your API key and billing settings');
}

console.log('\nUnavailable models:');
if (notWorking.length > 0) {
  notWorking.forEach(r => console.log(`  ❌ ${r.model} (${r.status || 'error'})`));
} else {
  console.log('  None - all models available!');
}

console.log('\n=== RECOMMENDATION ===');
if (working.some(r => r.model.includes('sonnet'))) {
  const bestSonnet = working.find(r => r.model === 'claude-3-5-sonnet-20241022') ||
                     working.find(r => r.model === 'claude-3-5-sonnet-20240620') ||
                     working.find(r => r.model.includes('sonnet'));
  console.log(`Use: ${bestSonnet.model} (best balance of speed and intelligence)`);
} else if (working.some(r => r.model.includes('opus'))) {
  console.log('Use: claude-3-opus-20240229 (most intelligent, but slower and more expensive)');
} else if (working.some(r => r.model.includes('haiku'))) {
  const bestHaiku = working.find(r => r.model === 'claude-3-5-haiku-20241022') ||
                    working.find(r => r.model === 'claude-3-haiku-20240307');
  console.log(`Use: ${bestHaiku.model} (fastest and cheapest, good for simple tasks)`);
} else {
  console.log('⚠️  No models available - check your API key and billing settings');
  console.log('   Visit: https://console.anthropic.com/settings/billing');
}

console.log('\n');
