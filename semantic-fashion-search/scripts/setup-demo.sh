#!/bin/bash

# Setup Demo Products
# This script creates the demo_products table and populates it with demo data

set -e

echo "=================================================="
echo "Setting up Demo Products for Live Presentation"
echo "=================================================="
echo ""

# Step 1: Check if SQL migration file exists
if [ ! -f "scripts/create-demo-products.sql" ]; then
  echo "ERROR: SQL migration file not found at scripts/create-demo-products.sql"
  exit 1
fi

echo "STEP 1: SQL Migration (manually run in Supabase)"
echo "=========================================="
echo ""
echo "You need to run this SQL in your Supabase SQL Editor:"
echo "1. Go to: https://supabase.com/dashboard/project/[your-project]/sql"
echo "2. Click 'New Query'"
echo "3. Copy and paste the contents of: scripts/create-demo-products.sql"
echo "4. Click 'Run'"
echo ""
echo "Once you've run the SQL in Supabase, press ENTER to continue..."
read -p "Press ENTER when done:"

echo ""
echo "STEP 2: Populating Demo Products"
echo "=========================================="
echo ""

# Step 2: Run the Node script to populate
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  export NEXT_PUBLIC_SUPABASE_URL=https://gyluicluodtabeufrajd.supabase.co
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bHVpY2x1b2R0YWJldWZyYWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2NDY5NiwiZXhwIjoyMDc4NjQwNjk2fQ.QeCXRvuKQGE23Ywl1pXGoEMnTB9DAMDE4GSqn2PtPig'
fi

node scripts/create-and-populate-demo.mjs

if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Failed to populate demo products"
  echo "Make sure you ran the SQL migration first!"
  exit 1
fi

echo ""
echo "=================================================="
echo "✅ Demo products setup complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Add demo search trigger to lib/search.ts"
echo "2. Test the demo search"
echo "3. Commit and push"
echo ""
