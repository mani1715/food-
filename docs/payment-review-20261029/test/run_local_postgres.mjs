import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Deliberately no remote host/URL option. Requires the previously isolated cluster.
const psql = process.env.AISHU_PSQL || 'C:/Program Files/PostgreSQL/17/bin/psql.exe';
const name = `aishu_consolidated_${Date.now()}`;
const args = ['-X','-w','-h','127.0.0.1','-p','55439','-U','postgres','-v','ON_ERROR_STOP=1'];
const sql = (database, input) => execFileSync(psql,[...args,'-d',database,'-At'], {input,encoding:'utf8',timeout:60000,stdio:['pipe','pipe','pipe']});
const file = (database, url) => execFileSync(psql,[...args,'-d',database,'-f',fileURLToPath(url)], {encoding:'utf8',timeout:60000,stdio:['ignore','pipe','pipe']});
const identity = sql('postgres', "SELECT inet_server_addr(), inet_server_port(), current_setting('data_directory');");
assert.match(identity, /^127\.0\.0\.1\|55439\|.*aishu-stage-c-.*\/data/);
const root = new URL('../', import.meta.url);
sql('postgres', `CREATE DATABASE ${name};`);
console.log(`Disposable database: ${name}`);
try {
  file(name, new URL('test/reported_baseline.sql', root));
  const before = sql(name, `SELECT
    NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='price'),
    to_regprocedure('public.place_order_secure(jsonb)') IS NULL,
    to_regclass('public.payments') IS NULL,
    to_regclass('public.order_number_seq') IS NULL,
    (SELECT count(*) FROM products), (SELECT count(*) FROM product_weight_options);`);
  assert.equal(before.trim(),'t|t|t|t|21|49');
  const idDefault = sql(name, "SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='id';");
  const migration = new URL('supabase/migrations/20261029110000_aishu_payment_lifecycle_hardening.sql', root);
  file(name, new URL('preflight_read_only.sql', root));
  file(name,migration);
  assert.equal(sql(name, "SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='id';"),idDefault);
  file(name, new URL('test/checkout_integration.sql', root));
  file(name, new URL('test/lifecycle_regressions.sql', root));
  file(name,migration);
  file(name, new URL('test/checkout_integration.sql', root));
  file(name, new URL('test/lifecycle_regressions.sql', root));
  file(name, new URL('preflight_read_only.sql', root));
  const payload = JSON.stringify({customer:{name:'Concurrent Fixture',phone:'9999999999',email:'fixture@example.invalid'},delivery_address:{address:'123 Test Street',city:'Test',pincode:'500001'},items:[{product_id:'fixture-1',selected_weight:'250g',quantity:1}],payment_method:'UPI',idempotency_key:'concurrent-checkout'});
  const query = `BEGIN; SET LOCAL ROLE anon; SELECT set_config('request.jwt.claim.role','anon',true); SELECT public.place_order_secure('${payload}'::jsonb); COMMIT;`;
  const concurrent = await Promise.all([1,2].map(() => promisify(execFile)(psql,[...args,'-d',name,'-At','-c',query],{encoding:'utf8',timeout:30000})));
  const orders = concurrent.map(r=>JSON.parse(r.stdout.split(/\r?\n/).find(line=>line.startsWith('{'))));
  assert.equal(orders[0].order_id,orders[1].order_id);
  assert.equal(orders.filter(o=>o.is_duplicate).length,1);
  assert.equal(sql(name,"SELECT count(*), (SELECT inventory_count FROM products WHERE id='fixture-1') FROM orders;").trim(),'1|99');
  const oid = orders[0].order_id;
  sql(name, `SELECT set_config('request.jwt.claim.role','service_role',false); SELECT record_payment_attempt('${oid}','order_concurrent',548,'INR'); SELECT finalize_payment_success('${oid}','pay_concurrent','order_concurrent',548,'INR','UPI',true);`);
  const reservations = await Promise.all([400,200].map(amount=>promisify(execFile)(psql,[...args,'-d',name,'-At','-c',`SELECT set_config('request.jwt.claim.role','service_role',false); SELECT initiate_refund_operation('${oid}','reservation-${amount}',${amount});`],{encoding:'utf8',timeout:30000})));
  assert.equal(reservations.map(r=>JSON.parse(r.stdout.split(/\r?\n/).find(line=>line.startsWith('{')))).filter(r=>r.success).length,1);
  console.log('PASS: concurrent checkout creates one order/debits stock once; concurrent refunds cannot over-reserve.');
  console.log('PASS: reported baseline, preflight, migration, checkout/lifecycle assertions, repeat migration and assertions.');
  console.log('Database retained for inspection; no remote connection was used.');
} catch (error) {
  console.error(error.stderr?.toString() || error.message);
  process.exitCode = 1;
}
