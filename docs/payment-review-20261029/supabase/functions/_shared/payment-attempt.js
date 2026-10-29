/**
 * Helpers shared by create-razorpay-order and Node regression tests.
 * A retry is safe only because the proposed record_payment_attempt RPC is idempotent
 * for the same provider_order_id + order_id + amount + currency tuple.
 */
export function validateRazorpayOrder(data, expectedAmountPaise) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, reason: 'malformed_json' };
  }
  if (typeof data.id !== 'string' || !/^order_[A-Za-z0-9]+$/.test(data.id)) {
    return { ok: false, reason: 'missing_or_invalid_order_id' };
  }
  if (data.amount !== expectedAmountPaise || data.currency !== 'INR') {
    return { ok: false, reason: 'amount_or_currency_mismatch' };
  }
  if (data.status !== undefined && data.status !== 'created') {
    return { ok: false, reason: 'unexpected_order_status' };
  }
  return { ok: true, order: data };
}

function isRecordedResponse(data, orderId, providerOrderId) {
  return Boolean(
    data && typeof data === 'object' && !Array.isArray(data) &&
    data.success === true && data.order_id === orderId &&
    data.provider_order_id === providerOrderId
  );
}

/**
 * Records one Razorpay order in the database. A transport error is ambiguous:
 * the server may have committed before the connection failed. Retry exactly once
 * with the same provider order ID; the SQL RPC must be idempotent for this to be safe.
 */
export async function recordPaymentAttemptWithRecovery({ rpc, orderId, providerOrderId, amount, currency = 'INR' }) {
  const args = {
    p_order_id: orderId,
    p_provider_order_id: providerOrderId,
    p_amount: amount,
    p_currency: currency,
  };

  let first;
  try {
    first = await rpc('record_payment_attempt', args);
  } catch (error) {
    first = { error };
  }

  if (!first?.error) {
    if (isRecordedResponse(first?.data, orderId, providerOrderId)) {
      return { ok: true, recovered: false };
    }
    return {
      ok: false,
      retryable: false,
      reason: first?.data?.success === false ? 'rpc_rejected' : 'malformed_rpc_response',
    };
  }

  // One retry with the same provider ID is safe because the RPC has idempotent replay semantics.
  let second;
  try {
    second = await rpc('record_payment_attempt', args);
  } catch (error) {
    second = { error };
  }
  if (!second?.error && isRecordedResponse(second?.data, orderId, providerOrderId)) {
    return { ok: true, recovered: true };
  }

  return {
    ok: false,
    retryable: true,
    reason: second?.error ? 'database_transport_unresolved' :
      second?.data?.success === false ? 'rpc_rejected_after_retry' : 'malformed_rpc_response_after_retry',
  };
}
