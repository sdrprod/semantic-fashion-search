-- ============================================
-- Semantic Fashion Search - Schema Migration
-- ============================================
-- Run this SQL in your Supabase SQL editor to add new features

-- 1. Add affiliate tracking columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS affiliate_network text,
ADD COLUMN IF NOT EXISTS merchant_id text,
ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2),
ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true;

-- 2. Create unique constraint on product_url for upserts
ALTER TABLE public.products
ADD CONSTRAINT products_product_url_key UNIQUE (product_url);

-- 3. Create users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create search_settings table for admin tuning
CREATE TABLE IF NOT EXISTS public.search_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  similarity_threshold numeric(4,3) DEFAULT 0.3,
  diversity_factor numeric(4,3) DEFAULT 0.1,
  category_weights jsonb DEFAULT '{}',
  brand_boosts jsonb DEFAULT '{}',
  default_page_size integer DEFAULT 10,
  max_page_size integer DEFAULT 50,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id)
);

-- 5. Create email_subscribers table
CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  preferences jsonb DEFAULT '{"newArrivals": true, "sales": true, "recommendations": true}',
  unsubscribed_at timestamptz
);

-- 6. Create search_analytics table for tracking
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  intent jsonb,
  results_count integer,
  user_id uuid REFERENCES public.users(id),
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Create page_content table for SEO/content management
CREATE TABLE IF NOT EXISTS public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text,
  meta_keywords text[],
  content text,
  json_ld jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id)
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_affiliate ON public.products(affiliate_network);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON public.search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_page_content_slug ON public.page_content(slug);

-- 9. Enable RLS on new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for users table
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 11. Create RLS policies for public read access to page_content
CREATE POLICY "Public can read page content" ON public.page_content
  FOR SELECT USING (true);

-- 12. Create policy for service role full access
CREATE POLICY "Service role full access users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access settings" ON public.search_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access subscribers" ON public.email_subscribers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access analytics" ON public.search_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access page_content" ON public.page_content
  FOR ALL USING (auth.role() = 'service_role');

-- 13. Insert default search settings
INSERT INTO public.search_settings (similarity_threshold, diversity_factor, default_page_size)
VALUES (0.3, 0.1, 10)
ON CONFLICT DO NOTHING;

-- 14. Insert default page content for homepage
INSERT INTO public.page_content (slug, title, meta_description, content)
VALUES (
  'home',
  'Semantic Fashion Search - AI-Powered Fashion Discovery',
  'Discover clothing that matches your exact vision using natural language. Our AI understands your style preferences.',
  'Welcome to Semantic Fashion Search'
)
ON CONFLICT (slug) DO NOTHING;
