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

    if (!razorpayKeyId || !razorpayKeySecret) {
      return errorResponse(
        'Razorpay credentials are not configured on server. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Edge Function secrets.',
        500
      );
    }

    const isTestKey = razorpayKeyId.startsWith('rzp_test_');
    const isLiveKey = razorpayKeyId.startsWith('rzp_live_');
    if (!isTestKey && !isLiveKey) {
      return errorResponse('Invalid RAZORPAY_KEY_ID format: Must start with rzp_test_ or rzp_live_.', 500);
    }

    const { orderId, paymentToken, customerNotes } = await req.json();

    if (!orderId || typeof orderId !== 'string') {
      return errorResponse('Valid orderId is required.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Authoritative Order Record
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, grand_total, payment_status, order_status, created_at, customer_id, customer_name, customer_phone, customer_email, payment_session_token, payment_token_expires_at')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return errorResponse('Order not found in store database.', 404);
    }

    // 2. Dual Authorization Check: Authenticated User OR Guest Payment Token Proof
    let isAuthorized = false;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: authUser } = await supabase.auth.getUser(token);
      if (authUser?.user) {
        if (order.customer_id && authUser.user.id === order.customer_id) {
          isAuthorized = true;
        } else {
          // Check staff
          const { data: staffData } = await supabase
            .from('admin_roles')
            .select('role, status')
            .eq('user_id', authUser.user.id)
            .eq('status', 'active')
            .single();
          if (staffData) isAuthorized = true;
        }
      }
    }

    // Check guest payment session token if not authenticated
    if (!isAuthorized && paymentToken) {
      if (
        order.payment_session_token &&
        order.payment_session_token === paymentToken &&
        (!order.payment_token_expires_at || new Date(order.payment_token_expires_at) > new Date())
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return errorResponse('Unauthorized: Valid user session or unexpired payment token is required.', 403);
    }

    if (order.payment_status === 'paid' || order.payment_status === 'completed') {
      return errorResponse('Order has already been marked as paid.', 400);
    }

    if (order.order_status === 'cancelled') {
      return errorResponse('Order has expired or been cancelled. Please place a new order.', 400);
    }

    // 3. Authoritative Amount in Integer Paise
    const amountInPaise = Math.round(Number(order.grand_total) * 100);
    if (amountInPaise <= 0) {
      return errorResponse('Invalid order grand total amount.', 400);
    }

    // 4. Create Razorpay Order via Official API
    const authBasic = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authBasic}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.order_number || order.id,
        notes: {
          store_order_id: order.id,
          order_number: order.order_number,
        },
      }),
    });

    const rzpData = await rzpRes.json();

    if (!rzpRes.ok) {
      console.error('Razorpay Orders API Error:', rzpData.error?.description || 'Unknown error');
      return errorResponse(
        rzpData.error?.description || 'Failed to create payment order with Razorpay.',
        rzpRes.status
      );
    }

    // 5. Record Payment Attempt in PostgreSQL
    await supabase.rpc('record_payment_attempt', {
      p_order_id: order.id,
      p_provider_order_id: rzpData.id,
      p_amount: Number(order.grand_total),
      p_currency: 'INR',
    });

    return jsonResponse({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      razorpayOrderId: rzpData.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId,
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
      },
    });
  } catch (err: any) {
    console.error('Edge Function Error [create-razorpay-order]:', err.message || err);
    return errorResponse(err.message || 'Internal server error while initializing payment.', 500);
  }
});
