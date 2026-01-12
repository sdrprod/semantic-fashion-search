# User Feedback & Personalization Master Plan

**Project**: Semantic Fashion Search
**Date**: 2026-01-12
**Status**: Planning Phase

---

## Executive Summary

Transform the semantic fashion search from a stateless query system into a personalized, learning platform that adapts to individual user preferences through explicit feedback (ratings, "more like this") and implicit signals (clicks, time spent, etc.).

---

## Phase 1: Authentication & User Profiles (Week 1-2)

### 1.1 Authentication System

**Recommended Stack**: NextAuth.js (Auth.js)
- ✅ Built for Next.js (already using)
- ✅ Supports OAuth (Google, Apple, email/password)
- ✅ Session management included
- ✅ JWT + database sessions
- ✅ Easy to add providers later

**Implementation:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { SupabaseAdapter } from "@auth/supabase-adapter"

export const authOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Email/password coming in Phase 1B
  ],
  callbacks: {
    session: async ({ session, user }) => {
      session.user.id = user.id
      return session
    },
  },
}

export const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**Database Schema:**
```sql
-- NextAuth tables (auto-created by adapter)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  ...
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ...
);
```

### 1.2 User Profile Extension

**Additional Profile Data:**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Preferences
  preferred_style_tags TEXT[], -- ['bohemian', 'vintage', 'minimalist']
  size_preferences JSONB, -- { "tops": "M", "bottoms": 8, "shoes": 7.5 }
  price_range_min INTEGER,
  price_range_max INTEGER,
  excluded_brands TEXT[],

  -- Computed preferences (learned from feedback)
  color_preferences JSONB, -- { "black": 0.8, "red": 0.6, "yellow": -0.2 }
  material_preferences JSONB,
  occasion_preferences JSONB,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT FALSE,
  total_searches INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_feedback_items INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

### 1.3 UI Components

**Components to Create:**
- `<SignInButton />` - Google OAuth + Email signin
- `<UserMenu />` - Avatar dropdown with profile/settings/signout
- `<ProfileSettings />` - Edit preferences page
- `<OnboardingFlow />` - Initial style quiz (optional)

---

## Phase 2: Feedback Collection System (Week 2-3)

### 2.1 Item-Level Feedback ("More Like This")

**Database Schema:**
```sql
CREATE TABLE user_feedback_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  search_session_id UUID REFERENCES search_sessions(id),

  -- Feedback type
  feedback_type TEXT NOT NULL, -- 'like', 'dislike', 'more_like_this', 'not_interested'

  -- Context
  search_query TEXT,
  result_position INTEGER, -- Where in results was this item?

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_product ON user_feedback_items(user_id, product_id);
CREATE INDEX idx_feedback_user_created ON user_feedback_items(user_id, created_at DESC);
CREATE INDEX idx_feedback_product ON user_feedback_items(product_id);
```

**UI Implementation:**
```typescript
// components/ProductCard.tsx - Add to existing card
<div className="product-actions">
  {isAuthenticated && (
    <>
      <button
        className="feedback-btn"
        onClick={() => handleFeedback('more_like_this')}
      >
        ❤️ More Like This
      </button>
      <button
        className="feedback-btn"
        onClick={() => handleFeedback('not_interested')}
      >
        🚫 Not Interested
      </button>
    </>
  )}
</div>

// API: POST /api/feedback/item
{
  productId: "uuid",
  feedbackType: "more_like_this",
  searchQuery: "casual summer brunch outfit",
  resultPosition: 3
}
```

### 2.2 Results Quality Rating

**Database Schema:**
```sql
CREATE TABLE search_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous

  -- Search details
  query TEXT NOT NULL,
  intent JSONB, -- Store parsed intent
  result_count INTEGER,

  -- Quality rating
  quality_rating TEXT, -- 'excellent', 'good', 'fair', 'poor', 'not_even_close'
  quality_feedback TEXT, -- Natural language feedback
  rated_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  session_duration INTEGER -- seconds spent on results
);

CREATE TABLE search_session_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_session_id UUID NOT NULL REFERENCES search_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  result_position INTEGER NOT NULL,
  similarity_score REAL,

  -- Engagement
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP,
  time_viewed INTEGER -- milliseconds
);

CREATE INDEX idx_search_sessions_user ON search_sessions(user_id, created_at DESC);
CREATE INDEX idx_search_sessions_quality ON search_sessions(quality_rating);
```

