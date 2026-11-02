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

    // Enforce Active Staff Role & Reconciliation Permission
    const { data: roleData, error: roleErr } = await supabase
      .from('admin_roles')
      .select('role, status, permissions')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (roleErr || !roleData) {
      return errorResponse('Forbidden: Administrative privileges required.', 403);
    }

    const hasReconcilePerm =
      roleData.role === 'super_admin' ||
      roleData.role === 'admin' ||
      (Array.isArray(roleData.permissions) && roleData.permissions.includes('payments.reconcile'));

    if (!hasReconcilePerm) {
      return errorResponse('Forbidden: Insufficient permissions for payment reconciliation.', 403);
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
    if (!rzpPayments || !Array.isArray(rzpPayments.items)) {
      return errorResponse('Invalid response structure from Razorpay payments API.', 502);
    }

    // Verify payment belongs to this exact provider order, is captured, has INR currency, and amount matches grand total
    const capturedPayment = rzpPayments.items.find((p: any) =>
      p.status === 'captured' &&
      p.order_id === payment.provider_order_id &&
      (p.currency || 'INR').toUpperCase() === 'INR' &&
      Math.abs(Number(p.amount) / 100 - Number(order.grand_total)) < 0.01
    );

    let reconcileResult;
    if (capturedPayment) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('finalize_payment_success', {
        p_order_id: orderId,
        p_provider_payment_id: capturedPayment.id,
        p_provider_order_id: payment.provider_order_id,
        p_amount: Number(capturedPayment.amount) / 100,
        p_currency: 'INR',
        p_method: capturedPayment.method || 'online',
        p_signature_verified: true,
        p_metadata: { source: 'admin_reconciliation', admin_user_id: userData.user.id },
      });

      if (rpcErr || !rpcData || rpcData.success === false) {
        return errorResponse(rpcErr?.message || rpcData?.error || 'Database error during payment reconciliation.', 500);
      }

      reconcileResult = { status: 'captured', synced: true, data: rpcData };
    } else {
      reconcileResult = { status: 'no_matching_captured_payment_found', localStatus: order.payment_status };
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
