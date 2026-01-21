-- ============================================
-- Product Feedback Table Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Create the feedback table
CREATE TABLE IF NOT EXISTS public.product_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid NULL,  -- Will be populated when OAuth is added (Day 2)
  product_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One vote per session per product (allows users to change their vote)
  CONSTRAINT product_feedback_session_product_key UNIQUE (session_id, product_id)
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_feedback_product ON public.product_feedback(product_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.product_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON public.product_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.product_feedback(user_id) WHERE user_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.product_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert/update/select (for anonymous voting)
-- This allows public access for the MVP. Tighten in production.
CREATE POLICY "Public can manage feedback" ON public.product_feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.product_feedback IS 'Stores user feedback (upvotes/downvotes) for products. Supports anonymous sessions via session_id.';
COMMENT ON COLUMN public.product_feedback.vote IS '+1 for upvote, -1 for downvote';
COMMENT ON COLUMN public.product_feedback.session_id IS 'UUID from browser localStorage for anonymous users';
COMMENT ON COLUMN public.product_feedback.user_id IS 'References authenticated user (NULL for anonymous sessions)';
