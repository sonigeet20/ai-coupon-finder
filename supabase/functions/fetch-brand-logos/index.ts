import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Multiple logo services to try in order
const logoServices = [
  {
    name: 'Clearbit',
    getUrl: (domain: string) => `https://logo.clearbit.com/${domain}`,
  },
  {
    name: 'Google Favicon',
    getUrl: (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  },
  {
    name: 'DuckDuckGo',
    getUrl: (domain: string) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  },
  {
    name: 'Favicon Kit',
    getUrl: (domain: string) => `https://api.faviconkit.com/${domain}/144`,
  },
];

function getBrandDomain(brandName: string): string {
  const cleanName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Common brand domain mappings
  const domainMap: Record<string, string> = {
    'adidas': 'adidas.com',
    'nike': 'nike.com',
    'amazon': 'amazon.com',
    'walmart': 'walmart.com',
    'target': 'target.com',
    'bestbuy': 'bestbuy.com',
    'apple': 'apple.com',
    'samsung': 'samsung.com',
    'mcdonalds': 'mcdonalds.com',
    'starbucks': 'starbucks.com',
    'subway': 'subway.com',
    'pizzahut': 'pizzahut.com',
    'dominos': 'dominos.com',
    'kfc': 'kfc.com',
    'burgerking': 'bk.com',
    'zara': 'zara.com',
    'hm': 'hm.com',
    'gap': 'gap.com',
    'uniqlo': 'uniqlo.com',
    'levis': 'levi.com',
    'gucci': 'gucci.com',
    'prada': 'prada.com',
    'louisvuitton': 'louisvuitton.com',
    'chanel': 'chanel.com',
    'dior': 'dior.com',
    'uber': 'uber.com',
    'lyft': 'lyft.com',
    'airbnb': 'airbnb.com',
    'booking': 'booking.com',
    'expedia': 'expedia.com',
    'netflix': 'netflix.com',
    'spotify': 'spotify.com',
    'youtube': 'youtube.com',
    'disney': 'disney.com',
  };
  
  return domainMap[cleanName] || `${cleanName}.com`;
}

async function fetchLogoFromService(domain: string, service: typeof logoServices[0]): Promise<string | null> {
  try {
    const url = service.getUrl(domain);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });
    
    if (response.ok) {
      console.log(`✓ Found logo for ${domain} using ${service.name}`);
      return url;
    }
    return null;
  } catch (error) {
    console.log(`✗ ${service.name} failed for ${domain}:`, error.message);
    return null;
  }
}

async function findBestLogoUrl(brandName: string): Promise<string | null> {
  const domain = getBrandDomain(brandName);
  
  // Try each service in order until we find a working logo
  for (const service of logoServices) {
    const logoUrl = await fetchLogoFromService(domain, service);
    if (logoUrl) {
      return logoUrl;
    }
  }
  
  console.log(`No logo found for ${brandName} (${domain})`);
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { brandName, updateAll } = await req.json();

    if (updateAll) {
      // Fetch all unique brands from coupons
      const { data: coupons, error: couponsError } = await supabase
        .from('coupons')
        .select('brand_name, brand_logo_url')
        .eq('is_active', true);

      if (couponsError) throw couponsError;

      // Get unique brands without logos
      const uniqueBrands = [...new Set(coupons?.map(c => c.brand_name) || [])];
      const brandsNeedingLogos = uniqueBrands.filter(brand => {
        const coupon = coupons?.find(c => c.brand_name === brand);
        return !coupon?.brand_logo_url;
      });

      console.log(`Found ${brandsNeedingLogos.length} brands without logos`);

      const results = [];
      for (const brand of brandsNeedingLogos) {
        const logoUrl = await findBestLogoUrl(brand);
        
        if (logoUrl) {
          // Update all coupons for this brand
          const { error: updateError } = await supabase
            .from('coupons')
            .update({ brand_logo_url: logoUrl })
            .eq('brand_name', brand)
            .is('brand_logo_url', null);

          if (!updateError) {
            results.push({ brand, logoUrl, status: 'updated' });
          } else {
            results.push({ brand, logoUrl, status: 'error', error: updateError.message });
          }
        } else {
          results.push({ brand, status: 'not_found' });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return new Response(JSON.stringify({
        success: true,
        processed: brandsNeedingLogos.length,
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (brandName) {
      // Fetch logo for a single brand
      const logoUrl = await findBestLogoUrl(brandName);

      if (logoUrl) {
        // Update all coupons for this brand
        const { error: updateError } = await supabase
          .from('coupons')
          .update({ brand_logo_url: logoUrl })
          .eq('brand_name', brandName);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          success: true,
          brand: brandName,
          logoUrl,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          brand: brandName,
          message: 'No logo found from any service',
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({
        error: 'Please provide brandName or set updateAll to true',
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error('Error in fetch-brand-logos:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
