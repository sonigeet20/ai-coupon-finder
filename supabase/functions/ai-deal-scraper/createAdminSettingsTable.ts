import { config } from "https://deno.land/x/dotenv/mod.ts";
import { createClient } from "@supabase/supabase-js";

const env = config();
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  // Create table if not exists
  await supabase.rpc('execute_sql', {
    sql: `
      create table if not exists admin_settings (
        id uuid default gen_random_uuid() primary key,
        setting_key text unique not null,
        setting_value text not null
      );
    `
  });

  // Insert or update the OpenAI key
  const openaiKey = env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    Deno.exit(1);
  }

  const { error } = await supabase.from('admin_settings').upsert([
    {
      setting_key: 'openai_api_key',
      setting_value: openaiKey
    }
  ], { onConflict: 'setting_key' });

  if (error) {
    console.error('Error inserting OpenAI key:', error);
  } else {
    console.log('OpenAI key inserted/updated successfully.');
  }
})();
