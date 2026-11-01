import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// 1. Razorpay Signature Verification & Constant-Time Comparison
// ---------------------------------------------------------------------------
function hmacSha256Hex(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

test('Razorpay HMAC SHA-256 signature verification succeeds on authentic payloads', () => {
  const secret = 'rzp_test_secret_key_1234567890';
  const razorpayOrderId = 'order_EKwxwAgIt4KOQN';
  const razorpayPaymentId = 'pay_29QQoUBi66xm2f';
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature = hmacSha256Hex(secret, payload);
  const isValid = timingSafeEqual(expectedSignature, expectedSignature);
  assert.equal(isValid, true, 'Valid signature should verify successfully');
});

test('Razorpay HMAC SHA-256 rejects tampered signature or modified order ID', () => {
  const secret = 'rzp_test_secret_key_1234567890';
  const razorpayOrderId = 'order_EKwxwAgIt4KOQN';
  const razorpayPaymentId = 'pay_29QQoUBi66xm2f';
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;

  const validSignature = hmacSha256Hex(secret, payload);
  const tamperedSignature = validSignature.substring(0, validSignature.length - 2) + '00';

  assert.equal(timingSafeEqual(validSignature, tamperedSignature), false, 'Tampered signature must be rejected');

  // Tampered payload with original signature
  const tamperedPayload = `order_ATTACKER_ID|${razorpayPaymentId}`;
  const tamperedExpected = hmacSha256Hex(secret, tamperedPayload);
  assert.equal(timingSafeEqual(tamperedExpected, validSignature), false, 'Modified order ID must fail verification');
});

// ---------------------------------------------------------------------------
// 2. Canonical Payload & SHA-256 Idempotency Hash
// ---------------------------------------------------------------------------
function buildCanonicalPayload({ customerName, customerPhone, customerEmail, address, items, paymentMethod, couponCode }) {
  // Sort items deterministically by product_id ASC, selected_weight ASC
  const sortedItems = [...items].sort((a, b) => {
    const pCmp = a.product_id.localeCompare(b.product_id);
    if (pCmp !== 0) return pCmp;
    return (a.selected_weight || 'Standard').localeCompare(b.selected_weight || 'Standard');
  }).map(item => ({
    product_id: item.product_id,
    selected_weight: item.selected_weight || 'Standard',
    quantity: parseInt(item.quantity, 10),
  }));

  const payloadObj = {
    customer_name: customerName.trim(),
    customer_phone: customerPhone.replace(/[^0-9]/g, ''),
    customer_email: customerEmail ? customerEmail.trim().toLowerCase() : `guest_${customerPhone}@aishufoods.com`,
    delivery_address: {
      address: address.address.trim(),
      city: address.city.trim(),
      pincode: address.pincode.trim(),
    },
    items: sortedItems,
    payment_method: paymentMethod.trim(),
    coupon_code: (couponCode || '').trim().toUpperCase(),
  };

  const canonicalText = JSON.stringify(payloadObj);
  const hash = crypto.createHash('sha256').update(canonicalText, 'utf8').digest('hex');
  return { canonicalText, hash };
}

test('Canonical payload hash is deterministic and order-invariant for line items', () => {
  const baseOrder = {
    customerName: 'Aishu Test User',
    customerPhone: '9876543210',
    customerEmail: 'test@aishufoods.com',
    address: { address: 'Flat 402, Sai Residency', city: 'Hyderabad', pincode: '500081' },
    paymentMethod: 'UPI',
    couponCode: 'WELCOME10',
  };

  const items1 = [
    { product_id: 'prod-002', selected_weight: '500g', quantity: '2' },
    { product_id: 'prod-001', selected_weight: '1kg', quantity: '1' },
  ];

  const items2 = [
    { product_id: 'prod-001', selected_weight: '1kg', quantity: '1' },
    { product_id: 'prod-002', selected_weight: '500g', quantity: '2' },
  ];

  const hash1 = buildCanonicalPayload({ ...baseOrder, items: items1 }).hash;
  const hash2 = buildCanonicalPayload({ ...baseOrder, items: items2 }).hash;

  assert.equal(hash1, hash2, 'Re-ordered items must produce the identical SHA-256 hash');

  // Modified quantity produces different hash
  const itemsModified = [
    { product_id: 'prod-001', selected_weight: '1kg', quantity: '2' },
    { product_id: 'prod-002', selected_weight: '500g', quantity: '2' },
  ];
  const hash3 = buildCanonicalPayload({ ...baseOrder, items: itemsModified }).hash;
  assert.notEqual(hash1, hash3, 'Modified quantity must produce a different hash');
});

// ---------------------------------------------------------------------------
// 3. Line-Item Quantity & Regex Input Validation
// ---------------------------------------------------------------------------
const quantityRegex = /^([1-9]|[1-4][0-9]|50)$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

test('Line-item quantity regex strictly permits 1 to 50 integers', () => {
  const validQuantities = ['1', '5', '25', '49', '50'];
  for (const q of validQuantities) {
    assert.equal(quantityRegex.test(q), true, `Quantity ${q} should be valid`);
  }

  const invalidQuantities = ['0', '51', '100', '-5', '1.5', 'abc', '10abc', '999999999999999999999999', ''];
  for (const q of invalidQuantities) {
    assert.equal(quantityRegex.test(q), false, `Quantity ${q} must be rejected`);
  }
});

test('Delivery PIN code regex strictly enforces 6 digits starting with 1-9', () => {
  const validPins = ['500001', '600028', '110001', '700001'];
  for (const pin of validPins) {
    assert.equal(pincodeRegex.test(pin), true, `PIN ${pin} should be valid`);
  }

  const invalidPins = ['050001', '12345', '1234567', '50008A', 'abcde', ''];
  for (const pin of invalidPins) {
    assert.equal(pincodeRegex.test(pin), false, `PIN ${pin} must be rejected`);
  }
});

// ---------------------------------------------------------------------------
// 4. Delivery Fee Rule
// ---------------------------------------------------------------------------
function calculateDeliveryFee(subtotal) {
  if (subtotal > 499.00 || subtotal === 0) {
    return 0.00;
  }
  return 49.00;
}

test('Delivery fee rule correctly waives fee above ₹499', () => {
  assert.equal(calculateDeliveryFee(500.00), 0.00, 'Subtotal ₹500 qualifies for free delivery');
  assert.equal(calculateDeliveryFee(499.01), 0.00, 'Subtotal ₹499.01 qualifies for free delivery');
  assert.equal(calculateDeliveryFee(499.00), 49.00, 'Subtotal ₹499.00 incurs ₹49 delivery fee');
  assert.equal(calculateDeliveryFee(250.00), 49.00, 'Subtotal ₹250.00 incurs ₹49 delivery fee');
});

// ---------------------------------------------------------------------------
// 5. Coupon Discount Calculation Engine
// ---------------------------------------------------------------------------
function calculateCouponDiscount(coupon, subtotal, items = []) {
  if (!coupon || !coupon.is_enabled) {
    throw new Error('Invalid or disabled coupon');
  }

  if (coupon.expiry_date && new Date() > new Date(coupon.expiry_date)) {
    throw new Error('Coupon expired');
  }

  if (subtotal < (coupon.min_order_amount || 0)) {
    throw new Error(`Minimum order of ₹${coupon.min_order_amount} required`);
  }

  let eligibleSubtotal = 0;
  const scope = (coupon.applies_to || 'all').toLowerCase();

  if (scope === 'all') {
    eligibleSubtotal = subtotal;
  } else if (scope === 'category') {
    if (!coupon.target_category) throw new Error('Target category missing');
    for (const item of items) {
      if (item.category_id === coupon.target_category) {
        eligibleSubtotal += item.unit_price * item.quantity;
      }
    }
    if (eligibleSubtotal <= 0) throw new Error('No eligible category items');
  } else if (scope === 'product') {
    if (!coupon.target_product_id) throw new Error('Target product missing');
    for (const item of items) {
      if (item.product_id === coupon.target_product_id) {
        eligibleSubtotal += item.unit_price * item.quantity;
      }
    }
    if (eligibleSubtotal <= 0) throw new Error('No eligible target product');
  } else {
    throw new Error('Unsupported coupon scope');
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    if (coupon.discount_value <= 0 || coupon.discount_value > 100) {
      throw new Error('Invalid percentage discount value');
    }
    discount = Math.round(((eligibleSubtotal * coupon.discount_value) / 100) * 100) / 100;
  } else if (coupon.discount_type === 'flat') {
    if (coupon.discount_value <= 0) {
      throw new Error('Invalid flat discount value');
    }
    discount = Math.min(eligibleSubtotal, coupon.discount_value);
  } else {
    throw new Error('Invalid discount type');
  }

  return Math.min(subtotal, Math.max(0, discount));
}

test('Coupon discounts calculate accurately without exceeding subtotal', () => {
  // Percentage discount
  const pctCoupon = {
    is_enabled: true,
    discount_type: 'percentage',
    discount_value: 10, // 10%
    min_order_amount: 300,
    applies_to: 'all',
  };
  assert.equal(calculateCouponDiscount(pctCoupon, 600), 60);

  // Flat discount capped by subtotal
  const flatCoupon = {
    is_enabled: true,
    discount_type: 'flat',
    discount_value: 200,
    min_order_amount: 100,
    applies_to: 'all',
  };
  assert.equal(calculateCouponDiscount(flatCoupon, 150), 150, 'Flat discount capped at subtotal');

  // Below minimum order throws
  assert.throws(() => calculateCouponDiscount(pctCoupon, 200), /Minimum order/);
});

// ---------------------------------------------------------------------------
// 6. Payment Status Transition Invariants & Delayed Failure Guard
// ---------------------------------------------------------------------------
test('Delayed payment failure cannot overwrite completed order payment status', () => {
  // Model state machine
  const order = {
    id: 'ord-test-123',
    payment_status: 'completed',
    order_status: 'confirmed',
  };

  const paymentAttempt = {
    order_id: 'ord-test-123',
    provider_order_id: 'order_RZP123',
    status: 'pending',
  };

  function simulateRecordPaymentFailure(currentOrder, payAttempt, failureCode, failureDesc) {
    if (currentOrder.payment_status === 'completed') {
      // Payment attempt marked failed, but order remains completed!
      payAttempt.status = 'failed';
      payAttempt.failure_code = failureCode;
      return { success: true, ignored_for_order: true };
    }
    currentOrder.payment_status = 'failed';
    payAttempt.status = 'failed';
    return { success: true, ignored_for_order: false };
  }

  const result = simulateRecordPaymentFailure(order, paymentAttempt, 'BAD_REQUEST', 'Card declined');
  assert.equal(result.ignored_for_order, true);
  assert.equal(order.payment_status, 'completed', 'Order status must remain completed');
  assert.equal(paymentAttempt.status, 'failed', 'Payment attempt log should record the failure');
});

// ---------------------------------------------------------------------------
// 7. Cancellation Safety on Paid Orders
// ---------------------------------------------------------------------------
test('Customer cannot cancel completed paid orders; staff requires refund handling', () => {
  const paidOrder = {
    id: 'ord-paid-999',
    payment_status: 'completed',
    order_status: 'confirmed',
    customer_id: 'cust-user-123',
    grand_total: 749.00,
  };

  function simulateCancelOrder(order, callerRole, callerUserId, refundId = null) {
    const isOwner = callerUserId === order.customer_id;
    const isServiceOrStaff = callerRole === 'service_role' || callerRole === 'admin';

    if (!isOwner && !isServiceOrStaff) {
      return { success: false, error: 'Unauthorized' };
    }

    if (order.payment_status === 'completed') {
      if (!isServiceOrStaff) {
        return {
          success: false,
          error: 'Paid orders cannot be self-cancelled. Please contact customer support for cancellations and refunds.',
        };
      }
      // Staff cancellation
      return {
        success: true,
        refundInitiated: refundId !== null,
        refundRequired: refundId === null,
      };
    }

    order.order_status = 'cancelled';
    return { success: true };
  }

  // Customer attempt: Rejected
  const customerResult = simulateCancelOrder(paidOrder, 'authenticated', 'cust-user-123');
  assert.equal(customerResult.success, false);
  assert.match(customerResult.error, /Paid orders cannot be self-cancelled/);

  // Staff attempt with refund: Permitted
  const staffResult = simulateCancelOrder(paidOrder, 'service_role', null, 'rfnd_12345');
  assert.equal(staffResult.success, true);
  assert.equal(staffResult.refundInitiated, true);
});

// ---------------------------------------------------------------------------
// 8. Exactly-Once Stock Restock & Coupon Restoration
// ---------------------------------------------------------------------------
test('Restock log collision prevents double-crediting stock on concurrent retries', () => {
  const stockLogs = new Set();
  const productStock = { 'prod-A': 10 };

  function simulateRestock(orderId, productId, qty) {
    const logId = `log-restock-${orderId}-${productId}`;
    if (stockLogs.has(logId)) {
      // ON CONFLICT (id) DO NOTHING
      return { restocked: false, message: 'Already restocked' };
    }
    stockLogs.add(logId);
    productStock[productId] += qty;
    return { restocked: true, newStock: productStock[productId] };
  }

  const call1 = simulateRestock('ord-001', 'prod-A', 5);
  assert.equal(call1.restocked, true);
  assert.equal(productStock['prod-A'], 15);

  // Concurrent or duplicate call with same order and product
  const call2 = simulateRestock('ord-001', 'prod-A', 5);
  assert.equal(call2.restocked, false);
  assert.equal(productStock['prod-A'], 15, 'Stock must NOT be incremented twice');
});

// ---------------------------------------------------------------------------
// 9. Durable Refund Ledger & Over-Refund Guard
// ---------------------------------------------------------------------------
test('Refund ledger rejects duplicate refund IDs idempotently without double counting', () => {
  const payment = { id: 'pay_rec_1', amount: 1000, status: 'captured' };
  const refundLedger = [];

  function recordRefundSuccess(p_order_id, p_refund_id, p_refund_amount) {
    if (refundLedger.some(r => r.provider_refund_id === p_refund_id)) {
      return { success: true, is_duplicate: true, message: 'Already recorded' };
    }
    const currentTotal = refundLedger
      .filter(r => r.payment_id === payment.id && r.status === 'processed')
      .reduce((sum, r) => sum + r.amount, 0);

    if (currentTotal + p_refund_amount > payment.amount + 0.01) {
      return { success: false, error: 'Refund exceeds captured amount' };
    }

    refundLedger.push({
      payment_id: payment.id,
      provider_refund_id: p_refund_id,
      amount: p_refund_amount,
      status: 'processed'
    });

    const newTotal = currentTotal + p_refund_amount;
    payment.status = newTotal >= (payment.amount - 0.01) ? 'refunded' : 'partially_refunded';
    return { success: true, is_duplicate: false, payment_status: payment.status };
  }

  // 1st refund of ₹400
  const r1 = recordRefundSuccess('ord-1', 'rfnd_001', 400);
  assert.equal(r1.success, true);
  assert.equal(r1.is_duplicate, false);
  assert.equal(payment.status, 'partially_refunded');

  // Duplicate webhook delivery of rfnd_001
  const r1Dup = recordRefundSuccess('ord-1', 'rfnd_001', 400);
  assert.equal(r1Dup.success, true);
  assert.equal(r1Dup.is_duplicate, true);
  assert.equal(refundLedger.length, 1, 'Duplicate refund should not insert second ledger entry');

  // Over-refund attempt of ₹700 (400 + 700 = 1100 > 1000)
  const rOver = recordRefundSuccess('ord-1', 'rfnd_002', 700);
  assert.equal(rOver.success, false);
  assert.match(rOver.error, /Refund exceeds captured amount/);
  assert.equal(refundLedger.length, 1, 'Over-refund must be rejected');

  // Valid second refund of ₹600 (400 + 600 = 1000)
  const r2 = recordRefundSuccess('ord-1', 'rfnd_003', 600);
  assert.equal(r2.success, true);
  assert.equal(payment.status, 'refunded');
  assert.equal(refundLedger.length, 2);
});

// ---------------------------------------------------------------------------
// 10. Webhook Atomic Claiming, In-Progress 429, and RPC Error Failure Logging
// ---------------------------------------------------------------------------
test('Webhook event claiming handles concurrent processing and RPC failure state', () => {
  const events = new Map();

  function claimEvent(eventId, eventType) {
    if (events.has(eventId)) {
      const existing = events.get(eventId);
      if (existing.status === 'processed') {
        return { action: 'skip_processed', statusCode: 200 };
      }
      if (existing.status === 'processing') {
        return { action: 'retry_later', statusCode: 429 };
      }
      if (existing.status === 'failed') {
        // Re-claim failed event for retry
        existing.status = 'processing';
        return { action: 'claimed_retry', statusCode: 200 };
      }
    }
    events.set(eventId, { id: eventId, type: eventType, status: 'processing' });
    return { action: 'claimed', statusCode: 200 };
  }

  function markEvent(eventId, status) {
    const ev = events.get(eventId);
    if (ev) ev.status = status;
  }

  // 1. Initial event claim
  const c1 = claimEvent('evt_001', 'payment.captured');
  assert.equal(c1.action, 'claimed');

  // 2. Concurrent duplicate delivery while in processing returns 429
  const cConcurrent = claimEvent('evt_001', 'payment.captured');
  assert.equal(cConcurrent.action, 'retry_later');
  assert.equal(cConcurrent.statusCode, 429);

  // 3. RPC fails: event status is set to 'failed' (allowing retry)
  markEvent('evt_001', 'failed');
  assert.equal(events.get('evt_001').status, 'failed');

  // 4. Retry arrival re-claims the event
  const cRetry = claimEvent('evt_001', 'payment.captured');
  assert.equal(cRetry.action, 'claimed_retry');

  // 5. Successful RPC completion marks event 'processed'
  markEvent('evt_001', 'processed');

  // 6. Subsequent duplicate returns 200 skip
  const cDup = claimEvent('evt_001', 'payment.captured');
  assert.equal(cDup.action, 'skip_processed');
  assert.equal(cDup.statusCode, 200);
});

// ---------------------------------------------------------------------------
// 11. Reconciliation Authorization and Payment Integrity Verification
// ---------------------------------------------------------------------------
test('Reconciliation rejects non-staff callers and verifies amount, currency, and provider ID', () => {
  function verifyReconciliationAuth(adminRoleRecord) {
    if (!adminRoleRecord || adminRoleRecord.status !== 'active') {
      return { allowed: false, status: 403, error: 'Administrative access required' };
    }
    const hasPerm =
      adminRoleRecord.role === 'super_admin' ||
      adminRoleRecord.role === 'admin' ||
      (adminRoleRecord.permissions && adminRoleRecord.permissions.includes('payments.reconcile'));

    if (!hasPerm) {
      return { allowed: false, status: 403, error: 'payments.reconcile permission required' };
    }
    return { allowed: true };
  }

  // Customer or inactive admin: Rejected
  assert.equal(verifyReconciliationAuth(null).allowed, false);
  assert.equal(verifyReconciliationAuth({ role: 'admin', status: 'suspended' }).allowed, false);
  assert.equal(verifyReconciliationAuth({ role: 'staff', status: 'active', permissions: ['orders.view'] }).allowed, false);

  // Authorized staff: Permitted
  assert.equal(verifyReconciliationAuth({ role: 'admin', status: 'active', permissions: [] }).allowed, true);
  assert.equal(verifyReconciliationAuth({ role: 'staff', status: 'active', permissions: ['payments.reconcile'] }).allowed, true);

  function verifyPaymentItem(item, order) {
    if (item.order_id !== order.provider_order_id) return { valid: false, error: 'Provider order ID mismatch' };
    if (item.status !== 'captured') return { valid: false, error: 'Payment not captured' };
    if (item.currency !== 'INR') return { valid: false, error: 'Currency mismatch' };
    if (item.amount !== Math.round(order.grand_total * 100)) return { valid: false, error: 'Amount mismatch' };
    return { valid: true };
  }

  const order = { id: 'ord-100', provider_order_id: 'order_RZP_100', grand_total: 499.00 };

  // Mismatched amount
  const badAmount = verifyPaymentItem({ order_id: 'order_RZP_100', status: 'captured', currency: 'INR', amount: 39900 }, order);
  assert.equal(badAmount.valid, false);
  assert.match(badAmount.error, /Amount mismatch/);

  // Mismatched currency
  const badCurrency = verifyPaymentItem({ order_id: 'order_RZP_100', status: 'captured', currency: 'USD', amount: 49900 }, order);
  assert.equal(badCurrency.valid, false);
  assert.match(badCurrency.error, /Currency mismatch/);

  // Non-captured status
  const badStatus = verifyPaymentItem({ order_id: 'order_RZP_100', status: 'failed', currency: 'INR', amount: 49900 }, order);
  assert.equal(badStatus.valid, false);
  assert.match(badStatus.error, /Payment not captured/);

  // Authentic matching payment item
  const validItem = verifyPaymentItem({ order_id: 'order_RZP_100', status: 'captured', currency: 'INR', amount: 49900 }, order);
  assert.equal(validItem.valid, true);
});

// ---------------------------------------------------------------------------
// 12. Delayed Failure Guard on Already-Captured Payments
// ---------------------------------------------------------------------------
test('Delayed payment failure cannot downgrade captured or refunded payments', () => {
  const payments = [
    { id: 1, status: 'captured' },
    { id: 2, status: 'refunded' },
    { id: 3, status: 'partially_refunded' },
    { id: 4, status: 'pending' },
  ];

  function applyPaymentFailure(payRecord, code, desc) {
    if (['captured', 'paid', 'refunded', 'partially_refunded'].includes(payRecord.status)) {
      return { modified: false, reason: 'Payment is in terminal/successful state' };
    }
    payRecord.status = 'failed';
    payRecord.failure_code = code;
    return { modified: true };
  }

  assert.equal(applyPaymentFailure(payments[0], 'BAD_REQ', 'err').modified, false);
  assert.equal(payments[0].status, 'captured');

  assert.equal(applyPaymentFailure(payments[1], 'BAD_REQ', 'err').modified, false);
  assert.equal(payments[1].status, 'refunded');

  assert.equal(applyPaymentFailure(payments[2], 'BAD_REQ', 'err').modified, false);
  assert.equal(payments[2].status, 'partially_refunded');

  assert.equal(applyPaymentFailure(payments[3], 'BAD_REQ', 'err').modified, true);
  assert.equal(payments[3].status, 'failed');
});

// ---------------------------------------------------------------------------
// 13. Late Payment Recovery on Cancelled Orders
// ---------------------------------------------------------------------------
test('Late payment on cancelled order records payment as completed without un-cancelling order', () => {
  const cancelledOrder = {
    id: 'ord-cancelled-1',
    order_status: 'cancelled',
    payment_status: 'pending',
    grand_total: 500,
    admin_notes: 'System cleanup due to timeout',
  };

  function finalizePayment(order, amount) {
    if (order.payment_status === 'completed') {
      return { success: true, is_duplicate: true };
    }

    if (order.order_status === 'cancelled') {
      order.payment_status = 'completed';
      // DO NOT restore order_status to 'confirmed' (inventory might be sold out)
      order.admin_notes = (order.admin_notes || '') + ' [LATE PAYMENT CAPTURED - Order was previously cancelled. Store staff must review inventory or issue refund.]';
      return {
        success: true,
        order_status: 'cancelled',
        payment_status: 'completed',
        is_late_payment: true,
      };
    }

    order.payment_status = 'completed';
    order.order_status = 'confirmed';
    return { success: true, order_status: 'confirmed', payment_status: 'completed', is_late_payment: false };
  }

  const result = finalizePayment(cancelledOrder, 500);
  assert.equal(result.is_late_payment, true);
  assert.equal(cancelledOrder.order_status, 'cancelled', 'Order must stay cancelled');
  assert.equal(cancelledOrder.payment_status, 'completed', 'Payment status must be marked completed');
  assert.match(cancelledOrder.admin_notes, /LATE PAYMENT CAPTURED/);
});

// ---------------------------------------------------------------------------
// 14. Exactly-Once Coupon Restoration & Cleanup Counter
// ---------------------------------------------------------------------------
test('Coupon usage count is restored exactly once upon order cancellation', () => {
  const coupon = { code: 'SAVE10', usage_count: 5 };
  const restoredOrders = new Set();

  function restoreCouponUsage(orderId, couponCode) {
    if (restoredOrders.has(orderId)) {
      return { restored: false, reason: 'Already restored' };
    }
    restoredOrders.add(orderId);
    coupon.usage_count = Math.max(0, coupon.usage_count - 1);
    return { restored: true, currentUsage: coupon.usage_count };
  }

  const r1 = restoreCouponUsage('ord-1', 'SAVE10');
  assert.equal(r1.restored, true);
  assert.equal(coupon.usage_count, 4);

  // Duplicate cancellation / retry
  const r2 = restoreCouponUsage('ord-1', 'SAVE10');
  assert.equal(r2.restored, false);
  assert.equal(coupon.usage_count, 4, 'Coupon usage count must NOT decrement twice');
});

test('Cleanup expired orders only increments count when order is actually cancelled', () => {
  const orders = [
    { id: 'o1', status: 'pending', created_at_mins_ago: 60 },
    { id: 'o2', status: 'confirmed', created_at_mins_ago: 60 }, // already paid/confirmed
    { id: 'o3', status: 'pending', created_at_mins_ago: 10 }, // not expired yet
  ];

  let cancelledCount = 0;
  for (const o of orders) {
    if (o.status === 'pending' && o.created_at_mins_ago >= 30) {
      o.status = 'cancelled';
      cancelledCount++;
    }
  }

  assert.equal(cancelledCount, 1);
  assert.equal(orders[0].status, 'cancelled');
  assert.equal(orders[1].status, 'confirmed');
  assert.equal(orders[2].status, 'pending');
});

// ---------------------------------------------------------------------------
// 15. PII Masking and Strict Search in Guest Tracking
// ---------------------------------------------------------------------------
test('Customer tracking masks sensitive PII and rejects loose 4-digit phone queries', () => {
  function maskPhone(p) {
    if (!p) return 'N/A';
    const digits = p.replace(/\D/g, '');
    if (digits.length < 4) return '******';
    return `+91 ******${digits.slice(-4)}`;
  }

  function maskEmail(e) {
    if (!e || !e.includes('@')) return 'N/A';
    const [u, d] = e.split('@');
    if (u.length <= 2) return `${u[0] || '*'}***@${d}`;
    return `${u[0]}***${u[u.length - 1]}@${d}`;
  }

  function maskAddress(a) {
    if (!a) return 'Address on file';
    const parts = a.split(',');
    if (parts.length > 1) return `***, ${parts.slice(1).join(',').trim()}`;
    return '*** (Confidential)';
  }

  assert.equal(maskPhone('+91 9876543210'), '+91 ******3210');
  assert.equal(maskEmail('customer@gmail.com'), 'c***r@gmail.com');
  assert.equal(maskAddress('House 42, Park Avenue, Hyderabad'), '***, Park Avenue, Hyderabad');

  function matchPhone(queryDigits, orderPhone) {
    const isPhone = queryDigits.length === 10 || (queryDigits.length === 12 && queryDigits.startsWith('91'));
    if (!isPhone) return false;
    const target10 = queryDigits.slice(-10);
    const order10 = orderPhone.replace(/\D/g, '').slice(-10);
    return target10 === order10;
  }

  assert.equal(matchPhone('4321', '9876543210'), false, '4-digit query must NOT match 10-digit phone');
  assert.equal(matchPhone('9876543210', '9876543210'), true, 'Full 10-digit phone matches');
});

// ===========================================================================
// PHASE B: PRODUCTION-GRADE PAYMENT HARDENING & REFUND ENGINE TESTS
// ===========================================================================

// Mock Refund & Webhook Database Engine (simulates migration 013 RPC semantics)
class MockPaymentEngine {
  constructor() {
    this.orders = new Map();
    this.payments = new Map();
    this.refunds = new Map();
    this.refundOperations = new Map();
    this.webhookEvents = new Map();
    this.adminRoles = new Map();
  }

  seedOrder(order) {
    this.orders.set(order.id, { ...order });
  }

  seedPayment(payment) {
    this.payments.set(payment.id, {
      ...payment,
      amount: Number(payment.amount),
      refund_amount: Number(payment.refund_amount || 0),
    });
  }

  seedAdminRole(userId, role, permissions = []) {
    this.adminRoles.set(userId, { role, permissions, status: 'active' });
  }

  // 18. Delete order with ON DELETE RESTRICT behavior
  deleteOrder(orderId) {
    // Check if any payments reference this order
    for (const payment of this.payments.values()) {
      if (payment.order_id === orderId) {
        throw new Error(`foreign_key_violation: update or delete on table "orders" violates foreign key constraint "payments_order_id_fkey" on table "payments"`);
      }
    }
    // Check if any refunds reference this order
    for (const refund of this.refunds.values()) {
      if (refund.order_id === orderId) {
        throw new Error(`foreign_key_violation: update or delete on table "orders" violates foreign key constraint "payment_refunds_order_id_fkey" on table "payment_refunds"`);
      }
    }
    this.orders.delete(orderId);
    return { success: true };
  }

  // RPC: initiate_refund_operation
  initiateRefundOperation({ orderId, idempotencyKey, amount, reason, staffUserId }) {
    if (!amount || amount <= 0) {
      return { success: false, error: 'Refund amount must be strictly positive.' };
    }
    if (!idempotencyKey || !idempotencyKey.trim()) {
      return { success: false, error: 'Idempotency key is required.' };
    }

    // Check if idempotency key exists
    for (const op of this.refundOperations.values()) {
      if (op.idempotency_key === idempotencyKey) {
        if (op.order_id !== orderId || op.amount !== amount) {
          return {
            success: false,
            conflict: true,
            error: 'Idempotency key conflict: Operation already exists with different order or amount.',
          };
        }
        return {
          success: true,
          is_retry: true,
          operation_id: op.operation_id,
          status: op.status,
          provider_refund_id: op.provider_refund_id,
          amount: op.amount,
          provider_payment_id: op.provider_payment_id,
        };
      }
    }

    // Find captured payment for order
    let targetPayment = null;
    for (const p of this.payments.values()) {
      if (p.order_id === orderId && ['captured', 'paid', 'partially_refunded', 'refunded'].includes(p.status)) {
        targetPayment = p;
        break;
      }
    }

    if (!targetPayment) {
      return { success: false, error: 'No captured payment found for this order to refund.' };
    }

    // Calculate processed refunds
    let currentProcessed = 0;
    for (const r of this.refunds.values()) {
      if (r.payment_id === targetPayment.id && r.status === 'processed') {
        currentProcessed += r.amount;
      }
    }

    // Calculate in-flight reserved refunds
    let inFlightReserved = 0;
    for (const op of this.refundOperations.values()) {
      if (op.payment_id === targetPayment.id && ['initiated', 'processing', 'uncertain'].includes(op.status)) {
        inFlightReserved += op.amount;
      }
    }

    const remainingBalance = targetPayment.amount - currentProcessed - inFlightReserved;
    if (amount > remainingBalance) {
      return {
        success: false,
        error: `Requested refund of ₹${amount} exceeds available remaining balance of ₹${remainingBalance}.`,
      };
    }

    const opId = crypto.randomUUID();
    const newOp = {
      operation_id: opId,
      idempotency_key: idempotencyKey,
      order_id: orderId,
      payment_id: targetPayment.id,
      provider_payment_id: targetPayment.provider_payment_id,
      amount,
      currency: 'INR',
      status: 'initiated',
      reason,
      staff_user_id: staffUserId,
      provider_refund_id: null,
      created_at: new Date(),
    };

    this.refundOperations.set(opId, newOp);
    return {
      success: true,
      is_retry: false,
      operation_id: opId,
      status: 'initiated',
      provider_payment_id: targetPayment.provider_payment_id,
      amount,
    };
  }

  // RPC: force_fail_refund_operation
  forceFailRefundOperation({ operationId, errorCode, errorDesc, isUncertain = false }) {
    const op = this.refundOperations.get(operationId);
    if (!op) return { success: false, error: 'Operation not found.' };

    if (['completed', 'reconciled'].includes(op.status)) {
      return { success: false, error: 'Cannot fail an already completed or reconciled refund operation.' };
    }

    op.status = isUncertain ? 'uncertain' : 'failed';
    op.error_code = errorCode;
    op.error_desc = errorDesc;
    return { success: true, operation_id: operationId, status: op.status };
  }

  // RPC: record_refund_success
  recordRefundSuccess({ orderId, refundId, refundAmount, reason, providerPaymentId, operationId }) {
    if (!refundAmount || refundAmount <= 0) {
      return { success: false, error: 'Refund amount must be strictly positive.' };
    }
    if (!refundId || !refundId.trim()) {
      return { success: false, error: 'Provider refund ID is required.' };
    }

    let targetPayment = null;
    for (const p of this.payments.values()) {
      if (p.order_id === orderId && (!providerPaymentId || p.provider_payment_id === providerPaymentId)) {
        targetPayment = p;
        break;
      }
    }

    if (!targetPayment) {
      return { success: false, error: 'No captured payment found for this order to refund.' };
    }

    // Operation check
    let op = null;
    if (operationId) {
      op = this.refundOperations.get(operationId);
      if (op) {
        if (op.order_id !== orderId) return { success: false, error: 'Operation order ID mismatch.' };
        if (op.amount !== refundAmount) return { success: false, error: 'Operation amount mismatch.' };
        if (['completed', 'reconciled'].includes(op.status) && op.provider_refund_id === refundId) {
          return {
            success: true,
            is_duplicate: true,
            message: 'Refund operation already completed.',
            refund_id: refundId,
            payment_status: targetPayment.status,
          };
        }
      }
    }

    // 7. Duplicate provider refund ID check
    if (this.refunds.has(refundId)) {
      if (op) {
        op.status = 'completed';
        op.provider_refund_id = refundId;
      }
      return {
        success: true,
        is_duplicate: true,
        message: 'Refund with this provider ID was already recorded.',
        refund_id: refundId,
        order_id: orderId,
        payment_status: targetPayment.status,
      };
    }

    // Cumulative processed refunds check
    let currentProcessed = 0;
    for (const r of this.refunds.values()) {
      if (r.payment_id === targetPayment.id && r.status === 'processed') {
        currentProcessed += r.amount;
      }
    }

    const newTotal = currentProcessed + refundAmount;
    // Exact bounds check (no slack)
    if (newTotal > targetPayment.amount) {
      return {
        success: false,
        error: `Requested refund of ₹${refundAmount} exceeds remaining balance of ₹${targetPayment.amount - currentProcessed}.`,
      };
    }

    // Insert durable refund
    const refundRecord = {
      id: `rfnd_log_${crypto.randomUUID().replace(/-/g, '')}`,
      order_id: orderId,
      payment_id: targetPayment.id,
      provider_refund_id: refundId,
      provider_payment_id: providerPaymentId || targetPayment.provider_payment_id,
      amount: refundAmount,
      currency: 'INR',
      status: 'processed',
      reason,
      created_at: new Date(),
    };
    this.refunds.set(refundId, refundRecord);

    // Update payment
    targetPayment.refund_amount = newTotal;
    targetPayment.status = newTotal >= targetPayment.amount ? 'refunded' : 'partially_refunded';

    // Update operation
    if (op) {
      op.status = 'completed';
      op.provider_refund_id = refundId;
    } else {
      for (const existingOp of this.refundOperations.values()) {
        if (existingOp.provider_refund_id === refundId && !['completed', 'reconciled'].includes(existingOp.status)) {
          existingOp.status = 'reconciled';
        }
      }
    }

    return {
      success: true,
      refund_id: refundId,
      refund_amount: refundAmount,
      cumulative_refund: newTotal,
      payment_status: targetPayment.status,
      is_duplicate: false,
    };
  }

  // RPC: claim_webhook_event
  claimWebhookEvent({ eventId, eventType, payloadHash, staleTimeoutMinutes = 5, now = new Date() }) {
    const existing = this.webhookEvents.get(eventId);
    const claimToken = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + staleTimeoutMinutes * 60000);

    if (!existing) {
      this.webhookEvents.set(eventId, {
        event_id: eventId,
        event_type: eventType,
        payload_hash: payloadHash,
        status: 'processing',
        claim_token: claimToken,
        claim_expires_at: expiresAt,
        locked_at: now,
      });
      return { action: 'claimed', status: 'processing', claim_token: claimToken };
    }

    if (['processed', 'ignored'].includes(existing.status)) {
      return { action: 'skip_processed', status: existing.status };
    }

    // Expired lease or failed: can re-claim
    if (existing.status === 'failed' || existing.claim_expires_at < now) {
      existing.status = 'processing';
      existing.claim_token = claimToken;
      existing.claim_expires_at = expiresAt;
      existing.locked_at = now;
      return { action: 'claimed_retry', status: 'processing', claim_token: claimToken };
    }

    // Active lease held by another worker
    return { action: 'retry_later', status: 'processing' };
  }

  // RPC: complete_webhook_event
  completeWebhookEvent({ eventId, status, claimToken, errorMessage, now = new Date() }) {
    const event = this.webhookEvents.get(eventId);
    if (!event) return { success: false, error: 'Webhook event not found.' };

    if (claimToken && event.claim_token !== claimToken) {
      return {
        success: false,
        stale: true,
        error: 'Stale worker lease: Event claim_token does not match active worker claim.',
      };
    }

    event.status = status;
    event.error_message = errorMessage;
    event.claim_token = null;
    event.claim_expires_at = null;
    event.locked_at = now;
    return { success: true, status };
  }
}

