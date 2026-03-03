# ATLAZ Fashion Search — Admin Guide

This guide is for users with **Editor** or **Admin** roles. It covers every administrative function available in the ATLAZ system — from the dashboard and search settings to product management, sync pipelines, and diagnostics. If you are a shopper or general user, see the separate **User Guide**.

---

## Roles and Access Levels

ATLAZ uses three roles. Each role inherits the capabilities of the roles below it.

| Role | Dashboard | Search Settings | Content & Subscribers | Products | Users |
|---|---|---|---|---|---|
| Viewer | Read only | No | No | No | No |
| Editor | Yes | Yes | Yes | No | No |
| Admin | Yes | Yes | Yes | Yes | Yes |

- **Viewer** — Can see the dashboard stats but cannot change any settings or manage products. Viewers who attempt to access the admin area are redirected to the homepage with an authorization error.
- **Editor** — Can view and modify search settings, manage content, and view subscriber lists. Cannot manage individual products or user accounts.
- **Admin** — Full access to all features, including moving/deleting products, managing users, and triggering product syncs.

Roles are assigned in the database (users table, `role` column). There is no self-service role upgrade.

> **Beyond Original Scope — Role-Based Access Control (RBAC)**
> A basic admin panel only needs a single "admin" flag. ATLAZ implements a three-tier RBAC system with per-route access checks on both client and server, role-aware navigation, and granular feature gating. **Typical build cost: $4,000–$8,000.**

---

## Accessing the Admin Area

### URL and Login

The admin dashboard is located at **/admin**. Navigate there directly or sign in via **/login** — if your account has the Editor or Admin role, you will be automatically redirected to the dashboard after signing in.

**Sign-in methods:**

- **Google OAuth** — Click "Sign in with Google" on the login page.
- **Email / Password** — Click "Or sign in with email," then enter your credentials.

If you sign in with a non-admin account, you are redirected to the homepage with the message: "You do not have permission to access the admin area. Please contact an administrator if you need access."

**[Screenshot: The admin login page showing the Google sign-in button and the "Or sign in with email" link]**

---

### Admin Dashboard Overview

After signing in, the dashboard displays:

**Header area:**
- Page title: "Admin Dashboard"
- Your profile image (if Google OAuth), your name, your role, and a **Sign Out** button.

**Navigation bar:**
- **Dashboard** (all roles) — The stats page you are on.
- **Search Settings** (Editor and Admin) — Configure search behavior.
- **Content** (Editor and Admin) — Manage site content.
- **Subscribers** (Editor and Admin) — View email subscribers.
- **Products** (Admin only) — Product management.
- **Users** (Admin only) — User management.

**Stats cards:**
- **Total Products** — The number of products in the database.
- **Total Searches** — The number of searches performed by all users.
- **Email Subscribers** — The number of email newsletter sign-ups.

**Quick Actions section (Admin only):**
- **Sync Products from Impact** — Clicking this button prompts for your admin secret, then triggers a product sync from the Impact affiliate network (100 products by default). A browser alert shows the result.
- **View Site** — Opens the ATLAZ homepage.

**[Screenshot: The admin dashboard showing the three stats cards (Total Products, Total Searches, Email Subscribers), the navigation bar with all links, and the Quick Actions section with the Sync and View Site buttons]**

---

## Managing Products on the Site (Admin Only)

Product management in ATLAZ happens in two places: on the public site (via admin controls on product cards) and through API endpoints (for bulk operations).

### Finding a Product to Manage

Use the main site as a regular user — search for products or browse categories. When you are signed in with an Admin account, every product card in the results grid displays an admin control panel.

### The Admin Panel on Product Cards

At the bottom of each product card, a small **Admin** button appears (visible only to Admin-role users). Click it to expand the admin panel for that card.

**[Screenshot: A product card with the admin panel expanded, showing the category dropdown set to "dresses", the "Move" button, and the "Delete Product" link below]**

The admin panel contains:

1. **Category dropdown** — Shows the product's current category, pre-selected. The dropdown always includes 23 canonical categories (see reference table below) plus any additional categories found in the database. If the dropdown is still loading, it shows "Loading..."
2. **Move button** — Reassigns the product to the selected category. While saving, the button reads "Saving..." After success, it reads "Saved" and the card disappears from the current view after a brief pause. On error, it reads "Error - retry."
3. **Delete Product link** — A red text link. Clicking it reveals a two-step confirmation.

