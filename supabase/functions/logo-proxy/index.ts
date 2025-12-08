import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const brandName = url.searchParams.get('brand');
    
    if (!brandName) {
      return new Response(JSON.stringify({ error: 'Brand name required' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const logoUrl = `https://logo.clearbit.com/${cleanName}.com`;

    // Fetch the logo from Clearbit server-side
    const logoResponse = await fetch(logoUrl);
    
    if (!logoResponse.ok) {
      return new Response(null, {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Forward the image with proper headers
    const imageData = await logoResponse.arrayBuffer();
    const contentType = logoResponse.headers.get('content-type') || 'image/png';

    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('Logo proxy error:', error);
    return new Response(null, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
