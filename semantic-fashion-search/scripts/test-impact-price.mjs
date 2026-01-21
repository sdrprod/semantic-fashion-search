import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const accountSid = process.env.IMPACT_ACCOUNT_SID;
const authToken = process.env.IMPACT_AUTH_TOKEN;
const campaignId = '11817'; // Asebbo

const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

const url = `https://api.impact.com/Mediapartners/${accountSid}/Catalogs/${campaignId}/Items?PageSize=1`;

console.log('Fetching sample product from Impact API...\n');

const response = await fetch(url, {
  headers: {
    'Authorization': authHeader,
    'Accept': 'application/json',
  },
});

const data = await response.json();

if (data.Items && data.Items.length > 0) {
  const item = data.Items[0];
  console.log('Sample product fields:');
  console.log(JSON.stringify(item, null, 2));

  console.log('\n\nPrice-related fields:');
  console.log('Price:', item.Price);
  console.log('CurrentPrice:', item.CurrentPrice);
  console.log('OriginalPrice:', item.OriginalPrice);
  console.log('SalePrice:', item.SalePrice);
  console.log('Currency:', item.Currency);
} else {
  console.log('No items returned');
}
