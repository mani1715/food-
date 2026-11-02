// Creates one staff-authorized NimbusPost shipment per order.
// Provider calls are never retried automatically: a timeout can mean the carrier
// accepted the booking. The reservation remains active until an operator reconciles it.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0';
import {
  getNimbusAuthToken,
  createNimbusShipment,
  NimbusCreateShipmentRequest,
} from '../_shared/nimbuspost/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const TERMINAL_SHIPMENT_STATES = new Set(['cancelled', 'returned', 'rto_delivered']);

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requiredText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text : null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceKey) return respond({ error: 'Server configuration is incomplete' }, 500);

    const authHeader = req.headers.get('Authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return respond({ error: 'Staff session required' }, 401);

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(match[1]);
    if (authError || !authData.user) return respond({ error: 'Unauthorized caller' }, 401);

    const { data: role, error: roleError } = await supabase
      .from('admin_roles')
      .select('role, permissions, status')
      .eq('user_id', authData.user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (roleError) return respond({ error: 'Unable to verify staff authorization' }, 503);
    const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
    const canCreate = role && (
      role.role === 'super_admin' || role.role === 'admin' ||
      permissions.includes('*') || permissions.includes('shipping.create')
    );
    if (!canCreate) return respond({ error: 'Insufficient permission to create shipments' }, 403);

    const body = await req.json().catch(() => null);
    const orderId = requiredText(body?.orderId);
    if (!orderId) return respond({ error: 'Valid orderId is required' }, 400);

    // Read configuration first. A failed/missing settings row must never enable booking.
    const { data: settings, error: settingsError } = await supabase
      .from('shipping_settings')
      .select('enabled, test_mode, shipping_provider')
      .eq('id', 'default_shipping_config')
      .maybeSingle();
    if (settingsError || !settings) return respond({ error: 'Shipping is not configured' }, 503);
    if (!settings.enabled || settings.shipping_provider !== 'nimbuspost') {
      return respond({ error: 'NimbusPost shipment creation is disabled by store settings' }, 403);
    }
    if (Deno.env.get('NIMBUSPOST_SHIPMENT_CONTRACT_VERIFIED') !== 'true') {
      return respond({ error: 'NimbusPost shipment API contract has not been confirmed' }, 503);
    }
    // The code uses NimbusPost's production API endpoint. Do not treat this local
    // flag as a provider sandbox; live carrier booking requires an explicit setting.
    if (settings.test_mode) return respond({ error: 'NimbusPost booking is blocked until provider test-mode support is verified' }, 403);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, grand_total, delivery_fee, payment_method, payment_status, order_status, delivery_address_json, customer_name, customer_phone, customer_email, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();
    if (orderError) return respond({ error: 'Unable to load order for shipment' }, 503);
    if (!order) return respond({ error: 'Order not found' }, 404);

    const isCod = String(order.payment_method || '').toLowerCase().includes('cod');
    if (!isCod && !['paid', 'completed'].includes(order.payment_status)) {
      return respond({ error: 'Prepaid order payment is not verified' }, 409);
    }
    if (order.order_status === 'cancelled') return respond({ error: 'Cancelled orders cannot be shipped' }, 409);

    // Existing rows are the durable idempotency guard. An incomplete reservation
    // is deliberately not retried because the provider may already have accepted it.
    const { data: existing, error: existingError } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .not('shipping_status', 'in', '("cancelled","returned","rto_delivered")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) return respond({ error: 'Unable to check existing shipment' }, 503);
    if (existing) {
      if (existing.provider_shipment_id || existing.awb_number) {
        return respond({ success: true, idempotent: true, shipment: existing });
      }
      return respond({ error: 'A shipment attempt is unresolved; reconcile it before retrying', shipment_id: existing.id }, 409);
    }

    const pickupQuery = supabase
      .from('shipping_pickup_locations')
      .select('id, name, contact_name, phone, address_line_1, address_line_2, landmark, city, state, postal_code')
      .eq('is_active', true);
    const { data: pickup, error: pickupError } = body.pickupLocationId
      ? await pickupQuery.eq('id', body.pickupLocationId).maybeSingle()
      : await pickupQuery.eq('is_default', true).maybeSingle();
    if (pickupError) return respond({ error: 'Unable to load pickup location' }, 503);
    if (!pickup) return respond({ error: 'Configure a verified active pickup location before booking' }, 409);

    const address = order.delivery_address_json || {};
    const consigneeName = requiredText(address.name || order.customer_name);
    const consigneePhone = requiredText(address.phone || order.customer_phone);
    const pincode = requiredText(address.pincode || address.postal_code);
    const city = requiredText(address.city);
    const state = requiredText(address.state);
    const addressLine = [address.address_line_1 || address.address, address.address_line_2, address.landmark]
      .map(requiredText).filter(Boolean).join(', ');
    if (!consigneeName || !consigneePhone || !/^\+?[\d\s()-]{10,16}$/.test(consigneePhone) ||
        !pincode || !/^\d{6}$/.test(pincode) || !city || !state || !addressLine) {
      return respond({ error: 'Order has incomplete or invalid delivery address details' }, 409);
    }

    const { data: pkg, error: packageError } = await supabase.rpc('calculate_order_package_details', { p_order_id: orderId });
    if (packageError || !pkg?.success || !pkg?.is_complete ||
        !Number.isFinite(Number(pkg.dead_weight_grams)) || Number(pkg.dead_weight_grams) <= 0 ||
        !Number(pkg.package_length_cm) || !Number(pkg.package_width_cm) || !Number(pkg.package_height_cm)) {
      return respond({ error: 'Package weight/dimensions are incomplete; configure shipping data before booking' }, 409);
    }

    const email = Deno.env.get('NIMBUSPOST_EMAIL') || '';
    const password = Deno.env.get('NIMBUSPOST_PASSWORD') || '';
    const apiKey = Deno.env.get('NIMBUSPOST_API_KEY') || '';
    const token = Deno.env.get('NIMBUSPOST_TOKEN') || '';
    const auth = await getNimbusAuthToken({ apiKey, email, password, token });
    if (!auth.token) return respond({ error: 'NimbusPost credentials are unavailable or authentication failed' }, 503);

    const shipmentItems = (order.order_items || []).map((item: any) => ({
      name: item.product_name_snapshot,
      qty: Number(item.quantity),
      price: Number(item.unit_price),
      sku: item.product_id,
    }));
    if (!shipmentItems.length || shipmentItems.some(i => !i.name || !Number.isFinite(i.qty) || i.qty <= 0 || !Number.isFinite(i.price) || i.price < 0)) {
      return respond({ error: 'Order items are incomplete; shipment was not sent' }, 409);
    }

    const idempotencyKey = `nimbuspost-order-${orderId}`;
    const { data: reservation, error: reserveError } = await supabase
      .from('shipments')
      .insert({
        order_id: orderId,
        provider: 'nimbuspost',
        provider_order_id: order.order_number || order.id,
        shipping_status: 'ready_to_ship',
        dead_weight_grams: Math.round(Number(pkg.dead_weight_grams)),
        volumetric_weight_grams: pkg.volumetric_weight_grams || null,
        charged_weight_grams: Math.max(Number(pkg.dead_weight_grams), Number(pkg.volumetric_weight_grams || 0)),
        package_length_cm: Number(pkg.package_length_cm),
        package_width_cm: Number(pkg.package_width_cm),
        package_height_cm: Number(pkg.package_height_cm),
        customer_delivery_charge: Number(order.delivery_fee || 0),
        cod_amount: isCod ? Number(order.grand_total) : 0,
        cod_collection_status: isCod ? 'pending' : 'not_applicable',
        idempotency_key: idempotencyKey,
      })
      .select('id')
      .single();
    if (reserveError || !reservation) {
      // A concurrent request or prior attempt won. Never issue a second provider call.
      return respond({ error: 'Shipment already exists or could not be safely reserved; inspect the order before retrying' }, 409);
    }

    const shipmentRequest: NimbusCreateShipmentRequest = {
      order_number: order.order_number || order.id,
      payment_type: isCod ? 'cod' : 'prepaid',
      order_amount: Number(order.grand_total),
      package_weight_kg: Number(pkg.dead_weight_grams) / 1000,
      package_length_cm: Number(pkg.package_length_cm),
      package_width_cm: Number(pkg.package_width_cm),
      package_height_cm: Number(pkg.package_height_cm),
      pickup_location_name: pickup.name,
      consignee: {
        name: consigneeName,
        phone: consigneePhone,
        email: order.customer_email || '',
        address: addressLine,
        city,
        state,
        pincode,
      },
      items: shipmentItems,
      courier_id: body.courierId || undefined,
    };

    const booking = await createNimbusShipment(auth.token, shipmentRequest);
    if (!booking.success) {
      // Keep the reservation active on both definitive failures and uncertain
      // outcomes. An operator must reconcile provider state before another attempt.
      await supabase.from('shipment_attempts').insert({
        order_id: orderId,
        shipment_id: reservation.id,
        action_type: 'create',
        provider: 'nimbuspost',
        idempotency_key: idempotencyKey,
        status: booking.is_uncertain ? 'uncertain' : 'failed',
        error_message: booking.error || 'Provider rejected shipment request',
        attempted_by: authData.user.id,
      });
      return respond({ error: 'NimbusPost did not confirm the booking; shipment reservation is held for reconciliation', uncertain: Boolean(booking.is_uncertain), shipment_id: reservation.id }, 503);
    }

    const { data: saved, error: saveError } = await supabase
      .from('shipments')
      .update({
        provider_shipment_id: booking.shipment_id || null,
        courier_id: booking.courier_id || null,
        courier_name: booking.courier_name || null,
        awb_number: booking.awb_number || null,
        tracking_url: booking.tracking_url || null,
        label_url: booking.label_url || null,
        shipping_status: 'shipment_created',
        pickup_status: 'pickup_scheduled',
        provider_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.id)
      .select('*')
      .single();
    if (saveError || !saved) {
      console.error('NimbusPost accepted booking but shipment update failed; reservation retained for reconciliation.');
      return respond({ error: 'Provider booking may exist; shipment reservation is held for reconciliation', shipment_id: reservation.id }, 503);
    }

    const { error: eventError } = await supabase.from('shipment_events').insert({
      shipment_id: saved.id,
      provider: 'nimbuspost',
      status: 'shipment_created',
      description: `Shipment booked with ${booking.courier_name || 'NimbusPost courier'}`,
      location: pickup.city,
      metadata: { actor_user_id: authData.user.id },
    });
    if (eventError) {
      console.error('Shipment saved but initial shipment event could not be recorded.');
      return respond({ error: 'Shipment was booked but audit event recording failed; inspect before retrying', shipment_id: saved.id }, 503);
    }

    return respond({ success: true, shipment: saved });
  } catch (err: any) {
    console.error('create-nimbuspost-shipment failed:', err?.message || 'unknown error');
    return respond({ error: 'Internal server error' }, 500);
  }
});
