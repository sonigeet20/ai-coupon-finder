# Database Migration Instructions

## Apply These Migrations to Fix All Errors

### Step 1: Create Missing Tables
1. Open: https://supabase.com/dashboard/project/aeyoxqmymruxxrjcqnpm/sql/new
2. Copy and paste the following SQL:

```sql
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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update own location" ON public.user_locations;

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
```

3. Click **RUN** button

### Step 2: Fix Admin Settings RLS
1. In the same SQL Editor (or open a new one)
2. Copy and paste the following SQL:

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admin users to read admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow admin users to update admin_settings" ON admin_settings;

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users with admin role to read
CREATE POLICY "Allow admin users to read admin_settings"
ON admin_settings
FOR SELECT
TO authenticated
USING (
  (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Create policy to allow users with admin role to update
CREATE POLICY "Allow admin users to update admin_settings"
ON admin_settings
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
)
WITH CHECK (
  (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);
```

3. Click **RUN** button

### Step 3: Verify and Test
1. Close all browser tabs with your app
2. Clear browser cache (Cmd+Shift+R on Mac, or Ctrl+Shift+R on Windows)
3. Reload the app at http://localhost:5173
4. Log in again
5. All errors should be gone and admin panel should be accessible

## What These Migrations Fix
- ✅ Creates `user_profiles` table (fixes ProfilePage errors)
- ✅ Creates `user_locations` table (fixes geolocation errors)
- ✅ Fixes RLS policies on `admin_settings` (enables admin panel access)
- ✅ Sets up proper Row Level Security for all tables
- ✅ Adds performance indexes

After running both migrations, all the 400/404 errors will disappear.
