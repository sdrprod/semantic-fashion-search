# Embedding Data Type Migration Guide

## Problem Statement

**Issue:** The `embedding` column in the `products` table is stored as `TEXT` instead of `vector(1536)`, causing:
- ❌ Negative similarity scores (-0.34 to -0.36)
- ❌ Search returns 0 results despite 20,058 products with embeddings
- ❌ PostgreSQL cannot use vector indexes properly
- ❌ Slow sequential scans instead of optimized vector search

**Solution:** Convert the `TEXT` column to `vector(1536)` type and create proper indexes.

---

## Migration Overview

**Time Required:** 5-10 minutes
**Downtime:** None (new column created first, then swapped)
**Rollback:** Difficult after Step 4 (column drop) - verify carefully before proceeding
**Risk Level:** Medium (production database modification)

---

## Step-by-Step Instructions

### Prerequisites

1. ✅ Backup your database (optional but recommended)
2. ✅ Have access to Supabase SQL Editor
3. ✅ Read through ALL steps before starting

---

### STEP 1: Pre-Migration Validation

**Purpose:** Document the current state before making changes.

1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `scripts/01-pre-migration-check.sql`
4. Copy the entire SQL script
5. Paste into Supabase SQL Editor
6. Click **Run**

**Expected Results:**
- Column type: `text`
- ~20,058 products with embeddings
- Embeddings stored as strings like `"[0.026,0.15,...]"`

**Action:** Take a screenshot or copy the results. You'll compare these after migration.

---

### STEP 2: Run the Migration

**⚠️ CRITICAL:** Read each section of the migration script carefully. The script is designed to run all at once, but understand what each step does.

1. In Supabase SQL Editor, open a **new query tab**
2. Open the file: `scripts/02-migration-text-to-vector.sql`
3. Copy the **entire SQL script**
4. Paste into Supabase SQL Editor
5. **REVIEW THE SCRIPT** - make sure you understand what it does:
   - Creates new `embedding_vector` column (vector type)
   - Converts TEXT → vector data
   - Creates ivfflat index for fast search
   - Drops old TEXT column
   - Renames new column to `embedding`
   - Updates `match_products` function

6. Click **Run**
7. **Monitor the execution** - you should see multiple success messages
8. Look for any **ERROR** messages (red text)

**Expected Duration:** 30-60 seconds

**Success Indicators:**
- ✅ All commands execute without errors
- ✅ You see messages about table alterations
- ✅ Index creation completes
- ✅ Function is recreated

**If You See Errors:**
- 🛑 **STOP** - do NOT continue
- Copy the error message
- Check if the error is about missing pgvector extension
  - If so: Run `CREATE EXTENSION IF NOT EXISTS vector;` first
- If other errors: Contact support or review the error carefully

---

### STEP 3: Post-Migration Validation (SQL)

**Purpose:** Verify the migration completed successfully at the database level.

1. In Supabase SQL Editor, open a **new query tab**
2. Open the file: `scripts/03-post-migration-check.sql`
3. Copy the entire SQL script
4. Paste into Supabase SQL Editor
5. Click **Run**

**Expected Results:**

| Check | Expected Value | Status |
|-------|---------------|--------|
| Column type | `USER-DEFINED` (vector) | ✅ |
| Products with embeddings | ~20,058 (same as before) | ✅ |
| Vector dimensions | 1536 | ✅ |
| Index exists | `products_embedding_vector_idx` | ✅ |
| Similarity scores | 0.0 to 1.0 (POSITIVE) | ✅ |
| Query plan | Uses index (not seq scan) | ✅ |
| Execution time | < 100ms | ✅ |

**⚠️ Critical Checks:**
1. **Column type MUST be `USER-DEFINED`** not `text`
2. **Same number of products** with embeddings as before
3. **Similarity scores MUST be positive** (0.0 to 1.0, NOT negative)
4. **Index exists** and is being used

**If Any Check Fails:**
- 🛑 **STOP** - the migration did not complete successfully
- Review the migration script output for errors
- Check the specific failing check and investigate

---

### STEP 4: Application-Level Testing

**Purpose:** Verify search works correctly from the application.

1. Open your terminal
2. Navigate to the project root directory:
   ```bash
   cd C:\Users\Owner\.claude\projects\semantic-fashion-search
   ```

3. Install dependencies (if not already done):
   ```bash
   npm install @supabase/supabase-js openai dotenv
   ```

4. Run the test script:
   ```bash
   node scripts/04-test-search-after-migration.mjs
   ```

**Expected Output:**

```
🔍 Testing search: "black dress"
=================================================================

📊 Step 1: Generating embedding...
   ✅ Embedding generated (234ms)
   📏 Dimensions: 1536

🔎 Step 2: Calling match_products RPC...
   ✅ RPC completed (89ms)
   📦 Returned 50 products

📈 Step 3: Analyzing results...
   Similarity scores:
      Max: 0.7234 ✅
      Min: 0.4156 ✅
      Avg: 0.5891
   Products above threshold (0.3): 48/50 ✅
   Fashion products: 45/50 ✅
   DHGate products: 5/50 ✅

✅ ALL CHECKS PASSED!
```

