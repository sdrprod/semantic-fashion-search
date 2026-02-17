# Rainforest API Integration Plan - Semantic Fashion Search

## Executive Summary

We have created a complete strategy for importing Amazon products into the database using weighted category distribution, with on-demand checking for product updates.

**Key Components:**
1. ✅ Migration script - Adds tracking columns
2. ✅ Initial import script - Phase 1: 5,000 products (test)
3. ✅ On-demand category checker - Check/update any category manually

---

## Strategy: Phased Approach with On-Demand Updates

**Phase 1 - Testing (5,000 products across 22 categories):**
- Limited credit budget: 50 credits
- Validate data quality and embedding generation
- Ensure workflow is correct

**Phase 2 - Full Population (remaining 15,000 products):**
- After Phase 1 validation
- Full weighted distribution across all categories
- Target 20,000 total additional products

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
TOTAL_TARGET_PRODUCTS = 5000  // Phase 1: Test first
PRODUCTS_PER_SEARCH = 50
CREDIT_BUDGET = 50  // Phase 1: Conservative budget for testing
```

**Expected Runtime:** ~10-20 minutes for Phase 1

**Run:**
```bash
node scripts/rainforest-initial-import.mjs
```

---

### Stage 3: On-Demand Category Checker

**File:** `scripts/rainforest-check-category.mjs`

**Purpose:** Manually check any category/subcategory for product changes without automation

**What it does:**
1. Takes category/subcategory as command line argument
2. Fetches latest products from Rainforest for that category
3. Compares against database using content_hash
4. Shows changes: new products, updated prices/sales, unchanged items
5. Prompts to confirm before updating database
6. Upserts only changed products

**Benefits:**
- ✅ Manual control over when to check
- ✅ Low credit cost per check (~3-5 credits per category)
- ✅ See exactly what changed before applying updates
- ✅ No recurring automation overhead
- ✅ Can check categories selectively based on need

**Configuration:**
```javascript
PAGES_TO_CHECK = 3          // Check first 3 pages = ~150 products
PRODUCTS_PER_PAGE = 50
CREDIT_BUDGET = 25          // Per-check budget
```

**Usage Examples:**
```bash
# Check specific subcategory
node scripts/rainforest-check-category.mjs "Footwear" "Sneakers"

# Check broader category
node scripts/rainforest-check-category.mjs "Dresses"

# Check accessories
node scripts/rainforest-check-category.mjs "Accessories" "Handbags & Totes"
```

**Output:**
- Summary of new, updated, and unchanged products
- Details of what changed (price, sale status, etc.)
- Interactive confirmation before applying changes
- Credit usage report

**Expected Runtime:** ~2-5 minutes per category check

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

### Phase 1: Initial Import (5,000 products)

**Budget:** 50 credits

**Calculation:**
- 5,000 products ÷ 50 products per search = 100 searches needed
- But we're only checking 3 pages per category = limited searches
- Average: ~2-3 searches per category × 22 categories = ~50-60 searches
- **Expected cost: 50-60 credits** ⚠️ (slightly over but close)

**Contingency:** If we hit budget limits, script will stop gracefully and report progress

### Phase 2: Full Population (remaining 15,000 products)

**Budget:** 100-150 credits

**Calculation:**
- Similar approach to Phase 1 but with more pages per category
- Total needed: ~5-7 searches × 22 categories = ~110-154 searches
- **Expected cost: 110-150 credits** ✅

### On-Demand Category Checking

**Cost per check:** ~3-5 credits per category (3 pages × 50 products)

**Examples:**
- Check 1 category: 3-5 credits
- Check 5 categories: 15-25 credits
- Check all 22 categories: ~66-110 credits

**No recurring costs** - Only run checks when you need to

---

## Execution Path - Option B (Selected)

**Phase 1: Testing (5,000 products)**
1. Run migration - Add tracking columns (0 credits)
2. Run initial import with 5,000 target (50 credits budget)
3. Validate data quality and completeness
4. Run existing embedding scripts
5. Test search functionality

**Phase 2: Full Population (15,000 more products)**
1. After Phase 1 validation succeeds
2. Adjust script to target remaining 15,000 products
3. Run initial import again for full 20,000 total (100-150 credits)
4. Re-run embedding scripts on new products
5. Verify quality across all categories

**Ongoing Maintenance: On-Demand Checking**
- No scheduled checks
- Run `rainforest-check-category.mjs` when needed
- Check specific categories showing stale data
- Examples: price drift, new competitors, seasonal changes
- Cost: 3-5 credits per category check

---

## Next Steps

### Immediate (Phase 1 - Ready Now)

1. **Run migration** - Execute `001-add-vendor-tracking-columns.sql`
   ```sql
   -- Execute in Supabase SQL editor
   ```

2. **Run initial import** - Test with 5,000 products
   ```bash
   node scripts/rainforest-initial-import.mjs
   ```
   - Monitor for completion
   - Report credit usage and product count

3. **Generate embeddings** - Run your existing embedding scripts on imported products
   ```bash
   # Your existing text embedding script
   # Your existing image embedding script
   ```

4. **Test search** - Verify semantic search quality

### After Phase 1 Validation

5. **Scale to 20,000** - Modify and re-run import with full target
6. **Check categories as needed** - Use on-demand checker:
   ```bash
   node scripts/rainforest-check-category.mjs "Footwear" "Sneakers"
   ```

---

## Files Created

- ✅ `scripts/001-add-vendor-tracking-columns.sql` - Database migration
- ✅ `scripts/rainforest-initial-import.mjs` - One-time product population (Phase 1: 5,000 target)
- ✅ `scripts/rainforest-check-category.mjs` - On-demand category checker
- ✅ `rainforest-weighting-analysis.json` - Category weighting data
- ✅ `RAINFOREST_IMPORT_PLAN.md` - This document

---

## Ready to Execute?

All scripts are prepared. Ready to:
1. Apply database migration
2. Run Phase 1 import (5,000 products, 50 credit budget)
3. Validate results before Phase 2