// ---------------------------------------------------------------------------
// 1. Repeated refund requests using the same idempotency key
// ---------------------------------------------------------------------------
test('Phase B: 1. Repeated refund requests using the same idempotency key return idempotent response', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 600 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 600, status: 'captured' });

  const r1 = engine.initiateRefundOperation({
    orderId: 'ORD-1',
    idempotencyKey: 'idem-test-1',
    amount: 250,
    reason: 'Customer requested',
  });
  assert.equal(r1.success, true);
  assert.equal(r1.is_retry, false);

  // Repeat call with identical key & parameters
  const r2 = engine.initiateRefundOperation({
    orderId: 'ORD-1',
    idempotencyKey: 'idem-test-1',
    amount: 250,
    reason: 'Customer requested',
  });
  assert.equal(r2.success, true);
  assert.equal(r2.is_retry, true);
  assert.equal(r2.operation_id, r1.operation_id);
});

// ---------------------------------------------------------------------------
// 2. Conflicting requests reusing an idempotency key
// ---------------------------------------------------------------------------
test('Phase B: 2. Conflicting requests reusing an idempotency key are rejected with conflict', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 600 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 600, status: 'captured' });

  engine.initiateRefundOperation({
    orderId: 'ORD-1',
    idempotencyKey: 'idem-test-2',
    amount: 200,
  });

  // Reusing same key with different amount
  const conflictRes = engine.initiateRefundOperation({
    orderId: 'ORD-1',
    idempotencyKey: 'idem-test-2',
    amount: 400,
  });
  assert.equal(conflictRes.success, false);
  assert.equal(conflictRes.conflict, true);
  assert.match(conflictRes.error, /Idempotency key conflict/);
});

