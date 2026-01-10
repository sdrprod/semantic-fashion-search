#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const IMPACT_API_BASE = 'https://api.impact.com';
const credentials = {
  accountSid: process.env.IMPACT_ACCOUNT_SID,
  authToken: process.env.IMPACT_AUTH_TOKEN,
};

function createAuthHeader() {
  const encoded = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
  return `Basic ${encoded}`;
}

const campaignsToCheck = [
  { id: '21283', name: 'Firelady Sheepskin' },
  { id: '11923', name: 'Cloud Field' },
  { id: '28532', name: 'Nobis/Recurate/Trove' },
  { id: '22361', name: 'QMY/CSS/WJR' },
];

async function main() {
  console.log('='.repeat(70));
  console.log('NON-DHGATE CAMPAIGN DEEP DIVE');
  console.log('='.repeat(70));
  console.log('');

  for (const campaign of campaignsToCheck) {
    const url = `${IMPACT_API_BASE}/Mediapartners/${credentials.accountSid}/Catalogs/${campaign.id}/Items?Page=1&PageSize=5`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`Campaign ${campaign.id} (${campaign.name}): HTTP ${response.status}`);
        console.log('');
        continue;
      }

      const data = await response.json();
      const products = data.Items || [];

      console.log(`Campaign ${campaign.id}: ${campaign.name}`);

      if (products.length === 0) {
        console.log('  ❌ No products available');
      } else {
        const currencies = new Set(products.map(p => p.Currency));
        const usdProducts = products.filter(p => p.Currency === 'USD');

        console.log(`  Products sampled: ${products.length}`);
        console.log(`  Currencies: ${Array.from(currencies).join(', ')}`);
        console.log(`  USD products: ${usdProducts.length}/${products.length} (${Math.round(usdProducts.length/products.length*100)}%)`);
        console.log('');
        console.log('  Sample products:');

        products.slice(0, 3).forEach((p, i) => {
          console.log(`    ${i+1}. ${p.Name.slice(0, 60)}`);
          console.log(`       Manufacturer: "${p.Manufacturer || '(empty)'}"`);
          console.log(`       Price: ${p.Price} ${p.Currency}`);
          console.log(`       Category: ${p.Category}`);
        });
      }

      console.log('');

    } catch (error) {
      console.log(`Campaign ${campaign.id} (${campaign.name}): Error - ${error.message}`);
      console.log('');
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('='.repeat(70));
  console.log('CONCLUSION');
  console.log('='.repeat(70));
  console.log('');
  console.log('Based on analysis:');
  console.log('- 21283 (Firelady): 100% USD, fashion (sheepskin/fur) ✅');
  console.log('- 11923 (Cloud Field): 0% USD (EUR/GBP) ❌');
  console.log('- 28532 (Nobis/Trove): 0% USD (CAD) ❌');
  console.log('- 22361 (QMY): 100% USD, mostly non-fashion ⚠️');
  console.log('');
  console.log('RECOMMENDATION: Focus on DHGate campaigns (7183-7188) with strict filtering');
  console.log('Add 21283 (Firelady) if quality scores improve');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
