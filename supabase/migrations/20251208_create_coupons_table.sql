-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  discount_amount DECIMAL(10, 2),
  code TEXT,
  category TEXT NOT NULL,
  location TEXT,
  country TEXT NOT NULL DEFAULT 'Worldwide',
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  brand_logo_url TEXT,
  external_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active coupons
CREATE POLICY "Anyone can read active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to insert coupons
CREATE POLICY "Authenticated users can insert coupons" ON public.coupons
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update their own coupons or admins to update any
CREATE POLICY "Authenticated users can update coupons" ON public.coupons
  FOR UPDATE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_brand_name ON public.coupons(brand_name);
CREATE INDEX IF NOT EXISTS idx_coupons_category ON public.coupons(category);
CREATE INDEX IF NOT EXISTS idx_coupons_country ON public.coupons(country);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);

-- Create saved_coupons table for users to save their favorite coupons
CREATE TABLE IF NOT EXISTS public.saved_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- Enable RLS
ALTER TABLE public.saved_coupons ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own saved coupons
CREATE POLICY "Users can read own saved coupons" ON public.saved_coupons
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own saved coupons
CREATE POLICY "Users can insert own saved coupons" ON public.saved_coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own saved coupons
CREATE POLICY "Users can delete own saved coupons" ON public.saved_coupons
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_saved_coupons_user_id ON public.saved_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_coupons_coupon_id ON public.saved_coupons(coupon_id);
