import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1dQMNF69WnXVQdhlLvUZTig3kL97NA21k6eZ9HRu6xiQ';
const SHEET_NAME = '◉ Leads';
const SHEET_RANGE = `${SHEET_NAME}!A:AG`;
const SHEET_CACHE_TTL_MS = 2 * 60 * 1000;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let cachedSheetPayload: { data: unknown; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await response.json();
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max((Number(data.expires_in) || 3600) * 1000 - TOKEN_EXPIRY_BUFFER_MS, 0),
  };

  return cachedAccessToken.token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (cachedSheetPayload && cachedSheetPayload.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cachedSheetPayload.data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
          'X-Lead-Cache': 'HIT',
        },
      });
    }

    const accessToken = await getAccessToken();
    
    const encodedSheet = encodeURIComponent(SHEET_RANGE);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodedSheet}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Sheets API error [${response.status}]: ${err}`);
    }

    const data = await response.json();
    cachedSheetPayload = {
      data,
      expiresAt: Date.now() + SHEET_CACHE_TTL_MS,
    };

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
        'X-Lead-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
