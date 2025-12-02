interface Env {
  LEADS_KV?: KVNamespace;
  ADMIN_API_KEY?: string;
}

// GET /api/leads - List all leads (protected)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Check API key for admin access
  const apiKey = request.headers.get('X-API-Key');
  if (!env.ADMIN_API_KEY || apiKey !== env.ADMIN_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  if (!env.LEADS_KV) {
    return new Response(
      JSON.stringify({ error: 'KV not configured', leads: [] }),
      { status: 200, headers: corsHeaders }
    );
  }

  try {
    // Get month parameter or default to current month
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const listKey = `leads_list_${month}`;
    const leadIds = await env.LEADS_KV.get(listKey);

    if (!leadIds) {
      return new Response(
        JSON.stringify({ leads: [], month }),
        { status: 200, headers: corsHeaders }
      );
    }

    const ids = JSON.parse(leadIds);
    const leads = await Promise.all(
      ids.map(async (id: string) => {
        const lead = await env.LEADS_KV!.get(id);
        return lead ? JSON.parse(lead) : null;
      })
    );

    return new Response(
      JSON.stringify({
        leads: leads.filter(Boolean).reverse(), // Most recent first
        count: leads.filter(Boolean).length,
        month,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error fetching leads:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch leads' }),
      { status: 500, headers: corsHeaders }
    );
  }
};
