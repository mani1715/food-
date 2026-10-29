import test from 'node:test';
import assert from 'node:assert/strict';
import { recordPaymentAttemptWithRecovery, validateRazorpayOrder } from '../supabase/functions/_shared/payment-attempt.js';

const success = (orderId = 'ord-123', providerOrderId = 'order_ABC123') => ({
  data: { success: true, order_id: orderId, provider_order_id: providerOrderId }, error: null,
});

test('accepts only a valid Razorpay order matching expected paise and INR', () => {
  assert.equal(validateRazorpayOrder({ id: 'order_ABC123', amount: 49900, currency: 'INR', status: 'created' }, 49900).ok, true);
  assert.equal(validateRazorpayOrder({ id: 'order_ABC123', amount: 49899, currency: 'INR' }, 49900).ok, false);
  assert.equal(validateRazorpayOrder({ id: 'order_ABC123', amount: 49900, currency: 'USD' }, 49900).ok, false);
  assert.equal(validateRazorpayOrder({ amount: 49900, currency: 'INR' }, 49900).ok, false);
  assert.equal(validateRazorpayOrder(null, 49900).ok, false);
});

test('returns success only when RPC success and identifiers match', async () => {
  const result = await recordPaymentAttemptWithRecovery({ rpc: async () => success(), orderId: 'ord-123', providerOrderId: 'order_ABC123', amount: 499 });
  assert.deepEqual(result, { ok: true, recovered: false });
});

test('does not return checkout success when RPC returns success:false', async () => {
  let calls = 0;
  const result = await recordPaymentAttemptWithRecovery({ rpc: async () => { calls++; return { data: { success: false, error: 'Order is cancelled' }, error: null }; }, orderId: 'ord-123', providerOrderId: 'order_ABC123', amount: 499 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'rpc_rejected');
  assert.equal(calls, 1, 'definitive business rejection must not be retried');
});

test('does not return checkout success for malformed RPC data or mismatched identifiers', async () => {
  for (const data of [null, { success: true }, { success: true, order_id: 'wrong', provider_order_id: 'order_ABC123' }]) {
    const result = await recordPaymentAttemptWithRecovery({ rpc: async () => ({ data, error: null }), orderId: 'ord-123', providerOrderId: 'order_ABC123', amount: 499 });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'malformed_rpc_response');
  }
});

test('retries the same idempotent RPC once after an ambiguous transport error', async () => {
  let calls = 0;
  const seen = [];
  const result = await recordPaymentAttemptWithRecovery({
    rpc: async (_name, args) => { calls++; seen.push(args); return calls === 1 ? { error: new Error('connection reset') } : success(); },
    orderId: 'ord-123', providerOrderId: 'order_ABC123', amount: 499,
  });
  assert.deepEqual(result, { ok: true, recovered: true });
  assert.equal(calls, 2);
  assert.deepEqual(seen[0], seen[1], 'retry must reuse the same provider order ID and amount');
});

test('leaves checkout unsuccessful and signals reconciliation if recording remains ambiguous', async () => {
  let calls = 0;
  const result = await recordPaymentAttemptWithRecovery({ rpc: async () => { calls++; return { error: new Error('database unavailable') }; }, orderId: 'ord-123', providerOrderId: 'order_ABC123', amount: 499 });
  assert.equal(result.ok, false);
  assert.equal(result.retryable, true);
  assert.equal(result.reason, 'database_transport_unresolved');
  assert.equal(calls, 2);
});

test('Edge Function gates checkout response on durable payment-attempt recording', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../supabase/functions/_shared/create-razorpay-order-handler.js', import.meta.url), 'utf8');
  assert.match(source, /recordPaymentAttemptWithRecovery/);
  assert.match(source, /if \(!recorded\.ok\)/);
  assert.match(source, /code: 'PAYMENT_ATTEMPT_NOT_RECORDED'/);
  assert.match(source, /success: false/);
  assert.match(source, /recovery: 'reconcile_existing_razorpay_order'/);
});
