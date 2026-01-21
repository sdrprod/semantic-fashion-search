#!/bin/bash

# Test Impact.com product sync with a single campaign
# This will sync products from campaign 7163 (first in your list)

echo "Starting test sync from Impact.com campaign 7163..."

curl -X POST http://localhost:3000/api/admin/sync-products \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: 3a2c5e9d9f4b27a8c1f0e2b6d7a934e1" \
  -d '{
    "source": "impact",
    "syncAll": false,
    "campaignId": "7163",
    "maxProducts": 50,
    "generateEmbeddings": true
  }' | jq

echo ""
echo "Sync complete! Check the output above for results."
