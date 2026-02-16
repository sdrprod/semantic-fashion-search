# Rainforest API Integration Plan - Semantic Fashion Search

## Executive Summary

We have created a complete strategy for importing Amazon products into the database using weighted category distribution, then maintaining them with weekly updates using content change detection.

**Key Components:**
1. ✅ Migration script - Adds tracking columns
2. ✅ Initial import script - Populates 20,000 products
3. ✅ Weekly diff script - Detects changes and updates only changed products

---

## Strategy: Weighted Distribution

**Distribution Model (20,000 products across 22 categories):**

| Rank | Category | Weight | Products |
|------|----------|--------|----------|
| 1 | Footwear - Sneakers | 6.27% | 1,254 |
| 2 | Women's Clothing - Dresses | 5.92% | 1,186 |
| 3 | Women's Clothing - Pants & Jeans | 5.57% | 1,120 |
| 4 | Footwear - Boots | 5.57% | 1,120 |
| 5 | Women's Clothing - Activewear | 5.23% | 1,052 |
| ... | ... | ... | ... |
| 22 | Accessories - Belts | 2.79% | 558 |

**Total:** 20,000 products weighted by Google Trends search demand

---

## Implementation Stages

### Stage 1: Database Migration

**File:** `scripts/001-add-vendor-tracking-columns.sql`

**New Columns (vendor-agnostic):**
- `last_scraped_at` - When product was last fetched from API
- `content_hash` - SHA256 hash of (title, brand, price, description) for change detection
- `sale_price` - Discounted price if on sale
- `discount_percent` - Percentage discount
- `sale_end_date` - When sale ends
- `is_on_sale` - Boolean flag for quick filtering

**Indexes Created:**
- `idx_products_content_hash` - Fast change detection
- `idx_products_last_scraped_at` - Fast age queries
- `idx_products_is_on_sale` - Fast sale filtering

**Run:** Execute in Supabase SQL editor before importing

---

### Stage 2: Initial Import (One-time)

**File:** `scripts/rainforest-initial-import.mjs`

**What it does:**
1. Loads weighted distribution from `rainforest-weighting-analysis.json`
2. For each category, calculates target product count
3. Searches Amazon via Rainforest API using category keywords
4. Maps Rainforest fields to database schema
5. Generates content_hash for each product
6. Upserts products (insert if new, update if URL exists)
7. Tracks import progress and credit usage

**Rainforest Field Mapping:**

| Rainforest Field | DB Column | Notes |
|-----------------|-----------|-------|
| title | title | Product name |
| brand | brand | Manufacturer |
| description / feature_bullets | description | Converted feature list to text |
| price | price | Current price |
| images[0] | image_url | Primary product image |
| link | product_url | Amazon product URL |
| stock_status | in_stock | Availability check |
| offers[0] | sale_price, discount_percent, is_on_sale | Sales/deals data |

**Configuration:**
```javascript
TOTAL_TARGET_PRODUCTS = 20000
PRODUCTS_PER_SEARCH = 50
CREDIT_BUDGET = 100  // Configurable - adjust as needed
```

**Expected Runtime:** ~30-60 minutes (depends on API responsiveness)

**Run:**
```bash
node scripts/rainforest-initial-import.mjs
```

---

### Stage 3: Weekly Diff/Update Script

**File:** `scripts/rainforest-weekly-diff.mjs`

**Strategy:**
1. Queries database for products where `last_scraped_at` > 7 days old
2. Extracts ASIN from product URL
3. Fetches fresh product data using Rainforest's product endpoint
4. Compares `content_hash` of old vs new data
5. Only updates products where content changed
6. Updates `last_scraped_at` timestamp for all checked products

**Benefits:**
- ✅ Minimal credit usage (only checks 7+ day old products)
- ✅ Skips unchanged products automatically
- ✅ Detects price changes, sales, stock status changes
- ✅ Scales to unlimited product count

**Configuration:**
```javascript
CREDIT_BUDGET = 50          // Weekly budget
DAYS_SINCE_LAST_SCRAPE = 7  // Re-check after 7 days
BATCH_SIZE = 20             // Process 20 products at a time
```

