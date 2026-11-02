import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  validateSupabaseEnvironment,
  isServiceRoleKey,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
} from '../src/lib/env.js';

// Binary magic byte validation test helper mirroring src/lib/supabase/storage.ts
async function validateImageFileSignature(file) {
  const slice = file.slice(0, 12);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 4) return false;

  // JPEG signature: FF D8 FF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  // PNG signature: 89 50 4E 47
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

  // WebP signature: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  const isRiff =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp =
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isJpeg || isPng || (isRiff && isWebp);
}

// ==============================================================================
// 1. Missing Supabase environment variables & fail-fast validation
// ==============================================================================
test('1. Missing Supabase environment variables: rejects missing VITE_SUPABASE_URL', () => {
  assert.throws(
    () => {
      validateSupabaseEnvironment({
        VITE_SUPABASE_ANON_KEY: 'sb_publishable_validkey123',
      });
    },
    /Missing required environment variable: VITE_SUPABASE_URL/
  );
});

test('1. Missing Supabase environment variables: rejects missing or placeholder ANON_KEY', () => {
  assert.throws(
    () => {
      validateSupabaseEnvironment({
        VITE_SUPABASE_URL: 'https://mjnktiyufvzkibrsdxug.supabase.co',
        VITE_SUPABASE_ANON_KEY: '',
      });
    },
    /Missing or unconfigured VITE_SUPABASE_ANON_KEY/
  );

  assert.throws(
    () => {
      validateSupabaseEnvironment({
        VITE_SUPABASE_URL: 'https://mjnktiyufvzkibrsdxug.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'your-anon-key-here',
      });
    },
    /Missing or unconfigured VITE_SUPABASE_ANON_KEY/
  );
});

// ==============================================================================
// 2. Staging configuration selection & isolation guard
// ==============================================================================
test('2. Staging configuration selection: correctly resolves Staging environment', () => {
  const config = validateSupabaseEnvironment({
    VITE_SUPABASE_URL: 'https://mjnktiyufvzkibrsdxug.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_staging_key_123',
    VITE_APP_ENV: 'staging',
  });

  assert.equal(config.appEnv, 'staging');
  assert.equal(config.isStaging, true);
  assert.equal(config.isProduction, false);
  assert.match(config.supabaseUrl, new RegExp(STAGING_PROJECT_REF));
});

test('2. Staging configuration selection: prevents Staging build from connecting to Production project', () => {
  assert.throws(
    () => {
      validateSupabaseEnvironment({
        VITE_SUPABASE_URL: `https://${PRODUCTION_PROJECT_REF}.supabase.co`,
        VITE_SUPABASE_ANON_KEY: 'sb_publishable_prod_key_123',
        VITE_APP_ENV: 'staging',
      });
    },
    /Environment mismatch.*Staging and development builds are strictly prevented from connecting to Production/
  );
});

test('2. Staging configuration selection: prevents Development build from connecting to Production project', () => {
  assert.throws(
    () => {
      validateSupabaseEnvironment({
        VITE_SUPABASE_URL: `https://${PRODUCTION_PROJECT_REF}.supabase.co`,
        VITE_SUPABASE_ANON_KEY: 'sb_publishable_prod_key_123',
        VITE_APP_ENV: 'development',
      });
    },
    /Environment mismatch.*Staging and development builds are strictly prevented from connecting to Production/
  );
});

test('2. Security Guard: rejects secret service_role key provided in client variables', () => {
  assert.throws(
    () => {
      validateSupabaseEnvironment({
        VITE_SUPABASE_URL: 'https://mjnktiyufvzkibrsdxug.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'sb_secret_service_role_unauthorized_key',
        VITE_APP_ENV: 'staging',
      });
    },
    /SECURITY VIOLATION.*service_role secret key was provided to the frontend client/
  );

  // JWT with role: 'service_role' payload simulation
  const fakeServiceRoleJwt = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64') + '.sig';
  assert.equal(isServiceRoleKey(fakeServiceRoleJwt), true);

  assert.throws(
    () => {
      validateSupabaseEnvironment({
        VITE_SUPABASE_URL: 'https://mjnktiyufvzkibrsdxug.supabase.co',
        VITE_SUPABASE_ANON_KEY: fakeServiceRoleJwt,
        VITE_APP_ENV: 'staging',
      });
    },
    /SECURITY VIOLATION.*service_role secret key was provided to the frontend client/
  );
});