**UI Implementation:**
```typescript
// components/ResultsFeedback.tsx - Add to bottom of results
<div className="results-feedback">
  <h3>How would you rate these results?</h3>
  <div className="rating-buttons">
    <button onClick={() => rate('excellent')}>😍 Excellent</button>
    <button onClick={() => rate('good')}>👍 Good</button>
    <button onClick={() => rate('fair')}>😐 Fair</button>
    <button onClick={() => rate('poor')}>👎 Poor</button>
    <button onClick={() => rate('not_even_close')}>❌ Not Even Close</button>
  </div>

  {showFeedbackBox && (
    <textarea
      placeholder="What could be better? (optional)"
      onChange={(e) => setFeedback(e.target.value)}
    />
  )}
</div>

// API: POST /api/feedback/search-results
{
  searchSessionId: "uuid",
  qualityRating: "good",
  qualityFeedback: "Great options but need more color variety"
}
```

### 2.3 Implicit Feedback (Passive Tracking)

**What to Track:**
- Product clicks (→ indicates interest)
- Time spent viewing product details
- Scroll depth on results
- Search refinements (query modifications)
- Pagination behavior
- Add-to-cart events (future)

**Implementation:**
```typescript
// components/ProductCard.tsx
<a
  href={product.productUrl}
  onClick={() => trackClick(product.id)}
  onMouseEnter={() => startViewTimer(product.id)}
  onMouseLeave={() => endViewTimer(product.id)}
>
  ...
</a>

// API: POST /api/analytics/track
{
  eventType: 'product_click',
  productId: "uuid",
  searchSessionId: "uuid",
  metadata: { position: 3, similarity: 0.87 }
}
```

---

## Phase 3: Learning & Personalization Engine (Week 3-5)

### 3.1 Preference Learning System

**Algorithm Overview:**
```
For each user:
1. Extract features from "liked" items (tags, colors, materials, price range)
2. Weight features by feedback strength:
   - "more_like_this": +1.0
   - clicked: +0.5
   - viewed >10s: +0.3
   - "not_interested": -1.0
3. Build user preference vector
4. Apply to future searches as query boost
```

**Database Functions:**
```sql
-- Compute user preference vector
CREATE OR REPLACE FUNCTION compute_user_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  preferences JSONB;
BEGIN
  WITH feedback_products AS (
    -- Get all products user interacted with
    SELECT
      p.*,
      f.feedback_type,
      CASE
        WHEN f.feedback_type = 'more_like_this' THEN 1.0
        WHEN f.feedback_type = 'like' THEN 0.8
        WHEN f.feedback_type = 'not_interested' THEN -1.0
        ELSE 0.3
      END as weight
    FROM user_feedback_items f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = p_user_id
  ),
  tag_scores AS (
    -- Aggregate tag preferences
    SELECT
      tag,
      SUM(weight) as total_weight,
      COUNT(*) as count
    FROM feedback_products,
    LATERAL unnest(tags) as tag
    GROUP BY tag
  ),
  brand_scores AS (
    -- Aggregate brand preferences
    SELECT
      brand,
      SUM(weight) as total_weight,
      COUNT(*) as count
    FROM feedback_products
    GROUP BY brand
  )
  SELECT jsonb_build_object(
    'tags', (SELECT jsonb_object_agg(tag, total_weight) FROM tag_scores),
    'brands', (SELECT jsonb_object_agg(brand, total_weight) FROM brand_scores),
    'avg_price', (SELECT AVG(price) FROM feedback_products WHERE weight > 0)
  ) INTO preferences;

  RETURN preferences;
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Personalized Search

**Modified Search Flow:**
```typescript
// lib/personalized-search.ts
export async function personalizedSearch(
  query: string,
  userId: string | null,
  options: SearchOptions
): Promise<SearchResponse> {

  // 1. Get base semantic search results
  const baseResults = await semanticSearch(query, options);

  // 2. If user is logged in, apply personalization
  if (userId) {
    const userPreferences = await getUserPreferences(userId);

    // 3. Re-rank results based on preferences
    const personalizedResults = baseResults.results.map(product => ({
      ...product,
      personalizedScore: calculatePersonalizedScore(
        product,
        userPreferences,
        product.similarity
      )
    }))
    .sort((a, b) => b.personalizedScore - a.personalizedScore);

    return {
      ...baseResults,
      results: personalizedResults,
      personalized: true
    };
  }

  return baseResults;
}

