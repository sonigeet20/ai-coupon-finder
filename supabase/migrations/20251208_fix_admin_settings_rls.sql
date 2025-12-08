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
