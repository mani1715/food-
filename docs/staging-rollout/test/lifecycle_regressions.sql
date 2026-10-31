-- Reuses the Stage C database assertions against the consolidated fixture.

BEGIN;

CREATE FUNCTION pg_temp.check_true(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'Assertion failed: %', label; END IF; END $$;
INSERT INTO public.orders(id,order_number,customer_name,customer_phone,customer_email,delivery_address_json,subtotal,grand_total,payment_method,payment_status)
VALUES ('ord-stage-c-1','STAGE-C-1','Test','9999999999','test@example.invalid','{}',499,499,'online','completed'),
       ('ord-stage-c-2','STAGE-C-2','Test','9999999999','test@example.invalid','{}',499,499,'online','completed');
INSERT INTO public.payments(id,order_id,provider_order_id,provider_payment_id,amount,status)
VALUES ('11111111-1111-4111-8111-111111111111','ord-stage-c-1','order-stage-c-1','pay-stage-c-1',499,'captured'),
       ('22222222-2222-4222-8222-222222222222','ord-stage-c-2','order-stage-c-2','pay-stage-c-2',499,'captured');
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $$ DECLARE c jsonb; d jsonb; token uuid; replacement uuid; op uuid; r jsonb; BEGIN
  c := public.claim_webhook_event('evt-stage-c','payment.captured','hash',5);
  token := (c->>'claim_token')::uuid;
  PERFORM pg_temp.check_true(c->>'action' = 'claimed' AND token IS NOT NULL,'first claim');
  d := public.claim_webhook_event('evt-stage-c','payment.captured','hash',5);
  PERFORM pg_temp.check_true(d->>'action' = 'retry_later','active lease excludes second worker');
  PERFORM pg_temp.check_true((public.complete_webhook_event('evt-stage-c','processed',NULL)->>'success')::boolean = false,'null token rejected');
  PERFORM pg_temp.check_true((public.complete_webhook_event('evt-stage-c','processed',gen_random_uuid())->>'stale')::boolean,'wrong token rejected');
  PERFORM pg_temp.check_true((public.complete_webhook_event('evt-stage-c','processing',token)->>'success')::boolean = false,'invalid status rejected');
  UPDATE public.payment_webhook_events SET claim_expires_at=clock_timestamp()-interval '1 second' WHERE event_id='evt-stage-c';
  PERFORM pg_temp.check_true((public.complete_webhook_event('evt-stage-c','processed',token)->>'stale')::boolean,'expired lease rejected without replacement');
  c := public.claim_webhook_event('evt-stage-c','payment.captured','hash',5);
  replacement := (c->>'claim_token')::uuid;
  PERFORM pg_temp.check_true(c->>'action'='claimed_retry' AND token<>replacement,'expired claim reclaimed');
  PERFORM pg_temp.check_true((public.complete_webhook_event('evt-stage-c','processed',token)->>'stale')::boolean,'superseded token rejected');
  PERFORM pg_temp.check_true((public.complete_webhook_event('evt-stage-c','processed',replacement)->>'success')::boolean,'active completion');
  PERFORM pg_temp.check_true(public.claim_webhook_event('evt-stage-c','payment.captured','hash',5)->>'action'='skip_processed','processed duplicate skipped');
  PERFORM pg_temp.check_true((public.complete_webhook_event('evt-stage-c','failed',replacement)->>'success')::boolean=false,'terminal state cannot be overwritten');
  c := public.claim_webhook_event('evt-stage-ignore','other','hash',5);
  PERFORM public.complete_webhook_event('evt-stage-ignore','ignored',(c->>'claim_token')::uuid);
  PERFORM pg_temp.check_true(public.claim_webhook_event('evt-stage-ignore','other','hash',5)->>'action'='skip_processed','ignored duplicate skipped');
  c := public.claim_webhook_event('evt-stage-fail','other','hash',5);
  PERFORM public.complete_webhook_event('evt-stage-fail','failed',(c->>'claim_token')::uuid);
  PERFORM pg_temp.check_true(public.claim_webhook_event('evt-stage-fail','other','hash',5)->>'action'='claimed_retry','failed event retry');
  PERFORM pg_temp.check_true((public.initiate_refund_operation('ord-stage-c-1','over',499.01)->>'success')::boolean=false,'499.01 reservation rejected');
  PERFORM pg_temp.check_true((public.initiate_refund_operation('ord-stage-c-1','nan','NaN'::numeric)->>'success')::boolean=false,'NaN rejected');
  PERFORM pg_temp.check_true((public.initiate_refund_operation('ord-stage-c-1','fraction',0.001)->>'success')::boolean=false,'fractional paise rejected');
  c := public.initiate_refund_operation('ord-stage-c-1','exact',499);
  op := (c->>'operation_id')::uuid;
  PERFORM pg_temp.check_true((c->>'success')::boolean,'499 exact reservation');
  PERFORM pg_temp.check_true((public.initiate_refund_operation('ord-stage-c-1','exact',499)->>'is_retry')::boolean,'operation idempotency');
  PERFORM pg_temp.check_true((public.initiate_refund_operation('ord-stage-c-1','exact',498)->>'conflict')::boolean,'operation key conflict');
  PERFORM pg_temp.check_true((public.initiate_refund_operation('ord-stage-c-1','another',0.01)->>'success')::boolean=false,'in-flight balance reserved');
  PERFORM pg_temp.check_true((public.record_refund_success('ord-stage-c-1','refund-over',499.01,'test','pay-stage-c-1')->>'success')::boolean=false,'499.01 ledger rejected');
  PERFORM pg_temp.check_true((public.record_refund_success('ord-stage-c-1','refund-missing',1,'test','pay-stage-c-1',gen_random_uuid())->>'success')::boolean=false,'unknown operation rejected');
  r := public.record_refund_success('ord-stage-c-1','refund-exact',499,'test','pay-stage-c-1',op);
  PERFORM pg_temp.check_true((r->>'success')::boolean AND r->>'payment_status'='refunded','exact refund committed');
  PERFORM pg_temp.check_true((public.record_refund_success('ord-stage-c-1','refund-exact',499,'test','pay-stage-c-1',op)->>'is_duplicate')::boolean,'duplicate refund idempotent');
  PERFORM pg_temp.check_true((SELECT sum(amount)=499 FROM public.payment_refunds WHERE order_id='ord-stage-c-1'),'duplicate not counted twice');
  PERFORM pg_temp.check_true((public.record_refund_success('ord-stage-c-2','refund-exact',499,'test','pay-stage-c-2')->>'success')::boolean=false,'cross-payment refund conflict');
  r := public.record_refund_success('ord-stage-c-2','partial-1',249.50,'test','pay-stage-c-2');
  PERFORM pg_temp.check_true(r->>'payment_status'='partially_refunded','partial refund status');
  PERFORM pg_temp.check_true((public.record_refund_success('ord-stage-c-2','partial-over',249.51,'test','pay-stage-c-2')->>'success')::boolean=false,'cumulative one-paise excess rejected');
  r := public.record_refund_success('ord-stage-c-2','partial-2',249.50,'test','pay-stage-c-2');
  PERFORM pg_temp.check_true(r->>'payment_status'='refunded','cumulative exact balance');
  BEGIN
    DELETE FROM public.orders WHERE id='ord-stage-c-1';
    RAISE EXCEPTION 'Order deletion unexpectedly succeeded';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    DELETE FROM public.payments WHERE order_id='ord-stage-c-1';
    RAISE EXCEPTION 'Payment deletion unexpectedly succeeded';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  PERFORM pg_temp.check_true((SELECT count(*)=1 FROM public.orders WHERE id='ord-stage-c-1'),'financial history retained');
END $$;
SELECT pg_temp.check_true(NOT has_function_privilege('anon','public.claim_webhook_event(text,text,text,integer)','EXECUTE'),'anon cannot claim');
SELECT pg_temp.check_true(NOT has_function_privilege('authenticated','public.record_refund_success(text,text,numeric,text,text,uuid)','EXECUTE'),'authenticated cannot refund');
SELECT pg_temp.check_true(NOT has_table_privilege('authenticated','public.payments','UPDATE'),'direct payment writes revoked');
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role','',true);
DO $$ BEGIN
  BEGIN
    PERFORM public.claim_webhook_event('unauthorized','test','hash',5);
    RAISE EXCEPTION 'Missing JWT role unexpectedly allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Access Denied:%' THEN RAISE; END IF;
  END;
END $$;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT public.claim_webhook_event('service-role-valid','test','hash',5);
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM public.claim_webhook_event('anon-claim','test','hash',5);
    RAISE EXCEPTION 'Anon unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;


SELECT 'PASS: staging webhook leases, duplicate events, refund reservations, cumulative limits, replay consistency and service-role authorization; synthetic rows rolled back' AS result;
