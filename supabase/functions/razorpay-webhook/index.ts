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
    const eventId = req.headers.get('x-razorpay-event-id') || event.event_id || `${event.event}_${event.created_at || Date.now()}`;
    const eventType = event.event;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Webhook Idempotency Check
    const { data: existingEvent } = await supabase
      .from('payment_webhook_events')
      .select('id, status')
      .eq('event_id', eventId)
      .single();

    if (existingEvent) {
      return new Response(JSON.stringify({ status: 'already_processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Record webhook event (Data minimization: store only event type and id)
    await supabase.from('payment_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      provider: 'razorpay',
      status: 'processed',
    });

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

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (storeOrderId) {
        await supabase.rpc('finalize_payment_success', {
          p_order_id: storeOrderId,
          p_provider_payment_id: razorpayPaymentId || 'pay_webhook_captured',
          p_provider_order_id: razorpayOrderId || 'order_webhook',
          p_method: paymentEntity?.method || 'online',
          p_signature_verified: true,
          p_metadata: { source: 'razorpay_webhook', webhook_event: eventType },
        });
      }
    } else if (eventType === 'payment.failed') {
      if (storeOrderId) {
        await supabase.rpc('record_payment_failure', {
          p_order_id: storeOrderId,
          p_provider_order_id: razorpayOrderId,
          p_failure_code: paymentEntity?.error_code || 'PAYMENT_FAILED',
          p_failure_desc:
            paymentEntity?.error_description || 'Payment failed as reported by webhook',
        });
      }
    } else if (eventType === 'refund.processed') {
      const refundEntity = event.payload?.refund?.entity;
      if (storeOrderId && refundEntity) {
        const refundAmount = (refundEntity.amount || 0) / 100;
        await supabase.rpc('record_refund_success', {
          p_order_id: storeOrderId,
          p_refund_id: refundEntity.id,
          p_refund_amount: refundAmount,
          p_reason: 'Webhook refund.processed event',
        });
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
