import { config } from "https://deno.land/x/dotenv/mod.ts";
import { createClient } from "@supabase/supabase-js";

const env = config();
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.from('admin_settings').select('*').limit(1);
  console.log('Minimal Supabase test:');
  console.log('Error:', error);
  console.log('Data:', data);
})();
