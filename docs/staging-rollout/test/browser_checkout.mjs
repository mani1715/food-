// Local-only test harness. No service key or Razorpay secret is needed or stored.
import http from 'node:http';
const base = 'https://mjnktiyufvzkibrsdxug.supabase.co';
const anon = process.env.AISHU_STAGING_ANON;
if (!anon) throw new Error('AISHU_STAGING_ANON required');
const headers = { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' };
async function api(path, body) {
 const r = await fetch(base + path, { headers, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
 const data = await r.json();
 if (!r.ok) throw new Error(`Staging request failed: ${r.status}`);
 return data;
}
const health = await api('/functions/v1/staging-payment-health');
if (!health.razorpayTestMode || !health.webhookSecretPresent) throw new Error('Test-mode/webhook gate failed');
const checkout = await api('/rest/v1/rpc/place_order_secure', { p_order_payload: {
 customer: { name: 'Staging Browser Test', phone: '9999999999', email: 'staging-browser@example.invalid' },
 delivery_address: { address: 'Synthetic Address', city: 'Test City', pincode: '500001' },
 items: [{ product_id: 'staging-payment-smoke-20261031', selected_weight: '250g', quantity: 1 }],
 payment_method: 'Card', idempotency_key: 'staging-browser-20261101-01',
} });
const payment = await api('/functions/v1/create-razorpay-order', { orderId: checkout.order_id, paymentToken: checkout.payment_session_token });
if (!payment.success || !payment.keyId.startsWith('rzp_test_')) throw new Error('Refusing non-test payment');
let result = { state: 'ready', storeOrderId: checkout.order_id, providerOrderId: payment.razorpayOrderId };
const options = { key: payment.keyId, order_id: payment.razorpayOrderId, amount: payment.amount, currency: 'INR', name: 'Aishu STAGING TEST', description: 'Test-mode only. No real charge.', prefill: { name: 'Staging Test', email: 'staging-browser@example.invalid', contact: '9000090000' } };
const html = `<!doctype html><meta charset="utf-8"><title>Aishu staging payment test</title><h1>Staging test payment — no real charge</h1><p>Project: mjnktiyufvzkibrsdxug</p><button id="pay">Open Razorpay test checkout</button><pre id="status">Ready</pre><script src="https://checkout.razorpay.com/v1/checkout.js"></script><script>
const options=${JSON.stringify(options)};
options.handler=async response=>{document.querySelector('#status').textContent='Verifying test payment';const r=await fetch('/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(response)});document.querySelector('#status').textContent=JSON.stringify(await r.json(),null,2);};
document.querySelector('#pay').onclick=()=>new Razorpay(options).open();
</script>`;
const server = http.createServer(async (req, res) => {
 if (req.headers.host !== '127.0.0.1:4179') { res.writeHead(403).end(); return; }
 res.setHeader('Cache-Control','no-store');
 if (req.method === 'GET' && req.url === '/') { res.setHeader('Content-Type','text/html'); res.end(html); return; }
 if (req.method === 'GET' && req.url === '/status') { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(result)); return; }
 if (req.method === 'POST' && req.url === '/verify' && req.headers.origin === 'http://127.0.0.1:4179') {
  try {
   let raw=''; for await(const chunk of req) {raw+=chunk;if(raw.length>16384)throw Error('oversized');}
   const body=JSON.parse(raw);
   const verified=await api('/functions/v1/verify-razorpay-payment',{orderId:checkout.order_id,paymentToken:checkout.payment_session_token,razorpayOrderId:body.razorpay_order_id,razorpayPaymentId:body.razorpay_payment_id,razorpaySignature:body.razorpay_signature});
   result={...result,state:'verified',providerPaymentId:body.razorpay_payment_id,success:verified.success};
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));
  } catch {res.writeHead(500).end(JSON.stringify({error:'Verification failed; inspect staging evidence'}));}
  return;
 }
 res.writeHead(404).end();
});
server.listen(4179,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:4179',...result})));
