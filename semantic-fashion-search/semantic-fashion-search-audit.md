# Semantic Fashion Search — Code Audit & Action Plan
**Prepared by HOPE | 2026-02-07**
**For: Scot Robnett | READ-ONLY — No commits or pushes**

---

## Executive Summary

I've read every critical file in your repo. You've built a surprisingly solid foundation — the architecture is sound, the intent extraction prompt is well-crafted, and you've already identified and documented most of your own issues (SEARCH-DIAGNOSIS.md is excellent). The problems are fixable and mostly fall into **three buckets**: data quality, vector search configuration, and search pipeline bottlenecks.

Here's the honest breakdown.

---

## 🔥 Critical Issue #1: Search Result Accuracy

### What's Actually Happening

Your search pipeline has **7 stages** — and that's actually well-designed:
1. Intent extraction (Claude Haiku) → structured query with color, price, category
2. Embedding generation (OpenAI `text-embedding-3-small`)
3. Vector similarity search via Supabase `match_products` RPC
4. Quality filtering (similarity thresholds, content filters, price floors)
5. Color filtering (text-based + AI-verified colors)
6. Category filtering (semantic term matching)
7. Optional vision reranking (GPT-4o, currently **disabled**)

### Root Causes of Inaccuracy

**Problem A: Embedding column data type mismatch (P0 — you already know this)**
Your own `SEARCH-DIAGNOSIS.md` nails it: embeddings stored as TEXT produce **negative similarity scores**. The `match_products` function uses `<=>` (cosine distance), which requires `vector(1536)` type. If this hasn't been fixed yet, **nothing else matters until it is.**

**Fix:** Run the migration in your `SEARCH-DIAGNOSIS.md` Option 1. Convert TEXT → `vector(1536)`, create the ivfflat index, update the function.

**Problem B: Color matching relies on text, not visual reality**
`productMatchesColor()` checks title + description text for color words. Many product listings say "multi-color" or don't mention the actual color. Your `verifiedColors` field (AI-verified from image analysis) is the right approach, but it's only populated for products that have been through the vision pipeline.

**Fix:** Prioritize backfilling `verifiedColors` for ALL products. You have `scripts/add-verified-colors.mjs` — run it broadly. Until then, color filtering will always be unreliable for products without verified colors.

**Problem C: Intent extraction uses Claude Haiku — it's fast but imprecise**
The `extractIntent()` function calls `claude-3-haiku-20240307`. Haiku is great for speed, but for nuanced fashion intent parsing (distinguishing "cocktail dress" from "casual dress" or understanding "faux gator belt with silver hardware"), you'd get significantly better results with Sonnet 3.5 or even Haiku 3.5.

**Fix:** Upgrade to `claude-3-5-haiku-20241022` or `claude-3-5-sonnet-20241022`. The cost difference is negligible for the quality jump. The intent extraction prompt itself is solid — the model just needs to be smarter.

**Problem D: `isSimpleQuery()` always returns false**
You commented it to "always use full GPT-4 intent extraction" — but it's actually calling Claude, not GPT-4. Every single query, even "sneakers," goes through the full Claude API call. This is why non-cached queries are slow.

**Fix:** Re-enable `isSimpleQuery()` for basic 1-2 word queries. For "black dress" or "sneakers," you don't need Claude to parse intent — direct embedding search with keyword-based color/category extraction is faster and equally accurate.

**Problem E: The `match_products` RPC doesn't return `verified_colors` or `on_sale`**
Your schema SQL shows `match_products` returns specific columns, but **doesn't include `verified_colors` or `on_sale`**. Yet the code in `executeMultiSearch` tries to use `row.verified_colors` and `row.on_sale`. These will always be `undefined`.

**Fix:** Update your `match_products` function to include these columns:
```sql
CREATE OR REPLACE FUNCTION public.match_products(...)
RETURNS TABLE (
  ...existing columns...,
  verified_colors text[],
  on_sale boolean,
  similarity float
)
```

---

## 🔥 Critical Issue #2: Non-Cached Search Speed

### Why It's Slow

Each non-cached search does **all of this serially**:
1. Claude API call for intent extraction (~1-2s)
2. OpenAI embeddings API call (~0.5-1s)
3. Supabase vector search RPC (~0.5-2s, depends on index)
4. Quality/color/category filtering (fast, in-memory)
5. Optional: Vision reranking with GPT-4o (~3-8s for 12 products, **disabled**)
6. Redis cache write (~0.1s)

**Total without vision: ~2-5 seconds. With vision: ~5-13 seconds.**

### Speed Fixes (in priority order)

1. **Re-enable `isSimpleQuery()`** for basic queries — skip the Claude call entirely for common searches. Saves 1-2s.

2. **Parallelize steps 1 and 2.** Intent extraction and embedding generation are independent — run them concurrently with `Promise.all()`. Saves ~1s.

3. **Ensure the vector index exists.** Your schema comments say "skipping index creation to avoid memory issues." If you're on a paid Supabase plan, create the ivfflat index. Without it, every search is a sequential scan of 20K+ products.

4. **Reduce `initialFetchSize` for simple queries.** You fetch 100 results for everything. For "black dress," 50 is plenty. For complex multi-category queries, keep 100.

