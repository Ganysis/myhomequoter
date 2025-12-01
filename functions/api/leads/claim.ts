// Cloudflare Pages Function for lead claiming
// Deploy to Cloudflare Pages - this file goes in /functions/api/leads/claim.ts

interface ClaimRequest {
  leadId: string;
  buyerId: string;
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const data: ClaimRequest = await request.json();

    if (!data.leadId || !data.buyerId) {
      return new Response(
        JSON.stringify({ error: 'Missing leadId or buyerId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if lead is still available
    const leadResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/leads?id=eq.${data.leadId}&status=eq.available&select=id,niche_id`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const leads = await leadResponse.json();
    if (!leads.length) {
      return new Response(
        JSON.stringify({ error: 'Lead is no longer available' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lead = leads[0];

    // Get niche price
    const nicheResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/niches?id=eq.${lead.niche_id}&select=price_per_lead`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const niches = await nicheResponse.json();
    const price = niches[0]?.price_per_lead || 50;

    // Verify buyer exists and is active
    const buyerResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/buyers?id=eq.${data.buyerId}&status=eq.active&select=id,stripe_customer_id`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const buyers = await buyerResponse.json();
    if (!buyers.length) {
      return new Response(
        JSON.stringify({ error: 'Buyer account not active' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create claim record
    const claimResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_claims`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        lead_id: data.leadId,
        buyer_id: data.buyerId,
        price: price,
      }),
    });

    if (!claimResponse.ok) {
      const error = await claimResponse.text();
      console.error('Claim error:', error);

      // Check if it's a unique constraint violation (lead already claimed)
      if (error.includes('unique') || error.includes('duplicate')) {
        return new Response(
          JSON.stringify({ error: 'Lead has already been claimed' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to claim lead' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update lead status to claimed
    await fetch(`${env.SUPABASE_URL}/rest/v1/leads?id=eq.${data.leadId}`, {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'claimed' }),
    });

    const [claim] = await claimResponse.json();

    // Get full lead details to return to buyer
    const fullLeadResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/leads?id=eq.${data.leadId}&select=*`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const [fullLead] = await fullLeadResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        claimId: claim.id,
        price: price,
        lead: {
          firstName: fullLead.first_name,
          lastName: fullLead.last_name,
          email: fullLead.email,
          phone: fullLead.phone,
          city: fullLead.city,
          state: fullLead.state,
          zipCode: fullLead.zip_code,
          projectType: fullLead.project_type,
          timeline: fullLead.timeline,
          propertyType: fullLead.property_type,
          additionalInfo: fullLead.additional_info,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error claiming lead:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