### Moving a Product to a Different Category

1. Click **Admin** on the product card to expand the panel.
2. Select the target category from the dropdown.
3. Click **Move**.
4. The button shows "Saving..." then "Saved" with a checkmark.
5. After approximately one second, the card disappears from the current results view (the product still exists in the database under its new category).

**Important note about browse results:** Category browse (clicking a category in the navigation) uses full-text search on the product **title**, not the `category` database column. Moving a product's category changes the database field but does not change what browse results it appears in. If a product is fundamentally wrong for a category (e.g., a handbag showing up in Tops & Blouses because "top" appears in "top-handle"), use **Delete** to permanently remove it, or adjust the product title if possible.

### Deleting a Product

1. Click **Admin** on the product card.
2. Click the red **Delete Product** link.
3. A warning appears: "Are you sure? This cannot be undone."
4. Click **Yes, delete** to confirm, or **Cancel** to back out.
5. On success, the card is immediately removed from the results view and the product is permanently deleted from the database.

**Deletion is irreversible.** The product, its embeddings, and all associated data are removed.

### Canonical Category Reference

The following 23 categories are always available in the admin dropdown, even if no products currently carry that category value:

| | | | |
|---|---|---|---|
| activewear | belts | boots | dresses |
| earrings | flats | handbags | hats |
| heels | jewelry | jumpsuits | necklaces |
| outerwear | pants | rings | sandals |
| scarves | skirts | sneakers | sunglasses |
| swimwear | tops | watches | |

---

## Search Settings (/admin/settings)

The Search Settings page is accessible to Editor and Admin roles. All changes take effect immediately after clicking **Save Settings**. A success or error message appears at the top of the page.

**[Screenshot: The Search Settings page header with "Search Settings" title and a "Back to Dashboard" button]**

---

### Search Mode

Three radio buttons control how the search engine combines semantic (vector) matching with exact text matching.

| Mode | Behavior |
|---|---|
| **Auto** (recommended) | Analyzes each query individually. Brand names and short queries get more text weight; descriptive style queries get more semantic weight. The slider value sets the default starting point that Auto adjusts from. |
| **Hybrid** | Applies the fixed slider split to every query regardless of content. Useful for testing and A/B comparisons. |
| **Vector Only** | Disables full-text search entirely. All matching is done by embedding similarity. Matches the original behavior before hybrid search was added. |

**[Screenshot: The Search Mode section showing the three radio buttons (Auto selected with "Recommended" label, Hybrid with "Fixed split" label, Vector Only with "Previous behavior" label)]**

> **Beyond Original Scope — Adaptive Search Mode (Auto)**
> Standard hybrid search uses a fixed weight split. ATLAZ Auto mode dynamically analyzes each query for brand signals, attribute density, and query length, then adjusts the vector/text balance per-query. This requires an intent classification layer integrated into the search pipeline. **Typical build cost: $5,000–$10,000.**

---

### Search Weighting (Hybrid and Auto modes)

A horizontal slider controls the balance between semantic matching and exact text matching. This slider is disabled (grayed out) when Vector Only mode is selected.

- **Left end (0%)** — Pure semantic matching. Products are found by meaning similarity only.
- **Right end (100%)** — Pure text matching. Products are found by keyword overlap only.
- **Default** — 60% semantic, 40% text.

The current values are displayed below the slider: "Semantic 60%" on the left, "Text 40%" on the right.

In **Auto mode**, this slider sets the starting default. The AI will adjust it per-query (e.g., shifting toward text for brand-name queries). In **Hybrid mode**, the slider value is applied exactly as set.

**[Screenshot: The Search Weighting slider showing the "More Semantic" and "More Exact Match" labels, with the slider positioned at the 60/40 split, and the percentage values displayed below]**

---

### Similarity and Ranking

Two sliders control result quality and variety.

#### Similarity Threshold

- **Range:** 0.00 to 1.00
- **Default:** 0.30
- **What it does:** Sets the minimum cosine similarity score a product must achieve to appear in results. Lower values return more results (including weaker matches). Higher values return fewer, more precise results.
- **Recommendation:** 0.25–0.35 for most catalogs. Go lower (0.15–0.20) if the catalog is small and you want maximum coverage. Go higher (0.40+) only if users report too many irrelevant results.

#### Diversity Factor