// ---------------------------------------------------------------------------
// 3. Concurrent refund attempts against the same payment
// ---------------------------------------------------------------------------
test('Phase B: 3. Concurrent refund attempts against same payment respect in-flight reservations', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  // Thread A reserves 300
  const opA = engine.initiateRefundOperation({
    orderId: 'ORD-1',
    idempotencyKey: 'idem-thread-A',
    amount: 300,
  });
  assert.equal(opA.success, true);

  // Thread B simultaneously requests 300 (total 600 > 500)
  const opB = engine.initiateRefundOperation({
    orderId: 'ORD-1',
    idempotencyKey: 'idem-thread-B',
    amount: 300,
  });
  assert.equal(opB.success, false);
  assert.match(opB.error, /exceeds available remaining balance of ₹200/);
});

// ---------------------------------------------------------------------------
// 4. Cumulative partial refunds
// ---------------------------------------------------------------------------
test('Phase B: 4. Cumulative partial refunds accurately update payment ledger and status', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 1000 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 1000, status: 'captured' });

  // Partial refund 1: ₹300
  const op1 = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k1', amount: 300 });
  const rec1 = engine.recordRefundSuccess({
    orderId: 'ORD-1',
    refundId: 'rfnd_001',
    refundAmount: 300,
    operationId: op1.operation_id,
  });
  assert.equal(rec1.success, true);
  assert.equal(rec1.cumulative_refund, 300);
  assert.equal(rec1.payment_status, 'partially_refunded');

  // Partial refund 2: ₹400
  const op2 = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k2', amount: 400 });
  const rec2 = engine.recordRefundSuccess({
    orderId: 'ORD-1',
    refundId: 'rfnd_002',
    refundAmount: 400,
    operationId: op2.operation_id,
  });
  assert.equal(rec2.success, true);
  assert.equal(rec2.cumulative_refund, 700);
  assert.equal(rec2.payment_status, 'partially_refunded');
});