function calculatePersonalizedScore(
  product: Product,
  preferences: UserPreferences,
  baseSimilarity: number
): number {
  let score = baseSimilarity;

  // Boost for preferred tags
  product.tags.forEach(tag => {
    if (preferences.tags[tag]) {
      score += preferences.tags[tag] * 0.1; // 10% boost per tag match
    }
  });

  // Boost for preferred brands
  if (preferences.brands[product.brand]) {
    score += preferences.brands[product.brand] * 0.15; // 15% boost
  }

  // Price preference (closer to user's avg = higher score)
  if (preferences.avg_price && product.price) {
    const priceDiff = Math.abs(product.price - preferences.avg_price);
    const priceScore = 1 - (priceDiff / preferences.avg_price);
    score += priceScore * 0.1;
  }

  return score;
}
```

### 3.3 "More Like This" Search

**Implementation:**
```typescript
// app/api/search/similar/route.ts
export async function POST(request: NextRequest) {
  const { productId, userId } = await request.json();

  // 1. Get the reference product
  const product = await getProduct(productId);

  // 2. Generate embedding from product features
  const productDescription = `${product.title} ${product.description} ${product.tags.join(' ')}`;
  const embedding = await generateEmbedding(productDescription);

  // 3. Search for similar items
  const results = await supabase.rpc('match_products', {
    query_embedding: embedding,
    match_count: 20
  });

  // 4. Filter out the original product
  const similarProducts = results.data
    .filter(p => p.id !== productId)
    .slice(0, 10);

  // 5. Log feedback
  if (userId) {
    await logFeedback({
      userId,
      productId,
      feedbackType: 'more_like_this'
    });
  }

  return NextResponse.json({ results: similarProducts });
}
```

---

## Phase 4: Analytics & Insights Dashboard (Week 5-6)

### 4.1 Admin Analytics

**Metrics to Track:**
- Search quality ratings distribution
- Most common feedback phrases (NLP on text feedback)
- Products with highest "more like this" rate
- Search queries with lowest satisfaction
- User engagement by cohort
- Conversion funnel (search → click → external site)

**Database Views:**
```sql
CREATE VIEW search_quality_metrics AS
SELECT
  DATE(created_at) as date,
  quality_rating,
  COUNT(*) as count,
  AVG(result_count) as avg_results,
  AVG(session_duration) as avg_duration
FROM search_sessions
WHERE quality_rating IS NOT NULL
GROUP BY DATE(created_at), quality_rating;

CREATE VIEW popular_products AS
SELECT
  p.id,
  p.title,
  p.brand,
  COUNT(DISTINCT f.user_id) as unique_users,
  COUNT(*) as total_interactions,
  SUM(CASE WHEN f.feedback_type = 'more_like_this' THEN 1 ELSE 0 END) as likes
FROM products p
JOIN user_feedback_items f ON p.id = f.product_id
GROUP BY p.id, p.title, p.brand
ORDER BY likes DESC
LIMIT 100;
```

### 4.2 User-Facing Insights

**"Your Style Profile" Page:**
- Top 5 preferred styles
- Favorite brands
- Color palette visualization
- Price range sweet spot
- Activity stats (searches, saves, feedback given)

---

## Phase 5: Advanced Features (Week 7+)

### 5.1 Collaborative Filtering

**"Users who liked this also liked..."**
```sql
CREATE TABLE product_similarity_collab (
  product_a UUID NOT NULL REFERENCES products(id),
  product_b UUID NOT NULL REFERENCES products(id),
  similarity_score REAL NOT NULL,
  based_on_users INTEGER, -- How many users contributed to this score
  PRIMARY KEY (product_a, product_b)
);