- **Range:** 0.00 to 1.00
- **Default:** 0.10
- **What it does:** Controls how aggressively the system de-duplicates results from the same brand. At 0.00, brands can dominate the top results. At higher values, repeat brands are penalized to surface more variety.
- **Recommendation:** 0.05–0.15 for most cases. Increase to 0.20+ if a single large brand dominates your catalog.

**[Screenshot: The Similarity & Ranking section showing both sliders with their current values displayed to the right of each label (e.g., "0.30" and "0.10")]**

---

### Pagination Settings

Two dropdowns control the default and maximum page sizes for search results.

| Setting | Options | Default |
|---|---|---|
| Default Results Per Page | 10, 25, 50 | 10 |
| Maximum Results Per Page | 25, 50, 100 | 50 |

These affect the server-side result count. The client-side pagination (which users control via the per-page dropdown on the results page) operates within the maximum set here.

---

### Category Weights

Six sliders adjust how prominently each product category appears in mixed search results (searches that span multiple categories). Each slider ranges from **0.5x** to **2.0x**, with **1.0x** being neutral.

| Category | Default | Effect of Increase |
|---|---|---|
| Dress | 1.0x | More dresses appear in mixed results |
| Shoes | 1.0x | More footwear in mixed results |
| Bags | 1.0x | More handbags and totes |
| Tops | 1.0x | More tops, blouses, sweaters |
| Bottoms | 1.0x | More pants, jeans, skirts |
| Accessories | 1.0x | More scarves, belts, hats, sunglasses |

Category weights do not affect searches that are explicitly for a single category (e.g., a user clicking "Dresses" in the navigation). They only influence searches where the AI determines multiple categories could be relevant.

**[Screenshot: The Category Weights section showing all six sliders, each with the category name on the left and the current multiplier value (e.g., "1.0x") on the right]**

---

### Quality Filters

Four settings control which products are included in or excluded from search results.

#### Minimum Price Threshold

- **Range:** $0.00 to $50.00 (slider, $0.50 steps)
- **Default:** $5.00
- **What it does:** Products priced below this amount are hidden from search results. Set to $0.00 to disable.
- **Why it exists:** Very low-priced listings (under $5) are often placeholder items, sample swatches, or accessory parts rather than actual fashion products.

#### Enable Price Filter (checkbox)

- **Default:** On
- **What it does:** Master toggle for the minimum price filter. When off, the price threshold is ignored entirely.

#### Filter Men's Products (checkbox)

- **Default:** On
- **What it does:** Hides products explicitly marketed for men. Unisex items are always shown regardless of this setting.
- **When to turn off:** If your catalog intentionally includes men's fashion.

#### Filter Non-Apparel Materials (checkbox)

- **Default:** On
- **What it does:** Hides raw fabrics, upholstery materials, sewing notions, hardware, and crafting supplies that sometimes appear in fashion affiliate feeds. Fashion accessories (bags, belts, jewelry) are always shown regardless of this setting.
- **When to turn off:** Only for testing or if you have verified that your catalog has no non-apparel contamination.

