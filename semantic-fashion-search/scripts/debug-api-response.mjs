import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const accountSid = process.env.IMPACT_ACCOUNT_SID;
const authToken = process.env.IMPACT_AUTH_TOKEN;
const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

// Test one campaign we know has products
const campaignId = '11817'; // Asebbo

console.log('\n🔍 Debugging API response for campaign', campaignId);
console.log('─'.repeat(60), '\n');

const url = `https://api.impact.com/Mediapartners/${accountSid}/Catalogs/${campaignId}/Items?PageSize=10`;

const response = await fetch(url, {
  headers: {
    'Authorization': authHeader,
    'Accept': 'application/json',
  },
});

const data = await response.json();

console.log('Full API Response:');
console.log(JSON.stringify(data, null, 2));

console.log('\n' + '─'.repeat(60));
console.log('Key fields:');
console.log('  Items.length:', data.Items?.length || 0);
console.log('  TotalCount:', data.TotalCount);
console.log('  Page:', data.Page);
console.log('  PageSize:', data.PageSize);
console.log('');
