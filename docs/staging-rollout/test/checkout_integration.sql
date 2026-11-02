BEGIN;
INSERT INTO public.products(id,name,slug,description,inventory_count) SELECT 'fixture-'||n,'Synthetic Product '||n,'fixture-'||n,'Staging synthetic test',100 FROM generate_series(1,21) n;
INSERT INTO public.product_weight_options(product_id,weight_label,price) SELECT 'fixture-'||n,w||'g',499 FROM generate_series(1,21) n CROSS JOIN (VALUES(250),(500)) t(w);
INSERT INTO public.product_weight_options(product_id,weight_label,price) SELECT 'fixture-'||n,'1000g',999 FROM generate_series(1,7) n;
CREATE FUNCTION pg_temp.check_true(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'Assertion failed: %', label; END IF; END $$;
CREATE FUNCTION pg_temp.payload(key text, method text DEFAULT 'COD') RETURNS jsonb LANGUAGE sql AS $$
SELECT jsonb_build_object('customer',jsonb_build_object('name','Synthetic Customer','phone','9999999999','email','fixture@example.invalid'),
  'delivery_address',jsonb_build_object('address','123 Synthetic Street','city','Test City','pincode','500001'),
  'items',jsonb_build_array(jsonb_build_object('product_id','fixture-1','selected_weight','250g','quantity',1)),
  'payment_method',method,'idempotency_key',key)
$$;
SELECT pg_temp.check_true(NOT EXISTS(SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='price'),'no products.price fixture crutch');
SELECT pg_temp.check_true(to_regclass('public.payment_refund_operations') IS NOT NULL,'full lifecycle installed');
SELECT pg_temp.check_true((SELECT column_default LIKE '%pending%' FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='payment_status'),'pending default');
SELECT pg_temp.check_true((SELECT column_default LIKE '%oitem-%' FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='id'),'item ID default preserved');
SELECT pg_temp.check_true(NOT EXISTS(SELECT FROM pg_proc p, LATERAL aclexplode(p.proacl) a WHERE p.oid='public.place_order_secure(jsonb)'::regprocedure AND a.grantee=0 AND a.privilege_type='EXECUTE'),'PUBLIC cannot execute');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.role','anon',true);
DO $$ DECLARE a jsonb; b jsonb; BEGIN
  a := public.place_order_secure(pg_temp.payload('guest-cod'));
  PERFORM pg_temp.check_true(a->>'payment_status'='pending' AND (a->>'grand_total')::numeric=548,'guest COD authoritative total');
  b := public.place_order_secure(pg_temp.payload('guest-cod'));
  PERFORM pg_temp.check_true(b->>'order_id'=a->>'order_id' AND (b->>'is_duplicate')::boolean,'guest exact retry');
END $$;
RESET ROLE;
SELECT pg_temp.check_true((SELECT inventory_count=99 FROM products WHERE id='fixture-1'),'retry debits stock once');
SELECT pg_temp.check_true((SELECT count(*)=1 FROM orders),'retry creates one order');
DO $$ DECLARE bad jsonb; before_stock int; before_orders int; msg text; BEGIN
  SELECT inventory_count INTO before_stock FROM products WHERE id='fixture-1';
  SELECT count(*) INTO before_orders FROM orders;
  FOREACH bad IN ARRAY ARRAY[
    pg_temp.payload('guest-cod','UPI'),
    jsonb_set(pg_temp.payload('bad-quantity'),'{items,0,quantity}','0'),
    jsonb_set(pg_temp.payload('bad-weight'),'{items,0,selected_weight}','"invalid"'),
    jsonb_set(pg_temp.payload('missing-product'),'{items,0,product_id}','"missing"'),
    jsonb_set(pg_temp.payload('empty-cart'),'{items}','[]'),
    pg_temp.payload('bad-method','Cash'),
    pg_temp.payload('bad-coupon') || '{"coupon_code":"MISSING"}'::jsonb
  ] LOOP
    msg := NULL;
    BEGIN PERFORM public.place_order_secure(bad); EXCEPTION WHEN OTHERS THEN msg:=SQLERRM; END;
    PERFORM pg_temp.check_true(msg IS NOT NULL,'invalid checkout rejected');
  END LOOP;
  PERFORM pg_temp.check_true((SELECT inventory_count=before_stock FROM products WHERE id='fixture-1'),'invalid requests preserve stock');
  PERFORM pg_temp.check_true((SELECT count(*)=before_orders FROM orders),'invalid requests preserve orders');
END $$;
INSERT INTO auth.users(id,email) VALUES ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','fixture@example.invalid');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT pg_temp.check_true(public.place_order_secure(pg_temp.payload('user-card','Card'))->>'payment_status'='pending','authenticated Card pending');
DO $$ BEGIN
  BEGIN
    INSERT INTO orders(id,order_number,customer_id,customer_name,customer_phone,customer_email,delivery_address_json,subtotal,grand_total,payment_method)
    VALUES('bypass','BYPASS',auth.uid(),'Bypass','9999999999','fixture@example.invalid','{}',1,1,'COD');
    RAISE EXCEPTION 'Direct customer insert unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT pg_temp.check_true((SELECT customer_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'::uuid FROM orders WHERE idempotency_key='user-card'),'customer identity from auth');
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ DECLARE a jsonb; b jsonb; oid text; total numeric; BEGIN
  a := public.place_order_secure(pg_temp.payload('service-upi','UPI'));
  oid := a->>'order_id'; total := (a->>'grand_total')::numeric;
  PERFORM pg_temp.check_true(a->>'payment_status'='pending','service UPI pending');
  a := public.record_payment_attempt(oid,'order_fixture',total,'INR');
  PERFORM pg_temp.check_true((a->>'success')::boolean,'attempt recorded');
  b := public.record_payment_attempt(oid,'order_fixture',total,'INR');
  PERFORM pg_temp.check_true((b->>'success')::boolean,'same-ID attempt replay');
  PERFORM pg_temp.check_true((SELECT count(*)=1 FROM payments WHERE provider_order_id='order_fixture'),'attempt not duplicated');
  PERFORM pg_temp.check_true((public.record_payment_attempt(oid,'order_fixture',total+0.01,'INR')->>'success')::boolean=false,'wrong amount rejected');
  PERFORM pg_temp.check_true((public.record_payment_attempt(oid,'order_fixture',total,'USD')->>'success')::boolean=false,'wrong currency rejected');
  a:=public.record_payment_failure(oid,'order_fixture','test failure','test');
  PERFORM pg_temp.check_true((SELECT payment_status='failed' FROM orders WHERE id=oid),'failure recorded');
  a:=public.finalize_payment_success(oid,'pay_fixture','order_fixture',total,'INR','UPI',true);
  PERFORM pg_temp.check_true((a->>'success')::boolean AND a->>'payment_status'='completed','verified capture recovers failure');
  a:=public.finalize_payment_success(oid,'pay_fixture','order_fixture',total,'INR','UPI',true);
  PERFORM pg_temp.check_true((a->>'is_duplicate')::boolean,'capture replay');
  PERFORM public.record_payment_failure(oid,'order_fixture','late failure','test');
  PERFORM pg_temp.check_true((SELECT payment_status='completed' FROM orders WHERE id=oid),'late failure cannot downgrade capture');
