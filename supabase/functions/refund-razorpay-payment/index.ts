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

    // 1. Authenticate Staff Member from Bearer Token
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

    // Verify staff role & permission
    const { data: roleData } = await supabase
      .from('admin_roles')
      .select('role, status, permissions')
      .eq('user_id', userData.user.id)
      .single();

    if (!roleData || roleData.status !== 'active') {
      return errorResponse('Forbidden: Administrative access required.', 403);
    }

    const hasRefundPerm =
      roleData.role === 'super_admin' ||
      roleData.role === 'admin' ||
      (roleData.permissions && roleData.permissions.includes('payments.refund'));

    if (!hasRefundPerm) {
      return errorResponse('Forbidden: payments.refund permission required.', 403);
    }

    const { orderId, amount, reason } = await req.json();

    if (!orderId) {
      return errorResponse('Valid orderId is required.');
    }

    // Fetch existing payment record
    const { data: paymentRecord, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['paid', 'partially_refunded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (payErr || !paymentRecord || !paymentRecord.provider_payment_id) {
      return errorResponse('No captured payment found for this order.', 404);
    }

    const remainingRefundable = Number(paymentRecord.amount) - (Number(paymentRecord.refund_amount) || 0);
    const requestedRefund = amount ? Number(amount) : remainingRefundable;

    if (requestedRefund <= 0 || requestedRefund > remainingRefundable) {
      return errorResponse(
        `Invalid refund amount. Must be between ₹1 and ₹${remainingRefundable}.`,
        400
      );
    }

    const refundAmountInPaise = Math.round(requestedRefund * 100);

    // Call Razorpay Refund API
    const rzpAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const rzpRes = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentRecord.provider_payment_id}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${rzpAuth}`,
        },
        body: JSON.stringify({
          amount: refundAmountInPaise,
          notes: {
            reason: reason || 'Customer refund requested by store admin',
          },
        }),
      }
    );

    const rzpData = await rzpRes.json();

    if (!rzpRes.ok) {
      console.error('Razorpay Refund API Error:', rzpData.error?.description || 'Unknown error');
      return errorResponse(rzpData.error?.description || 'Razorpay refund request rejected.', rzpRes.status);
    }

    // Update local database payment and order state via secure RPC
    const { data: refundResult, error: rpcErr } = await supabase.rpc('record_refund_success', {
      p_order_id: orderId,
      p_refund_id: rzpData.id,
      p_refund_amount: requestedRefund,
      p_reason: reason || 'Admin refund',
    });

    if (rpcErr) {
      console.error('RPC Error updating refund record:', rpcErr.message);
      return errorResponse('Refund was processed by gateway but database record update failed.', 500);
    }

    return jsonResponse({
      success: true,
      message: 'Refund processed successfully.',
      refundId: rzpData.id,
      refundAmount: requestedRefund,
      cumulativeRefund: refundResult?.cumulative_refund,
      paymentStatus: refundResult?.payment_status,
    });
  } catch (err: any) {
    console.error('Edge Function Error [refund-razorpay-payment]:', err.message || err);
    return errorResponse(err.message || 'Refund processing failed.', 500);
  }
});
