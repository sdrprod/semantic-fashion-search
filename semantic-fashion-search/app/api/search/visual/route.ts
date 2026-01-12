import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { semanticSearch } from '@/lib/search';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Security limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 3;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Rate limiting (simple in-memory, consider Redis for production)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}. Only JPG, PNG, and WebP allowed.` };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max 5MB allowed.` };
  }

  return { valid: true };
}

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Convert image to base64 data URL for GPT-4 Vision
 */
async function imageToBase64DataUrl(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');

  // Determine MIME type
  let mimeType = file.type;
  if (!mimeType || mimeType === 'application/octet-stream') {
    // Fallback to jpeg if MIME type is unknown
    mimeType = 'image/jpeg';
  }

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Analyze images using GPT-4 Vision to extract fashion details
 */
async function analyzeImagesWithVision(imageDataUrls: string[]): Promise<string> {
  try {
    console.log(`[Visual Search] Analyzing ${imageDataUrls.length} images with GPT-4 Vision...`);

    // Build content array with all images
    const content: any[] = [
      {
        type: 'text',
        text: 'List the fashion items with: type, style, colors, patterns, materials, fit. Be concise and specific.'
      }
    ];

    // Add all images
    for (const imageUrl of imageDataUrls) {
      content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
          detail: 'low' // Use low detail for faster processing
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper model
      messages: [
        {
          role: 'user',
          content
        }
      ],
      max_tokens: 150, // Reduced for faster response
      temperature: 0.2, // Lower temperature for more consistent descriptions
    });

    const description = response.choices[0]?.message?.content || '';
    console.log('[Visual Search] GPT-4 Vision description:', description);

    return description;
  } catch (error) {
    console.error('[Visual Search] Error analyzing images with GPT-4 Vision:', error);
    throw new Error('Failed to analyze images');
  }
}

/**
 * POST handler for visual search
 * Supports:
 * 1. Image-only search
 * 2. Text-only search
 * 3. Hybrid search (images + text for granular results)
 */
export async function POST(request: NextRequest) {
  console.log('[Visual Search API] Request received');

  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      console.log('[Visual Search API] Rate limit exceeded:', ip);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const textQuery = formData.get('query') as string | null;
    const files: File[] = [];

    // Extract files
    for (let i = 0; i < MAX_FILES; i++) {
      const file = formData.get(`image${i}`) as File | null;
      if (file) {
        files.push(file);
      }
    }

    // Validate at least one input
    if (files.length === 0 && !textQuery) {
      return NextResponse.json(
        { error: 'Please provide at least one image or a text query.' },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} images allowed.` },
        { status: 400 }
      );
    }

    console.log('[Visual Search API] Files received:', files.length);
    console.log('[Visual Search API] Text query:', textQuery || 'none');

    // Validate each file
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    let finalSearchQuery = '';

    // If images provided, analyze them with GPT-4 Vision
    if (files.length > 0) {
      console.log(`[Visual Search API] Processing ${files.length} images...`);

      const imageDataUrls: string[] = [];
      for (const file of files) {
        try {
          const dataUrl = await imageToBase64DataUrl(file);
          imageDataUrls.push(dataUrl);
        } catch (error) {
          console.error('[Visual Search API] Error converting image:', error);
          return NextResponse.json(
            { error: 'Failed to process image. Please ensure it\'s a valid image file.' },
            { status: 400 }
          );
        }
      }

      // Analyze images with GPT-4 Vision
      try {
        const imageDescription = await analyzeImagesWithVision(imageDataUrls);

        // Combine image description with text query if provided
        if (textQuery && textQuery.trim().length > 0) {
          // Hybrid search: combine user's text with AI-generated image description
          finalSearchQuery = `${textQuery.trim()}. Additional context from images: ${imageDescription}`;
          console.log('[Visual Search API] Hybrid search query:', finalSearchQuery);
        } else {
          // Image-only search
          finalSearchQuery = imageDescription;
          console.log('[Visual Search API] Image-only search query:', finalSearchQuery);
        }
      } catch (error) {
        console.error('[Visual Search API] Error analyzing images:', error);
        return NextResponse.json(
          { error: 'Failed to analyze images. Please try again.' },
          { status: 500 }
        );
      }
    } else {
      // Text-only search (fallback)
      finalSearchQuery = textQuery!.trim();
      console.log('[Visual Search API] Text-only search:', finalSearchQuery);
    }

    // Use semantic search with the combined query
    console.log('[Visual Search API] Executing semantic search...');
    const searchResponse = await semanticSearch(finalSearchQuery, {
      limit: 24,
      page: 1,
      similarityThreshold: 0.3,
      enableImageValidation: false, // Don't need image validation for visual search
    });

    console.log(`[Visual Search API] Found ${searchResponse.results.length} results`);

    // Format response
    const response = {
      results: searchResponse.results,
      totalCount: searchResponse.totalCount,
      query: finalSearchQuery,
      intent: searchResponse.intent,
      qualityWarning: searchResponse.qualityWarning,
      meta: {
        imagesProcessed: files.length,
        textQuery: textQuery || null,
        searchType: files.length > 0 && textQuery ? 'hybrid' : files.length > 0 ? 'visual' : 'text',
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Visual Search API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
