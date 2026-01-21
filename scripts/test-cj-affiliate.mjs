#!/usr/bin/env node

/**
 * Test script for CJ Affiliate Product API
 * Fetches athleisurewear and activewear products
 */

const CJ_TOKEN = 'nogiW53n2svnVTcrcLp7rScybw';
const CJ_CID = '7790932';
const CJ_API_URL = 'https://ads.api.cj.com/query';

async function testCJAffiliate() {
  console.log('Testing CJ Affiliate Product API...\n');

  // GraphQL query for athleisure and activewear products
  const query = `
    {
      shoppingProducts(
        companyId: "${CJ_CID}"
        keywords: ["athleisure", "activewear", "athletic wear", "gym clothes", "workout clothes"]
        currency: "USD"
        limit: 50
      ) {
        totalCount
        count
        resultList {
          id
          title
          description
          advertiserId
          advertiserName
          price {
            amount
            currency
          }
          availability
          imageLink
          link
          linkCode(pid: "${CJ_CID}") {
            clickUrl
          }
          brand
          condition
          googleProductCategory {
            id
            name
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(CJ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CJ_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL Errors:');
      console.error(JSON.stringify(data.errors, null, 2));
      return;
    }

    const products = data.data?.shoppingProducts;

    if (!products) {
      console.error('No products data in response');
      console.error(JSON.stringify(data, null, 2));
      return;
    }

    console.log(`Total matching products: ${products.totalCount}`);
    console.log(`Products returned: ${products.count}\n`);
    console.log('='.repeat(80));

    // Display sample products
    products.resultList.forEach((product, index) => {
      console.log(`\n[${index + 1}] ${product.title}`);
      console.log(`    ID: ${product.id}`);
      console.log(`    Advertiser: ${product.advertiserName || product.advertiserId}`);
      console.log(`    Price: ${product.price?.amount} ${product.price?.currency}`);
      console.log(`    Brand: ${product.brand || 'N/A'}`);
      console.log(`    Availability: ${product.availability || 'N/A'}`);
      console.log(`    Category: ${product.googleProductCategory?.name || 'N/A'}`);
      console.log(`    Image: ${product.imageLink || 'N/A'}`);
      console.log(`    Link: ${product.link?.substring(0, 60)}...`);
      if (product.description) {
        const desc = product.description.substring(0, 100);
        console.log(`    Description: ${desc}...`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\nSample complete!');

    // Write full results to file for inspection
    const fs = await import('fs');
    const outputFile = 'scripts/cj-test-results.json';
    fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
    console.log(`\nFull results written to: ${outputFile}`);

  } catch (error) {
    console.error('Error fetching from CJ Affiliate:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testCJAffiliate();
