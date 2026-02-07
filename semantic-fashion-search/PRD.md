# Product Requirements Document: Semantic Fashion Search
## "Vibe Commerce" for Apparel
**Version 1.0 | 2026-02-07 | Prepared by HOPE for Scot Robnett**

---

## 1. Vision Statement

Semantic Fashion Search is a **conversational shopping experience** for apparel, shoes, jewelry, and accessories. Instead of traditional e-commerce filters (size dropdowns, color checkboxes, price sliders), users describe what they want in natural language — and an AI assistant interprets their intent, curates matching products, and explains why each recommendation works.

**This is "vibe commerce"**: shopping by describing a feeling, occasion, or aesthetic rather than clicking through rigid category trees.

### The Core Differentiator
The user types:
> "I need a mid-length black dress for a formal event. I don't want to spend more than $200 on the dress, and I need you to find me some options for matching shoes and a clutch."

The system:
1. **Understands** the full intent — occasion (formal), item (mid-length black dress), budget ($200 max), complementary items (shoes + clutch)
2. **Confirms understanding** back to the user in a warm, conversational tone
3. **Returns curated results** — black dresses first (sorted by relevance), then matching shoes and clutches
4. **Explains the reasoning** — "I found this A-line midi dress in black crepe — it's formal enough for a gala but the drape keeps it comfortable. I paired it with these pointed-toe pumps because the heel height complements the dress length."

**No other fashion e-commerce site does this well.** That's the opportunity.

---

## 2. Target User

**Primary:** Women ages 25-45 who shop online for apparel and accessories. They know what they want aesthetically but struggle to translate that vision into search filters. They'd rather describe the vibe than click through 47 subcategories.

**Secondary:** Gift shoppers who can describe the recipient's style but don't know specific brands or products.

**Anti-persona:** Bargain hunters who want the cheapest possible item regardless of style. Price-only shoppers are better served by traditional comparison sites.

---

## 3. Core Features (MVP)

### 3.1 Natural Language Search (P0 — THE feature)
- User enters a free-text query describing what they want
- System extracts: item type, color, occasion, style, budget, complementary items
- System returns relevant products with similarity scoring
- System provides a conversational explanation of results

**Acceptance Criteria:**
- "Black dress" returns ONLY black dresses in the first page of results
- "Red heels under $100" returns red heels priced under $100
- Multi-item queries ("dress and matching shoes") return grouped results by category
- Zero-result queries show a helpful message, not a blank page

### 3.2 Visual Search (P1)
- User uploads an image of a fashion item they like
- System finds visually similar products in the catalog
- Combined with text refinement ("like this but in blue")

**Acceptance Criteria:**
- Upload an image of a red dress → results show similar red dresses
- Upload + text refinement works ("like this but longer")

### 3.3 Conversational Feedback Loop (P1)
- After showing results, user can refine: "Show me more like #3 but cheaper"
- System remembers context within the session
- Iterative refinement narrows results

### 3.4 Affiliate Product Catalog (P1)
- Products sourced from affiliate networks (CJ, Impact, Amazon)
- Affiliate links generate revenue on click-through purchases
- Product data synced and deduplicated regularly

### 3.5 User Ratings & Personalization (P2)
- Users can rate products (1-5 stars)
- Low-rated products hidden from future results
- High-rated products boosted in ranking
- Community ratings influence results (51% rule)

### 3.6 Admin Dashboard (P2)
- View product stats, search analytics
- Configure quality filters, similarity thresholds
- Manage product sync and embeddings
- User management

---

## 4. Technical Architecture

### 4.1 Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 18 + TypeScript |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + pgvector) |
| ORM | Prisma |
| Search | OpenAI text-embedding-3-small + pgvector cosine similarity |
| Intent Parsing | Anthropic Claude (Haiku/Sonnet) |
| Vision | OpenAI GPT-4o (image analysis) |
| Caching | Upstash Redis |
| Auth | NextAuth with email verification |
| Email | Resend |
| Deployment | Netlify |
| Affiliate APIs | CJ Affiliate, Impact Radius |

### 4.2 Search Pipeline (Critical Path)

```
User Query
    ↓
Intent Extraction (Claude) → ParsedIntent {color, category, price, occasion, style}
    ↓
Embedding Generation (OpenAI) → vector(1536)
    ↓
Vector Similarity Search (Supabase pgvector) → raw candidates
    ↓
Quality Filtering (similarity threshold, content filters, price floor)
    ↓
Color Filtering (verified colors > text-based fallback)
    ↓
Category Filtering (exact > partial > none)
    ↓
Price Range Filtering
    ↓
[Optional] Vision Reranking (GPT-4o image analysis)
    ↓
Rating-Based Filtering & Boosting (personal + community)
    ↓
Category Grouping (for multi-item queries)
    ↓
Pagination → Response with explanation
```

