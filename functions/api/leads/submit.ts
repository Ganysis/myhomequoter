interface Env {
  LEADS_KV?: KVNamespace;
  NOTIFICATION_EMAIL?: string;
  RESEND_API_KEY?: string;
}

interface LeadData {
  service: string;
  projectType: string;
  zipCode: string;
  city: string;
  state: string;
  propertyType: string;
  timeline: string;
  additionalInfo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sourceUrl: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const data: LeadData = await request.json();

    // Validate required fields
    const requiredFields = ['service', 'firstName', 'lastName', 'email', 'phone', 'zipCode'];
    for (const field of requiredFields) {
      if (!data[field as keyof LeadData]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // Validate email format
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate phone (10 digits)
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create lead record
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lead = {
      id: leadId,
      ...data,
      phone: cleanPhone,
      createdAt: new Date().toISOString(),
      status: 'new',
      ipAddress: request.headers.get('CF-Connecting-IP') || 'unknown',
      userAgent: request.headers.get('User-Agent') || 'unknown',
      country: request.headers.get('CF-IPCountry') || 'unknown',
    };

    // Store in KV if available
    if (env.LEADS_KV) {
      await env.LEADS_KV.put(leadId, JSON.stringify(lead), {
        expirationTtl: 60 * 60 * 24 * 365, // 1 year
      });

      // Also add to list for easy retrieval
      const listKey = `leads_list_${new Date().toISOString().slice(0, 7)}`; // Monthly list
      const existingList = await env.LEADS_KV.get(listKey);
      const leadIds = existingList ? JSON.parse(existingList) : [];
      leadIds.push(leadId);
      await env.LEADS_KV.put(listKey, JSON.stringify(leadIds));
    }

    // Send email notification via Resend if configured
    if (env.RESEND_API_KEY && env.NOTIFICATION_EMAIL) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MyHomeQuoter <leads@myhomequoter.com>',
            to: env.NOTIFICATION_EMAIL,
            subject: `New Lead: ${data.service} - ${data.city}, ${data.state}`,
            html: `
              <h2>New Lead Received</h2>
              <table style="border-collapse: collapse; width: 100%;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Service</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.service}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Project Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.projectType}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.firstName} ${data.lastName}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${cleanPhone}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.city}, ${data.state} ${data.zipCode}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Property Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.propertyType}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Timeline</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.timeline}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Additional Info</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.additionalInfo || 'N/A'}</td></tr>
              </table>
              <p style="margin-top: 20px; color: #666;">Lead ID: ${leadId}<br>Submitted: ${lead.createdAt}</p>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Log to console (visible in Cloudflare dashboard)
    console.log('New lead received:', JSON.stringify(lead, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        message: 'Your request has been submitted. Contractors will contact you shortly.'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error processing lead:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process your request. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
