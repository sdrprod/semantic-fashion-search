import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const accountSid = process.env.IMPACT_ACCOUNT_SID;
const authToken = process.env.IMPACT_AUTH_TOKEN;
const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

// All 20 campaigns
const campaigns = [
  '7163', '7183', '7184', '7186', '7187', '7188',
  '11817', '11923', '16350', '16376', '16377', '16378',
  '19090', '19224', '21283', '22361', '25480', '27725', '27815', '28532'
];

console.log('\n📊 Checking product inventory for all 20 campaigns...\n');

let totalAvailable = 0;
let totalSynced = 566; // Current count

for (const campaignId of campaigns) {
  try {
    const url = `https://api.impact.com/Mediapartners/${accountSid}/Catalogs/${campaignId}/Items?PageSize=1`;

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Campaign ${campaignId}: ❌ API Error (${response.status})`);
      continue;
    }

    const data = await response.json();
    // Impact API uses @total (string) not TotalCount
    const totalCount = parseInt(data['@total'] || '0', 10);
    totalAvailable += totalCount;

    // Show campaign name if available
    let campaignName = '';
    if (data.Items && data.Items.length > 0) {
      campaignName = data.Items[0].CampaignName || '';
    }

    console.log(`Campaign ${campaignId}: ${totalCount.toLocaleString()} products`);
    if (campaignName) {
      console.log(`  └─ ${campaignName}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (err) {
    console.log(`Campaign ${campaignId}: ❌ Error - ${err.message}`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log(`Total products available: ${totalAvailable.toLocaleString()}`);
console.log(`Currently synced: ${totalSynced.toLocaleString()}`);
console.log(`Potential to add: ${(totalAvailable - totalSynced).toLocaleString()}`);
console.log('═'.repeat(60));
console.log('\nRecommendations:');
console.log('1. Sync 500 products per campaign = ~10,000 products total');
console.log('2. Sync 1000 products per campaign = ~20,000 products total');
console.log('3. Sync all available products (may take hours)');
console.log('');