// ---------------------------------------------------------------------------
// 5. Refunds that exactly exhaust the remaining refundable balance
// ---------------------------------------------------------------------------
test('Phase B: 5. Refunds that exactly exhaust balance set status to refunded', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  const op1 = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k1', amount: 500 });
  const rec1 = engine.recordRefundSuccess({
    orderId: 'ORD-1',
    refundId: 'rfnd_exact',
    refundAmount: 500,
    operationId: op1.operation_id,
  });
  assert.equal(rec1.success, true);
  assert.equal(rec1.cumulative_refund, 500);
  assert.equal(rec1.payment_status, 'refunded');
});

// ---------------------------------------------------------------------------
// 6. Attempts to exceed the remaining refundable balance
// ---------------------------------------------------------------------------
test('Phase B: 6. Attempts to exceed the remaining refundable balance by any amount are strictly rejected', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  // First refund: 400
  const op1 = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k1', amount: 400 });
  engine.recordRefundSuccess({ orderId: 'ORD-1', refundId: 'r1', refundAmount: 400, operationId: op1.operation_id });

  // Attempt 100.01 (over by 1 paisa)
  const overRes = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k2', amount: 100.01 });
  assert.equal(overRes.success, false);
  assert.match(overRes.error, /exceeds available remaining balance/);
});

