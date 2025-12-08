-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create user_locations table
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT,
  country_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own location
CREATE POLICY "Users can read own location" ON public.user_locations
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own location
CREATE POLICY "Users can insert own location" ON public.user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own location
CREATE POLICY "Users can update own location" ON public.user_locations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