5. **Don't re-enable vision reranking as-is.** It makes 4 GPT-4o API calls per search (batches of 3). That's $$$$ and slow. If you want visual reranking, pre-compute it during product ingestion, not at query time.

---

## 🔥 Issue #3: Row-Level Security (RLS)

Your `supabase-schema.sql` already has RLS enabled with the right policies:
```sql
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow service role full access" ON public.products FOR ALL USING (auth.role() = 'service_role');
```

**If you're seeing RLS warnings**, it likely means:
- These policies haven't been applied to your actual Supabase instance yet
- Or other tables (users, feedback, ratings, search_settings) don't have RLS enabled

**Fix:** Run the schema SQL against your live Supabase instance. Also enable RLS on all other tables and add appropriate policies. For user-specific tables (ratings, feedback), add policies that restrict access to the user's own data.

---

## 💡 Architectural Observations

### What's Good
- **Tiered quality thresholds** — requiring higher similarity for top results is smart
- **Color variation mapping** — handling synonyms like "navy" → "blue" is correct
- **Category match types** (exact/partial/none) — good for multi-item queries
- **Content filtering** (men's, non-apparel, sexy content) — necessary for a fashion site
- **Deduplication logic** — content-based fingerprinting is the right approach
- **The overall pipeline design** — intent → search → filter → rank is industry-standard

### What Needs Work
- **No product description enrichment.** Embeddings are generated from raw product titles/descriptions. Many affiliate product feeds have terrible descriptions. Consider enriching them with structured attributes (color, material, occasion, style) using an LLM during ingestion.
- **No query rewriting.** "Show me all the faux gator belts with silver hardware" should be rewritten to something the embedding model understands better, like "crocodile embossed leather belt silver buckle hardware."
- **No fallback search.** If semantic search returns 0 results, there's no keyword/full-text fallback. Add a PostgreSQL full-text search as a safety net.
- **DHGate quality issues.** You have 12,612 DHGate tech products mixed with 7,446 fashion products. Consider a one-time cleanup to remove non-fashion products entirely, not just filter them at query time.

---

## 📋 Recommended Action Plan (Priority Order)

### Week 1: Fix the Foundation
1. ✅ Fix embedding column type (TEXT → vector(1536)) — `SEARCH-DIAGNOSIS.md` Option 1
2. ✅ Update `match_products` to return `verified_colors` and `on_sale`
3. ✅ Create ivfflat index on embeddings (if Supabase plan allows)
4. ✅ Apply RLS policies to all tables
5. ✅ Remove non-fashion products from DB (DHGate tech junk)

### Week 2: Improve Accuracy
6. Upgrade Claude Haiku → Claude 3.5 Haiku or Sonnet for intent extraction
7. Re-enable `isSimpleQuery()` for 1-2 word queries
8. Backfill `verifiedColors` for all products using vision pipeline
9. Add query rewriting step between intent extraction and embedding generation
10. Enrich product descriptions during ingestion (structured attributes)

### Week 3: Improve Speed
11. Parallelize intent extraction + embedding generation
12. Add full-text search fallback for zero-result queries
13. Implement query normalization for better cache hit rates
14. Consider pre-computing category/color tags during product sync

### Ongoing
15. Monitor search quality metrics (avg similarity, zero-result rate)
16. Expand product catalog with quality affiliate sources
17. A/B test different embedding models (text-embedding-3-large vs small)

---

## 🛠️ Prompts for Claude Code

When working with Claude Code on these fixes, use prompts like:

**For the embedding fix:**
> "In our Supabase database, the `embedding` column on the `products` table is currently stored as TEXT but needs to be vector(1536). Write a migration SQL script that: (1) adds a new vector(1536) column, (2) converts existing text embeddings to vector type, (3) creates an ivfflat index using cosine distance, (4) drops the old column, (5) renames the new column. Include error handling and a rollback script."

**For improving search speed:**
> "In lib/search.ts, the `semanticSearch` function calls `extractIntent()` and then `generateEmbeddings()` serially. Refactor to run intent extraction and embedding generation in parallel using Promise.all, since they're independent. Also re-enable `isSimpleQuery()` in lib/intent.ts for queries with 3 or fewer words — for these, skip the Claude API call entirely and use direct keyword-based category/color detection."

**For the PRD (already written — see PRD.md):**
> "Read PRD.md in the project root. This defines the product vision and technical requirements. Use it as your north star for all implementation decisions."

---

## Cost Impact Assessment

| Change | Monthly Cost Impact |
|--------|-------------------|
| Upgrade Haiku → Sonnet for intent | +$2-5/mo (depends on query volume) |
| Backfill verified colors (one-time) | ~$5-15 one-time (GPT-4o vision calls) |
| Remove DHGate cleanup | $0 (one-time SQL) |
| ivfflat index | $0 (Supabase feature) |
| Parallelize API calls | $0 (code change only) |
| **Total additional monthly** | **~$2-5/mo** |

Well within your $50/mo budget.

---

*This audit is based on a full read of: lib/search.ts, lib/intent.ts, lib/embeddings.ts, lib/vision-reranking.ts, lib/vision-embeddings-api.ts, lib/deduplication.ts, lib/supabase.ts, app/api/search/route.ts, types/index.ts, .env.example, supabase-schema.sql, SEARCH-DIAGNOSIS.md, package.json, and the full project file listing.*
