# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Semantic Fashion Search** is a Next.js full-stack application that uses AI-powered semantic search to find fashion products. It combines vector embeddings, hybrid search (vector + text), vision-based reranking, and personalized recommendations based on user feedback.

### Tech Stack
- **Frontend**: React 18, Next.js 16 (App Router)
- **Backend**: Next.js API routes, Netlify Functions
- **Database**: PostgreSQL (via Supabase)
- **Search**: Supabase vector storage + text search, Redis caching
- **AI/Embeddings**: Anthropic Claude API, @xenova/transformers (ONNX), OpenAI embeddings fallback
- **Product Data**: Impact API, DHgate campaigns, custom affiliate links
- **Auth**: NextAuth.js v4 with Prisma adapter

## Common Commands

```bash
# Development
npm run dev                 # Start Next.js dev server (http://localhost:3000)
npm run build             # Build for production
npm start                 # Start production server
npm run lint              # Run ESLint

# Database
npx prisma studio        # Open Prisma Studio (DB admin UI)
npx prisma db push       # Sync schema to database
npx prisma generate      # Regenerate Prisma client
```

### Testing/Debugging

```bash
# Visual test (requires manual interaction)
npm run dev

# Database diagnostics
curl http://localhost:3000/api/diagnose

# Check admin stats (requires ADMIN_SECRET)
curl -X POST http://localhost:3000/api/admin/stats \
  -H "x-admin-secret: $ADMIN_SECRET"
```

## High-Level Architecture

### Core Flow: User Search

1. **User submits query** (text or image) → `app/page.tsx`
2. **Intent extraction** → `lib/intent.ts` (parse fashion attributes: category, color, price, brand)
3. **Search routing** → `lib/search.ts` (classify search mode: auto/hybrid/vector)
4. **Embedding generation** → `lib/embeddings.ts` (Claude or transformers.js)
5. **Hybrid search** → Supabase (vector similarity + full-text search, combined with weights)
6. **Vision reranking** (optional) → `lib/vision-reranking.ts` (Claude vision API reorders results)
7. **Redis caching** → Full result sets cached per query+userRatings combo
8. **Return to UI** → Paginated results in ProductCard components

### Key Modules

#### Search Engine (`lib/search.ts`)
- **`semanticSearch()`**: Main entry point. Orchestrates intent extraction, embedding generation, database queries, reranking, and caching
- **`getQualityFilterSettings()`**: Fetches admin-configured filters (min price, enable mens filter, search mode weights, etc.) with 1-minute cache
- Quality filters applied: price range, non-apparel exclusion, branded products only (configurable)

#### Intent Extraction (`lib/intent.ts`)
- **`extractIntent()`**: Uses Claude to parse user query into structured intent (color, category, price range, style, brand, etc.)
- **`classifySearchMode()`**: Decides between vector-only, hybrid, or auto mode based on admin settings
- **`isSimpleQuery()`**: Detects brand-only or ultra-short queries that can skip Claude API

#### Embeddings (`lib/embeddings.ts`)
- **`generateEmbedding(text, model)`**: Generates single embedding using Claude or transformers.js
- **`generateEmbeddings()`**: Bulk embedding for syncing products, with error handling and retry logic
- Supports both Claude and OpenAI models; falls back gracefully

#### Database Schema (`prisma/schema.prisma`)
- **Products**: Stored in Supabase PostgreSQL (schema not in prisma, managed separately)
- **User tables**: User, Account, Session, VerificationToken (NextAuth.js)
- **Feedback**: UserFeedbackItem, SearchSession, ProductClick (analytics & personalization)
- **User profiles**: UserProfile with learned preferences (colors, styles, brands, prices)

#### Vision Reranking (`lib/vision-reranking.ts`)
- **`rerankWithVision()`**: Uses Claude's vision API to re-score image search results
- Only triggered if `shouldUseVisionReranking()` detects visual intent
- Expensive operation; cached aggressively and skipped by default for text searches

#### Product Quality Filtering
- See `QUALITY-FILTERING.md` for detailed scoring system (0-7 points)
- Admin can configure `minQualityScore` during product sync
- Filters: USD currency, brand presence, fashion keywords, description length, price range

### Product Sync Pipeline

1. **Impact API → Supabase** (`app/api/admin/sync-products/route.ts`)
   - Fetches products from Impact API or DHgate
   - Applies quality filtering (configurable threshold)
   - Stores raw product data + generated embeddings
   - Uses PowerShell scripts (`scripts/bulk-sync-high-quality.ps1`, etc.) for large batches

2. **Product Deduplication** (`lib/deduplication.ts`)
   - Cross-category contamination detection (e.g., socks appearing in Dresses)
   - Hash-based duplicate detection by title, image, brand

