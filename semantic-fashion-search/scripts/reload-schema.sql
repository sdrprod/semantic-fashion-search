-- Reload Supabase schema cache
-- Run this in Supabase SQL Editor after creating/modifying tables

NOTIFY pgrst, 'reload schema';