**Expected Runtime:** ~5-15 minutes

**Schedule:** Run every weekend (Friday night or Saturday morning)

**Run:**
```bash
node scripts/rainforest-weekly-diff.mjs
```

---

## Change Detection Logic

**Content Hash Algorithm:**
```
hash = SHA256(
  title.toLowerCase() + "|" +
  brand.toLowerCase() + "|" +
  price + "|" +
  description.toLowerCase()
)
```

**Change triggers:**
- Any of: title, brand, price, description changed
- New sale detected (sale_price populated)
- Sale ended (is_on_sale changed from true to false)
- Stock status changed

**Non-triggering changes:**
- `image_url` alone (doesn't trigger re-embedding)
- `updated_at` timestamp change
- Any other minor field

---

## Credit Cost Analysis

### Initial Import Estimates

**Scenario 1: Optimized Search (2 credits/search)**
- 22 categories
- ~18 searches per category (at 50 products per search)
- Total: 22 × 18 = 396 searches
- **Estimated cost: 792+ credits** ❌ (exceeds 30-credit test budget significantly)

**Scenario 2: Aggressive Batching (1 search per category)**
- 22 broad category searches
- Get ~100-200 products per search
- **Estimated cost: 22-44 credits** ✅ (feasible)

### Weekly Maintenance Costs

**Scenario: 20,000 products, re-check 1/7 per week**
- Products to check: ~2,857 per week
- Product endpoint cost: ~0.5 credits per ASIN
- **Estimated weekly cost: ~1,400 credits** ❌ (too high if checking all weekly)

**Recommended: Monthly full check instead**
- Re-check 1/30 per month: ~667 products
- Monthly cost: ~333 credits
- **This is sustainable** ✅

---

## Execution Recommendations

### For Initial Import - Three Options:

**Option A: Go Big (Recommended)**
- Run initial import with 20,000 target
- Accept higher credit cost (~100-150 credits)
- Verify data quality
- Then switch to monthly maintenance
- **Cost:** 100-150 one-time + ~333/month maintenance

**Option B: Conservative Approach**
- Start with 5,000 products (test first)
- Validate import quality and embedding generation
- Then scale to 20,000
- **Cost:** 25-50 for test + 100-150 for full + 333/month

**Option C: Smart Batching**
- Use category-wide searches (1 per category)
- Get ~100-200 products per category = ~2,200-4,400 total
- Accept smaller initial dataset, grow weekly
- **Cost:** ~22-44 initial + ~200/month growth

### Recommended Path:

1. **Run migration** - Execute `001-add-vendor-tracking-columns.sql` (0 credits)
2. **Test import** - Run initial-import on 1-2 categories first (2-4 credits)
3. **Validate results** - Check data quality, run existing embedding scripts
4. **Full import** - Run for all categories (100-150 credits)
5. **Set up weekly** - Configure cron/scheduled task for diff script (next Monday)

---

## Next Steps

1. **Confirm credit budget allocation** - How many credits for initial import?
2. **Run migration** - Apply database schema changes
3. **Run initial import** - Populate 20,000 products
4. **Generate embeddings** - Run existing text & image embedding scripts
5. **Test search** - Verify quality of results
6. **Schedule weekly diff** - Set up automated weekend maintenance

---

## Files Created

- ✅ `scripts/001-add-vendor-tracking-columns.sql` - Database migration
- ✅ `scripts/rainforest-initial-import.mjs` - One-time product population
- ✅ `scripts/rainforest-weekly-diff.mjs` - Weekly change detection
- ✅ `rainforest-weighting-analysis.json` - Category weighting data
- ✅ `RAINFOREST_IMPORT_PLAN.md` - This document

---

## Questions to Confirm

1. **Initial import approach?** (Option A, B, or C above)
2. **Credit budget for initial import?** (Recommend 100-150)
3. **When to start?** (Immediately or after testing?)
4. **Re-check frequency?** (Weekly vs monthly after initial import)

Ready to proceed when you give the go-ahead.