-- Computed daily via background job
-- Find products commonly liked by same users
```

### 5.2 Style Collections

**User-Created Collections:**
```sql
CREATE TABLE user_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collection_products (
  collection_id UUID NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (collection_id, product_id)
);
```

### 5.3 Social Features (UGC/Crowdsourcing Prep)

**Schema for Future:**
```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_follows (
  follower_id UUID NOT NULL REFERENCES users(id),
  following_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE style_tags_user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  tag TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.4 Voice Interaction (Future)

**Architecture:**
```typescript
// Voice → Speech-to-Text → Intent Extraction → Search
// Search Results → Text-to-Speech feedback

// app/api/voice/search/route.ts
export async function POST(request: NextRequest) {
  const audioBlob = await request.blob();

  // 1. Convert speech to text (OpenAI Whisper API)
  const transcript = await openai.audio.transcriptions.create({
    file: audioBlob,
    model: "whisper-1"
  });

  // 2. Process as normal search
  const results = await personalizedSearch(transcript.text, userId);

  // 3. Generate voice summary
  const summary = generateVoiceSummary(results);
  const speech = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: summary
  });

  return new Response(speech, {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
}
```

---

## Implementation Priority & Timeline

### Sprint 1 (Week 1-2): Foundation
- [ ] NextAuth.js integration
- [ ] User profiles database schema
- [ ] Basic sign-in UI
- [ ] Session management

### Sprint 2 (Week 2-3): Feedback Collection
- [ ] "More Like This" buttons on product cards
- [ ] Results quality rating component
- [ ] Feedback API endpoints
- [ ] Analytics tracking setup

### Sprint 3 (Week 3-4): Learning Engine
- [ ] User preference computation
- [ ] Personalized search re-ranking
- [ ] "More Like This" search endpoint
- [ ] Background job to update preferences

### Sprint 4 (Week 4-5): Polish & Testing
- [ ] Profile settings page
- [ ] Style profile visualization
- [ ] A/B test personalization impact
- [ ] Performance optimization

### Sprint 5 (Week 5-6): Analytics
- [ ] Admin dashboard
- [ ] Quality metrics tracking
- [ ] Feedback analysis (NLP on text)
- [ ] User insights page

### Future Sprints:
- Collaborative filtering
- User collections
- Social features
- Voice interaction
- Mobile app

---

## Technical Architecture Decisions

### Why NextAuth.js?
- ✅ Native Next.js integration
- ✅ Supabase adapter available
- ✅ Multiple auth providers
- ✅ Session management included
- ✅ TypeScript support
- ❌ Alternative: Supabase Auth (less flexible for OAuth)

### Why Store Preferences in DB vs Vector?
- Preferences: Structured data (DB) - tags, brands, price range
- Product embeddings: Unstructured semantic (Vector) - "style vibe"
- Hybrid approach: Use both for personalization

### Why Separate search_sessions vs user_feedback_items?
- Sessions: Holistic search quality (1 rating per search)
- Items: Individual product feedback (many per search)
- Allows tracking both macro and micro feedback

---

## Success Metrics

### User Engagement
- % users who provide feedback (target: 30%+)
- Avg feedback items per user (target: 10+)
- Return user rate (target: 40%+)
- Time spent on site (target: 5min+)

### Search Quality
- Avg quality rating (target: 3.5/5 "good")
- % searches rated "excellent" (target: 25%+)
- % searches rated "poor" or worse (target: <10%)
- Click-through rate (target: 60%+)

### Personalization Impact
- Search quality improvement for repeat users (target: +20%)
- "More Like This" engagement (target: 15% click rate)
- User preference coverage (target: 80% users have 10+ tags)

---

## Privacy & Ethics Considerations

### Data Privacy
- GDPR compliance: Right to be forgotten, data export
- Transparent data usage disclosure
- Opt-out of personalization option
- Anonymous search option (no tracking)

### Bias Mitigation
- Avoid filter bubbles (occasionally show diverse results)
- Detect and flag discriminatory patterns
- Regular audits of personalization fairness
- Diverse training data (multiple demographics)

### Transparency
- Explain why results are shown ("Based on your past likes...")
- Allow users to edit/correct preferences
- Show "unpersonalized" results toggle
- Clear feedback on what data is collected

---

## Decisions Made ✅

1. **Authentication**: ✅ **Both Google OAuth + Email/Password** - Maximum accessibility
2. **Anonymous Users**: ✅ **No tracking without account** - Must sign up (free) for personalization
3. **Feedback Frequency**: ✅ **Every search** - Test UX, adjust if annoying
4. **Onboarding**: ⏳ TBD - Required style quiz, or learn organically from usage?
5. **Personalization Strength**: ⏳ TBD - How aggressively to personalize? (Risk: filter bubble)
6. **Data Retention**: ⏳ TBD - How long to keep search history? (30 days, 1 year, forever?)

---

## Implementation Strategy (Based on Decisions)

### Authentication UX Flow

**For New Users:**
1. User searches without account → sees results
2. After viewing results, show prominent message:
   ```
   "Sign up for free to get personalized recommendations!"
   [Sign in with Google] [Sign up with Email]
   ```
3. No feedback buttons visible until signed in
4. Once signed in → feedback buttons appear on all products

**For Returning Users:**
1. Auto-signed in (session persisted)
2. See "✨ Personalized for you" badge on results
3. Feedback always visible
4. Profile accessible in header

### Feedback Collection UX

**Every Search Flow:**
1. User searches → results appear
2. Scroll to bottom → **always show rating prompt**:
   ```
   "How were these results?"
   [😍 Excellent] [👍 Good] [😐 Fair] [👎 Poor] [❌ Not Even Close]
   ```
3. After rating → optional text box expands:
   ```
   "What could be better? (optional)"
   [text area]
   ```
4. Track completion rate → adjust if <20% engagement

**Product-Level Feedback:**
- Every product card shows: `❤️ More Like This` button
- Hover/click shows: `🚫 Not Interested` option
- Feedback saves immediately (no confirmation needed)

---

## Next Steps

**Phase 1A: Core Authentication (Week 1)**
1. ✅ Install NextAuth.js + dependencies
2. ✅ Set up Google OAuth credentials (Google Cloud Console)
3. ✅ Configure NextAuth with both Google + Email providers
4. ✅ Create Supabase auth tables (users, accounts, sessions)
5. ✅ Build sign-in UI components
6. ✅ Test full auth flow

**Phase 1B: User Profiles (Week 2)**
1. ✅ Create user_profiles table
2. ✅ Build profile settings page
3. ✅ Add user menu to navigation
4. ✅ Implement session persistence

**Phase 2A: Feedback UI (Week 2-3)**
1. ✅ Add results quality rating component (always visible)
2. ✅ Add "More Like This" buttons to product cards
3. ✅ Create feedback API endpoints
4. ✅ Test feedback flows

**Phase 2B: Feedback Storage (Week 3)**
1. ✅ Create feedback database tables
2. ✅ Create search_sessions tracking
3. ✅ Build analytics queries
4. ✅ Admin dashboard (basic)

**Ready to start when you return!** 🚀

---

## Quick Start Checklist (When Ready)

**Environment Variables Needed:**
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Email Provider (if using email/password)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@yourdomain.com

# Existing
NEXT_PUBLIC_SUPABASE_URL=<already set>
SUPABASE_SERVICE_ROLE_KEY=<already set>
```

**NPM Packages to Install:**
```bash
npm install next-auth @auth/supabase-adapter
npm install @next-auth/supabase-adapter
npm install bcrypt @types/bcrypt  # for email/password
npm install nodemailer @types/nodemailer  # for email verification
```

**Files to Create (Phase 1A):**
- `app/api/auth/[...nextauth]/route.ts` - NextAuth config
- `components/auth/SignInButton.tsx` - Sign in trigger
- `components/auth/SignInModal.tsx` - Auth modal
- `components/auth/UserMenu.tsx` - User dropdown menu
- `lib/auth.ts` - Auth utilities
- `middleware.ts` - Route protection

**Total Estimated Time: 1-2 weeks for full authentication + basic feedback**
