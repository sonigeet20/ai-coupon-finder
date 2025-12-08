



import { config } from "https://deno.land/x/dotenv/mod.ts";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env
const env = config();
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) throw new Error("supabaseUrl is required.");
if (!supabaseKey) throw new Error("supabaseKey is required.");
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getBrandNameSuggestions(query: string): Promise<string[]> {
  // Use OpenAI to get brand name suggestions

  const { data: apiKeyData, error: keyError } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'openai_api_key')
    .single();

  if (keyError || !apiKeyData?.setting_value) {
    console.error('Supabase error:', keyError);
    console.error('Supabase data:', apiKeyData);
    return [query];
  }

  const openaiApiKey = apiKeyData.setting_value;
  const suggestionPrompt = `Suggest up to 10 real brand names that closely match the user input. Only return a JSON array of brand names, no other text. User input: "${query}"`;

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a brand name suggestion assistant. Only respond with a JSON array of brand names.' },
        { role: 'user', content: suggestionPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!openaiResponse.ok) {
    return [query];
  }

  const aiResult = await openaiResponse.json();
  let suggestions: string[] = [];
  try {
    const content = aiResult.choices[0]?.message?.content || '[]';
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    suggestions = JSON.parse(cleanContent);
  } catch {
    suggestions = [query];
  }
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    suggestions = [query];
  }
  return suggestions;
}
