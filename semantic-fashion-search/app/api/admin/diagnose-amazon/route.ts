import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseClient();

  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      results: {},
    };

    // 1. Count total Amazon products
    const { count: totalAmazon } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_network', 'amazon');

    diagnostics.results.totalAmazonProducts = totalAmazon;

    // 2. Count with text embeddings
    const { count: withTextEmbeddings } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_network', 'amazon')
      .not('text_embedding', 'is', null);

    diagnostics.results.amazonWithTextEmbeddings = withTextEmbeddings;

    // 3. Count with vision embeddings
    const { count: withVisionEmbeddings } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_network', 'amazon')
      .not('vision_embedding', 'is', null);

    diagnostics.results.amazonWithVisionEmbeddings = withVisionEmbeddings;

    // 4. Sample Amazon black dress products
    const { data: blackDresses } = await supabase
      .from('products')
      .select('id, title, color, category, price, text_embedding, vision_embedding')
      .eq('affiliate_network', 'amazon')
      .ilike('title', '%black%dress%')
      .limit(10);

    diagnostics.results.blackDressesInTitle = blackDresses?.length || 0;
    diagnostics.results.blackDressSamples = blackDresses?.map((p) => ({
      id: p.id,
      title: p.title,
      color: p.color,
      category: p.category,
      price: p.price,
      hasTextEmbedding: !!p.text_embedding,
      hasVisionEmbedding: !!p.vision_embedding,
    })) || [];

    // 5. Count Amazon products by color "black"
    const { count: blackProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_network', 'amazon')
      .eq('color', 'black');

    diagnostics.results.amazonColorBlack = blackProducts;

    // 6. Count Amazon products by category "dress"
    const { count: dressProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_network', 'amazon')
      .eq('category', 'dress');

    diagnostics.results.amazonCategoryDress = dressProducts;

    // 7. Sample any Amazon products (first 5)
    const { data: anySample } = await supabase
      .from('products')
      .select('id, title, color, category, price, affiliate_network, text_embedding, vision_embedding')
      .eq('affiliate_network', 'amazon')
      .limit(5);

    diagnostics.results.firstFiveSamples = anySample?.map((p) => ({
      id: p.id,
      title: p.title,
      color: p.color,
      category: p.category,
      price: p.price,
      hasTextEmbedding: !!p.text_embedding,
      hasVisionEmbedding: !!p.vision_embedding,
    })) || [];

    // 8. Check if any Amazon products have BOTH embeddings
    const { count: withBothEmbeddings } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_network', 'amazon')
      .not('text_embedding', 'is', null)
      .not('vision_embedding', 'is', null);

    diagnostics.results.amazonWithBothEmbeddings = withBothEmbeddings;

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    console.error('[Diagnose Amazon] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