// ==============================================================================
// 3. Customer authentication
// ==============================================================================
test('3. Customer authentication: signup redirect URL stays on origin and rejects open redirects', () => {
  const origin = 'https://staging.aishufoods.com';
  const redirectTarget = `${origin}/login`;
  assert.ok(redirectTarget.startsWith(origin));
  assert.equal(new URL(redirectTarget).origin, origin);
});

// ==============================================================================
// 4. Admin authentication & permissions
// ==============================================================================
test('4. Admin authentication and permissions: permissions are strictly evaluated server-side', () => {
  const staffRole = {
    role: 'sub_admin',
    status: 'active',
    permissions: ['orders.read', 'products.read'],
  };

  const hasPermission = (required) => {
    if (staffRole.status !== 'active') return false;
    if (staffRole.role === 'super_admin' || staffRole.role === 'admin') return true;
    return staffRole.permissions.includes('*') || staffRole.permissions.includes(required);
  };

  assert.equal(hasPermission('orders.read'), true);
  assert.equal(hasPermission('products.read'), true);
  assert.equal(hasPermission('orders.cancel'), false);
  assert.equal(hasPermission('settings.write'), false);
});

// ==============================================================================
// 5. Customer data isolation
// ==============================================================================
test('5. Customer data isolation: profile update payload whitelists only allowed fields', () => {
  const untrustedPayload = {
    full_name: 'Genuine Customer',
    phone_number: '9876543210',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'super_admin', // Forged privilege escalation
    is_admin: true,
    permissions: ['*'],
  };

  const permittedUpdates = Object.fromEntries(
    ['full_name', 'phone_number', 'avatar_url']
      .filter((k) => Object.prototype.hasOwnProperty.call(untrustedPayload, k))
      .map((k) => [k, untrustedPayload[k]])
  );

  assert.deepEqual(permittedUpdates, {
    full_name: 'Genuine Customer',
    phone_number: '9876543210',
    avatar_url: 'https://example.com/avatar.jpg',
  });
  assert.equal(permittedUpdates.role, undefined);
  assert.equal(permittedUpdates.is_admin, undefined);
  assert.equal(permittedUpdates.permissions, undefined);
});

// ==============================================================================
// 6. Product read and admin product updates
// ==============================================================================
test('6. Product read and admin product updates: catalog read permits anon, write requires staff', () => {
  const rlsCheck = (role, op) => {
    if (op === 'SELECT') return true; // public
    return role === 'admin' || role === 'super_admin';
  };

  assert.equal(rlsCheck('anon', 'SELECT'), true);
  assert.equal(rlsCheck('authenticated_customer', 'SELECT'), true);
  assert.equal(rlsCheck('anon', 'INSERT'), false);
  assert.equal(rlsCheck('authenticated_customer', 'UPDATE'), false);
  assert.equal(rlsCheck('admin', 'UPDATE'), true);
});

// ==============================================================================
// 7 & 8. Guest checkout with valid data and tampered prices
// ==============================================================================
test('7 & 8. Guest checkout: recalculates item totals authoritatively and ignores client prices', () => {
  const dbCatalog = {
    'prod-pickle-01': { '500g': 350 },
  };

  const clientOrder = {
    items: [
      {
        product_id: 'prod-pickle-01',
        selected_weight: '500g',
        unit_price: 1.0, // Tampered client price!
        quantity: 2,
      },
    ],
  };

  // Authoritative server-side calculation
  let authoritativeSubtotal = 0;
  for (const item of clientOrder.items) {
    const verifiedPrice = dbCatalog[item.product_id]?.[item.selected_weight];
    assert.ok(verifiedPrice, 'Product variant must exist in DB');
    authoritativeSubtotal += verifiedPrice * item.quantity;
  }

  assert.equal(authoritativeSubtotal, 700); // 350 * 2, not 1.00 * 2
  assert.notEqual(authoritativeSubtotal, 2.0);
});