**Critical Indicators of SUCCESS:**
- ✅ Similarity scores are **POSITIVE** (0.0 to 1.0)
- ✅ RPC completes in < 500ms (should be ~50-150ms with index)
- ✅ Fashion products appear in results
- ✅ Not all results are DHGate products
- ✅ Multiple products above threshold (0.3)

**Indicators of FAILURE:**
- ❌ Negative similarity scores (still broken)
- ❌ RPC takes > 2 seconds (index not working)
- ❌ 0 results returned
- ❌ All DHGate products in results

---

### STEP 5: Test in Browser (Optional but Recommended)

1. Start your development server:
   ```bash
   cd semantic-fashion-search
   npm run dev
   ```

2. Open browser to `http://localhost:3000`

3. Test searches:
   - "black dress"
   - "red heels"
   - "summer outfit"

**Expected Results:**
- ✅ Search returns results in < 2 seconds
- ✅ Results are relevant fashion products
- ✅ No console errors
- ✅ Pagination works

---

## Troubleshooting

### Issue: "extension 'vector' does not exist"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
Then re-run the migration script.

---

### Issue: Negative similarity scores persist

**Possible Causes:**
1. Migration script didn't complete all steps
2. `match_products` function wasn't updated
3. Application is caching old results

**Solutions:**
1. Re-run post-migration validation (Step 3)
2. Verify column type is `USER-DEFINED` not `text`
3. Check function signature:
   ```sql
   SELECT routine_name, data_type
   FROM information_schema.parameters
   WHERE specific_schema = 'public'
     AND specific_name LIKE '%match_products%'
     AND parameter_name = 'query_embedding';
   ```
   Should show `USER-DEFINED` type.
4. Clear application cache/restart server

---

### Issue: "RPC error: no rows returned"

**Possible Causes:**
1. Function parameters don't match
2. All products filtered out

**Solutions:**
1. Verify function was recreated:
   ```sql
   SELECT routine_definition
   FROM information_schema.routines
   WHERE routine_name = 'match_products';
   ```
2. Check if embeddings exist:
   ```sql
   SELECT COUNT(*) FROM products WHERE embedding IS NOT NULL;
   ```

---

### Issue: Slow search performance (>2 seconds)

**Possible Causes:**
1. Index not created
2. Index not being used (sequential scan)
3. Index needs to be rebuilt

**Solutions:**
1. Verify index exists:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'products' AND indexname = 'products_embedding_vector_idx';
   ```
2. Check query plan:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM match_products(array_fill(0, ARRAY[1536])::vector(1536), 20);
   ```
   Should show "Index Scan using products_embedding_vector_idx"
3. Rebuild index:
   ```sql
   REINDEX INDEX products_embedding_vector_idx;
   ```

---

## Validation Checklist

After completing the migration, verify ALL items below:

- [ ] **Database Level**
  - [ ] Column type is `vector(1536)` (shows as USER-DEFINED)
  - [ ] All 20,058+ products still have embeddings
  - [ ] ivfflat index exists and is being used
  - [ ] Sample queries return positive similarity scores (0.0 to 1.0)
  - [ ] Query execution time < 100ms

- [ ] **Application Level**
  - [ ] Test script passes all checks
  - [ ] Search returns results for "black dress"
  - [ ] Similarity scores are positive
  - [ ] Fashion products appear in top results
  - [ ] RPC calls complete in < 500ms

- [ ] **User Experience**
  - [ ] Search works in browser
  - [ ] Results are relevant
  - [ ] Page loads in < 2 seconds
  - [ ] No console errors

---

## Success Criteria

✅ **Migration is successful when:**

1. Column type = `vector(1536)` ✅
2. Same number of products with embeddings ✅
3. Similarity scores: 0.0 to 1.0 (positive) ✅
4. Search returns relevant fashion products ✅
5. Query performance < 100ms ✅
6. Application search works in < 2 seconds ✅

---

## Post-Migration

After successful migration:

1. ✅ Monitor search performance for 24 hours
2. ✅ Check error logs for any RPC failures
3. ✅ User test various search queries
4. ✅ Verify cached searches are refreshed (TTL = 1 hour)

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/01-pre-migration-check.sql` | Validate current state |
| `scripts/02-migration-text-to-vector.sql` | **Main migration script** |
| `scripts/03-post-migration-check.sql` | Validate migration success |
| `scripts/04-test-search-after-migration.mjs` | Application-level testing |
| `semantic-fashion-search/SEARCH-DIAGNOSIS.md` | Original problem diagnosis |

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review error messages carefully
3. Verify each validation step completed successfully
4. Check Supabase logs for detailed error messages

---

## Notes

- **No rollback after Step 4** (column drop) - validate carefully before proceeding
- **Downtime:** Minimal (new column created alongside old, then swapped)
- **Performance:** Should improve dramatically with vector index
- **Data Safety:** No data loss expected (conversion, not deletion)

---

**Good luck with the migration! 🚀**
