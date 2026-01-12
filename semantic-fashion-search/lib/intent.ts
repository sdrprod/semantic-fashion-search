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
  "explanation": "Write 2-3 sentences in a warm, friendly tone like a fashion-savvy colleague helping a friend. Start with 'I can help you find...' or 'It sounds like you're looking for...' Describe the vibe, occasion, and key style elements in detail. Add enthusiasm and be descriptive about the aesthetic. End with 'Does that sound right?' or 'How does that sound?' to invite feedback. Be conversational and helpful, not robotic."
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
- ALWAYS provide an explanation in the format described above, addressing the user directly`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
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
 * Generate a simple search query for straightforward inputs
 */
export function isSimpleQuery(query: string): boolean {
  // Consider it simple if it's short and doesn't have conversational markers
  const conversationalMarkers = [
    'i need', 'i want', 'looking for', 'help me', 'show me',
    'going to', 'attending', 'for a', 'that', 'which', 'but not',
    'without', 'similar to', 'like the'
  ];

  const lowerQuery = query.toLowerCase();
  const hasConversationalMarker = conversationalMarkers.some(marker =>
    lowerQuery.includes(marker)
  );

  return query.length < 50 && !hasConversationalMarker;
}

/**
 * Create a basic intent for simple queries (skip Claude call)
 */
export function createSimpleIntent(query: string): ParsedIntent {
  // Detect category from query
  const categoryKeywords: Record<string, string[]> = {
    dress: ['dress', 'gown', 'frock'],
    shoes: ['shoes', 'heels', 'boots', 'sandals', 'sneakers', 'loafers'],
    bags: ['bag', 'purse', 'handbag', 'tote', 'clutch', 'backpack'],
    tops: ['top', 'blouse', 'shirt', 'sweater', 'cardigan', 't-shirt'],
    bottoms: ['pants', 'jeans', 'skirt', 'shorts', 'trousers'],
    outerwear: ['jacket', 'coat', 'blazer', 'cardigan'],
    accessories: ['jewelry', 'scarf', 'belt', 'hat', 'watch', 'sunglasses'],
  };

  const lowerQuery = query.toLowerCase();
  let category = 'all';

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      category = cat;
      break;
    }
  }

  return {
    searchQueries: [
      {
        query: query,
        category: category,
        priority: 1,
        weight: 1.0,
      },
    ],
    explanation: `I can help you find ${query}! I'll search through our collection to find pieces that match what you're looking for. Does that sound right?`,
  };
}