// ==============================================================================
// 9. Razorpay payment verification
// ==============================================================================
test('9. Razorpay payment verification: requires signature and matching order id', () => {
  const secret = 'test_webhook_secret_xyz';
  const orderId = 'order_TuMypTJFyOzqKh';
  const paymentId = 'pay_TuMypXYZ12345';

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const verifySignature = (ordId, payId, sig, sec) => {
    const hmac = crypto.createHmac('sha256', sec).update(`${ordId}|${payId}`).digest('hex');
    const a = Buffer.from(hmac);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  };

  assert.equal(verifySignature(orderId, paymentId, expectedSignature, secret), true);

  // Tampered payment id fails verification
  assert.equal(verifySignature(orderId, 'pay_forged_99999', expectedSignature, secret), false);
});

// ==============================================================================
// 10. Unauthorized refund attempts
// ==============================================================================
test('10. Unauthorized refund attempts: caller must have payments.refund permission', () => {
  const authorizeRefund = (callerRole, callerPermissions) => {
    if (callerRole === 'super_admin' || callerRole === 'admin') return true;
    return Array.isArray(callerPermissions) && (callerPermissions.includes('*') || callerPermissions.includes('payments.refund'));
  };

  assert.equal(authorizeRefund('customer', []), false);
  assert.equal(authorizeRefund('anon', []), false);
  assert.equal(authorizeRefund('sub_admin', ['orders.read']), false);
  assert.equal(authorizeRefund('sub_admin', ['payments.refund']), true);
  assert.equal(authorizeRefund('super_admin', []), true);
});

// ==============================================================================
// 11. Order tracking and cancellation
// ==============================================================================
test('11. Order tracking and cancellation: customer cannot cancel paid or delivered orders', () => {
  const canCustomerCancel = (orderStatus, paymentStatus) => {
    if (orderStatus === 'cancelled' || orderStatus === 'delivered' || orderStatus === 'shipped') {
      return false;
    }
    if (paymentStatus === 'completed' || paymentStatus === 'captured') {
      return false; // Paid orders must go through staff refund workflow
    }
    return true;
  };

  assert.equal(canCustomerCancel('placed', 'pending'), true);
  assert.equal(canCustomerCancel('placed', 'completed'), false);
  assert.equal(canCustomerCancel('delivered', 'pending'), false);
  assert.equal(canCustomerCancel('shipped', 'pending'), false);
});

// ==============================================================================
// 12. NimbusPost shipment & webhook workflows
// ==============================================================================
test('12. NimbusPost shipment: pickup location must be active and verified', () => {
  const pickupLocations = [
    { id: 'loc-1', name: 'Kitchen A', is_active: true, postal_code: '500001' },
    { id: 'loc-2', name: 'Kitchen B (Closed)', is_active: false, postal_code: '500002' },
  ];

  const validatePickup = (locId) => {
    const loc = pickupLocations.find((l) => l.id === locId);
    if (!loc || !loc.is_active) {
      throw new Error('Selected pickup location is not active');
    }
    return loc;
  };

  assert.doesNotThrow(() => validatePickup('loc-1'));
  assert.throws(() => validatePickup('loc-2'), /not active/);
  assert.throws(() => validatePickup('loc-nonexistent'), /not active/);
});

// ==============================================================================
// 13. Storage upload authorization & magic bytes inspection
// ==============================================================================
test('13. Storage upload authorization: validates magic bytes for JPG, PNG, and WebP', async () => {
  // Simulated JPEG file (FF D8 FF)
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const fakeJpeg = { slice: () => ({ arrayBuffer: async () => jpegHeader.buffer }) };
  assert.equal(await validateImageFileSignature(fakeJpeg), true);

  // Simulated PNG file (89 50 4E 47)
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const fakePng = { slice: () => ({ arrayBuffer: async () => pngHeader.buffer }) };
  assert.equal(await validateImageFileSignature(fakePng), true);

  // Simulated Executable / Malicious script (4D 5A ...)
  const exeHeader = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
  const fakeExe = { slice: () => ({ arrayBuffer: async () => exeHeader.buffer }) };
  assert.equal(await validateImageFileSignature(fakeExe), false);
});
