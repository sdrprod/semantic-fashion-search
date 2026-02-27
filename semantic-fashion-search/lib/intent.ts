import Anthropic from '@anthropic-ai/sdk';
import type { ParsedIntent, SearchQuery } from '@/types';

export type SearchMode = 'auto' | 'hybrid' | 'vector';

export interface SearchModeResult {
  useHybrid: boolean;
  vectorWeight: number;
  textWeight: number;
}

/**
 * Classify a query to determine the optimal search routing.
 * In 'auto' mode, detects brand signals and attribute stacking to decide weights.
 * In 'hybrid' mode, uses the admin-configured weights for all queries.
 * In 'vector' mode, bypasses text search entirely.
 */
export function classifySearchMode(
  query: string,
  adminMode: SearchMode,
  adminVectorWeight: number,
  adminTextWeight: number
): SearchModeResult {
  if (adminMode === 'vector') {
    return { useHybrid: false, vectorWeight: 1.0, textWeight: 0.0 };
  }

  if (adminMode === 'hybrid') {
    return { useHybrid: true, vectorWeight: adminVectorWeight, textWeight: adminTextWeight };
  }

  // auto mode: analyze the query to determine best weighting

  // Brand signal 1: two or more consecutive Title Case words ("Eileen Fisher", "Pleats Please")
  const multiWordBrandPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/;
  const hasBrand = multiWordBrandPattern.test(query);

  // Brand signal 2: short query (1-3 words) that contains no known color or fashion
  // category keywords → almost certainly a brand name search (e.g. "nike", "Zara", "BCBG")
  const knownColors = new Set([
    'black','white','red','blue','navy','green','yellow','orange','purple','pink',
    'brown','beige','cream','grey','gray','gold','silver','tan','burgundy','maroon',
    'olive','emerald','lavender','coral','ivory','nude','rose','blush','khaki','camel',
  ]);
  const knownCategories = new Set([
    'dress','gown','romper','jumpsuit','shoes','heels','boots','sandals','sneakers',
    'loafers','pumps','flats','bag','purse','handbag','tote','clutch','backpack',
    'top','blouse','shirt','sweater','cardigan','tee','tank','cami','tunic',
    'pants','jeans','skirt','shorts','trousers','leggings','chinos','joggers',
    'jacket','coat','blazer','vest','parka','trench','outerwear',
    'jewelry','necklace','earrings','bracelet','ring','watch',
    'hat','cap','scarf','belt','sunglasses','accessory','accessories',
    'lingerie','swimwear','bikini','activewear','athleisure',
  ]);
  // Add broader terms that appear in nav queries but aren't individual products
  const knownGeneral = new Set([
    'clothing','apparel','fashion','wear','style','women','men','outfit',
    'footwear','outerwear','activewear','swimwear','athleisure','loungewear',
    'wraps','totes','blouses','loafers','joggers','chinos','trousers',
  ]);
  const words = query.trim().toLowerCase().split(/\s+/);
  // Use prefix matching to handle plurals (e.g. "tops" matches "top", "boots" matches "boot")
  const colorArr = [...knownColors];
  const categoryArr = [...knownCategories, ...knownGeneral];
  const hasKnownTerm = words.some(w =>
    colorArr.some(c => w === c || w.startsWith(c) || c.startsWith(w)) ||
    categoryArr.some(c => w === c || w.startsWith(c) || c.startsWith(w))
  );
  const looksLikeBrand = words.length <= 3 && !hasKnownTerm;

  // Specificity signal: material, construction, or garment-part terms stacked
  const specificTerms = [
    /\bcotton\b/i, /\bsilk\b/i, /\blinen\b/i, /\bwool\b/i, /\bcashmere\b/i,
    /\bnylon\b/i, /\bpolyester\b/i, /\bsatin\b/i, /\bvelvet\b/i, /\bdenim\b/i,
    /\bneck\b/i, /\bsleeves?\b/i, /\bwaist\b/i, /\bheels?\b/i, /\btoes?\b/i,
    /\bpleated\b/i, /\bflared\b/i, /\bfitted\b/i, /\boversize[d]?\b/i, /\bcropped\b/i,
    /\bchunky\b/i, /\bwedge\b/i, /\bplatform\b/i, /\bpointed\b/i, /\bblock\b/i,
    /\bankle\b/i, /\bknee[\s-]?high\b/i, /\bthigh[\s-]?high\b/i, /\bstrappy\b/i, /\bpeep[\s-]?toe\b/i,
    /\bopen[\s-]?toe\b/i, /\bkitten\b/i, /\bstiletto\b/i, /\bcone\b/i,
  ];
  const specificityScore = specificTerms.filter(t => t.test(query)).length;

  if (hasBrand || looksLikeBrand) {
    // Brand query: text search dominant to surface exact brand matches
    return { useHybrid: true, vectorWeight: 0.35, textWeight: 0.65 };
  }

  if (specificityScore >= 2) {
    // Attribute-stacked query: balanced split catches e.g. "chunky heel ankle boot"
    return { useHybrid: true, vectorWeight: 0.5, textWeight: 0.5 };
  }

  // Nav browse signal: short query (1-2 words) that IS a known fashion category.
  // e.g. "dresses", "shoes", "tops", "pants jeans", "handbags totes"
  // FTS ensures products that explicitly name the category rank higher;
  // vector handles semantic diversity within the category.
  const isNavBrowse = words.length <= 2 && hasKnownTerm;
  if (isNavBrowse) {
    return { useHybrid: true, vectorWeight: 0.6, textWeight: 0.4 };
  }

  // Pure style/aesthetic query: vector only to avoid noise from FTS
  // e.g. "boho summer vibes", "dark academia aesthetic", "cozy fall outfit"
  return { useHybrid: false, vectorWeight: 1.0, textWeight: 0.0 };
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract search intent from a natural language query using Claude
 */
export async function extractIntent(query: string): Promise<ParsedIntent> {
  const systemPrompt = `You are a fashion search intent parser. Your job is to analyze natural language queries about fashion and extract structured search intents.

Given a user's query, extract:
1. The occasion or context (if mentioned)
2. Style preferences and aesthetics
3. Constraints or things to avoid
4. The primary item they're looking for
5. Secondary/accessory items
6. Generate optimized search queries for each item

Return your response as JSON with this structure:
{
  "occasion": "string or null",
  "style": ["array", "of", "style", "keywords"],
  "constraints": ["things", "to", "avoid"],
  "color": "specific color mentioned (e.g., 'black', 'red', 'navy blue') or null if no color specified",
  "priceRange": {
    "min": number or null,
    "max": number or null
  },
  "primaryItem": "main item category",
  "secondaryItems": ["accessory", "items"],
  "searchQueries": [
    {
      "query": "optimized search text for semantic matching",
      "category": "dress|shoes|bags|tops|bottoms|accessories|outerwear",
      "priority": 1,
      "weight": 1.0
    }
  ],
  "explanation": "Write 2-3 sentences in a warm, friendly tone like a fashion-savvy colleague helping a friend. Start with 'I can help you find...' or 'It sounds like you're looking for...' Describe the vibe, occasion, and key style elements in detail. Add enthusiasm and be descriptive about the aesthetic. Be conversational and helpful, not robotic."
}

Important guidelines:
- Generate search queries that will work well with semantic/vector search
- Include style descriptors, colors, materials, and key features in queries
- For complex queries, break down into multiple focused searches
- Weight primary items higher (1.0) and accessories lower (0.6-0.8)
- Priority 1 is highest, increase for secondary items
- ONLY extract what the user explicitly stated - do NOT add style preferences they didn't mention
- Make contextual inferences ONLY when clearly implied (e.g., "ball" → formal, "gym" → athletic)
- NEVER default to "understated", "not flashy", or similar qualifiers unless the user said so
- If the user says "stunning" or "glamorous", preserve that - don't tone it down
- ALWAYS provide an explanation in the format described above, addressing the user directly

OUTFIT / ENSEMBLE QUERIES (CRITICAL):
- If the query contains words like "outfit", "look", "ensemble", "get dressed", "what to wear", or is clearly asking for a complete head-to-toe set of pieces, you MUST generate EXACTLY 4 searchQueries — one per category:
  1. { "query": "<style/occasion> top/blouse/shirt", "category": "tops", "priority": 1, "weight": 1.0 }
  2. { "query": "<style/occasion> pants/skirt/shorts", "category": "bottoms", "priority": 1, "weight": 1.0 }
  3. { "query": "<style/occasion> shoes/heels/sandals/boots", "category": "shoes", "priority": 2, "weight": 0.9 }
  4. { "query": "<style/occasion> bag/accessories/jewelry", "category": "accessories", "priority": 3, "weight": 0.8 }
- Adapt each query to the style and occasion (e.g., "elegant evening gown" → bottoms query becomes "formal midi skirt evening"; shoes query becomes "heeled sandals evening formal")
- Do NOT generate a single query for the whole outfit — this is the most common mistake and produces only tops in results
- Do NOT skip any of the 4 categories even if the user didn't explicitly ask for all of them

COMPOUND ITEM QUERIES (when user explicitly names 2+ specific items):
- If the user mentions 2 or more specific fashion items by name WITHOUT using outfit/ensemble keywords, generate a separate searchQuery for EACH named item — do NOT collapse them into one query
- Weight the most-described item higher (0.65–0.7), the secondary item(s) lower (0.3–0.45)
- Keep the occasion/style context in EVERY query so results stay coherent
- Examples:
  - "floral dress for a party and sandals to go with it" → TWO queries: { "query": "floral dress party casual", "category": "dress", "weight": 0.65 } and { "query": "party sandals casual", "category": "shoes", "weight": 0.35 }
  - "white blouse and black pants for work" → TWO queries: tops weight 0.6, bottoms weight 0.4
  - "evening bag to match a red dress" → TWO queries: dress weight 0.6, bags weight 0.4
  - "cozy sweater with matching scarf" → TWO queries: tops weight 0.6, accessories weight 0.4
- Signals that indicate a compound query: "and", "with", "to go with", "to match", "plus", "along with", "paired with", listing two distinct product types
- This is DIFFERENT from outfit mode: only generate queries for items explicitly named, NOT the full 4-category set

COLOR EXTRACTION (CRITICAL):
- If user specifies a color, extract it EXACTLY in the "color" field
- Common colors: black, white, red, blue, navy, pink, green, yellow, orange, purple, brown, beige, cream, grey/gray, gold, silver
- Multi-word colors: "navy blue", "forest green", "hot pink", "burgundy", "emerald green"
- Color patterns: "floral", "striped", "polka dot", "animal print" should be in style, NOT color
- If multiple colors mentioned: use primary color (e.g., "black and white dress" → "black")
- If no specific color: set color to null

PRICE RANGE EXTRACTION:
- "under $X" or "less than $X" → {"min": null, "max": X}
- "over $X" or "more than $X" → {"min": X, "max": null}
- "$X to $Y" or "$X-$Y" or "between $X and $Y" → {"min": X, "max": Y}
- "around $X" or "about $X" → {"min": X-10, "max": X+10}
- "affordable" or "budget" or "cheap" → {"min": null, "max": 50}
- "expensive" or "luxury" or "high-end" → {"min": 100, "max": null}
- If no price mentioned: {"min": null, "max": null}

Contextual inference rules:
- "brunch" or "lunch" → daytime appropriate, modest coverage, not revealing, comfortable, casual-to-smart-casual
- "dinner" or "date night" → elegant, can be more glamorous, evening appropriate
- "work" or "office" → professional, modest, business appropriate
- "party" or "club" → fun, can be more daring, evening appropriate
- "wedding guest" → elegant, formal, celebratory but not bridal colors
- "beach" or "poolside" → resort wear, vacation vibes, lightweight
- "casual" with occasion → comfortable, relaxed, everyday wear
- "summer" → light fabrics, bright colors, breathable materials
- "winter" → warm fabrics, layering pieces, deeper colors`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6', // Using Opus 4.6 (new version number format)
    max_tokens: 2048, // Increased from 1024 to allow for more detailed explanations
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Parse this fashion search query:\n\n"${query}"`,
      },
    ],
  });

  // Extract the text content from the response
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse the JSON response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Claude response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as ParsedIntent;

  // Validate the response structure
  if (!parsed.searchQueries || !Array.isArray(parsed.searchQueries)) {
    throw new Error('Invalid intent structure: missing searchQueries');
  }

  // Safety net: if secondaryItems were named but have no corresponding searchQuery,
  // add lightweight queries for them so they actually get searched.
  // This covers cases where Claude puts items in secondaryItems but forgets to
  // generate searchQueries for them (e.g., "dress and sandals" → sandals missing).
  if (parsed.secondaryItems && parsed.secondaryItems.length > 0) {
    const SECONDARY_ITEM_CATEGORY: Record<string, string> = {
      'sandal': 'shoes', 'sandals': 'shoes', 'heel': 'shoes', 'heels': 'shoes',
      'boot': 'shoes', 'boots': 'shoes', 'sneaker': 'shoes', 'sneakers': 'shoes',
      'shoe': 'shoes', 'shoes': 'shoes', 'loafer': 'shoes', 'flat': 'shoes', 'pump': 'shoes',
      'bag': 'bags', 'bags': 'bags', 'handbag': 'bags', 'purse': 'bags',
      'clutch': 'bags', 'tote': 'bags', 'backpack': 'bags',
      'pants': 'bottoms', 'jeans': 'bottoms', 'skirt': 'bottoms',
      'shorts': 'bottoms', 'trousers': 'bottoms', 'leggings': 'bottoms',
      'top': 'tops', 'tops': 'tops', 'blouse': 'tops', 'shirt': 'tops',
      'sweater': 'tops', 'cardigan': 'tops', 'cami': 'tops',
      'jacket': 'outerwear', 'coat': 'outerwear', 'blazer': 'outerwear',
      'scarf': 'accessories', 'belt': 'accessories', 'hat': 'accessories',
      'jewelry': 'accessories', 'necklace': 'accessories', 'earrings': 'accessories',
    };

    const existingCategories = new Set(parsed.searchQueries.map(q => q.category.toLowerCase()));
    const contextWords = [parsed.occasion, ...(parsed.style ?? [])].filter(Boolean).join(' ');

    for (const item of parsed.secondaryItems) {
      const itemLower = item.toLowerCase();
      let category: string | null = null;
      for (const [keyword, cat] of Object.entries(SECONDARY_ITEM_CATEGORY)) {
        if (itemLower.includes(keyword)) { category = cat; break; }
      }
      if (category && !existingCategories.has(category)) {
        console.log(`[extractIntent] Safety net: adding searchQuery for secondary item "${item}" (${category})`);
        parsed.searchQueries.push({
          query: `${contextWords} ${item}`.trim(),
          category,
          priority: 2,
          weight: 0.35,
        });
        existingCategories.add(category);
      }
    }
  }

  return parsed;
}

/**
 * Detect if query is simple enough to skip Claude API call
 * Simple queries: 1-3 words, basic item + optional color/style
 * Complex queries: Need Claude for nuanced understanding
 */
export function isSimpleQuery(query: string): boolean {
  const trimmed = query.trim();
  const wordCount = trimmed.split(/\s+/).length;

  // Too long? Use Claude
  if (wordCount > 4) return false;

  // Check for complexity indicators that need Claude
  const complexityIndicators = [
    /\$\d+/,              // Price mentions: "$100", "$50"
    /under|over|less|more|between|around/i, // Price words
    /for (a|an|the|my)/i, // Occasion phrases: "for a wedding"
    /but not|not too|without/i, // Constraints: "but not flashy"
    /with|and|or/i,       // Multi-item or detailed specs: "dress and shoes", "with pockets"
    /formal|casual|elegant|wedding|party|work|office|date/i, // Occasion/style context
    /\boutfit\b|\bensemble\b|\blook\b|\bget dressed\b|\bwhat to wear\b/i, // Outfit queries always need Claude
  ];

  for (const indicator of complexityIndicators) {
    if (indicator.test(trimmed)) {
      return false; // Complex query, use Claude
    }
  }

  // Simple query: just an item, color, or basic combo
  return true;
}

/**
 * Create a basic intent for simple queries (skip Claude call)
 * Extracts color, category, and creates a friendly explanation
 */
export function createSimpleIntent(query: string): ParsedIntent {
  const lowerQuery = query.toLowerCase();

  // Extract color
  const colorKeywords = [
    'black', 'white', 'red', 'blue', 'navy', 'green', 'yellow', 'orange',
    'purple', 'pink', 'brown', 'beige', 'cream', 'grey', 'gray', 'gold',
    'silver', 'tan', 'burgundy', 'maroon', 'olive', 'emerald', 'lavender'
  ];

  let extractedColor: string | null = null;
  for (const color of colorKeywords) {
    if (lowerQuery.includes(color)) {
      extractedColor = color;
      break;
    }
  }

  // Detect category from query.
  // Use specific category names (hat, scarf, belt, etc.) rather than the
  // broad abstract "accessories" bucket so that getCategoryMatchType in
  // search.ts can look up the right concrete product term variations.
  const categoryKeywords: Record<string, string[]> = {
    dress: ['dress', 'gown', 'frock', 'maxi', 'midi', 'sundress', 'romper', 'jumpsuit'],
    shoes: ['heels', 'boots', 'sandals', 'sneakers', 'loafers', 'pumps', 'flats', 'footwear', 'shoe', 'mule', 'wedge', 'trainer'],
    bags: ['bag', 'purse', 'handbag', 'tote', 'clutch', 'backpack', 'satchel', 'wallet'],
    tops: ['top', 'blouse', 'shirt', 'sweater', 'cardigan', 't-shirt', 'tee', 'tunic', 'tank', 'cami'],
    bottoms: ['pants', 'jeans', 'skirt', 'shorts', 'trousers', 'leggings', 'chino', 'jogger'],
    outerwear: ['jacket', 'coat', 'blazer', 'vest', 'parka', 'anorak', 'windbreaker', 'trench', 'outerwear'],
    hat: ['hat', 'cap', 'beanie', 'fedora', 'beret', 'visor', 'snapback', 'bucket hat', 'baseball cap'],
    scarf: ['scarf', 'scarves', 'wrap', 'shawl', 'stole', 'pashmina', 'bandana'],
    belt: ['belt', 'belts', 'waistband', 'sash'],
    sunglasses: ['sunglasses', 'sunglass', 'eyewear', 'shades', 'eyeglasses'],
    jewelry: ['necklace', 'necklaces', 'earring', 'earrings', 'bracelet', 'bracelets', 'ring', 'rings', 'pendant', 'bangle', 'jewelry', 'jewellery', 'jewel', 'brooch', 'anklet', 'choker'],
    accessories: ['accessory', 'accessories', 'watch', 'glove', 'gloves', 'hair clip', 'headband', 'scrunchie'],
  };

  let category = 'all';
  let itemName = query;

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      category = cat;
      // Use the matched keyword as item name
      itemName = keywords.find(kw => lowerQuery.includes(kw)) || query;
      break;
    }
  }

  // For multi-word nav queries (e.g. "pants jeans", "tops blouses"), generate
  // one searchQuery per word so the semantic search fetches a balanced mix of both.
  // If any word in the query doesn't map to a known category keyword, fall back
  // to a single combined query (this is a free-text search, not a nav browse).
  const queryWords = lowerQuery.split(/\s+/);
  const wordMatches: Array<{ word: string; cat: string }> = [];
  if (queryWords.length >= 2) {
    for (const word of queryWords) {
      let matched = false;
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => word === kw || word.startsWith(kw) || kw.startsWith(word))) {
          wordMatches.push({ word, cat });
          matched = true;
          break;
        }
      }
      if (!matched) break; // non-category word → not a pure nav query, don't split
    }
  }
  const isMultiTermNav = wordMatches.length === queryWords.length && queryWords.length >= 2;

  // Pluralize only if the word doesn't already end in s/x/z/ch/sh
  const pluralize = (word: string) =>
    /[sxz]$|[cs]h$/i.test(word) ? word : `${word}s`;

  // Create friendly, detailed explanation (2-3 sentences minimum)
  let explanation = '';
  if (extractedColor && category !== 'all') {
    explanation = `I can help you find ${extractedColor} ${pluralize(itemName)}! I'm searching our collection specifically for ${extractedColor} ${pluralize(itemName)} that match your style. I'll prioritize items where the color is verified from product images to ensure you get exactly what you're looking for.`;
  } else if (extractedColor) {
    explanation = `Perfect! I'm searching for ${extractedColor} items across our entire collection. I'll use AI-verified color matching to show you pieces that are genuinely ${extractedColor}, not just items that mention the color in the description. This ensures you get the exact shade you're looking for!`;
  } else if (category !== 'all') {
    explanation = `I can help you find great ${pluralize(itemName)}! I'm browsing through our ${itemName} collection using semantic search to understand the style and vibe you're after. I'll show you options that match your aesthetic, sorted by relevance to ensure the best matches appear first.`;
  } else {
    explanation = `I understand you're looking for "${query}"! I'm using semantic search to find items that match the style, aesthetic, and vibe you're describing. Let me show you what I've found that best captures what you're looking for.`;
  }

  return {
    color: extractedColor,
    searchQueries: isMultiTermNav
      ? wordMatches.map(m => ({
          query: m.word,
          category: m.cat,
          priority: 1,
          weight: 1.0 / wordMatches.length,
        }))
      : [
          {
            query: query,
            category: category,
            priority: 1,
            weight: 1.0,
          },
        ],
    explanation,
  };
}