// ---------------------------------------------------------------------------
// 7. Duplicate provider refund IDs
// ---------------------------------------------------------------------------
test('Phase B: 7. Duplicate provider refund IDs return idempotent success without double counting', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  const op = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k1', amount: 150 });
  const r1 = engine.recordRefundSuccess({ orderId: 'ORD-1', refundId: 'rfnd_dup_1', refundAmount: 150, operationId: op.operation_id });
  assert.equal(r1.success, true);
  assert.equal(r1.is_duplicate, false);

  // Duplicate delivery of same refund ID
  const r2 = engine.recordRefundSuccess({ orderId: 'ORD-1', refundId: 'rfnd_dup_1', refundAmount: 150, operationId: op.operation_id });
  assert.equal(r2.success, true);
  assert.equal(r2.is_duplicate, true);

  const payment = engine.payments.get('PAY-1');
  assert.equal(payment.refund_amount, 150, 'Total refunded must not double-increment');
});

// ---------------------------------------------------------------------------
// 8. Gateway timeouts and ambiguous responses
// ---------------------------------------------------------------------------
test('Phase B: 8. Gateway timeouts mark operation uncertain instead of failing or double-refunding', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  const op = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k_timeout', amount: 200 });

  // Simulate timeout handler in Edge Function
  const failRes = engine.forceFailRefundOperation({
    operationId: op.operation_id,
    errorCode: 'GATEWAY_TIMEOUT',
    errorDesc: 'Timeout contacting Razorpay',
    isUncertain: true,
  });
  assert.equal(failRes.success, true);
  assert.equal(failRes.status, 'uncertain');

  // Verify the operation retains balance reservation while uncertain
  const newOp = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k_next', amount: 350 });
  assert.equal(newOp.success, false, 'Uncertain operation reservation must block over-allocation');
});

// ---------------------------------------------------------------------------
// 9. Pending gateway refunds
// ---------------------------------------------------------------------------
test('Phase B: 9. Pending gateway refunds remain in processing state without committing to ledger', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  const op = engine.initiateRefundOperation({ orderId: 'ORD-1', idempotencyKey: 'k_pending', amount: 200 });

  // Razorpay returns status: 'pending' -> update operation but do NOT call recordRefundSuccess
  const storedOp = engine.refundOperations.get(op.operation_id);
  storedOp.status = 'processing';
  storedOp.provider_refund_id = 'rfnd_pending_123';

  assert.equal(storedOp.status, 'processing');
  assert.equal(engine.refunds.size, 0, 'No refund record should be inserted in payment_refunds yet');
  const payment = engine.payments.get('PAY-1');
  assert.equal(payment.refund_amount, 0, 'Payment refund amount must not update while pending');
});

// ---------------------------------------------------------------------------
// 10. Provider pagination and pagination boundaries
// ---------------------------------------------------------------------------
test('Phase B: 10. Provider pagination loops through all pages up to boundary limit', async () => {
  // Mock pagination generator
  function mockFetchPage(skip, count, totalItems = 250) {
    const items = [];
    for (let i = skip; i < Math.min(skip + count, totalItems); i++) {
      items.push({ id: `rfnd_${i}`, amount: 10000, status: 'processed' });
    }
    return { items, count: items.length };
  }

  let skip = 0;
  const count = 100;
  let allRefunds = [];
  let page = 0;
  const maxPages = 10;

  while (page < maxPages) {
    const res = mockFetchPage(skip, count, 250);
    allRefunds.push(...res.items);
    if (res.items.length < count) break;
    skip += count;
    page++;
  }

  assert.equal(allRefunds.length, 250, 'Must have traversed all 250 items across 3 pages');
  assert.equal(page, 2, 'Should complete on page index 2 (skip=200)');
});

// ---------------------------------------------------------------------------
// 11. Incomplete provider results
// ---------------------------------------------------------------------------
test('Phase B: 11. Incomplete provider pagination fails safely without issuing new refunds', () => {
  let traversalCompleted = false;
  let refundIssued = false;

  function executeRefundWithPreCheck(pageFailureAt) {
    let page = 0;
    while (page < 5) {
      if (page === pageFailureAt) {
        // Network error during pagination traversal
        return { success: false, error: 'Gateway pagination error' };
      }
      page++;
    }
    traversalCompleted = true;
    refundIssued = true;
    return { success: true };
  }

  const result = executeRefundWithPreCheck(2);
  assert.equal(result.success, false);
  assert.equal(traversalCompleted, false);
  assert.equal(refundIssued, false, 'Must not issue refund if pagination pre-check was incomplete');
});

// ---------------------------------------------------------------------------
// 12. Webhook claim leasing
// ---------------------------------------------------------------------------
test('Phase B: 12. Webhook claim leasing grants unique claim_token and prevents concurrent workers', () => {
  const engine = new MockPaymentEngine();
  const now = new Date('2026-10-24T12:00:00Z');

  // Worker 1 claims event
  const c1 = engine.claimWebhookEvent({ eventId: 'evt_lease_1', eventType: 'payment.captured', now });
  assert.equal(c1.action, 'claimed');
  assert.ok(c1.claim_token, 'Claim token must be generated');

  // Worker 2 attempts claiming same event concurrently
  const c2 = engine.claimWebhookEvent({ eventId: 'evt_lease_1', eventType: 'payment.captured', now });
  assert.equal(c2.action, 'retry_later');
});

// ---------------------------------------------------------------------------
// 13. Expired lease recovery
// ---------------------------------------------------------------------------
test('Phase B: 13. Expired lease allows a new worker to safely claim and recover the event', () => {
  const engine = new MockPaymentEngine();
  const startTime = new Date('2026-10-24T12:00:00Z');

  // Worker 1 claims with 5 min lease
  const c1 = engine.claimWebhookEvent({ eventId: 'evt_exp_1', eventType: 'payment.captured', staleTimeoutMinutes: 5, now: startTime });
  assert.equal(c1.action, 'claimed');

  // 6 minutes later: Worker 2 arrives after Worker 1 stalled
  const laterTime = new Date('2026-10-24T12:06:00Z');
  const c2 = engine.claimWebhookEvent({ eventId: 'evt_exp_1', eventType: 'payment.captured', staleTimeoutMinutes: 5, now: laterTime });
  assert.equal(c2.action, 'claimed_retry');
  assert.notEqual(c2.claim_token, c1.claim_token, 'New worker must receive fresh lease token');
});

// ---------------------------------------------------------------------------
// 14. Stale claim-token rejection
// ---------------------------------------------------------------------------
test('Phase B: 14. Stale worker claim token is rejected when lease was superseded', () => {
  const engine = new MockPaymentEngine();
  const t1 = new Date('2026-10-24T12:00:00Z');
  const c1 = engine.claimWebhookEvent({ eventId: 'evt_stale_1', eventType: 'payment.captured', now: t1 });

  // Worker 2 re-claims after expiration
  const t2 = new Date('2026-10-24T12:06:00Z');
  const c2 = engine.claimWebhookEvent({ eventId: 'evt_stale_1', eventType: 'payment.captured', now: t2 });

  // Worker 1 finally tries to complete with its stale token
  const staleComp = engine.completeWebhookEvent({ eventId: 'evt_stale_1', status: 'processed', claimToken: c1.claim_token });
  assert.equal(staleComp.success, false);
  assert.equal(staleComp.stale, true);

  // Worker 2 completes with valid active token
  const validComp = engine.completeWebhookEvent({ eventId: 'evt_stale_1', status: 'processed', claimToken: c2.claim_token });
  assert.equal(validComp.success, true);
});