**[Screenshot: The Quality Filters section showing the price threshold slider, and the three checkboxes for Enable Price Filter, Filter Men's Products, and Filter Non-Apparel Materials]**

After configuring all settings, click **Save Settings** at the bottom of the page. A green "Settings saved successfully!" message confirms the save.

---

## Product Sync Pipeline

Products enter the ATLAZ catalog through an automated sync pipeline that pulls listings from affiliate networks, scores them for quality, and generates AI embeddings.

> **Beyond Original Scope — Quality-Scored Sync Pipeline**
> Standard affiliate integrations import all available products. ATLAZ scores each product on a 0–7 quality scale, rejects products below a configurable threshold, de-duplicates by title/brand/price fingerprint, and generates AI embeddings automatically. This end-to-end pipeline requires quality assessment logic, deduplication, embedding generation with rate limiting, and per-campaign configuration. **Typical build cost: $12,000–$20,000.**

### Quality Scoring System (0–7 Points)

Every product is evaluated before it enters the database. The scoring system awards points for completeness:

| Criterion | Points | Details |
|---|---|---|
| Has valid description | +1 | Description is not null, empty, or the literal string "null" |
| Description > 50 characters | +1 | Sufficiently detailed |
| Description > 150 characters | +1 | Rich description |
| Has valid price > $0 | +1 | Price is present and positive |
| Price in fashion range ($5–$500) | +1 | Reasonable price for a fashion item |
| Has valid brand | +1 | Brand is not "Unknown" or empty |
| Detected as fashion item | +1 | Passes fashion keyword detection |
| **Maximum** | **7** | |

The default minimum threshold for import is **5** (Impact and CJ affiliates) or **6** (DHGate merchants, which require stricter filtering due to higher catalog noise).

---

### Syncing from Impact API

**Endpoint:** POST `/api/admin/sync-products`
**Authentication:** Header `x-admin-secret` must match the `ADMIN_SECRET` environment variable.

**Request body:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| source | string | "impact" | Affiliate network: "impact" or "cj" |
| syncAll | boolean | false | When true, syncs all campaigns configured in `IMPACT_CAMPAIGN_IDS` |
| campaignId | string | env default | Specific campaign ID to sync (ignored when syncAll is true) |
| maxProducts | number | 1000 (single) or 500 (per campaign when syncAll) | Maximum products to import per run |
| generateEmbeddings | boolean | true | Automatically generate AI embeddings for newly synced products |
| minQualityScore | number | 5 | Minimum quality score (0–7) required for import |

**Response:**

| Field | Type | Description |
|---|---|---|
| success | boolean | Whether the sync completed without fatal errors |
| synced | number | Products successfully inserted into the database |
| errors | number | Products that failed to insert |
| skipped | number | Products that failed quality scoring (CJ source) |
| embeddingsGenerated | number | Embeddings created (if generateEmbeddings was true) |
| message | string | Human-readable summary |
| campaignResults | array | Per-campaign breakdown (only when syncAll is true) |

**Example: Sync 200 products from the default Impact campaign with quality threshold 6**

| Field | Value |
|---|---|
| URL | POST /api/admin/sync-products |
| Header | x-admin-secret: [your secret] |
| Body | source: "impact", maxProducts: 200, minQualityScore: 6 |

---

### Syncing from CJ Affiliate

Uses the same endpoint with `source: "cj"`. Requires the `CJ_AFFILIATE_TOKEN` and `CJ_AFFILIATE_CID` environment variables to be set.

---

### Generating Embeddings Separately

If products were synced without embedding generation (or if embeddings need to be regenerated), use this endpoint.

**Endpoint:** POST `/api/admin/generate-embeddings`
**Authentication:** Header `x-admin-secret`

**Action: Count products needing embeddings**

| Field | Value |
|---|---|
| Body | action: "count" |
| Response | count: (number of products without embeddings) |

**Action: Generate embeddings for next batch**

| Field | Value |
|---|---|
| Body | action: "generate", batchSize: 50 |
| Response | generated: (number), errors: (number), message: (summary) |

The generator uses the Claude API (Anthropic) as the primary embedding model. If Claude is unavailable, it falls back to OpenAI. There is a 100ms rate limit between products to avoid API throttling.

Each run processes one batch. To generate embeddings for all products, run the action repeatedly until the count returns 0, or use the PowerShell script below.

---

### Bulk Sync Scripts (PowerShell)

These scripts are located in the `scripts/` folder and automate multi-campaign syncs for larger operations.

#### bulk-sync-high-quality.ps1

Syncs 4 DHGate campaigns with configurable quality.

| Parameter | Default | Description |
|---|---|---|
| -ProductsPerCampaign | 2000 | Maximum products per campaign |
| -MinQualityScore | 5 | Quality threshold (0–7) |
| -GenerateEmbeddings | off | Add this switch to generate embeddings after sync |

**Campaigns synced:** 7183, 7184, 7186, 7187

#### sync-all-campaigns.ps1

Syncs all 10 configured campaigns (6 high-quality + 4 DHGate), 100 products each, with embedding generation enabled and 2-second delays between campaigns.

#### sync-dhgate-strict.ps1

Syncs 5 DHGate campaigns with premium quality threshold.

| Parameter | Default | Description |
|---|---|---|
| -ProductsPerCampaign | 1000 | Maximum products per campaign |
| -MinQualityScore | 6 | Premium quality threshold |

#### generate-embeddings.ps1

Generates embeddings for all products that lack them.

| Parameter | Default | Description |
|---|---|---|
| -BatchSize | 50 | Products per batch |
| -DryRun | off | Count only, do not generate |

Shows progress with elapsed time and ETA. Estimates cost at approximately $0.02 per 1,000 embeddings. Prompts for confirmation before proceeding.

#### regenerate-all-embeddings.ps1

Regenerates embeddings for all 10 campaigns sequentially with 1-second delays between campaigns.

#### test-quality-sync.ps1

Tests quality filtering on a single DHGate campaign (7186) at three threshold levels (4, 5, 6) with 20 products each. Useful for evaluating the impact of threshold changes before a full sync.

---

## Product Deduplication

When products are synced, the system checks for duplicates using a fingerprint composed of:

1. **Normalized title** — Lowercased, stripped of special characters
2. **Brand name** — Normalized to lowercase
3. **Price bucket** — Rounded to the nearest dollar

When a duplicate is found, the system resolves it by keeping the version with the highest quality score. If tied, the lower price wins. If still tied, the newer listing wins.

This prevents the same product from appearing multiple times in search results even if it is listed across multiple affiliate campaigns.

---

## Cache Management

**Endpoint:** POST `/api/cache/clear`
**Authentication:** None required (see security note below)

Calling this endpoint flushes the entire Redis cache, which stores search results for up to one hour.

**When to clear the cache:**

- After bulk category changes (moving many products)
- After a large product sync
- After changing search settings (settings have their own 1-minute cache, but result caches may still contain stale data)
- When testing search behavior changes

**Response on success:** success: true, message: "Cache cleared"
**Response if Redis is not configured:** success: false, message: "Redis not configured" (HTTP 503)

**Quick access:** A tiny cache-clear button (a refresh icon) also appears in the bottom-right corner of the site footer on every page. It is nearly invisible (18% opacity) until hovered. Click it to clear the cache without using the API directly. A checkmark or X appears briefly to confirm success or failure.

**Security note:** This endpoint currently has no authentication. Anyone who knows the URL can clear the cache. While clearing the cache is not destructive (it only causes a brief performance dip as caches rebuild), this is flagged as a potential concern for production environments.

---

## Diagnostics

**Endpoint:** GET `/api/diagnose`
**Authentication:** None required (public, read-only)

Returns a JSON health check of the deployment environment. Useful for verifying that all required API keys and database connections are configured.

**What it checks:**

| Check | Environment Variable | Severity if Missing |
|---|---|---|
| Anthropic API key | ANTHROPIC_API_KEY | Critical — intent extraction and embeddings will fail |
| OpenAI API key | OPENAI_API_KEY | Critical — fallback embeddings will fail |
| Supabase URL | NEXT_PUBLIC_SUPABASE_URL | Critical — all database queries will fail |
| Supabase key | SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY | Critical — database access denied |
| Base URL | NEXT_PUBLIC_BASE_URL | Warning — rating stats API will fall back to localhost |
| Platform detection | AWS_LAMBDA_FUNCTION_NAME, NETLIFY | Info — reports "Netlify", "Vercel", or "Unknown" |

The response includes a `recommendations` array with "CRITICAL:" or "WARNING:" messages for each issue found, or "All environment variables are properly configured!" if everything checks out.

---

## Required Environment Variables

| Variable | Required For | Notes |
|---|---|---|
| ADMIN_SECRET | Sync and embedding endpoints | Header-based auth for API calls |
| ANTHROPIC_API_KEY | Intent extraction, primary embeddings | Claude API |
| OPENAI_API_KEY | Fallback embeddings | Used when Claude is unavailable |
| NEXT_PUBLIC_SUPABASE_URL | All database operations | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Admin-level database writes | Service role (bypasses RLS) |
| NEXTAUTH_SECRET | Authentication sessions | NextAuth.js session encryption |
| NEXTAUTH_URL | Authentication redirects | Must match your deployment URL |
| GOOGLE_CLIENT_ID | Google OAuth sign-in | Google Cloud Console |
| GOOGLE_CLIENT_SECRET | Google OAuth sign-in | Google Cloud Console |
| IMPACT_ACCOUNT_SID | Impact affiliate product sync | Impact partnership dashboard |
| IMPACT_AUTH_TOKEN | Impact affiliate product sync | Impact partnership dashboard |
| IMPACT_CAMPAIGN_ID | Default campaign for single sync | Used when campaignId is not specified |
| IMPACT_CAMPAIGN_IDS | Multi-campaign sync (comma-separated) | Used when syncAll is true |
| CJ_AFFILIATE_TOKEN | CJ affiliate product sync | CJ Affiliate dashboard |
| CJ_AFFILIATE_CID | CJ affiliate product sync | CJ Affiliate company ID |
| UPSTASH_REDIS_REST_URL | Search result caching | Optional — search works without it, just slower |
| UPSTASH_REDIS_REST_TOKEN | Search result caching | Optional — required if URL is set |

---

## Database Schema Reference (Key Tables)

### Products Table (Supabase — managed via SQL, not Prisma)

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| title | text | Product title (used for FTS browse) |
| description | text | Product description |
| price | numeric | Price in listed currency |
| currency | text | Currency code (e.g., "USD") |
| brand | text | Brand name |
| category | text | Category label |
| image_url | text | Primary product image URL |
| product_url | text | Retailer product page URL |
| on_sale | boolean | Whether the item is on sale |
| merchant_name | text | Retailer/merchant name |
| embedding | vector(1536) | pgvector embedding (Claude/OpenAI) |
| tags | text[] | Product tags |
| created_at | timestamp | Record creation time |
| updated_at | timestamp | Last update time |

### Search Settings Table (single row)

| Column | Type | Default |
|---|---|---|
| similarity_threshold | numeric | 0.30 |
| diversity_factor | numeric | 0.10 |
| default_page_size | integer | 10 |
| max_page_size | integer | 50 |
| category_weights | JSONB | {} |
| brand_boosts | JSONB | {} |
| min_price_threshold | numeric | 5.00 |
| enable_mens_filter | boolean | true |
| enable_price_filter | boolean | true |
| enable_non_apparel_filter | boolean | true |
| search_mode | text | "auto" |
| hybrid_vector_weight | numeric | 0.60 |
| hybrid_text_weight | numeric | 0.40 |
| updated_at | timestamp | |
| updated_by | text | |

### Users Table (Prisma-managed)

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| email | text | Unique email address |
| name | text | Display name |
| password | text | bcrypt-hashed password (null for Google OAuth users) |
| role | text | "admin", "editor", or "viewer" |
| emailVerified | timestamp | When email was verified (null if unverified) |
| image | text | Profile image URL (from Google OAuth) |

---

## Endpoint Quick Reference

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| /api/admin/stats | GET | Session (Editor or Admin) | Dashboard statistics |
| /api/admin/settings | GET | Session (Editor or Admin) | Read current search settings |
| /api/admin/settings | PUT | Session (Editor or Admin) | Update search settings |
| /api/admin/sync-products | POST | x-admin-secret header | Sync products from affiliate networks |
| /api/admin/generate-embeddings | POST | x-admin-secret header | Count or generate AI embeddings |
| /api/admin/products/{id} | PATCH | Session (Admin only) | Move product to a different category |
| /api/admin/products/{id} | DELETE | Session (Admin only) | Permanently delete a product |
| /api/admin/categories | GET | Session (Admin only) | List all available categories |
| /api/cache/clear | POST | None | Flush the entire Redis cache |
| /api/diagnose | GET | None | Environment health check |

---

## Beyond-Scope Feature Summary (Admin-Specific)

The following admin-facing features go beyond what a standard e-commerce admin panel includes.

| Feature | What It Does | Typical Build Cost |
|---|---|---|
| Role-Based Access Control | Three-tier RBAC with per-route checks and role-aware navigation | $4,000–$8,000 |
| Adaptive Search Mode (Auto) | Dynamically adjusts vector/text weighting per query based on intent analysis | $5,000–$10,000 |
| Quality-Scored Sync Pipeline | Scores products 0–7, rejects below threshold, deduplicates, auto-generates embeddings | $12,000–$20,000 |
| AI Embedding Generation | Converts product descriptions into 1536-dimension vectors using Claude API with OpenAI fallback | $5,000–$8,000 |
| Product Deduplication | Fingerprint-based dedup across campaigns using title + brand + price bucket | $3,000–$5,000 |
| Category Weight Tuning | Per-category relevance multipliers for mixed-category searches | $2,000–$4,000 |
| Diversity Factor Ranking | Brand de-duplication in search results via configurable penalty | $2,000–$3,000 |
| Real-Time Search Diagnostics | Environment health check endpoint with severity-graded recommendations | $1,000–$2,000 |
| **Total (admin features only)** | | **$34,000–$60,000** |

**Note:** This table covers admin-specific features only. See the User Guide's summary table for user-facing features ($69,000–$139,000). The total for all beyond-scope features across both guides is approximately **$103,000–$199,000**.
