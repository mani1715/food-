/** Injectable handler implementation. Production uses the real Supabase client and fetch;
 * Node regression tests inject deterministic fakes and execute this exact handler. */
import { recordPaymentAttemptWithRecovery, validateRazorpayOrder } from './payment-attempt.js';

export function createRazorpayOrderHandler({ env, createClient, fetchImpl = fetch, corsHeaders = {}, jsonResponse, errorResponse, logError = console.error }) {
  if (typeof env !== 'function' || typeof createClient !== 'function' || typeof jsonResponse !== 'function' || typeof errorResponse !== 'function') {
    throw new TypeError('Missing create-razorpay-order handler dependency');
  }
  return async function handleCreateRazorpayOrder(req) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = env('SUPABASE_URL') || '';
    const supabaseServiceKey = env('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse('Supabase server configuration is incomplete.', 500);
    }
    const razorpayKeyId = env('RAZORPAY_KEY_ID') || '';
    const razorpayKeySecret = env('RAZORPAY_KEY_SECRET') || '';

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

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return errorResponse('Request body must be valid JSON.', 400);
    }
    const { orderId, paymentToken } = requestBody ?? {};

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
    const rzpRes = await fetchImpl('https://api.razorpay.com/v1/orders', {
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

    let rzpData;
    try {
      rzpData = await rzpRes.json();
    } catch {
      logError('Razorpay returned non-JSON response while creating an order.');
      return errorResponse('Razorpay returned an invalid response. No checkout session was started.', 502);
    }

    if (!rzpRes.ok) {
      logError('Razorpay Orders API Error:', rzpData?.error?.description || 'Unknown error');
      return errorResponse(
        rzpData?.error?.description || 'Failed to create payment order with Razorpay.',
        rzpRes.status >= 400 && rzpRes.status < 600 ? rzpRes.status : 502
      );
    }

    const validRazorpayOrder = validateRazorpayOrder(rzpData, amountInPaise);
    if (!validRazorpayOrder.ok) {
      logError('Razorpay returned malformed or inconsistent order data:', validRazorpayOrder.reason);
      return errorResponse('Razorpay returned an invalid order response. No checkout session was started.', 502);
    }

    // 5. Record Payment Attempt in PostgreSQL. Do not send checkout credentials unless
    // the authoritative payment attempt row is confirmed. Retry only the idempotent DB RPC,
    // never create another Razorpay order automatically.
    const recorded = await recordPaymentAttemptWithRecovery({
      rpc: (name, args) => supabase.rpc(name, args),
      orderId: order.id,
      providerOrderId: rzpData.id,
      amount: Number(order.grand_total),
      currency: 'INR',
    });

    if (!recorded.ok) {
      // The provider order may exist remotely, but it is not exposed as a usable checkout.
      // An operator/reconciliation job can safely look it up by provider_order_id and retry
      // record_payment_attempt; do not create another provider order or mark checkout successful.
      logError('Payment attempt could not be durably recorded.', {
        orderId: order.id, providerOrderId: rzpData.id, reason: recorded.reason,
      });
      return jsonResponse({
        success: false,
        error: 'Payment setup is temporarily unavailable. Please retry or contact support before paying.',
        code: 'PAYMENT_ATTEMPT_NOT_RECORDED',
        retryable: recorded.retryable,
        recovery: 'reconcile_existing_razorpay_order',
      }, 503);
    }

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
  } catch (err) {
    logError('Edge Function Error [create-razorpay-order]:', err.message || err);
    return errorResponse(err.message || 'Internal server error while initializing payment.', 500);
  }
  };
}
