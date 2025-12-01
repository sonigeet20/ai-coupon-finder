/*
  # Create AI Prompts Table

  1. New Tables
    - `ai_prompts`
      - `id` (uuid, primary key)
      - `prompt_name` (text, unique) - Name/identifier for the prompt
      - `prompt_text` (text) - The actual AI prompt template
      - `description` (text) - Description of what the prompt does
      - `category` (text) - Category like 'search', 'scraping', 'content'
      - `is_active` (boolean) - Whether the prompt is currently in use
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid) - Reference to user who last updated

  2. Security
    - Enable RLS on `ai_prompts` table
    - Add policy for authenticated users to read prompts
    - Add policy for admins to manage prompts
*/

CREATE TABLE IF NOT EXISTS ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name text UNIQUE NOT NULL,
  prompt_text text NOT NULL DEFAULT '',
  description text DEFAULT '',
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active prompts"
  ON ai_prompts FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert prompts"
  ON ai_prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE updated_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update prompts"
  ON ai_prompts FOR UPDATE
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

CREATE POLICY "Admins can delete prompts"
  ON ai_prompts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE updated_by = auth.uid()
    )
  );

INSERT INTO ai_prompts (prompt_name, prompt_text, description, category, updated_by)
VALUES 
  ('search_enhancement', 'Enhance this search query for better coupon discovery: {query}. Return a list of related keywords and brand names that would help find relevant deals.', 'Enhances user search queries for better results', 'search', (SELECT updated_by FROM admin_settings LIMIT 1)),
  ('deal_extraction', 'Extract coupon deals from the following content: {content}. Return structured data with brand, title, discount, code, and expiry date.', 'Extracts deal information from scraped content', 'scraping', (SELECT updated_by FROM admin_settings LIMIT 1)),
  ('blog_generation', 'Write a blog post about {topic} in the context of saving money with coupons. Make it engaging and SEO-friendly with 800-1000 words.', 'Generates blog content about deals and savings', 'content', (SELECT updated_by FROM admin_settings LIMIT 1))
ON CONFLICT (prompt_name) DO NOTHING;