3. **Embedding Generation** (`app/api/admin/generate-embeddings/route.ts`)
   - Batch generates embeddings for products without them
   - Falls back to OpenAI if Claude quota exhausted

### Search Result Refinement

When users refine search (e.g., "black version", "smaller size"):
- **Refinement Box** (`components/RefinementBox.tsx`) captures refinement query
- **Refinement History** (`src/hooks/useRefinementHistory.ts`) tracks refinement chain
- **Search refinement endpoint** (`app/api/search/refine/route.ts`) applies refinement as a filter to existing results

### Caching Strategy

- **Redis**: Full search results per (query + userRatings hash)
- **Settings cache**: Quality filter settings cached 1 minute in memory
- Demo queries bypass cache (to show fresh results in demos)

### User Personalization

- **Session ratings**: Client-side transient ratings during single session
- **Persistent ratings**: Stored in DB for logged-in users
- **User feedback**: Captures "more_like_this", "not_right" actions for learning
- **Preferences**: Learned color, style, brand, category preferences in UserProfile

## Key Points for Development

### Configuration & Secrets

**Environment variables required**:
```
# Database
DATABASE_URL=postgresql://user:pass@host/db
DIRECT_URL=postgresql://... (for migrations)

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# APIs
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=... (fallback embeddings)
IMPACT_API_KEY=...
ADMIN_SECRET=... (protects admin endpoints)

# Search settings
REDIS_URL=... (optional, for caching)

# Notifications
RESEND_API_KEY=... (email)
```

### Admin Endpoints (Protected by `x-admin-secret` header)

- `POST /api/admin/sync-products` - Sync products from Impact API
- `POST /api/admin/generate-embeddings` - Generate missing embeddings
- `GET /api/admin/stats` - View sync statistics
- `POST /api/admin/settings` - Update search filters and weights

### Code Organization

- `app/` - Next.js pages and API routes
- `components/` - React components (SearchBar, ProductCard, etc.)
- `src/lib/` - Core utilities (search, embeddings, intent, vision, etc.)
- `src/hooks/` - React hooks (useSearch, useFeedback, useRefinementHistory, etc.)
- `prisma/` - Database schema
- `scripts/` - PowerShell scripts for bulk operations

### Search Mode Weights

Controlled by admin settings and used in `lib/intent.ts`:
- **Auto mode** (default): Analyzes query for brand signals and attribute stacking; adjusts vector/text weights dynamically
- **Hybrid mode**: Uses fixed admin-configured weights (default: 60% vector, 40% text)
- **Vector mode**: Vector-only search, ignores text queries

Brand detection in auto mode:
- Multi-word Title Case patterns ("Eileen Fisher", "Pleats Please") → boost text weight
- Short queries without color/category keywords → assume brand, boost text weight
- Long descriptive queries → boost vector weight (semantic understanding)

### Important Patterns

1. **Sexy content filtering**: `hasSexyIntent` detected in search API; filtered if not explicitly requested
2. **Deduplication**: Browse category searches apply cross-category blacklist to avoid contamination
3. **Vision reranking**: Optional; expensive; auto-skips for simple text queries
4. **Embedding fallback**: Claude → transformers.js (ONNX) → OpenAI (cost)

### Testing the Search System

1. **Single text search**: `npm run dev` → enter query
2. **Image search**: Upload fashion image, system generates embedding and searches visually
3. **Refinement**: After search, use "Refine results" box to narrow down
4. **Admin sync**: Use PowerShell scripts to test product quality filtering
5. **Cache behavior**: Search same query twice; second should be instant

## Database-Specific Notes

- **Supabase PostgreSQL**: Main product database (schema not in Prisma; managed via SQL migrations in Supabase dashboard)
- **Prisma models**: User auth, sessions, feedback, personalization (separate from product tables)
- **Vector column**: Products table has `embedding` column (pgvector format, 1536 dimensions for Claude/OpenAI)
- **Indexes**: Products indexed on brand, category, price, embedding for fast search

## Performance Considerations

- **Embedding generation**: Claude API (expensive, slow). Consider using transformers.js for large batches
- **Vision reranking**: ~5-10 seconds per search; disabled by default
- **Redis caching**: Reduces duplicate API calls; critical for frequently searched terms
- **Settings cache**: 1-minute in-memory cache prevents DB hits on every search
- **Hybrid search weights**: 60% vector (semantic) + 40% text (exact matches) is default; tunable by admin

## Deployment

- **Netlify Functions**: Configured via `netlify.toml` and `.netlify/functions/` directory
- **Next.js App Router**: Standard deployment via `npm run build && npm start`
- **Environment**: Set all required env vars in Netlify dashboard or local `.env.local`