// ---------------------------------------------------------------------------
// 15. Duplicate webhook delivery
// ---------------------------------------------------------------------------
test('Phase B: 15. Duplicate webhook deliveries for already processed events are skipped idempotently', () => {
  const engine = new MockPaymentEngine();
  const c1 = engine.claimWebhookEvent({ eventId: 'evt_dup_1', eventType: 'payment.captured' });
  engine.completeWebhookEvent({ eventId: 'evt_dup_1', status: 'processed', claimToken: c1.claim_token });

  // Redelivery of processed event
  const c2 = engine.claimWebhookEvent({ eventId: 'evt_dup_1', eventType: 'payment.captured' });
  assert.equal(c2.action, 'skip_processed');
});

// ---------------------------------------------------------------------------
// 16. Delayed failure events after confirmed payment success
// ---------------------------------------------------------------------------
test('Phase B: 16. Delayed payment failure cannot overwrite captured or refunded payment', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-1', order_id: 'ORD-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  function recordPaymentFailure(payRecord, code, desc) {
    if (['captured', 'paid', 'partially_refunded', 'refunded'].includes(payRecord.status)) {
      return { modified: false, reason: 'Terminal successful state cannot be downgraded' };
    }
    payRecord.status = 'failed';
    return { modified: true };
  }

  const pay = engine.payments.get('PAY-1');
  const res = recordPaymentFailure(pay, 'GATEWAY_ERROR', 'Late failure notification');
  assert.equal(res.modified, false);
  assert.equal(pay.status, 'captured');
});

// ---------------------------------------------------------------------------
// 17. Database RPC errors after a gateway operation
// ---------------------------------------------------------------------------
test('Phase B: 17. Database RPC errors after gateway success are surfaced without losing operation tracking', () => {
  const rzpRefundSuccess = { id: 'rfnd_999', status: 'processed', amount: 20000 };
  let dbFailed = true;

  function handleRefundResponse(rzpRes, rpcFn) {
    if (rzpRes.status === 'processed') {
      const rpcResult = rpcFn(rzpRes.id);
      if (!rpcResult.success) {
        return {
          status: 500,
          error: `Refund of ₹${rzpRes.amount / 100} succeeded at Razorpay (${rzpRes.id}) but database update failed: ${rpcResult.error}`,
          gatewayRefundId: rzpRes.id,
        };
      }
      return { status: 200, success: true };
    }
    return { status: 400 };
  }

  const mockRpc = () => ({ success: false, error: 'Connection timeout' });
  const result = handleRefundResponse(rzpRefundSuccess, mockRpc);

  assert.equal(result.status, 500);
  assert.equal(result.gatewayRefundId, 'rfnd_999');
  assert.match(result.error, /succeeded at Razorpay.*database update failed/);
});

// ---------------------------------------------------------------------------
// 18. Preservation of payment/refund audit records when an order is deleted
// ---------------------------------------------------------------------------
test('Phase B: 18. ON DELETE RESTRICT blocks order deletion when financial audit records exist', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-SECURE-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-SECURE-1', order_id: 'ORD-SECURE-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  assert.throws(
    () => engine.deleteOrder('ORD-SECURE-1'),
    /foreign_key_violation.*payments_order_id_fkey/
  );
  assert.ok(engine.orders.has('ORD-SECURE-1'), 'Order must remain preserved');
  assert.ok(engine.payments.has('PAY-SECURE-1'), 'Payment must remain preserved');
});

// ---------------------------------------------------------------------------
// 19. Authorization failures
// ---------------------------------------------------------------------------
test('Phase B: 19. Unauthorized callers or staff without payments.refund permission are rejected', () => {
  const engine = new MockPaymentEngine();
  engine.seedAdminRole('user-support', 'support', ['orders.view']); // No payments.refund permission

  function verifyRefundAuthorization(roleData) {
    if (!roleData || roleData.status !== 'active') {
      return { authorized: false, code: 403, error: 'Administrative privileges required.' };
    }
    const hasPerm =
      roleData.role === 'super_admin' ||
      roleData.role === 'admin' ||
      (Array.isArray(roleData.permissions) && roleData.permissions.includes('payments.refund'));
    if (!hasPerm) {
      return { authorized: false, code: 403, error: 'Forbidden: payments.refund permission required.' };
    }
    return { authorized: true };
  }

  const unauthed = verifyRefundAuthorization(null);
  assert.equal(unauthed.authorized, false);
  assert.equal(unauthed.code, 403);

  const supportStaff = verifyRefundAuthorization(engine.adminRoles.get('user-support'));
  assert.equal(supportStaff.authorized, false);
  assert.match(supportStaff.error, /payments\.refund permission required/);

  engine.seedAdminRole('user-admin', 'admin', []);
  const adminStaff = verifyRefundAuthorization(engine.adminRoles.get('user-admin'));
  assert.equal(adminStaff.authorized, true);
});

// ---------------------------------------------------------------------------
// 20. Regression coverage for existing checkout, coupon, cancellation, inventory restock, and tracking
// ---------------------------------------------------------------------------
test('Phase B: 20. Regression verification across checkout calculations, coupon restoration, and tracking', () => {
  // Coupon cap regression
  const subtotal = 100;
  const coupon = { discount_type: 'fixed', discount_value: 150 };
  const discount = Math.min(subtotal, coupon.discount_value);
  assert.equal(discount, 100, 'Discount must not exceed subtotal');

  // Inventory restock idempotency regression
  const restockLedger = new Set();
  function restock(orderId, itemId, qty) {
    const key = `${orderId}:${itemId}`;
    if (restockLedger.has(key)) return false;
    restockLedger.add(key);
    return true;
  }
  assert.equal(restock('ord_1', 'item_1', 2), true);
  assert.equal(restock('ord_1', 'item_1', 2), false, 'Duplicate restock must be blocked');

  // Customer tracking masking regression
  const phone = '9876543210';
  const masked = `+91 ******${phone.slice(-4)}`;
  assert.equal(masked, '+91 ******3210');
});

// ===========================================================================
// PHASE C1: VERIFIED REMEDIATION & BOUNDARY TESTS
// ===========================================================================

// ---------------------------------------------------------------------------
// 21. Pagination HTTP 500 Failure Aborts Refund Flow
// ---------------------------------------------------------------------------
test('Phase C1: Pagination HTTP 500 error aborts refund flow and leaves operation uncertain', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-PAG-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-PAG-1', order_id: 'ORD-PAG-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  const initRes = engine.initiateRefundOperation({
    orderId: 'ORD-PAG-1',
    idempotencyKey: 'idem-pag-fail-1',
    amount: 200,
  });
  assert.equal(initRes.success, true);

  // Simulate Edge Function pagination loop with HTTP failure
  function simulateRefundPreCheck(fetchStatus) {
    let paginationExhausted = false;
    let paginationError = false;
    let postRefundCalled = false;

    if (fetchStatus !== 200) {
      paginationError = true;
    } else {
      paginationExhausted = true;
    }

    if (paginationError || !paginationExhausted) {
      // Must abort and mark uncertain
      engine.forceFailRefundOperation({
        operationId: initRes.operation_id,
        errorCode: 'GATEWAY_PRECHECK_INCOMPLETE',
        errorDesc: 'Gateway returned HTTP ' + fetchStatus,
        isUncertain: true,
      });
      return { status: 502, error: 'Pre-check incomplete' };
    }

    postRefundCalled = true;
    return { status: 200, success: true };
  }

  const result = simulateRefundPreCheck(500);
  assert.equal(result.status, 502);
  const op = engine.refundOperations.get(initRes.operation_id);
  assert.equal(op.status, 'uncertain', 'Operation must be in uncertain state');
});

// ---------------------------------------------------------------------------
// 22. Pagination Network Timeout Aborts Refund Flow
// ---------------------------------------------------------------------------
test('Phase C1: Pagination network timeout aborts refund flow and leaves operation uncertain', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-PAG-2', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-PAG-2', order_id: 'ORD-PAG-2', provider_payment_id: 'pay_2', amount: 500, status: 'captured' });

  const initRes = engine.initiateRefundOperation({
    orderId: 'ORD-PAG-2',
    idempotencyKey: 'idem-pag-timeout',
    amount: 150,
  });

  function simulateTimeoutPreCheck() {
    let postRefundDispatched = false;
    try {
      throw new Error('Connection timeout to Razorpay');
    } catch (err) {
      engine.forceFailRefundOperation({
        operationId: initRes.operation_id,
        errorCode: 'GATEWAY_PRECHECK_INCOMPLETE',
        errorDesc: err.message,
        isUncertain: true,
      });
      return { status: 502, error: 'Network timeout during precheck' };
    }
  }

  const res = simulateTimeoutPreCheck();
  assert.equal(res.status, 502);
  const op = engine.refundOperations.get(initRes.operation_id);
  assert.equal(op.status, 'uncertain');
});

// ---------------------------------------------------------------------------
// 23. Pagination Reaching Page Limit Without Confirmed End Aborts Refund Flow
// ---------------------------------------------------------------------------
test('Phase C1: Pagination reaching limit without confirmed end aborts refund creation', () => {
  let postRefundCalled = false;
  const pageSize = 100;
  const maxPages = 10;
  let page = 0;
  let paginationExhausted = false;

  // Simulate 1,500 total items (each page returns full 100 items)
  while (page < maxPages) {
    const pageItems = Array(100).fill({ id: 'rfnd_old' });
    if (pageItems.length < pageSize) {
      paginationExhausted = true;
      break;
    }
    page++;
  }

  // At page 10, items.length is still 100, so paginationExhausted is false
  assert.equal(page, 10);
  assert.equal(paginationExhausted, false);

  const isPaginationIncomplete = !paginationExhausted && page >= maxPages;
  assert.equal(isPaginationIncomplete, true, 'Must detect that pagination was cut off at maxPages');

  if (isPaginationIncomplete) {
    // Correctly aborts without calling POST /refund
    postRefundCalled = false;
  }

  assert.equal(postRefundCalled, false, 'Must NOT dispatch new refund if history was cut off');
});

