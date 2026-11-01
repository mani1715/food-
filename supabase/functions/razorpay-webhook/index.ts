import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

async function hmacSha256Hex(secret: string, rawBody: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(rawBody);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function completeWebhookEventSafe(
  supabase: any,
  eventId: string,
  status: string,
  claimToken: string | null | undefined,
  errorMessage?: string
): Promise<{ success: boolean; stale?: boolean }> {
  try {
    const { data, error } = await supabase.rpc('complete_webhook_event', {
      p_event_id: eventId,
      p_status: status,
      p_claim_token: claimToken || null,
      p_error_message: errorMessage || null,
    });

    if (error) {
      console.error(`[WEBHOOK_COMPLETE_ERROR] RPC error completing event ${eventId}:`, error.message);
      return { success: false };
    }

    if (data && data.stale) {
      console.warn(
        `[WEBHOOK_STALE_LEASE] Worker completion rejected for event ${eventId}. Active lease was superseded by another claim.`
      );
      return { success: false, stale: true };
    }

    if (data?.success !== true) {
      console.error(`[WEBHOOK_COMPLETE_REJECTED] Completion rejected for event ${eventId}`);
      return { success: false };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`[WEBHOOK_COMPLETE_EXCEPTION] Exception completing event ${eventId}:`, err?.message || err);
    return { success: false };
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';

    if (!webhookSecret) {
      console.error('Missing RAZORPAY_WEBHOOK_SECRET configuration in Edge Function environment.');
      return new Response('Server configuration error', { status: 500 });
    }

    // 1. Read Raw Body (Required for Razorpay Webhook Signature Verification)
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-razorpay-signature') || req.headers.get('X-Razorpay-Signature') || '';

    if (!signature) {
      console.warn('Webhook request missing X-Razorpay-Signature header.');
      return new Response('Missing signature', { status: 400 });
    }

    // 2. Verify Webhook HMAC SHA256 Signature using constant-time comparison
    const expectedSignature = await hmacSha256Hex(webhookSecret, rawBody);
    if (!timingSafeEqual(expectedSignature, signature)) {
      console.warn('Invalid Razorpay Webhook Signature rejected.');
      return new Response('Invalid webhook signature', { status: 400 });
    }

    // 3. Parse Verified Webhook Event Payload
    const event = JSON.parse(rawBody);
    const eventId = req.headers.get('x-razorpay-event-id') || event.event_id;
    const eventType = event.event;
    if (typeof eventId !== 'string' || !eventId.trim() || typeof eventType !== 'string' || !eventType.trim()) {
      return new Response('Missing event identifiers', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Atomic Event Claiming with Lease Token & Stale Recovery
    const payloadDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawBody));
    const payloadHash = Array.from(new Uint8Array(payloadDigest), b => b.toString(16).padStart(2, '0')).join('');
    const { data: claimResult, error: claimErr } = await supabase.rpc('claim_webhook_event', {
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload_hash: payloadHash,
      p_stale_timeout_minutes: 5,
    });

    if (claimErr) {
      console.error('Webhook atomic claim failed:', claimErr.message);
      return new Response(JSON.stringify({ error: 'Database claim error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (claimResult?.action === 'skip_processed') {
      return new Response(JSON.stringify({ status: 'already_processed', event_id: eventId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (claimResult?.action === 'retry_later') {
      return new Response(JSON.stringify({ status: 'in_progress_by_another_worker', event_id: eventId }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '15' },
      });
    }

    const claimToken = claimResult?.claim_token;
    if (!['claimed', 'claimed_retry'].includes(claimResult?.action) ||
        typeof claimToken !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claimToken)) {
      console.error(`[WEBHOOK_INVALID_CLAIM] Invalid claim response for event ${eventId}`);
      return new Response('Invalid database claim', { status: 500 });
    }

    // 5. Process Webhook Event Types
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;
    let storeOrderId =
      paymentEntity?.notes?.store_order_id || orderEntity?.notes?.store_order_id;

    // Resilient fallback: lookup by provider_order_id in payments table if notes are absent
    if (!storeOrderId && razorpayOrderId) {
      const { data: payRow } = await supabase
        .from('payments')
        .select('order_id')
        .eq('provider_order_id', razorpayOrderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (payRow?.order_id) {
        storeOrderId = payRow.order_id;
      }
    }

    let processingSuccess = false;
    let completionStatus = 'processed';

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (!storeOrderId || !razorpayOrderId || !razorpayPaymentId) {
        console.error(`Webhook payload missing required IDs for ${eventType}`);
        await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, 'Missing payment identifiers');
        return new Response(JSON.stringify({ error: 'Missing payment identifiers' }), { status: 400 });
      }

      // Validate provider payment status
      if (paymentEntity?.status !== 'captured') {
        console.warn(`Ignoring non-captured payment status: ${paymentEntity.status}`);
        const completion = await completeWebhookEventSafe(supabase, eventId, 'ignored', claimToken, `Ignored unmet status: ${paymentEntity?.status}`);
        return new Response(JSON.stringify({ status: 'ignored_unmet_status' }), { status: completion.success ? 200 : 500 });
      }

      // Fetch store order to validate authoritative amount and currency
      const { data: storeOrder, error: storeOrderErr } = await supabase
        .from('orders')
        .select('id, grand_total, payment_status')
        .eq('id', storeOrderId)
        .single();

      if (storeOrderErr || !storeOrder) {
        console.error(`Webhook received for unknown store order: ${storeOrderId}`);
        await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, `Store order not found: ${storeOrderId}`);
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
      }

      // Validate amount (Razorpay payment entity amount is in integer paise)
      {
        const webhookAmountRupees = Number(paymentEntity.amount) / 100;
        const expectedPaise = Math.round(Number(storeOrder.grand_total) * 100);
        if (!Number.isSafeInteger(paymentEntity.amount) || !Number.isSafeInteger(expectedPaise) || paymentEntity.amount !== expectedPaise) {
          console.error(
            `Webhook amount mismatch: received ₹${webhookAmountRupees}, expected ₹${storeOrder.grand_total}`
          );
          await completeWebhookEventSafe(
            supabase,
            eventId,
            'failed',
            claimToken,
            `Amount mismatch: received ₹${webhookAmountRupees}, expected ₹${storeOrder.grand_total}`
          );
          return new Response(JSON.stringify({ error: 'Payment amount mismatch' }), { status: 400 });
        }
      }

      if (paymentEntity?.currency !== 'INR') {
        console.error(`Webhook currency mismatch: received ${paymentEntity.currency}`);
        await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, `Invalid currency: ${paymentEntity.currency}`);
        return new Response(JSON.stringify({ error: 'Invalid payment currency' }), { status: 400 });
      }

      const { data: finalizeData, error: finalizeErr } = await supabase.rpc('finalize_payment_success', {
        p_order_id: storeOrderId,
        p_provider_payment_id: razorpayPaymentId,
        p_provider_order_id: razorpayOrderId,
        p_amount: Number(storeOrder.grand_total),
        p_currency: 'INR',
        p_method: paymentEntity?.method || 'online',
        p_signature_verified: true,
        p_metadata: { source: 'razorpay_webhook', webhook_event: eventType, event_id: eventId },
      });

      if (finalizeErr || finalizeData?.success !== true) {
        const errMsg = finalizeErr?.message || finalizeData?.error || 'Failed to finalize payment';
        console.error('RPC Error finalizing payment via webhook:', errMsg);
        await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, errMsg);
        return new Response(JSON.stringify({ error: 'Failed to record payment success in database' }), { status: 500 });
      }

      processingSuccess = true;
    } else if (eventType === 'payment.failed') {
      if (storeOrderId && razorpayOrderId) {
        const { data: failData, error: failErr } = await supabase.rpc('record_payment_failure', {
          p_order_id: storeOrderId,
          p_provider_order_id: razorpayOrderId,
          p_failure_code: paymentEntity?.error_code || 'PAYMENT_FAILED',
          p_failure_desc:
            paymentEntity?.error_description || 'Payment failed as reported by webhook',
        });

        if (failErr || failData?.success !== true) {
          console.error('RPC Error recording payment failure via webhook:', failErr?.message || failData?.error);
          await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, 'Failure recording rejected');
          return new Response(JSON.stringify({ error: 'Failed to record payment failure' }), { status: 500 });
        }
      } else {
        await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, 'Missing payment identifiers');
        return new Response('Missing payment identifiers', { status: 400 });
      }
      processingSuccess = true;
    } else if (eventType === 'refund.processed') {
      const refundEntity = event.payload?.refund?.entity;
      if (!storeOrderId && refundEntity?.payment_id) {
        const { data: payment } = await supabase.from('payments').select('order_id')
          .eq('provider_payment_id', refundEntity.payment_id).single();
        storeOrderId = payment?.order_id;
      }
      if (storeOrderId && refundEntity && refundEntity.id) {
        const refundAmount = Number(refundEntity.amount || 0) / 100;
        if (!Number.isSafeInteger(refundEntity.amount) || refundAmount <= 0 || !refundEntity.payment_id) {
          console.error(`Invalid refund amount in webhook: ${refundAmount}`);
          await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, 'Invalid refund amount');
          return new Response(JSON.stringify({ error: 'Invalid refund amount' }), { status: 400 });
        }

        const { data: refundData, error: refundErr } = await supabase.rpc('record_refund_success', {
          p_order_id: storeOrderId,
          p_refund_id: refundEntity.id,
          p_refund_amount: refundAmount,
          p_reason: 'Webhook refund.processed event',
          p_provider_payment_id: refundEntity.payment_id || razorpayPaymentId,
          p_operation_id: refundEntity.notes?.operation_id || null,
        });

        if (refundErr || refundData?.success !== true) {
          const errMsg = refundErr?.message || refundData?.error || 'Failed to record refund';
          console.error('RPC Error recording refund via webhook:', errMsg);
          await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, errMsg);
          return new Response(JSON.stringify({ error: 'Failed to record refund in database' }), { status: 500 });
        }
      } else {
        await completeWebhookEventSafe(supabase, eventId, 'failed', claimToken, 'Missing refund identifiers');
        return new Response('Missing refund identifiers', { status: 400 });
      }
      processingSuccess = true;
    } else {
      // Safely ignore unhandled event types through complete_webhook_event
      processingSuccess = true;
      completionStatus = 'ignored';
    }

    // 6. Complete active lease with token verification
    if (processingSuccess) {
      const completion = await completeWebhookEventSafe(supabase, eventId, completionStatus, claimToken);
      if (!completion.success) {
        // Financial RPCs are idempotent: request redelivery without undoing committed money records.
        console.error(`[WEBHOOK_RECONCILIATION_REQUIRED] Event ${eventId}: operation succeeded but completion failed`);
        return new Response('Webhook completion failed; retry required', { status: 500 });
      }
    }

    return new Response(JSON.stringify({ success: true, event: eventType }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error processing Razorpay webhook:', err.message || err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
