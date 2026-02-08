import Anthropic from '@anthropic-ai/sdk';
import type { ParsedIntent, SearchQuery } from '@/types';

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
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
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

  // Detect category from query
  const categoryKeywords: Record<string, string[]> = {
    dress: ['dress', 'gown', 'frock'],
    shoes: ['shoes', 'heels', 'boots', 'sandals', 'sneakers', 'loafers', 'pumps', 'flats'],
    bags: ['bag', 'purse', 'handbag', 'tote', 'clutch', 'backpack', 'satchel'],
    tops: ['top', 'blouse', 'shirt', 'sweater', 'cardigan', 't-shirt', 'tee'],
    bottoms: ['pants', 'jeans', 'skirt', 'shorts', 'trousers', 'leggings'],
    outerwear: ['jacket', 'coat', 'blazer'],
    accessories: ['jewelry', 'scarf', 'belt', 'hat', 'watch', 'sunglasses', 'necklace', 'earrings', 'bracelet'],
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

  // Create friendly explanation
  let explanation = 'I can help you find ';
  if (extractedColor && category !== 'all') {
    explanation += `${extractedColor} ${itemName}s! I'll show you ${extractedColor} options that match your style.`;
  } else if (extractedColor) {
    explanation += `${extractedColor} items! I'll search for ${extractedColor} pieces in our collection.`;
  } else if (category !== 'all') {
    explanation += `${itemName}s! I'll browse through our ${itemName} collection to find great matches.`;
  } else {
    explanation += `${query}! I'll search through our collection to find pieces that match what you're looking for.`;
  }

  return {
    color: extractedColor,
    searchQueries: [
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
