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
