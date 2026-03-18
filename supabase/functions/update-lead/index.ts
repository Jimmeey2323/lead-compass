import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MOMENCE_BASE_URL = 'https://momence.com/_api/primary/host/13752/customer-leads';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cookies = Deno.env.get('MOMENCE_ALL_COOKIES');
    if (!cookies) {
      throw new Error('MOMENCE_ALL_COOKIES is not configured for the update-lead function');
    }

    const { leadId, payload } = await req.json();

    if (!leadId) {
      return new Response(JSON.stringify({ error: 'leadId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload ?? {}).filter(([, value]) => {
        if (value === undefined || value === null) {
          return false;
        }
        return true;
      }),
    );

    if (Object.keys(sanitizedPayload).length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'No changed fields to update' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`${MOMENCE_BASE_URL}/${leadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify(sanitizedPayload),
    });

    const responseText = await response.text();
    let responseBody: unknown = responseText;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // Keep raw text when Momence responds with non-JSON.
    }

    if (!response.ok) {
      console.error('Momence update failed', {
        leadId,
        status: response.status,
        payloadKeys: Object.keys(sanitizedPayload),
        responseBody,
      });

      return new Response(JSON.stringify({ error: responseBody, leadId, payloadKeys: Object.keys(sanitizedPayload) }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: responseBody }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
