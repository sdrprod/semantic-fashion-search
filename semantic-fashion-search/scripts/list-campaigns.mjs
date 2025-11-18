/**
 * Script to fetch all campaign/catalog IDs from Impact API
 * Run with: node scripts/list-campaigns.mjs
 */

const IMPACT_ACCOUNT_SID = process.env.IMPACT_ACCOUNT_SID || 'IRjhw5CtHDNB4960377Lgz6o7UtoXtkxw1';
const IMPACT_AUTH_TOKEN = process.env.IMPACT_AUTH_TOKEN || 'xT8__QbcCRLiaHofdFTdwRYXZJgCFMv8';

async function listCampaigns() {
  const authHeader = Buffer.from(`${IMPACT_ACCOUNT_SID}:${IMPACT_AUTH_TOKEN}`).toString('base64');

  console.log('Fetching campaigns from Impact API...\n');

  try {
    // Fetch media partner's campaigns/catalogs
    const response = await fetch(
      `https://api.impact.com/Mediapartners/${IMPACT_ACCOUNT_SID}/Campaigns`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText}`);
      console.error(errorText);
      return;
    }

    const data = await response.json();

    if (!data.Campaigns || data.Campaigns.length === 0) {
      console.log('No campaigns found. Trying alternative endpoint...\n');

      // Try fetching catalogs instead
      const catalogResponse = await fetch(
        `https://api.impact.com/Mediapartners/${IMPACT_ACCOUNT_SID}/Catalogs`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Accept': 'application/json',
          },
        }
      );

      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json();
        if (catalogData.Catalogs && catalogData.Catalogs.length > 0) {
          console.log(`Found ${catalogData.Catalogs.length} catalogs:\n`);
          console.log('Campaign ID | Advertiser Name | Status');
          console.log('-'.repeat(60));

          for (const catalog of catalogData.Catalogs) {
            console.log(`${catalog.Id} | ${catalog.AdvertiserName || catalog.Name || 'Unknown'} | ${catalog.Status || 'Active'}`);
          }

          console.log('\n--- JSON for .env.local ---');
          const ids = catalogData.Catalogs.map(c => c.Id);
          console.log(`IMPACT_CAMPAIGN_IDS=${ids.join(',')}`);
          return;
        }
      }

      console.log('No catalogs found either.');
      return;
    }

    console.log(`Found ${data.Campaigns.length} campaigns:\n`);
    console.log('Campaign ID | Advertiser Name | Status');
    console.log('-'.repeat(60));

    for (const campaign of data.Campaigns) {
      console.log(`${campaign.Id || campaign.CampaignId} | ${campaign.AdvertiserName || campaign.Name} | ${campaign.Status || 'Active'}`);
    }

    console.log('\n--- JSON for .env.local ---');
    const ids = data.Campaigns.map(c => c.Id || c.CampaignId);
    console.log(`IMPACT_CAMPAIGN_IDS=${ids.join(',')}`);

  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
  }
}

listCampaigns();
