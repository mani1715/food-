import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

    if (!razorpayKeySecret) {
      return errorResponse('Server missing RAZORPAY_KEY_SECRET configuration.', 500);
    }

    const {
      orderId,
      paymentToken,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = await req.json();

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return errorResponse('Missing required payment verification fields.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Order Record and Verify Authorization
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, customer_id, payment_session_token, payment_token_expires_at')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return errorResponse('Order not found.', 404);
    }

    let isAuthorized = false;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: authUser } = await supabase.auth.getUser(token);
      if (authUser?.user) {
        if (order.customer_id && authUser.user.id === order.customer_id) {
          isAuthorized = true;
        } else {
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
      return errorResponse('Unauthorized: Invalid payment verification authority.', 403);
    }

    // 2. Verify Payment Attempt Belongs to Order in Database
    const { data: paymentAttempt, error: payErr } = await supabase
      .from('payments')
      .select('id, order_id, amount, status')
      .eq('order_id', orderId)
      .eq('provider_order_id', razorpayOrderId)
      .single();

    if (payErr || !paymentAttempt) {
      return errorResponse('Invalid payment attempt reference for this order.', 400);
    }

    // 3. Constant-Time HMAC SHA256 Signature Verification
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = await hmacSha256Hex(razorpayKeySecret, payload);

    const isSignatureValid = timingSafeEqual(expectedSignature, razorpaySignature);

    if (!isSignatureValid) {
      console.warn(`Payment signature verification failed for order ${orderId}`);
      await supabase.rpc('record_payment_failure', {
        p_order_id: orderId,
        p_provider_order_id: razorpayOrderId,
        p_failure_code: 'SIGNATURE_VERIFICATION_FAILED',
        p_failure_desc: 'Payment signature did not match expected HMAC SHA-256 hash.',
      });

      return errorResponse('Payment signature verification failed.', 400);
    }

    // 4. Finalize Payment Success in Database
    const { data: finalizeData, error: rpcErr } = await supabase.rpc('finalize_payment_success', {
      p_order_id: orderId,
      p_provider_payment_id: razorpayPaymentId,
      p_provider_order_id: razorpayOrderId,
      p_method: 'online',
      p_signature_verified: true,
      p_metadata: { source: 'client_callback' },
    });

    if (rpcErr) {
      console.error('RPC Error finalizing payment:', rpcErr.message);
      return errorResponse('Failed to update order payment status in database.', 500);
    }

    return jsonResponse({
      success: true,
      message: 'Payment verified successfully.',
      orderId,
      paymentStatus: finalizeData?.payment_status || 'paid',
      orderStatus: finalizeData?.order_status || 'confirmed',
      isLatePayment: finalizeData?.is_late_payment || false,
    });
  } catch (err: any) {
    console.error('Edge Function Error [verify-razorpay-payment]:', err.message || err);
    return errorResponse(err.message || 'Payment verification failed.', 500);
  }
});
