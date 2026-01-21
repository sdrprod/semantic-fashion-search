# Product Quality Filtering System

## Overview

The quality filtering system ensures only high-quality fashion products are synced to the database, providing the best user experience for semantic search.

## Quality Score (0-7 points)

Products are assessed across multiple dimensions:

### Scoring Breakdown

1. **Has Description** (1 point)
   - Description exists, is not null, and is not the string "null"

2. **Description Quality** (up to 2 more points)
   - +1 point: Description > 50 characters
   - +1 point: Description > 150 characters

3. **Has Valid Price** (1 point)
   - Price exists and is greater than 0

4. **Reasonable Price** (1 point)
   - Price is between $5 and $500 (fashion product range)

5. **Has Brand** (1 point)
   - Brand exists, is not "Unknown", and is not empty

6. **Is Fashion Product** (1 point)
   - Name, description, or category contains fashion keywords
   - Keywords include: dress, shoes, bag, jewelry, clothing, etc.

### Quality Thresholds

- **Score 0-3**: Low quality - Missing critical data, poor descriptions
- **Score 4**: Medium quality - USD + description + price + (fashion OR brand)
- **Score 5**: High quality - Medium + good description (50+ chars) OR reasonable price
- **Score 6**: Premium quality - High + detailed description (150+ chars) + brand
- **Score 7**: Perfect - All quality criteria met

## DHgate Campaign Analysis

Based on testing 600 products across 6 DHgate campaigns:

### Good Campaigns (100% USD)

| Campaign | Products | USD | Fashion | High Quality (≥5) | Premium (≥6) |
|----------|----------|-----|---------|-------------------|--------------|
| 7186     | ~87,000  | 100% | 94%     | **75%**           | **66%**      |
| 7184     | ~84,000  | 100% | 97%     | **55%**           | **33%**      |
| 7187     | ~87,000  | 100% | 99%     | **49%**           | **37%**      |
| 7183     | ~85,000  | 100% | 50%     | **32%**           | **20%**      |

### Bad Campaigns (Non-USD)

| Campaign | Status |
|----------|--------|
| 11923    | 0% USD - Skip |
| 16350    | 0% USD - Skip |

## Projections

From 395,752 total DHgate products:

- **Basic valid (USD + fields)**: ~321,750 products
- **Has description**: ~241,312 products
- **Fashion items**: ~273,487 products
- **Medium quality (≥4)**: ~213,159 products
- **High quality (≥5)**: **~169,723 products** ⭐
- **Premium quality (≥6)**: ~125,482 products

## Usage

### API Endpoint

```bash
POST /api/admin/sync-products
Content-Type: application/json
x-admin-secret: <admin-secret>

{
  "source": "impact",
  "campaignId": "7186",
  "maxProducts": 1000,
  "generateEmbeddings": false,
  "minQualityScore": 5
}
```

### PowerShell Scripts

#### Test Quality Filtering
```powershell
# Test with small batch to verify filtering works
.\scripts\test-quality-sync.ps1
```

#### Bulk Sync High-Quality Products
```powershell
# Sync 1000 products per campaign (default: minQualityScore=5)
.\scripts\bulk-sync-high-quality.ps1

# Sync 2000 products per campaign with premium quality
.\scripts\bulk-sync-high-quality.ps1 -ProductsPerCampaign 2000 -MinQualityScore 6

# Sync and generate embeddings (slower but complete)
.\scripts\bulk-sync-high-quality.ps1 -GenerateEmbeddings
```

## Recommendations

### For MVP Launch

**Recommended Setting**: `minQualityScore = 5` (HIGH quality)

- **Pros**:
  - Best balance of quality and quantity
  - ~169,723 products available
  - Ensures descriptions for semantic search
  - Filters out junk products
  - Reasonable price validation

- **Expected Results**:
  - 1,000 products/campaign = ~2,110 products total (4 campaigns)
  - 2,000 products/campaign = ~4,220 products total
  - 5,000 products/campaign = ~10,550 products total

### For Premium Experience

**Alternative Setting**: `minQualityScore = 6` (PREMIUM quality)

- **Pros**:
  - Highest quality products only
  - Detailed descriptions (150+ chars)
  - Branded products
  - Best search relevance

- **Cons**:
  - Smaller inventory (~125,482 available)
  - May miss some good products

- **Expected Results**:
  - 1,000 products/campaign = ~1,560 products total
  - 2,000 products/campaign = ~3,120 products total

## Quality vs Quantity Trade-off

| Min Score | Quality Level | Products Available | Search Quality | Inventory Size |
|-----------|---------------|-------------------|----------------|----------------|
| 3         | Basic         | ~241,000          | ⭐⭐          | ⭐⭐⭐⭐⭐     |
| 4         | Medium        | ~213,000          | ⭐⭐⭐        | ⭐⭐⭐⭐      |
| **5**     | **High**      | **~169,000**      | **⭐⭐⭐⭐**  | **⭐⭐⭐⭐**   |
| 6         | Premium       | ~125,000          | ⭐⭐⭐⭐⭐    | ⭐⭐⭐        |
| 7         | Perfect       | ~50,000           | ⭐⭐⭐⭐⭐    | ⭐⭐          |

## Implementation Details

### Code Location

- **Quality Assessment**: `lib/impact.ts` lines 244-312
  - `isFashionProduct()` - Checks for fashion keywords
  - `assessProductQuality()` - Calculates 0-7 quality score

- **Filtering**: `lib/impact.ts` lines 343-376
  - Applied before product transformation
  - Detailed logging of filtered products

- **API Integration**: `app/api/admin/sync-products/route.ts`
  - Accepts `minQualityScore` parameter (default: 5)

### Logging

During sync, you'll see logs like:
```
Page 1 filtering: 75/100 passed (skipped: 0 missing fields, 0 non-USD, 25 low quality)
```

This shows:
- 75 products met quality threshold
- 25 products filtered out for low quality
- 0 products missing required fields
- 0 products with non-USD currency

## Next Steps

1. **Test quality filtering**:
   ```powershell
   .\scripts\test-quality-sync.ps1
   ```

2. **Bulk sync high-quality products**:
   ```powershell
   .\scripts\bulk-sync-high-quality.ps1 -ProductsPerCampaign 1000
   ```

3. **Generate embeddings** (required for search):
   ```powershell
   # After sync completes
   .\scripts\generate-missing-embeddings.ps1
   ```

4. **Test search quality** with expanded catalog

5. **Deploy to Netlify** when ready

## FAQs

### Why score 5 (HIGH) as default?

- Ensures products have meaningful descriptions for semantic search
- Filters out low-quality listings without descriptions
- Validates price is reasonable ($5-$500)
- Largest available inventory (~169K products)
- Best balance for MVP launch

### Can I change quality threshold later?

Yes! You can:
- Re-sync with different `minQualityScore`
- Clear database and start fresh
- Mix quality levels by syncing different campaigns with different thresholds

### What about non-DHgate products?

Premium campaigns (Cloudfield, Asebbo, etc.) are filtered separately:
- Cloudfield: Filtered out (EUR/GBP, not USD)
- Other campaigns: Need individual testing
- Can add quality threshold to any campaign

### Why filter fashion keywords?

Some DHgate campaigns include:
- Home goods (thermoses, cups)
- Crafts (diamond painting kits)
- Electronics
- Other non-fashion items

Fashion keyword filtering ensures only relevant products appear in fashion search.
