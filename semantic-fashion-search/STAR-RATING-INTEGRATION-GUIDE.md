# Star Rating System - Integration Guide

## Quick Reference for Next Session

### Status: 70% Complete - Backend Ready, Integration Pending

---

## What's Already Built ✅

### Database Schema
- **Migration SQL**: `scripts/migrate-to-star-ratings.sql`
- Changes `vote` (±1) → `rating` (1-5)
- Creates `product_rating_stats` view for aggregates
- Ready to run in Supabase SQL Editor

### Components
- **StarRating.tsx**: Interactive 1-5 star component with hover preview
- **useSessionRatings.ts**: Anonymous ratings (sessionStorage, no DB)
- **usePersistentRatings.ts**: Authenticated ratings (DB-backed)

### API Endpoints
- `POST /api/ratings` - Save/update rating (auth required)
- `DELETE /api/ratings` - Remove rating (auth required)
- `GET /api/ratings/user` - Fetch user's ratings
- `GET /api/ratings/stats` - Aggregate stats (Redis cached, 1hr)

---

## What's Pending ⏳

### 1. Run Database Migration
```sql
-- File: scripts/migrate-to-star-ratings.sql
-- Run in Supabase SQL Editor
-- Verify: Check product_feedback table schema
-- Test: SELECT * FROM product_rating_stats LIMIT 5;
```

### 2. Update ProductCard Component

**Location**: `components/ProductCard.tsx`

**Add**:
```tsx
import { StarRating } from './StarRating';
import { useSessionRatings } from '@/hooks/useSessionRatings';
import { usePersistentRatings } from '@/hooks/usePersistentRatings';
import { useSession } from 'next-auth/react';

// Inside component:
const { data: session } = useSession();
const sessionRatings = useSessionRatings();
const persistentRatings = usePersistentRatings({
  userId: session?.user?.id
});

// Use authenticated ratings if logged in, otherwise session ratings
const currentRating = session?.user?.id
  ? persistentRatings.getRating(product.id)
  : sessionRatings.getRating(product.id);

const handleRate = (rating: number) => {
  if (session?.user?.id) {
    persistentRatings.rate(product.id, rating);
  } else {
    sessionRatings.rate(product.id, rating);
  }
};

// In JSX:
<StarRating
  rating={currentRating}
  onRate={handleRate}
  size={20}
/>

// Fetch and display stats
const [stats, setStats] = useState(null);
useEffect(() => {
  fetch(`/api/ratings/stats?productIds=${product.id}`)
    .then(r => r.json())
    .then(data => setStats(data.stats[product.id]));
}, [product.id]);

// Display stats
{stats && stats.totalRatings >= 5 && (
  <div className="text-xs text-gray-600">
    {stats.percent3Plus}% rated 3+ stars • {stats.percent5Star}% gave 5 stars
  </div>
)}
```

### 3. Update Search Filtering

**Location**: `lib/search.ts`

**Add after semantic search, before pagination**:

```typescript
// Import at top
import { redis } from './redis';

// After priceFilteredResults, before pagination:

// Step 1: Get user's ratings (session or persistent)
const userRatings = session?.user?.id
  ? await fetchUserRatings(session.user.id)
  : getSessionRatings(); // from request headers or context

// Step 2: Fetch community stats for all products
const productIds = priceFilteredResults.map(p => p.id);
const statsResponse = await fetch(
  `/api/ratings/stats?productIds=${productIds.join(',')}`
);
const { stats } = await statsResponse.json();

// Step 3: Filter + boost
let ratedResults = priceFilteredResults
  // Personal filtering: hide ≤2 stars
  .filter(product => {
    const userRating = userRatings[product.id] || 0;
    return userRating === 0 || userRating >= 3;
  })
  // Community filtering: hide 51% rule violations
  .filter(product => {
    const productStats = stats[product.id];
    return !productStats?.shouldHide;
  })
  // Apply boosts
  .map(product => {
    const userRating = userRatings[product.id] || 0;
    const productStats = stats[product.id];

    // Personal boost
    let personalBoost = 0;
    if (userRating === 5) personalBoost = 0.15;
    else if (userRating === 4) personalBoost = 0.10;
    else if (userRating === 3) personalBoost = 0.05;

    // Community boost
    const communityBoost = productStats?.communityBoost || 0;

    return {
      ...product,
      similarity: product.similarity + personalBoost + communityBoost
    };
  })
  // Re-sort by adjusted similarity
  .sort((a, b) => b.similarity - a.similarity);
```

### 4. Testing Checklist

- [ ] Anonymous user can rate products (saved in sessionStorage)
- [ ] Authenticated user can rate products (saved to DB)
- [ ] Ratings persist across page refreshes (authenticated)
- [ ] Session ratings cleared when all tabs close
- [ ] User can change their rating
- [ ] Products rated ≤2 stars hidden from that user
- [ ] Community stats display correctly (X% gave 3+, Y% gave 5)
- [ ] Products with 51%+ low ratings hidden from everyone
- [ ] Search ranking boosted for highly-rated products
- [ ] Stats API returns correct percentages
- [ ] Redis caching working (check logs)

---

## Filtering Logic Summary

### Personal Level (Current User)
| Rating | Action | Boost |
|--------|--------|-------|
| 1-2 ⭐ | HIDE | N/A |
| 3 ⭐⭐⭐ | Show | +0.05 |
| 4 ⭐⭐⭐⭐ | Show | +0.10 |
| 5 ⭐⭐⭐⭐⭐ | Show | +0.15 |

### Community Level (Min 10 Ratings)
| Condition | Action |
|-----------|--------|
| ≥51% rated ≤2 stars | HIDE from everyone |
| ≥60% gave 5 stars | +0.12 boost |
| ≥40% gave 5 stars | +0.08 boost |
| ≥20% gave 5 stars | +0.04 boost |
| ≥80% gave 3+ stars | +0.06 additional boost |
| ≥60% gave 3+ stars | +0.03 additional boost |

---

## Files to Modify in Integration Phase

1. `components/ProductCard.tsx` - Add rating UI + stats display
2. `lib/search.ts` - Add filtering + boosting logic
3. `app/page.tsx` - Initialize rating hooks at top level

---

## Notes

- **Session ratings**: Never hit database, instant personalization
- **Persistent ratings**: Require authentication, contribute to community stats
- **Stats caching**: 1-hour Redis TTL, batch fetch up to 100 products
- **Security**: All persistent writes require NextAuth session
- **Privacy**: Anonymous ratings never persisted beyond session

---

## After Integration is Complete

### Phase 3 Future Enhancements
1. Admin dashboard to view top/bottom rated products
2. Learning engine: Use ratings to personalize search results
3. A/B testing: Experiment with different boost values
4. Half-star support: Update StarRating component + backend
5. Rating explanations: "Why did you rate this?" text field

---

## Command Reference

```bash
# Check rating system status
node -e "const db = require('./lib/supabase'); /* query product_feedback */"

# Clear Redis cache (testing)
redis-cli KEYS "product_stats:*" | xargs redis-cli DEL

# Test stats API
curl "http://localhost:3000/api/ratings/stats?productIds=abc,def,ghi"

# Test user ratings API (requires auth)
curl "http://localhost:3000/api/ratings/user" \
  -H "Cookie: next-auth.session-token=..."
```

---

**Last Updated**: 2026-01-18
**Status**: Ready for integration (waiting for color backfill to complete)