### 4.3 Data Model (Key Tables)

**products** — Core product catalog
- id, brand, title, description, tags, price, currency
- image_url, product_url
- embedding (vector(1536)) — text semantic embedding
- image_embedding (vector) — vision embedding (optional)
- verified_colors (text[]) — AI-verified actual product colors
- affiliate_network, merchant_id, merchant_name
- on_sale (boolean)
- content_hash — deduplication fingerprint

**search_settings** — Admin-configurable quality filters
**users** — Auth and profile data
**ratings** — User product ratings (1-5 stars)
**feedback** — Search quality feedback
**email_subscribers** — Newsletter signups

### 4.4 Key Algorithms

**Similarity Scoring:** Cosine similarity via pgvector `<=>` operator. Threshold: 0.3 base, tiered up to 0.55 for top results.

**Color Matching:** Two-phase: (1) Check AI-verified colors if available, (2) Fall back to text-based matching with synonym expansion.

**Category Matching:** Three-tier: exact (product IS the category), partial (product includes the category in a set), none (unrelated).

**Deduplication:** Content-based fingerprinting using normalized title + brand + price bucket.

---

## 5. Quality Requirements

### 5.1 Search Accuracy (Non-negotiable)
- Color queries MUST return color-matching products first
- Category queries MUST return category-matching products
- Price-constrained queries MUST respect the budget
- Top 3 results should have >0.5 similarity score
- Zero false-category results in top 6

### 5.2 Performance
- Cached queries: <500ms response time
- Non-cached queries: <3s response time (target: <2s)
- Page load: <2s initial, <1s subsequent

### 5.3 Data Quality
- No non-fashion products in results (home goods, electronics, raw fabric)
- No men's products unless explicitly requested
- No duplicate products across affiliate networks
- Product images must be valid and load correctly
- Prices must be current and in USD

---

## 6. Revenue Model

- **Affiliate commissions** from product click-throughs and purchases
- **Future:** Premium features (saved outfits, style profiles, personal shopper mode)
- **Future:** Sponsored product placements (clearly labeled)

---

## 7. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Search relevance | >80% of top-6 results match intent | Manual audit + user feedback |
| Zero-result rate | <5% of queries | Log analysis |
| Average similarity score | >0.45 for top results | Log analysis |
| Click-through rate | >15% on top-3 results | Analytics |
| Time to first result | <3s non-cached, <500ms cached | Performance monitoring |
| User return rate | >30% within 7 days | Analytics |

---

## 8. Known Limitations & Risks

1. **Small catalog** — Limited product selection means some queries will have no good matches. Mitigate with quality warnings and catalog expansion.
2. **Affiliate program acceptance** — New sites struggle to get approved. Mitigate by building traffic first, applying to programs with low barriers.
3. **API costs** — Each non-cached search costs ~$0.002-0.01 in API calls. Monitor and optimize.
4. **Embedding model limitations** — `text-embedding-3-small` may not capture nuanced fashion concepts. Consider upgrading to `text-embedding-3-large` if accuracy doesn't improve with other fixes.

---

## 9. Implementation Notes for AI Assistants

**If you are Claude Code, Cursor, or any AI coding assistant reading this document:**

- The PRIMARY value of this app is **search accuracy**. Every decision should prioritize returning the RIGHT products for the user's query.
- The SECONDARY value is **conversational UX**. The explanation of results matters as much as the results themselves.
- Do NOT optimize for features over accuracy. A simple search that returns perfect results beats a complex search that returns wrong results.
- When in doubt about a search algorithm change, test with these queries:
  - "black dress" → should return ONLY black dresses
  - "red heels under $100" → should return red heels under $100
  - "casual summer outfit" → should return appropriate items grouped logically
  - "faux gator belt with silver hardware" → should return crocodile/alligator-print belts with silver buckles/hardware, or a quality warning if none exist
- The embedding column MUST be `vector(1536)` type, not TEXT. If it's TEXT, fix that FIRST before doing anything else.
- Color matching should ALWAYS prefer `verified_colors` (AI-verified from image) over text-based matching.

---

*This PRD is a living document. Update it as the product evolves.*
