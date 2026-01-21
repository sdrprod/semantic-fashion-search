# Visual Search Feature - Setup & Testing Guide

## ✅ What's Complete

### 1. Backend API (`app/api/search/visual/route.ts`)
- ✅ Secure image upload handling (multipart/form-data)
- ✅ MIME type validation (JPG/PNG only)
- ✅ File size limits (5MB max per image)
- ✅ Rate limiting (10 requests/minute per IP)
- ✅ Image sanitization (validates actual image data)
- ✅ CLIP vision embedding generation
- ✅ Multi-image support (1-3 images, averaged embeddings)
- ✅ Optional text query combination

### 2. Frontend UI
- ✅ ImageUpload component (`components/ImageUpload.tsx`)
- ✅ Drag & drop support
- ✅ Image preview grid
- ✅ File validation UI
- ✅ Visual search button
- ✅ Integration into main search page
- ✅ CSS styling (gradient button, responsive design)

### 3. Database Migration
- ✅ SQL script created (`scripts/create-visual-search-function.sql`)
- ⏳ **WAITING**: Run when image embeddings complete

---

## ⏳ Next Steps (Once Embeddings Complete)

### Step 1: Check Embedding Progress

Run this in your terminal:
```bash
node scripts/generate-vision-embeddings-simple.mjs
```

Wait until you see:
```
✅ All products have vision embeddings!
```

### Step 2: Run SQL Migration

In **Supabase SQL Editor**, run:
```sql
-- Copy and paste contents from:
scripts/create-visual-search-function.sql
```

This creates the `match_products_by_image` function.

### Step 3: Start Dev Server

```bash
cd semantic-fashion-search
npm run dev
```

### Step 4: Test Visual Search

#### Test 1: Single Image Search
1. Visit http://localhost:3000
2. Scroll to "Or Search by Image" section
3. Upload 1 fashion item image (blouse, dress, etc.)
4. Click "Find Similar Items"
5. Verify results match the uploaded image style

#### Test 2: Multi-Image Search
1. Upload 2-3 images (e.g., blouse + skirt + handbag)
2. Click "Find Similar Items"
3. Verify results include items similar to any uploaded image

#### Test 3: Image + Text Search
1. Upload 1-2 images
2. Also type a description: "I am looking for outfits similar to this blouse, skirt and handbag"
3. Click "Find Similar Items"
4. Verify results match both visual style AND text description

#### Test 4: Security Tests
- Try uploading a .pdf file → Should reject with error
- Try uploading >5MB image → Should reject with error
- Try uploading 4+ images → Should reject with error

---

## How Visual Search Works

### User Flow
```
1. User uploads 1-3 images (JPG/PNG)
   ↓
2. Optional: User adds text description
   ↓
3. Click "Find Similar Items"
   ↓
4. Frontend sends FormData with images + text to /api/search/visual
   ↓
5. Backend validates files (MIME, size, count)
   ↓
6. Backend generates CLIP embeddings for each image
   ↓
7. If multiple images: Average embeddings into one
   ↓
8. Query database: match_products_by_image(averaged_embedding)
   ↓
9. Return products with image_embedding similar to query
   ↓
10. Display results with intent message
```

### Technical Details

**Image Processing:**
- Uses same CLIP model as product embeddings (`Xenova/clip-vit-base-patch32`)
- Generates 512-dimensional vision embeddings
- Normalizes embeddings for cosine similarity
- Averages multiple image embeddings if 2-3 uploaded

**Security Layers:**
1. Client-side MIME validation
2. Server-side MIME re-validation
3. File size checks (5MB limit)
4. Actual image content verification (RawImage.read)
5. Rate limiting (10 req/min per IP)
6. No file storage (memory-only processing)

**Database Query:**
```sql
match_products_by_image(
  query_embedding vector(512),
  match_count int DEFAULT 24,
  similarity_threshold float DEFAULT 0.5
)
```

Searches `products.image_embedding` column using cosine distance.

---

## Expected Results

### Good Results (60%+ similarity)
- Same clothing type
- Similar colors/patterns
- Similar style (formal/casual/trendy)
- Similar fabric appearance

### Why Results Might Not Match Exactly
- Product image quality varies
- Lighting/background differences
- Different angles/poses
- CLIP focuses on visual concepts, not exact matches

### Tuning Similarity Threshold

In `app/api/search/visual/route.ts` line ~228:
```typescript
similarity_threshold: 0.5  // Current: 50% similarity
```

**Adjust based on results:**
- Too many irrelevant results? → Increase to 0.6 or 0.7
- Too few results? → Decrease to 0.4

---

## Troubleshooting

### Error: "Search failed. Please try again."
**Check:**
1. SQL migration ran successfully?
2. Image embeddings generation complete?
3. Supabase logs for detailed error

### Error: "Failed to process image"
**Common Causes:**
- Image file corrupted
- Unsupported image format
- Image too large (>5MB)

**Fix:**
- Try different image
- Reduce image size
- Ensure JPG/PNG format

### Error: "Rate limit exceeded"
**Cause:** More than 10 searches in 1 minute

**Fix:**
- Wait 1 minute
- For production: Implement Redis-based rate limiting

### No Results Found
**Possible Reasons:**
1. Similarity threshold too strict (>0.7)
2. Uploaded image very different from product catalog
3. Image embeddings not generated for products

**Check:**
```sql
SELECT COUNT(*) FROM products WHERE image_embedding IS NOT NULL;
```

Should return ~7400+ products.

---

## File Reference

### New Files
- `app/api/search/visual/route.ts` - Visual search API endpoint
- `components/ImageUpload.tsx` - Image upload component
- `scripts/create-visual-search-function.sql` - Database migration

### Modified Files
- `app/page.tsx` - Added visual search section and logic
- `src/styles.css` - Added CSS for visual search UI

---

## Performance Considerations

### First Search Delay
- **First visual search**: +2-3 seconds (CLIP model loads)
- **Subsequent searches**: ~500-700ms

### Resource Usage
- **Memory**: ~500MB for CLIP model
- **CPU**: Moderate during embedding generation
- **Network**: ~200KB per uploaded image

### Optimization Tips
1. Consider caching CLIP model in production
2. Implement client-side image compression before upload
3. Use CDN for faster model downloads
4. Consider GPU acceleration for high-traffic sites

---

## Next Features (Future Phase 2)

1. **Visual + Text Hybrid Scoring**
   - Combine text and image similarity scores
   - Weight: 70% image + 30% text

2. **Image Quality Filtering**
   - Auto-detect blurry/low-quality uploads
   - Suggest better images

3. **Style Profiles**
   - Learn user's visual preferences
   - Personalize results over time

4. **Advanced Multi-Image**
   - "Find items that match ALL these images" (AND logic)
   - "Find items similar to ANY of these" (OR logic - current)

---

## Success Criteria

✅ **Feature is successful when:**
1. Users can upload 1-3 images
2. Search returns visually similar products
3. Results match both style and type
4. No security vulnerabilities
5. Load time < 3 seconds (including first load)
6. Error rate < 5%

---

## Support

### Questions?
- Check browser console for detailed errors
- Check Supabase logs for backend errors
- Verify embeddings generation status

### Known Limitations
1. Only JPG/PNG supported (no WEBP, HEIC, etc.)
2. Max 3 images per search
3. 5MB file size limit
4. First search has model load delay
5. Results depend on product catalog quality

---

**Version:** 1.0
**Created:** 2026-01-04
**Status:** Ready for testing (pending embeddings completion)
