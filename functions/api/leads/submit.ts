// Cloudflare Pages Function for lead submission
// Deploy to Cloudflare Pages - this file goes in /functions/api/leads/submit.ts

interface LeadSubmission {
  service: string;
  projectType: string;
  zipCode: string;
  city: string;
  state: string;
  propertyType: string;
  timeline: string;
  additionalInfo?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sourceUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const data: LeadSubmission = await request.json();

    // Validate required fields
    const requiredFields = ['service', 'projectType', 'zipCode', 'city', 'state', 'propertyType', 'timeline', 'firstName', 'lastName', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!data[field as keyof LeadSubmission]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone (10 digits)
    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get client info
    const ipAddress = request.headers.get('CF-Connecting-IP') || '';
    const userAgent = request.headers.get('User-Agent') || '';

    // Get niche ID from service slug
    const nicheResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/niches?slug=eq.${data.service}&select=id`, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    });

    const niches = await nicheResponse.json();
    const nicheId = niches[0]?.id;

    if (!nicheId) {
      return new Response(
        JSON.stringify({ error: 'Invalid service type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate quality score (simple heuristic)
    let qualityScore = 50;
    if (data.timeline === 'asap') qualityScore += 25;
    else if (data.timeline === '1-3months') qualityScore += 15;
    if (data.propertyType === 'commercial') qualityScore += 10;
    if (data.additionalInfo && data.additionalInfo.length > 50) qualityScore += 5;

    // Insert lead into Supabase
    const leadData = {
      niche_id: nicheId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: phoneDigits,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      project_type: data.projectType,
      timeline: data.timeline,
      property_type: data.propertyType,
      additional_info: data.additionalInfo || null,
      source_url: data.sourceUrl || null,
      utm_source: data.utmSource || null,
      utm_medium: data.utmMedium || null,
      utm_campaign: data.utmCampaign || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'available',
      quality_score: qualityScore,
    };

    const insertResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(leadData),
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save lead' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [insertedLead] = await insertResponse.json();

    // Send confirmation email via Resend
    if (env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'MyHomeQuoter <noreply@myhomequoter.com>',
          to: data.email,
          subject: 'Your Quote Request Has Been Received!',
          html: `
            <h1>Thanks for your request, ${data.firstName}!</h1>
            <p>We've received your request for ${data.service} services in ${data.city}, ${data.state}.</p>
            <p>Local contractors will be reaching out to you shortly with free quotes.</p>
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>Up to 4 pre-screened contractors will contact you</li>
              <li>You'll receive competitive quotes to compare</li>
              <li>Choose the best contractor for your needs</li>
            </ul>
            <p>Questions? Reply to this email or visit <a href="https://myhomequoter.com">myhomequoter.com</a></p>
          `,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        leadId: insertedLead.id,
        message: 'Lead submitted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing lead:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
