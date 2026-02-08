#!/usr/bin/env node

/**
 * Check which Anthropic models are available with your API key
 *
 * Usage:
 *   node scripts/check-anthropic-models.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from semantic-fashion-search directory
dotenv.config({ path: join(__dirname, '../semantic-fashion-search/.env.local') });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Models to test
const modelsToTest = [
  'claude-3-haiku-20240307',          // Fastest, cheapest
  'claude-3-5-haiku-20241022',        // Faster Haiku
  'claude-3-5-sonnet-20240620',       // Sonnet (stable)
  'claude-3-5-sonnet-20241022',       // Sonnet (latest)
  'claude-3-opus-20240229',           // Most intelligent
  'claude-3-sonnet-20240229',         // Older Sonnet
];

console.log('Testing Anthropic API key access to models...\n');
console.log(`API Key: ${process.env.ANTHROPIC_API_KEY?.slice(0, 20)}...${process.env.ANTHROPIC_API_KEY?.slice(-4)}\n`);

async function testModel(modelName) {
  try {
    const response = await anthropic.messages.create({
      model: modelName,
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Hi',
        },
      ],
    });

    return {
      model: modelName,
      available: true,
      response: response.content[0].text,
    };
  } catch (error) {
    return {
      model: modelName,
      available: false,
      error: error.message,
      status: error.status,
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
