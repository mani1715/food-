import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

for (const authorized of [false, true]) test(`completed payment response requires authorization: ${authorized}`, async () => {
  let handler;
  const order = { id: 'test-order', payment_status: 'completed', payment_session_token: 'test-proof', payment_token_expires_at: '2099-01-01T00:00:00Z' };
  const client = { from: () => ({ select() { return this; }, eq() { return this; }, single: async () => ({ data: order }) }) };
  const source = fs.readFileSync(new URL('../supabase/functions/verify-razorpay-payment/index.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const requireMock = name => name.includes('server.ts') ? { serve: fn => { handler = fn; } }
    : name.includes('supabase-js') ? { createClient: () => client }
    : { jsonResponse: body => Response.json(body), errorResponse: (error, status = 400) => Response.json({ success: false, error }, { status }) };
  new Function('require', 'Deno', 'exports', outputText)(requireMock, { env: { get: () => 'test-only' } }, {});
  const response = await handler(new Request('https://test.invalid', { method: 'POST', body: JSON.stringify({ orderId: 'test-order', razorpayOrderId: 'order_test', razorpayPaymentId: 'pay_test', razorpaySignature: 'invalid', ...(authorized ? { paymentToken: 'test-proof' } : {}) }) }));
  assert.equal(response.status, authorized ? 200 : 403);
  assert.equal((await response.json()).success, authorized);
});
