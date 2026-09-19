import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

    // Verify Admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing Authorization token', 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !userData.user) {
      return errorResponse('Unauthorized: Invalid or expired session.', 401);
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return errorResponse('Valid orderId is required for reconciliation.');
    }

    // Fetch order & payment attempts
    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, grand_total, payment_status, order_status')
      .eq('id', orderId)
      .single();

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!payment || !payment.provider_order_id) {
      return errorResponse('No gateway order attempt found for this order.', 404);
    }

    // Query Razorpay Payments API server-to-server
    const rzpAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const rzpRes = await fetch(
      `https://api.razorpay.com/v1/orders/${payment.provider_order_id}/payments`,
      {
        headers: {
          Authorization: `Basic ${rzpAuth}`,
        },
      }
    );

    if (!rzpRes.ok) {
      return errorResponse('Failed to fetch payment status from Razorpay.', rzpRes.status);
    }

    const rzpPayments = await rzpRes.json();
    const capturedPayment = rzpPayments.items?.find((p: any) => p.status === 'captured');

    let reconcileResult;
    if (capturedPayment) {
      const { data, error } = await supabase.rpc('reconcile_order_payment', {
        p_order_id: orderId,
        p_gateway_status: 'captured',
        p_gateway_payment_id: capturedPayment.id,
        p_gateway_amount_paise: capturedPayment.amount,
      });
      reconcileResult = { status: 'captured', synced: !error, data };
    } else {
      reconcileResult = { status: 'no_captured_payment_found', localStatus: order.payment_status };
    }

    return jsonResponse({
      success: true,
      orderId,
      reconciliation: reconcileResult,
    });
  } catch (err: any) {
    console.error('Edge Function Error [reconcile-razorpay-payment]:', err.message || err);
    return errorResponse(err.message || 'Reconciliation failed.', 500);
  }
});
