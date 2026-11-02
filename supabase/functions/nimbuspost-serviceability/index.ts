// Deno-compatible Edge Function: nimbuspost-serviceability
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0';
import {
  getNimbusAuthToken,
  checkCourierServiceability,
  redactSensitive,
} from '../_shared/nimbuspost/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const nimbusEmail = Deno.env.get('NIMBUSPOST_EMAIL') || '';
    const nimbusPassword = Deno.env.get('NIMBUSPOST_PASSWORD') || '';
    const nimbusApiKey = Deno.env.get('NIMBUSPOST_API_KEY') || '';
    const nimbusToken = Deno.env.get('NIMBUSPOST_TOKEN') || '';

    const body = await req.json().catch(() => ({}));
    const { pickupPincode, deliveryPincode, weightGrams, isCod = false } = body;

    if (!deliveryPincode || !/^\d{6}$/.test(deliveryPincode.toString())) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid 6-digit destination pincode.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings, error: settingsError } = await supabase
      .from('shipping_settings')
      .select('enabled, shipping_provider')
      .eq('id', 'default_shipping_config')
      .maybeSingle();
    if (settingsError || !settings) {
      return new Response(JSON.stringify({ success: false, error: 'Shipping is not configured' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!settings.enabled || settings.shipping_provider !== 'nimbuspost') {
      return new Response(JSON.stringify({ success: false, error: 'NimbusPost shipping is disabled' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If pickup pincode is not provided, fetch default warehouse pincode
    let effectivePickupPincode = pickupPincode;
    if (!effectivePickupPincode) {
      const { data: defaultLocation, error: locationError } = await supabase
        .from('shipping_pickup_locations')
        .select('postal_code')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();

      if (locationError) {
        return new Response(JSON.stringify({ success: false, error: 'Unable to load pickup location' }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      effectivePickupPincode = defaultLocation?.postal_code;
    }
    if (!effectivePickupPincode || !/^\d{6}$/.test(effectivePickupPincode.toString()) ||
        !Number.isFinite(Number(weightGrams)) || Number(weightGrams) <= 0) {
      return new Response(JSON.stringify({ success: false, error: 'Valid pickup pincode and parcel weight are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate with NimbusPost
    const auth = await getNimbusAuthToken({
      apiKey: nimbusApiKey,
      email: nimbusEmail,
      password: nimbusPassword,
      token: nimbusToken,
    });

    if (!auth.token) {
      console.warn('NimbusPost credentials not configured or login failed:', auth.error);
      return new Response(
        JSON.stringify({
          success: false,
          status: 'PROVIDER_NOT_CONFIGURED',
          message: 'NimbusPost shipping credentials are unavailable or authentication failed.',
          couriers: [],
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query live courier serviceability
    const weightKg = Number(weightGrams) / 1000;
    const result = await checkCourierServiceability(auth.token, {
      pickup_pincode: effectivePickupPincode.toString(),
      delivery_pincode: deliveryPincode.toString(),
      weight_kg: weightKg,
      cod: isCod ? 1 : 0,
    });

    return new Response(
      JSON.stringify({
        success: result.success,
        pickup_pincode: effectivePickupPincode,
        delivery_pincode: deliveryPincode,
        couriers: result.couriers,
        error: result.error,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Exception in nimbuspost-serviceability:', err.message || err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
