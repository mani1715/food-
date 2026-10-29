import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';

function moneyToPaise(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^\d+(?:\.\d{1,2})?$/.test(String(value))) {
    return NaN;
  }
  const [whole, fraction = ''] = String(value).split('.');
  const paise = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return paise <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(paise) : NaN;
}

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

    const body = await req.json();
    const { orderId, amount, reason } = body;
    const idempotencyKey = body.idempotencyKey || body.idempotency_key || crypto.randomUUID();

    if (!orderId) {
      return errorResponse('Valid orderId is required.');
    }

    // Fetch existing payment record
    const { data: paymentRecord, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['captured', 'paid', 'partially_refunded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (payErr || !paymentRecord || !paymentRecord.provider_payment_id) {
      return errorResponse('No captured payment found for this order.', 404);
    }

    // Query durable payment_refunds table for existing refunded sum
    const { data: initialPastRefunds, error: pastRefundsError } = await supabase
      .from('payment_refunds')
      .select('amount, provider_refund_id')
      .eq('payment_id', paymentRecord.id)
      .eq('status', 'processed');

    if (pastRefundsError || !Array.isArray(initialPastRefunds)) {
      return errorResponse('Unable to verify refund ledger.', 500);
    }
    const totalPastRefundPaise = initialPastRefunds.reduce(
      (acc: number, r: { amount: number }) => acc + moneyToPaise(r.amount),
      0
    );

    const remainingPaise = moneyToPaise(paymentRecord.amount) - totalPastRefundPaise;
    if (!Number.isSafeInteger(remainingPaise) || !Number.isSafeInteger(totalPastRefundPaise)) {
      return errorResponse('Invalid monetary values in refund ledger.', 500);
    }
    const remainingRefundable = remainingPaise / 100;
    const totalPastRefunds = totalPastRefundPaise / 100;

    if (remainingRefundable <= 0) {
      return jsonResponse({
        success: true,
        message: 'Order payment is already fully refunded.',
        alreadyFullyRefunded: true,
        totalRefunded: totalPastRefunds,
        paymentStatus: 'refunded',
      });
    }

    const requestedPaise = amount === undefined ? remainingPaise : moneyToPaise(amount);
    const requestedRefund = requestedPaise / 100;

    if (!Number.isSafeInteger(requestedPaise) || requestedPaise <= 0 || requestedPaise > remainingPaise) {
      return errorResponse(
        `Invalid refund amount. Must be between ₹1 and ₹${remainingRefundable.toFixed(2)}.`,
        400
      );
    }

    // 2. Initiate persistent refund operation record in PostgreSQL before contacting Razorpay
    const { data: initData, error: initErr } = await supabase.rpc('initiate_refund_operation', {
      p_order_id: orderId,
      p_idempotency_key: idempotencyKey,
      p_amount: requestedRefund,
      p_reason: reason || 'Customer refund requested by store admin',
      p_staff_user_id: userData.user.id,
    });

    if (initErr) {
      console.error('RPC Error initiating refund operation:', initErr.message);
      return errorResponse('Database error initiating refund operation: ' + initErr.message, 500);
    }

    if (initData?.success !== true) {
      console.error('Refund initiation rejected:', initData?.error);
      const status = initData?.conflict ? 409 : 400;
      return errorResponse(initData?.error || 'Failed to initiate refund operation.', status);
    }

    // If this is a retry of an already completed/reconciled operation, return idempotent success immediately
    if (initData.is_retry && (initData.status === 'completed' || initData.status === 'reconciled')) {
      return jsonResponse({
        success: true,
        message: 'Refund already completed.',
        refundId: initData.provider_refund_id,
        refundAmount: requestedRefund,
        isDuplicate: true,
        status: initData.status,
      });
    }

    const operationId = initData.operation_id;
    const rzpAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    // 3. Fully Paginated Gateway Reconciliation Pre-check
    // Traverse existing refunds using count=100 & skip=offset (bounded to 10 pages / 1,000 items)
    let page = 0;
    const pageSize = 100;
    const maxPages = 10;
    let hasMorePages = true;
    let paginationExhausted = false;
    let paginationError = false;
    let paginationErrorMessage = '';
    const recordedRefundIds = new Set((initialPastRefunds || []).map((r: any) => r.provider_refund_id));
    let matchedGatewayRefund: any = null;

    try {
      while (hasMorePages && page < maxPages) {
        const skip = page * pageSize;
        const rzpRefundListRes = await fetch(
          `https://api.razorpay.com/v1/payments/${paymentRecord.provider_payment_id}/refunds?count=${pageSize}&skip=${skip}`,
          {
            headers: {
              Authorization: `Basic ${rzpAuth}`,
            },
          }
        );

        if (!rzpRefundListRes.ok) {
          console.warn(`Gateway refund pagination failed at page ${page} (HTTP ${rzpRefundListRes.status})`);
          paginationError = true;
          paginationErrorMessage = `Gateway returned HTTP ${rzpRefundListRes.status} during pagination`;
          break;
        }

        const rzpRefundList = await rzpRefundListRes.json();
        const items = rzpRefundList?.items;
        if (!Array.isArray(items)) {
          console.warn(`Gateway refund pagination returned malformed items structure at page ${page}`);
          paginationError = true;
          paginationErrorMessage = 'Malformed response structure from gateway';
          break;
        }

        for (const item of items) {
          // Check if this refund matches our operation
          if (
            item.notes?.operation_id === operationId ||
            (initData.provider_refund_id && item.id === initData.provider_refund_id)
          ) {
            matchedGatewayRefund = item;
          }

          // Also reconcile any other orphaned refunds discovered
          if (!recordedRefundIds.has(item.id) && item.status === 'processed') {
            console.log(`Reconciling discovered processed refund ${item.id} of ₹${item.amount / 100}...`);
            const { data: reconciled, error: reconcileError } = await supabase.rpc('record_refund_success', {
              p_order_id: orderId,
              p_refund_id: item.id,
              p_refund_amount: Number(item.amount) / 100,
              p_reason: item.notes?.reason || 'Reconciled from gateway pagination',
              p_provider_payment_id: paymentRecord.provider_payment_id,
            });
            if (reconcileError || reconciled?.success !== true) {
              throw new Error('Gateway refund could not be recorded locally; reconciliation required');
            }
            recordedRefundIds.add(item.id);
          }
        }

        if (items.length < pageSize) {
          paginationExhausted = true;
          hasMorePages = false;
        } else {
          page++;
        }
      }
    } catch (reconcileErr: any) {
      console.warn('Network exception while paginating Razorpay refunds:', reconcileErr?.message || reconcileErr);
      paginationError = true;
      paginationErrorMessage = reconcileErr?.message || 'Network exception during pagination';
    }

    // If an existing matching refund was found on Razorpay:
    if (matchedGatewayRefund && !paginationError) {
      if (matchedGatewayRefund.status === 'processed') {
        const { data: recordRes, error: recordErr } = await supabase.rpc('record_refund_success', {
          p_order_id: orderId,
          p_refund_id: matchedGatewayRefund.id,
          p_refund_amount: Number(matchedGatewayRefund.amount) / 100,
          p_reason: reason || 'Reconciled gateway refund',
          p_provider_payment_id: paymentRecord.provider_payment_id,
          p_operation_id: operationId,
        });

        if (recordErr || recordRes?.success !== true) {
          return errorResponse(`Gateway refund confirmed (${matchedGatewayRefund.id}) but local sync failed; reconciliation required.`, 500);
        }

        return jsonResponse({
          success: true,
          message: 'Existing refund reconciled from gateway.',
          refundId: matchedGatewayRefund.id,
          refundAmount: Number(matchedGatewayRefund.amount) / 100,
          isDuplicate: true,
          paymentStatus: recordRes?.payment_status || 'refunded',
        });
      } else if (matchedGatewayRefund.status === 'pending') {
        return jsonResponse({
          success: true,
          status: 'pending',
          message: 'Refund is currently pending at bank/gateway.',
          refundId: matchedGatewayRefund.id,
          refundAmount: Number(matchedGatewayRefund.amount) / 100,
        });
      }
    }

    // SAFE BOUNDARY GUARD: If pagination did not complete cleanly and no matching refund was found,
    // we MUST NOT proceed to dispatch a new refund! Mark operation as uncertain and abort safely.
    const isPaginationIncomplete = paginationError || (!paginationExhausted && page >= maxPages);
    if (isPaginationIncomplete) {
      console.error(
        `Pre-check pagination could not complete verified traversal (error: ${paginationError}, exhausted: ${paginationExhausted}, page: ${page}). Aborting refund creation.`
      );
      await supabase.rpc('force_fail_refund_operation', {
        p_operation_id: operationId,
        p_error_code: 'GATEWAY_PRECHECK_INCOMPLETE',
        p_error_desc: `Unable to fully verify gateway refund history: ${paginationErrorMessage || 'pagination limit reached'}`,
        p_is_uncertain: true,
      });

      return errorResponse(
        'Gateway refund history could not be verified conclusively. Please retry shortly or reconcile manually.',
        502
      );
    }

    // 4. Dispatch POST Refund to Razorpay with X-Refund-Idempotency Header
    const refundAmountInPaise = Math.round(requestedRefund * 100);
    let rzpRes: Response;
    let rzpData: any;

    try {
      rzpRes = await fetch(
        `https://api.razorpay.com/v1/payments/${paymentRecord.provider_payment_id}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${rzpAuth}`,
            'X-Refund-Idempotency': idempotencyKey,
          },
          body: JSON.stringify({
            amount: refundAmountInPaise,
            notes: {
              reason: reason || 'Customer refund requested by store admin',
              order_id: orderId,
              operation_id: operationId,
            },
          }),
        }
      );
      rzpData = await rzpRes.json();
    } catch (networkErr: any) {
      console.error('Network timeout/failure contacting Razorpay refund API:', networkErr.message || networkErr);
      // Mark operation as uncertain - outcome is unknown, must not fail or issue second refund
      await supabase.rpc('force_fail_refund_operation', {
        p_operation_id: operationId,
        p_error_code: 'NETWORK_TIMEOUT',
        p_error_desc: 'Network timeout contacting Razorpay: ' + (networkErr.message || 'Unknown network error'),
        p_is_uncertain: true,
      });

      return errorResponse(
        'Gateway communication timed out. Refund outcome is uncertain and awaiting automatic reconciliation. Please do not retry immediately.',
        504
      );
    }

    // 5. Handle Provider Status Codes
    if (rzpRes.status === 409) {
      // 409 Conflict: Razorpay is currently processing this refund
      return jsonResponse({
        success: false,
        status: 'in_progress',
        message: 'Refund is currently in progress at payment gateway. Please check back shortly.',
        retryAfterSeconds: 5,
      }, 409);
    }

    if (!rzpRes.ok) {
      console.error('Razorpay Refund API Rejection:', rzpData.error?.description || 'Unknown error');
      const isUncertain = rzpRes.status >= 500;
      await supabase.rpc('force_fail_refund_operation', {
        p_operation_id: operationId,
        p_error_code: rzpData.error?.code || `HTTP_${rzpRes.status}`,
        p_error_desc: rzpData.error?.description || 'Gateway rejected refund',
        p_is_uncertain: isUncertain,
      });

      return errorResponse(
        rzpData.error?.description || 'Razorpay refund request rejected.',
        rzpRes.status
      );
    }

    // 6. Handle Provider Status
    if (rzpData.status === 'pending') {
      // Refund created but pending settlement by provider bank
      return jsonResponse({
        success: true,
        status: 'pending',
        message: 'Refund accepted and pending bank confirmation.',
        refundId: rzpData.id,
        refundAmount: requestedRefund,
        operationId: operationId,
      });
    }

    if (rzpData.status !== 'processed') {
      await supabase.rpc('force_fail_refund_operation', {
        p_operation_id: operationId,
        p_error_code: 'UNEXPECTED_REFUND_STATUS',
        p_error_desc: 'Gateway did not confirm a processed refund; reconciliation required.',
        p_is_uncertain: true,
      });
      return errorResponse('Refund outcome is uncertain; reconciliation required.', 502);
    }

    // 7. Confirmed Successful Gateway Refund: Commit Atomic Accounting in Database
    const { data: refundResult, error: rpcErr } = await supabase.rpc('record_refund_success', {
      p_order_id: orderId,
      p_refund_id: rzpData.id,
      p_refund_amount: requestedRefund,
      p_reason: reason || 'Admin refund',
      p_provider_payment_id: paymentRecord.provider_payment_id,
      p_operation_id: operationId,
    });

    if (rpcErr) {
      console.error('RPC Error updating refund record:', rpcErr.message);
      return errorResponse(
        `Refund of ₹${requestedRefund} succeeded at Razorpay (${rzpData.id}) but database update failed: ${rpcErr.message}`,
        500
      );
    }

    if (refundResult?.success !== true) {
      console.error('Refund record rejected by RPC:', refundResult?.error);
      return errorResponse(
        `Refund at Razorpay succeeded (${rzpData.id}) but local record was rejected; reconciliation required.`,
        500
      );
    }

    return jsonResponse({
      success: true,
      message: refundResult?.is_duplicate ? 'Refund already recorded in database.' : 'Refund processed successfully.',
      refundId: rzpData.id,
      refundAmount: requestedRefund,
      isDuplicate: !!refundResult?.is_duplicate,
      paymentStatus: refundResult?.payment_status || 'refunded',
      operationId: operationId,
    });
  } catch (err: any) {
    console.error('Edge Function Error [refund-razorpay-payment]:', err.message || err);
    return errorResponse(err.message || 'Refund processing failed.', 500);
  }
});
