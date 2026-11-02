import test from 'node:test';
import assert from 'node:assert/strict';
import { createRazorpayOrderHandler } from '../supabase/functions/_shared/create-razorpay-order-handler.js';

const order = {
  id: 'ord-123', order_number: 'AF-123', grand_total: 499,
  payment_status: 'pending', order_status: 'placed', created_at: '2026-10-29T00:00:00Z',
  customer_id: null, customer_name: 'Test Customer', customer_phone: '9999999999',
  customer_email: 'customer@example.test', payment_session_token: 'guest-token',
  payment_token_expires_at: '2099-01-01T00:00:00Z',
};
const secrets = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  RAZORPAY_KEY_ID: 'rzp_test_example',
  RAZORPAY_KEY_SECRET: 'test-razorpay-secret',
};

function makeHarness({ rpcResults, storePaymentEnabled = true }) {
  let rpcIndex = 0;
  const rpcCalls = [];
  const providerCalls = [];
  const logs = [];
  const supabase = {
    from(table) {
      if (table === 'store_settings') {
        return {
          select() { return this; },
          eq(column, value) { return this; },
          async maybeSingle() { return { data: { payment_enabled: storePaymentEnabled }, error: null }; },
        };
      }
      assert.equal(table, 'orders');
      return {
        select() { return this; },
        eq(column, value) { assert.equal(column, 'id'); assert.equal(value, 'ord-123'); return this; },
        async single() { return { data: order, error: null }; },
      };
    },
    auth: { async getUser() { return { data: { user: null }, error: null }; } },
    async rpc(name, args) {
      rpcCalls.push({ name, args });
      const next = rpcResults[rpcIndex++];
      if (next instanceof Error) throw next;
      return next;
    },
  };
  const handler = createRazorpayOrderHandler({
    env: (name) => secrets[name],
    createClient: (url, key) => { assert.equal(url, secrets.SUPABASE_URL); assert.equal(key, secrets.SUPABASE_SERVICE_ROLE_KEY); return supabase; },
    fetchImpl: async (url, options) => {
      providerCalls.push({ url, options });
      return Response.json({ id: 'order_RZP123', amount: 49900, currency: 'INR', status: 'created' }, { status: 200 });
    },
    corsHeaders: {},
    jsonResponse: (body, status = 200) => Response.json(body, { status }),
    errorResponse: (message, status = 400) => Response.json({ success: false, error: message }, { status }),
    logError: (...args) => logs.push(args),
  });
  return { handler, rpcCalls, providerCalls, logs };
}

function request() {
  return new Request('https://edge.example.test/create-razorpay-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: 'ord-123', paymentToken: 'guest-token' }),
  });
}

const recorded = {
  data: { success: true, order_id: 'ord-123', provider_order_id: 'order_RZP123' },
  error: null,
};

test('handler returns HTTP 503 and withholds checkout details when both DB recording attempts fail', async () => {
  const { handler, rpcCalls, providerCalls } = makeHarness({ rpcResults: [new Error('connection reset'), new Error('database unavailable')] });
  const response = await handler(request());
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.success, false);
  assert.equal(payload.code, 'PAYMENT_ATTEMPT_NOT_RECORDED');
  assert.equal(payload.recovery, 'reconcile_existing_razorpay_order');
  for (const forbidden of ['razorpayOrderId', 'keyId', 'amount', 'currency', 'customer', 'orderNumber']) {
    assert.equal(Object.hasOwn(payload, forbidden), false, `503 must not include ${forbidden}`);
  }
  assert.equal(providerCalls.length, 1, 'provider order must only be created once');
  assert.equal(rpcCalls.length, 2, 'database RPC may be retried once');
  assert.equal(rpcCalls[0].name, 'record_payment_attempt');
  assert.equal(rpcCalls[1].name, 'record_payment_attempt');
  assert.deepEqual(rpcCalls[1].args, rpcCalls[0].args, 'retry must reuse the exact same provider order ID and arguments');
  assert.equal(rpcCalls[0].args.p_provider_order_id, 'order_RZP123');
});

test('handler recovers on same-ID DB retry, returns checkout only after durable record, and creates one provider order', async () => {
  const { handler, rpcCalls, providerCalls } = makeHarness({ rpcResults: [new Error('connection reset'), recorded] });
  const response = await handler(request());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.razorpayOrderId, 'order_RZP123');
  assert.equal(payload.keyId, secrets.RAZORPAY_KEY_ID);
  assert.equal(providerCalls.length, 1, 'DB retry must not issue a second Razorpay order-create request');
  assert.equal(rpcCalls.length, 2);
  assert.deepEqual(rpcCalls[1].args, rpcCalls[0].args);
});

test('handler does not retry a definitive success:false RPC rejection and withholds checkout data', async () => {
  const { handler, rpcCalls, providerCalls } = makeHarness({ rpcResults: [{ data: { success: false, error: 'Order is cancelled' }, error: null }] });
  const response = await handler(request());
  const payload = await response.json();
  assert.equal(response.status, 503);
  assert.equal(payload.success, false);
  assert.equal(payload.code, 'PAYMENT_ATTEMPT_NOT_RECORDED');
  assert.equal(Object.hasOwn(payload, 'razorpayOrderId'), false);
  assert.equal(rpcCalls.length, 1);
  assert.equal(providerCalls.length, 1);
});

test('handler returns HTTP 403 when store_settings payment_enabled is false', async () => {
  const { handler, providerCalls, rpcCalls } = makeHarness({ rpcResults: [], storePaymentEnabled: false });
  const response = await handler(request());
  assert.equal(response.status, 403);
  const data = await response.json();
  assert.equal(data.success, false);
  assert.match(data.error, /disabled by store administrator/i);
  assert.equal(providerCalls.length, 0, 'No gateway order should be created when payments are disabled');
  assert.equal(rpcCalls.length, 0);
});
