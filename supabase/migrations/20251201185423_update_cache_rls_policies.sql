/*
  # Update Cache Table RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Add policies to allow admins to manage cache
    - Keep read access for all authenticated users

  2. Security
    - Admins can insert, update, and delete cache entries
    - All authenticated users can read cache
*/

DROP POLICY IF EXISTS "Service role can insert brand search cache" ON brand_search_cache;
DROP POLICY IF EXISTS "Service role can update brand search cache" ON brand_search_cache;
DROP POLICY IF EXISTS "Service role can delete old brand search cache" ON brand_search_cache;

CREATE POLICY "Admins can insert cache"
  ON brand_search_cache FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE updated_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update cache"
  ON brand_search_cache FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE updated_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE updated_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete cache"
  ON brand_search_cache FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE updated_by = auth.uid()
    )
  );