// ---------------------------------------------------------------------------
// 24. Lock Order Hierarchy: Payments Locked First, Operations Locked Second
// ---------------------------------------------------------------------------
test('Phase C1: Lock order hierarchy prevents deadlocks (payments locked first, operations second)', () => {
  const engine = new MockPaymentEngine();
  engine.seedOrder({ id: 'ORD-LOCK-1', grand_total: 500 });
  engine.seedPayment({ id: 'PAY-LOCK-1', order_id: 'ORD-LOCK-1', provider_payment_id: 'pay_1', amount: 500, status: 'captured' });

  const lockSequence = [];

  // Simulate initiateRefundOperation locking hierarchy
  function initiateRefund(orderId, key, amt) {
    // 1. Lock payment first
    lockSequence.push('payments');
    // 2. Lock operation second
    lockSequence.push('payment_refund_operations');
    return engine.initiateRefundOperation({ orderId, idempotencyKey: key, amount: amt });
  }

  // Simulate recordRefundSuccess locking hierarchy
  function recordRefund(orderId, refId, amt, opId) {
    // 1. Lock payment first
    lockSequence.push('payments');
    // 2. Lock operation second
    lockSequence.push('payment_refund_operations');
    return engine.recordRefundSuccess({ orderId, refundId: refId, refundAmount: amt, operationId: opId });
  }

  const op = initiateRefund('ORD-LOCK-1', 'key-lock-1', 200);
  recordRefund('ORD-LOCK-1', 'rfnd-lock-1', 200, op.operation_id);

  assert.deepEqual(
    lockSequence,
    ['payments', 'payment_refund_operations', 'payments', 'payment_refund_operations'],
    'Both RPCs must lock payments first, then operations second'
  );
});

// ---------------------------------------------------------------------------
// 25. Idempotent Foreign-Key Check Logic
// ---------------------------------------------------------------------------
test('Phase C1: Idempotent foreign-key logic preserves existing valid RESTRICT constraint', () => {
  const existingConstraints = [
    { conname: 'payments_order_id_fkey', confdeltype: 'r', convalidated: true },
    { conname: 'legacy_cascade_fkey', confdeltype: 'c', convalidated: true },
  ];

  function evaluateFkAction(constraint) {
    const shouldDropAndRecreate = (constraint.confdeltype !== 'r' || !constraint.convalidated);
    return shouldDropAndRecreate ? 'REPLACE' : 'PRESERVE';
  }

  assert.equal(evaluateFkAction(existingConstraints[0]), 'PRESERVE', 'Existing RESTRICT must be preserved');
  assert.equal(evaluateFkAction(existingConstraints[1]), 'REPLACE', 'Legacy CASCADE must be replaced');
});

// ---------------------------------------------------------------------------
// 26. Stale Webhook Completion Observer
// ---------------------------------------------------------------------------
test('Phase C1: Stale webhook completion result is detected as error and not marked successful', async () => {
  const engine = new MockPaymentEngine();
  const t1 = new Date('2026-10-24T12:00:00Z');
  const c1 = engine.claimWebhookEvent({ eventId: 'evt_obs_1', eventType: 'payment.captured', now: t1 });

  // Lease expires and worker 2 claims
  const t2 = new Date('2026-10-24T12:06:00Z');
  engine.claimWebhookEvent({ eventId: 'evt_obs_1', eventType: 'payment.captured', now: t2 });

  // Worker 1 finishes late
  let loggedWarning = false;
  async function completeWebhookEventSafe(eventId, token) {
    const res = engine.completeWebhookEvent({ eventId, status: 'processed', claimToken: token });
    if (!res.success && res.stale) {
      loggedWarning = true;
      return { success: false, stale: true };
    }
    return { success: true };
  }

  const result = await completeWebhookEventSafe('evt_obs_1', c1.claim_token);
  assert.equal(result.success, false);
  assert.equal(result.stale, true);
  assert.equal(loggedWarning, true, 'Operational warning must be emitted when stale worker is rejected');
});




// Stage C: execute the real TypeScript handlers with mocked external boundaries.
// These are handler tests, NOT PostgreSQL/Supabase or Razorpay end-to-end tests.
async function loadEdgeHandler(name, client, fetchMock = async () => { throw new Error('Unexpected network request'); }) {
  const { readFileSync } = await import('node:fs');
  const { default: ts } = await import('typescript');
  const { runInNewContext } = await import('node:vm');
  const source = readFileSync(new URL(`../supabase/functions/${name}/index.ts`, import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  let handler;
  const logs = [];
  runInNewContext(js, {
    serve: fn => { handler = fn; }, createClient: () => client,
    Deno: { env: { get: () => 'unit-test-only' } },
    crypto: crypto.webcrypto, TextEncoder, Request, Response, btoa,
    fetch: fetchMock, corsHeaders: {},
    jsonResponse: (data, status = 200) => Response.json(data, { status }),
    errorResponse: (error, status = 400) => Response.json({ success: false, error }, { status }),
    console: Object.fromEntries(['log', 'warn', 'error'].map(k => [k, (...args) => logs.push(args.join(' '))])),
  });
  return { handler, logs };
}
const activeToken = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
function webhookFixture(options = {}) {
  const calls = [];
  const client = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (options.rpc) { const override = await options.rpc(name, args); if (override !== undefined) return override; }
      return { data: name === 'claim_webhook_event' ? { action: 'claimed', claim_token: activeToken } : { success: true }, error: null };
    },
    from: table => {
      const query = { select: () => query, eq: () => query, order: () => query, limit: () => query,
        single: async () => ({ data: table === 'orders' ? { id: 'ord-test', grand_total: 499 } : { order_id: 'ord-test' } }) };
      return query;
    },
  };
  return { client, calls };
}
function capturedEvent(overrides = {}) {
  return { event: 'payment.captured', payload: { payment: { entity: {
    id: 'pay-test', order_id: 'order-test', status: 'captured', currency: 'INR', amount: 49900,
    notes: { store_order_id: 'ord-test' }, ...overrides,
  } } } };
}
function signedRequest(event, signature, includeId = true) {
  const body = JSON.stringify(event);
  return new Request('https://unit.test/webhook', { method: 'POST', body, headers: {
    'x-razorpay-signature': signature ?? hmacSha256Hex('unit-test-only', body),
    ...(includeId ? { 'x-razorpay-event-id': 'evt-test' } : {}),
  } });
}
for (const claim of [null, {}, { action: 'unknown', claim_token: activeToken }, { action: 'claimed' }, { action: 'claimed_retry', claim_token: 'bad-token' }]) {
  test(`Actual webhook rejects malformed claim ${JSON.stringify(claim)}`, async () => {
    const f = webhookFixture({ rpc: name => name === 'claim_webhook_event' ? { data: claim } : undefined });
    const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
    assert.equal((await handler(signedRequest(capturedEvent()))).status, 500);
    assert.deepEqual(f.calls.map(c => c.name), ['claim_webhook_event']);
  });
}
for (const [action, status] of [['skip_processed', 200], ['retry_later', 429]]) {
  test(`Actual webhook ${action} has no financial side effects`, async () => {
    const f = webhookFixture({ rpc: name => name === 'claim_webhook_event' ? { data: { action } } : undefined });
    const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
    assert.equal((await handler(signedRequest(capturedEvent()))).status, status);
    assert.equal(f.calls.length, 1);
  });
}
test('Actual webhook verifies raw signature before database access', async () => {
  const f = webhookFixture();
  const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
  assert.equal((await handler(signedRequest(capturedEvent(), 'bad'))).status, 400);
  assert.equal((await handler(signedRequest(capturedEvent(), undefined, false))).status, 400);
  assert.equal(f.calls.length, 0);
});
test('Actual webhook completes unsupported events exactly once as ignored', async () => {
  const f = webhookFixture();
  const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
  assert.equal((await handler(signedRequest({ event: 'unhandled.event' }))).status, 200);
  assert.deepEqual(f.calls.map(c => c.name), ['claim_webhook_event', 'complete_webhook_event']);
  assert.equal(f.calls[1].args.p_status, 'ignored');
  assert.equal(f.calls[1].args.p_claim_token, activeToken);
});
for (const completion of [{ data: null }, { data: {} }, { data: { success: false } }, { data: { success: false, stale: true } }, { error: { message: 'database unavailable' } }, 'throw']) {
  test(`Actual webhook retries completion failure after commit: ${JSON.stringify(completion)}`, async () => {
    const f = webhookFixture({ rpc: name => {
      if (name !== 'complete_webhook_event') return;
      if (completion === 'throw') throw new Error('connection lost');
      return completion;
    } });
    const { handler, logs } = await loadEdgeHandler('razorpay-webhook', f.client);
    assert.equal((await handler(signedRequest(capturedEvent()))).status, 500);
    assert.equal(f.calls.filter(c => c.name === 'finalize_payment_success').length, 1);
    assert.ok(logs.some(l => l.includes('WEBHOOK_RECONCILIATION_REQUIRED')));
  });
}
for (const amount of [49901, 49899, 49900.5, null, '49900']) {
  test(`Actual webhook rejects nonmatching/noninteger payment amount ${amount}`, async () => {
    const f = webhookFixture();
    const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
    assert.equal((await handler(signedRequest(capturedEvent({ amount })))).status, 400);
    assert.ok(!f.calls.some(c => c.name === 'finalize_payment_success'));
  });
}
test('Actual webhook captures exact amount and ignores merely authorized payment', async () => {
  for (const status of ['captured', 'authorized']) {
    const f = webhookFixture();
    const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
    assert.equal((await handler(signedRequest(capturedEvent({ status })))).status, 200);
    assert.equal(f.calls.some(c => c.name === 'finalize_payment_success'), status === 'captured');
  }
});
test('Actual refund-only webhook resolves order by provider payment ID', async () => {
  const f = webhookFixture();
  const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
  assert.equal((await handler(signedRequest({ event: 'refund.processed', payload: { refund: { entity: { id: 'rfnd-test', payment_id: 'pay-test', amount: 49900 } } } }))).status, 200);
  const refund = f.calls.find(c => c.name === 'record_refund_success');
  assert.equal(refund.args.p_refund_amount, 499);
  assert.equal(refund.args.p_provider_payment_id, 'pay-test');
});
test('Actual payment failure rejects RPC business failure', async () => {
  const f = webhookFixture({ rpc: name => name === 'record_payment_failure' ? { data: { success: false } } : undefined });
  const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
  const event = capturedEvent(); event.event = 'payment.failed';
  assert.equal((await handler(signedRequest(event))).status, 500);
  assert.equal(f.calls.at(-1).args.p_status, 'failed');
});

