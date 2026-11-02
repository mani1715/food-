// NimbusPost has not published a verifiable signature contract in the supplied
// integration materials. This endpoint therefore requires an operator-configured
// shared secret header and independently confirms every status through NimbusPost.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0';
import { getNimbusAuthToken, trackNimbusShipment } from '../_shared/nimbuspost/client.ts';
import { equalSecret, mapNimbusStatusToInternal, sha256Hex } from '../_shared/nimbuspost/webhook-utils.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-nimbuspost-webhook-secret',
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);

  const expectedSecret = Deno.env.get('NIMBUSPOST_WEBHOOK_SECRET') || '';
  if (!expectedSecret) return respond({ error: 'Webhook authentication is not configured' }, 503);
  const suppliedSecret = req.headers.get('x-nimbuspost-webhook-secret') || '';
  if (!suppliedSecret || !equalSecret(expectedSecret, suppliedSecret)) {
    return respond({ error: 'Invalid webhook authentication' }, 401);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceKey) return respond({ error: 'Server configuration is incomplete' }, 500);

    const rawBody = await req.text();
    let body: any;
    try { body = JSON.parse(rawBody); } catch { return respond({ error: 'Invalid JSON payload' }, 400); }

    const awbValue = body.awb_number || body.awb || body.data?.awb_number || body.data?.awb;
    const awb = typeof awbValue === 'string' || typeof awbValue === 'number' ? String(awbValue).trim() : '';
    if (!awb) return respond({ error: 'Webhook payload is missing an AWB' }, 400);

    const incoming = body.status || body.current_status || body.data?.status || body.data?.current_status;
    const suppliedInternalStatus = typeof incoming === 'string' ? mapNimbusStatusToInternal(incoming) : null;
    if (!suppliedInternalStatus) return respond({ error: 'Webhook contains an unsupported shipment status' }, 422);

    const email = Deno.env.get('NIMBUSPOST_EMAIL') || '';
    const password = Deno.env.get('NIMBUSPOST_PASSWORD') || '';
    const apiKey = Deno.env.get('NIMBUSPOST_API_KEY') || '';
    const standingToken = Deno.env.get('NIMBUSPOST_TOKEN') || '';
    const auth = await getNimbusAuthToken({ apiKey, email, password, token: standingToken });
    if (!auth.token) return respond({ error: 'NimbusPost tracking authentication is unavailable' }, 503);

    // The request is only a notification. State is taken from an authenticated
    // NimbusPost tracking lookup; unavailable provider verification is retryable.
    const tracking = await trackNimbusShipment(auth.token, awb);
    if (!tracking.success || !tracking.status) return respond({ error: 'Unable to verify shipment status with NimbusPost' }, 503);
    const verifiedStatus = mapNimbusStatusToInternal(tracking.status);
    if (!verifiedStatus) return respond({ error: 'NimbusPost returned an unsupported shipment status' }, 503);

    const supabase = createClient(supabaseUrl, serviceKey);
    const providerEventId = body.event_id || body.eventId || body.data?.event_id || body.data?.eventId || null;
    const description = body.message || body.remarks || body.data?.remarks || `NimbusPost status: ${tracking.status}`;
    const location = body.location || body.city || body.data?.location || null;
    const eventTimestamp = body.event_at || body.timestamp || body.data?.event_at || body.data?.timestamp;
    const parsedTimestamp = eventTimestamp ? new Date(eventTimestamp) : null;
    const eventAt = parsedTimestamp && Number.isFinite(parsedTimestamp.getTime()) ? parsedTimestamp.toISOString() : null;

    const { data, error } = await supabase.rpc('process_nimbuspost_webhook', {
      p_awb: awb,
      p_provider_event_id: providerEventId ? String(providerEventId) : null,
      p_payload_hash: await sha256Hex(rawBody),
      p_event_type: 'shipment_status',
      p_status: verifiedStatus,
      p_description: String(description).slice(0, 500),
      p_location: location ? String(location).slice(0, 200) : null,
      p_event_at: eventAt,
      p_metadata: { provider_status: String(tracking.status).slice(0, 100) },
    });
    if (error) {
      console.error('NimbusPost webhook database processing failed:', error.message);
      return respond({ error: 'Webhook processing failed; provider may retry' }, 503);
    }
    return respond(data || { success: true });
  } catch (err: any) {
    console.error('NimbusPost webhook failed:', err?.message || 'unknown error');
    return respond({ error: 'Internal server error' }, 500);
  }
});