END $$;
-- Cancellation releases inventory once, cleanup does not release it again.
DO $$ DECLARE oid text; stock int; a jsonb; BEGIN
  SELECT id INTO oid FROM orders WHERE idempotency_key='user-card';
  SELECT inventory_count INTO stock FROM products WHERE id='fixture-1';
  a:=public.cancel_order_secure(oid,'Local test');
  PERFORM pg_temp.check_true((a->>'success')::boolean,'unpaid cancellation');
  a:=public.cancel_order_secure(oid,'Duplicate');
  PERFORM pg_temp.check_true((a->>'is_duplicate')::boolean,'duplicate cancellation');
  PERFORM pg_temp.check_true((SELECT inventory_count=stock+1 FROM products WHERE id='fixture-1'),'stock released once');
END $$;
INSERT INTO coupons(id,code,discount_type,discount_value) VALUES('fixture-coupon','LOCAL10','flat',10);
DO $$ DECLARE a jsonb; oid text; stock int; msg text; BEGIN
  SELECT inventory_count INTO stock FROM products WHERE id='fixture-1';
  a:=public.place_order_secure(pg_temp.payload('coupon','UPI')||'{"coupon_code":"LOCAL10"}'::jsonb);
  oid:=a->>'order_id';
  PERFORM pg_temp.check_true((a->>'grand_total')::numeric=538,'coupon authoritative total');
  PERFORM public.place_order_secure(pg_temp.payload('coupon','UPI')||'{"coupon_code":"LOCAL10"}'::jsonb);
  PERFORM pg_temp.check_true((SELECT usage_count=1 FROM coupons WHERE id='fixture-coupon'),'coupon replay counted once');
  UPDATE orders SET created_at=now()-interval '2 hours' WHERE id=oid;
  PERFORM public.cleanup_expired_unpaid_orders(30);
  PERFORM public.cleanup_expired_unpaid_orders(30);
  PERFORM pg_temp.check_true((SELECT order_status='cancelled' FROM orders WHERE id=oid),'cleanup cancels unpaid online order');
  PERFORM pg_temp.check_true((SELECT inventory_count=stock FROM products WHERE id='fixture-1'),'cleanup releases stock once');
  PERFORM pg_temp.check_true((SELECT usage_count=0 FROM coupons WHERE id='fixture-coupon'),'cleanup restores coupon once');
  -- Force a downstream item insert failure after coupon update to prove atomic rollback.
  ALTER TABLE order_items ADD CONSTRAINT fixture_reject CHECK (product_id <> 'fixture-2');
  msg:=NULL;
  BEGIN
    PERFORM public.place_order_secure(jsonb_set(pg_temp.payload('atomic-coupon'),'{items,0,product_id}','"fixture-2"')||'{"coupon_code":"LOCAL10"}'::jsonb);
  EXCEPTION WHEN check_violation THEN msg:=SQLERRM; END;
  PERFORM pg_temp.check_true(msg IS NOT NULL,'downstream failure injected');
  PERFORM pg_temp.check_true(NOT EXISTS(SELECT FROM orders WHERE idempotency_key='atomic-coupon'),'failed insert rolls order back');
  PERFORM pg_temp.check_true((SELECT inventory_count=100 FROM products WHERE id='fixture-2'),'failed insert preserves stock');
  PERFORM pg_temp.check_true((SELECT usage_count=0 FROM coupons WHERE id='fixture-coupon'),'failed insert rolls coupon back');
  ALTER TABLE order_items DROP CONSTRAINT fixture_reject;
  UPDATE products SET inventory_count=0 WHERE id='fixture-2';
  msg:=NULL;
  BEGIN PERFORM public.place_order_secure(jsonb_set(pg_temp.payload('out-of-stock'),'{items,0,product_id}','"fixture-2"'));
  EXCEPTION WHEN OTHERS THEN msg:=SQLERRM; END;
  PERFORM pg_temp.check_true(msg LIKE 'Insufficient stock%','out-of-stock rejected');
  DELETE FROM product_weight_options WHERE product_id='fixture-3';
  msg:=NULL;
  BEGIN PERFORM public.place_order_secure(jsonb_set(pg_temp.payload('no-price'),'{items,0,product_id}','"fixture-3"'));
  EXCEPTION WHEN OTHERS THEN msg:=SQLERRM; END;
  PERFORM pg_temp.check_true(msg LIKE 'No configured weight-option price%','missing configured price fails closed');
END $$;
ROLLBACK;


SELECT 'PASS: staging checkout, authorization, idempotency, payment failure/recovery, cancellation and cleanup assertions; synthetic rows rolled back' AS result;
