import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

function getBrandLogoUrl(brandName: string): string {
  const cleanName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://logo.clearbit.com/${cleanName}.com`;
}

function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query, location, city, category } = await req.json();

    console.log('AI Scraper called with:', { query, location, city, category });

    const { data: apiKeyData, error: keyError } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'openai_api_key')
      .single();

    if (keyError || !apiKeyData?.setting_value) {
      console.log('No OpenAI API key configured');
      return new Response(JSON.stringify({
        deals: [],
        message: "AI scraping requires OpenAI API key. Configure it in Admin Settings.",
        fallback: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiApiKey = apiKeyData.setting_value;
    const today = new Date().toISOString().split('T')[0];
    const minValidDate = getFutureDate(7); // At least 7 days valid

    const searchPrompt = `You are a deal finder assistant. Find the LATEST, CURRENTLY ACTIVE LOCAL deals for "${query}" in ${city || location}, ${location}.

CRITICAL REQUIREMENTS:
1. Return EXACTLY 10 LOCAL deals for ${city || location}, ${location}
2. ONLY local deals - NO global/international/worldwide deals
3. Focus on stores, brands, and businesses that operate in ${location}
4. ONLY return deals that are CURRENTLY ACTIVE and VALID TODAY (${today})
5. ALL deals MUST be valid for AT LEAST 7 DAYS from today
6. Find the NEWEST and MOST RECENT deals available
7. Include verified discount codes when available
8. Include actual URLs to the deals
${category ? `9. Focus on ${category} category deals` : ''}
10. Use real brand names (e.g., Nike, Adidas, Samsung, etc.)
11. All deals MUST be for ${city || location}, ${location} specifically
12. Set valid_until dates between ${minValidDate.split('T')[0]} and 2026-12-31
13. DO NOT include expired or past deals
14. Only include deals that are active RIGHT NOW

Return ONLY a JSON array with EXACTLY 10 LOCAL, VALID, FUTURE deals (no markdown, no explanation):
[
  {
    "brand_name": "Nike",
    "title": "Specific deal title",
    "description": "Clear description of the offer",
    "discount_percentage": 20,
    "discount_amount": null,
    "code": "CODE20" or null,
    "category": "${category || 'General'}",
    "location": "${city || location}",
    "country": "${location}",
    "valid_until": "2026-01-31T23:59:59Z",
    "external_url": "https://nike.com/deal"
  }
]

IMPORTANT: Every deal must have valid_until date in the FUTURE (after ${today}). No expired deals!`;

    console.log('Calling OpenAI API for latest local deals...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a deal finder that returns ONLY the LATEST, CURRENTLY ACTIVE, VALID LOCAL deals in JSON format. Today is ${today}. Always return exactly 10 local deals for the specific location. Every deal MUST be valid today and in the future (valid_until must be after ${today}). Use well-known brand names like Nike, Adidas, Samsung, Apple, etc. NEVER include expired deals.`
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(JSON.stringify({
        deals: [],
        message: `OpenAI API error: ${openaiResponse.statusText}`,
        fallback: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await openaiResponse.json();
    console.log('OpenAI response received');

    let deals = [];
    try {
      const content = aiResult.choices[0]?.message?.content || '[]';
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      deals = JSON.parse(cleanContent);
      
      // Filter out any expired deals and validate dates
      const now = new Date();
      deals = deals.filter((deal: any) => {
        const validUntil = new Date(deal.valid_until);
        return validUntil > now;
      });
      
      // Add brand logos using Clearbit
      deals = deals.map((deal: any) => ({
        ...deal,
        brand_logo_url: getBrandLogoUrl(deal.brand_name)
      }));
      
      console.log(`Parsed ${deals.length} valid local deals from AI response`);
      console.log(`All deals valid after ${today}`);

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      deals = [];
    }

    return new Response(JSON.stringify({
      deals: deals,
      message: deals.length > 0 ? `Found ${deals.length} valid local deals` : 'No deals found',
      fallback: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in ai-deal-scraper:', error);
    return new Response(
      JSON.stringify({ 
        deals: [], 
        error: error.message,
        fallback: true 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});