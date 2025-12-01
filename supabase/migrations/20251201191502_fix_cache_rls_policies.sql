/*
  # Fix Cache RLS Policies

  1. Changes
    - Drop existing restrictive admin policies on brand_search_cache
    - Add simple authenticated user policies for cache management
    - Allow any authenticated user to manage cache (since admin panel has its own access control)
  
  2. Security
    - Policies restricted to authenticated users only
    - Cache operations require authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete cache" ON brand_search_cache;
DROP POLICY IF EXISTS "Admins can insert cache" ON brand_search_cache;
DROP POLICY IF EXISTS "Admins can update cache" ON brand_search_cache;

-- Create new policies that allow authenticated users to manage cache
CREATE POLICY "Authenticated users can delete cache"
  ON brand_search_cache
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cache"
  ON brand_search_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cache"
  ON brand_search_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