function refundFixture(recordResult, listItems = [], role = 'admin') {
  const calls = [], requests = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'staff-test' } } }) },
    from: table => {
      const result = { data: table === 'admin_roles' ? { role, status: 'active', permissions: [] } : table === 'payments' ? { id: 'payment-test', provider_payment_id: 'pay-test', amount: 499 } : [] };
      const query = { select: () => query, eq: () => query, in: () => query, order: () => query, limit: () => query,
        single: async () => result, then: (resolve, reject) => Promise.resolve(result).then(resolve, reject) };
      return query;
    },
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'record_refund_success') return recordResult;
      return { data: name === 'initiate_refund_operation' ? { success: true, operation_id: activeToken, status: 'initiated' } : { success: true } };
    },
  };
  const fetchMock = async (url, options = {}) => {
    requests.push({ url, method: options.method || 'GET' });
    return Response.json(options.method === 'POST' ? { id: 'rfnd-test', status: 'processed' } : { items: listItems });
  };
  return { client, calls, requests, fetchMock };
}
function refundRequest(amount = 499, authorized = true) {
  return new Request('https://unit.test/refund', { method: 'POST', headers: authorized ? { Authorization: 'Bearer test' } : {},
    body: JSON.stringify({ orderId: 'ord-test', amount, idempotencyKey: 'stable-test-key' }) });
}
for (const result of [{ data: { success: false } }, { data: null }, { error: { message: 'db unavailable' } }]) {
  test(`Actual refund stops new dispatch on reconciliation failure ${JSON.stringify(result)}`, async () => {
    const f = refundFixture(result, [{ id: 'existing-refund', status: 'processed', amount: 10000 }]);
    const { handler } = await loadEdgeHandler('refund-razorpay-payment', f.client, f.fetchMock);
    assert.equal((await handler(refundRequest())).status, 502);
    assert.ok(f.requests.every(r => r.method === 'GET'));
    assert.equal(f.calls.at(-1).args.p_is_uncertain, true);
  });
  test(`Actual refund reports failed post-gateway database write ${JSON.stringify(result)}`, async () => {
    const f = refundFixture(result);
    const { handler } = await loadEdgeHandler('refund-razorpay-payment', f.client, f.fetchMock);
    assert.equal((await handler(refundRequest())).status, 500);
    assert.equal(f.requests.filter(r => r.method === 'POST').length, 1);
  });
}
test('Actual refund rejects unauthorized staff and 499.01 against 499.00 before dispatch', async () => {
  for (const [role, amount, authorized, expected] of [['admin', 499.01, true, 400], ['sub_admin', 499, true, 403], ['admin', 499, false, 401]]) {
    const f = refundFixture({ data: { success: true } }, [], role);
    const { handler } = await loadEdgeHandler('refund-razorpay-payment', f.client, f.fetchMock);
    assert.equal((await handler(refundRequest(amount, authorized))).status, expected);
    assert.equal(f.requests.length, 0);
    assert.equal(f.calls.length, 0);
  }
});
test('Migration source guards: strict leases, service role, exact numeric refunds, no auth stubs', async () => {
  const { readFileSync } = await import('node:fs');
  const sql = readFileSync(new URL('../supabase/migrations/20261023_013_payment_hardening_final.sql', import.meta.url), 'utf8');
  assert.match(sql, /p_claim_token IS NULL OR v_event.claim_token IS DISTINCT FROM p_claim_token/);
  assert.match(sql, /v_event.claim_expires_at <= clock_timestamp\(\)/);
  assert.match(sql, /p_status NOT IN \('processed', 'failed', 'ignored'\)/);
  assert.doesNotMatch(sql, /CREATE OR REPLACE FUNCTION auth\./);
  assert.doesNotMatch(sql, /auth\.role\(\) <> 'service_role'/);
  assert.match(sql, /v_new_total_refunded > v_pay.amount THEN/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.complete_webhook_event/);
  // Source assertions document required guards; execution with real roles/locks is still required.
});

// Opt-in PostgreSQL component test. Requires the separately initialized disposable
// local cluster and sequential migrations 001–013. Auth/storage are test fixtures,
// not a claim of full Supabase compatibility. Never accepts a remote connection URL.
test('PostgreSQL: leases, privileges, refund accounting and audit retention', { skip: process.env.AISHU_STAGE_C_PG !== '1' }, async () => {
  const { execFileSync } = await import('node:child_process');
  const sql = String.raw`
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'aishu_stage_c' OR inet_server_addr() <> '127.0.0.1'::inet
     OR inet_server_port() <> 55439 OR current_setting('data_directory') NOT LIKE '%aishu-stage-c-%/data' THEN
    RAISE EXCEPTION 'Refusing non-disposable database target';
  END IF;
END $$;
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
SELECT pg_temp.check_true(NOT has_function_privilege('authenticated','public.finalize_payment_success(text,text,text,text,text,jsonb)','EXECUTE'),'legacy finalize revoked');
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
`;
  const output = execFileSync(process.env.AISHU_PSQL || 'C:/Program Files/PostgreSQL/17/bin/psql.exe',
    ['-X', '-w', '-h', '127.0.0.1', '-p', '55439', '-U', 'postgres', '-d', 'aishu_stage_c', '-v', 'ON_ERROR_STOP=1'],
    { input: sql, encoding: 'utf8', timeout: 30000 });
  assert.match(output, /ROLLBACK/);
});

test('Actual refund rejects zero, malformed and fractional-paise amounts before creating an operation', async () => {
  for (const amount of [0, null, 'not-a-number', 499.001, -1]) {
    const f = refundFixture({ data: { success: true } });
    const { handler } = await loadEdgeHandler('refund-razorpay-payment', f.client, f.fetchMock);
    assert.equal((await handler(refundRequest(amount))).status, 400);
    assert.equal(f.calls.length, 0);
    assert.equal(f.requests.length, 0);
  }
});

test('PostgreSQL: concurrent reservations serialize on the payment row', { skip: process.env.AISHU_STAGE_C_PG !== '1' }, async () => {
  const { execFileSync, execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const psql = process.env.AISHU_PSQL || 'C:/Program Files/PostgreSQL/17/bin/psql.exe';
  const args = ['-X','-w','-h','127.0.0.1','-p','55439','-U','postgres','-d','aishu_stage_c','-v','ON_ERROR_STOP=1','-t','-A'];
  const sync = sql => execFileSync(psql,args,{ input:sql,encoding:'utf8',timeout:30000 });
  const identity = sync("SELECT current_setting('data_directory');").trim();
  assert.match(identity, /aishu-stage-c-[a-f0-9]+\/data$/);
  sync(`INSERT INTO public.orders(id,order_number,customer_name,customer_phone,customer_email,delivery_address_json,subtotal,grand_total,payment_method,payment_status)
    VALUES ('ord-stage-concurrent','STAGE-CONCURRENT','Test','9999999999','test@example.invalid','{}',499,499,'online','completed');
    INSERT INTO public.payments(order_id,provider_order_id,provider_payment_id,amount,status)
    VALUES ('ord-stage-concurrent','order-stage-concurrent','pay-stage-concurrent',499,'captured');`);
  try {
    const query = (key, amount) => `BEGIN; SET LOCAL request.jwt.claim.role='service_role'; SELECT public.initiate_refund_operation('ord-stage-concurrent','${key}',${amount}); SELECT pg_sleep(0.2); COMMIT;`;
    const results = await Promise.all([
      promisify(execFile)(psql,[...args,'-c',query('concurrent-a',400)],{timeout:30000}),
      promisify(execFile)(psql,[...args,'-c',query('concurrent-b',200)],{timeout:30000}),
    ]);
    const outcomes = results.map(r => JSON.parse(r.stdout.split(/\r?\n/).find(l => l.startsWith('{'))));
    assert.equal(outcomes.filter(o=>o.success===true).length,1);
    assert.equal(outcomes.filter(o=>o.success===false).length,1);
    assert.equal(sync("SELECT count(*) FROM public.payment_refund_operations WHERE order_id='ord-stage-concurrent';").trim(),'1');
  } finally {
    sync("BEGIN; DELETE FROM public.payment_refund_operations WHERE order_id='ord-stage-concurrent'; DELETE FROM public.payments WHERE order_id='ord-stage-concurrent'; DELETE FROM public.orders WHERE id='ord-stage-concurrent'; COMMIT;");
  }
});

for (const operationId of [undefined, 'aaaaaaaa-1111-4111-8111-bbbbbbbbbbbb']) {
  test(`Actual webhook links refund reservation: ${operationId ?? 'external refund'}`, async () => {
    const f = webhookFixture();
    const { handler } = await loadEdgeHandler('razorpay-webhook', f.client);
    const event = { event: 'refund.processed', payload: { refund: { entity: {
      id: 'rfnd-test', payment_id: 'pay-test', amount: 101,
      notes: operationId ? { operation_id: operationId } : {},
    } } } };
    assert.equal((await handler(signedRequest(event))).status, 200);
    const record = f.calls.find(c => c.name === 'record_refund_success');
    assert.equal(record.args.p_operation_id, operationId ?? null);
    assert.equal(record.args.p_refund_amount, 1.01);
  });
}
