import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNimbusAuthToken,
  checkCourierServiceability,
  createNimbusShipment,
  trackNimbusShipment,
  redactSensitive,
} from '../supabase/functions/_shared/nimbuspost/client.js';
import { equalSecret, mapNimbusStatusToInternal, sha256Hex } from '../supabase/functions/_shared/nimbuspost/webhook-utils.js';

test('NimbusPost Client: redactSensitive sanitizes passwords, secrets, and auth tokens', () => {
  const sensitiveObj = {
    email: 'store@aishufoods.com',
    password: 'super_secret_password',
    token: 'jwt.token.here',
    nested: {
      api_key: 'nimbus_key_123',
      safeField: 'Hyderabad Kitchen',
    },
  };

  const clean = redactSensitive(sensitiveObj);
  assert.equal(clean.password, '[REDACTED]');
  assert.equal(clean.token, '[REDACTED]');
  assert.equal(clean.nested.api_key, '[REDACTED]');
  assert.equal(clean.nested.safeField, 'Hyderabad Kitchen');
  assert.equal(clean.email, 'store@aishufoods.com');
});

test('NimbusPost Client: getNimbusAuthToken succeeds with valid API credentials', async () => {
  const fakeFetch = async (url, options) => {
    assert.match(url, /\/users\/login/);
    const body = JSON.parse(options.body);
    assert.equal(body.key, 'nimbus_test_key');
    assert.equal(body.email, 'test@aishufoods.com');
    assert.equal(body.password, 'valid_pass');
    return {
      ok: true,
      json: async () => ({ status: true, data: { token: 'jwt_mock_token_xyz' } }),
    };
  };

  const res = await getNimbusAuthToken({ apiKey: 'nimbus_test_key', email: 'test@aishufoods.com', password: 'valid_pass' }, fakeFetch);
  assert.equal(res.token, 'jwt_mock_token_xyz');
});

test('NimbusPost Client: refuses account login without the NimbusPost API key', async () => {
  let called = false;
  const res = await getNimbusAuthToken({ email: 'test@aishufoods.com', password: 'valid_pass' }, async () => {
    called = true;
    throw new Error('must not be called');
  });
  assert.equal(res.token, null);
  assert.equal(called, false);
  assert.match(res.error, /NIMBUSPOST_API_KEY/);
});

test('NimbusPost Client: getNimbusAuthToken accepts pre-existing standing API token', async () => {
  const res = await getNimbusAuthToken({ token: 'pre_configured_api_token_123' });
  assert.equal(res.token, 'pre_configured_api_token_123');
});

test('NimbusPost Client: checkCourierServiceability parses and standardizes rate options', async () => {
  const fakeFetch = async (url, options) => {
    assert.match(url, /\/courier\/serviceability/);
    assert.equal(options.headers.Authorization, 'Bearer token_123');
    return {
      ok: true,
      json: async () => ({
        status: true,
        data: [
          { courier_id: 101, courier_name: 'Delhivery Surface', freight_charge: 54, cod_charges: 0, charge: 54, edd: '2-3 days' },
          { courier_id: 102, courier_name: 'BlueDart Express', freight_charge: 90, cod_charges: 0, charge: 90, edd: '1-2 days' },
        ],
      }),
    };
  };

  const res = await checkCourierServiceability(
    'token_123',
    { pickup_pincode: '500001', delivery_pincode: '560001', weight_kg: 0.5, cod: 0 },
    fakeFetch
  );

  assert.equal(res.success, true);
  assert.equal(res.couriers.length, 2);
  assert.equal(res.couriers[0].courier_name, 'Delhivery Surface');
  assert.equal(res.couriers[0].total_charge, 54);
});

test('NimbusPost Client: createNimbusShipment validates and returns AWB and label info', async () => {
  const fakeFetch = async (url, options) => {
    assert.match(url, /\/shipments/);
    const body = JSON.parse(options.body);
    assert.equal(body.order_number, 'Aishu-0010008');
    assert.equal(body.payment_type, 'prepaid');
    assert.equal(body.sub_total, 548);
    assert.equal(body.pickup_location, 'Kukatpally Central Kitchen');

    return {
      ok: true,
      json: async () => ({
        status: true,
        data: {
          shipment_id: 'np_ship_789',
          awb_number: 'AWB9876543210',
          courier_id: 101,
          courier_name: 'Delhivery Surface',
          label_url: 'https://api.nimbuspost.com/labels/AWB9876543210.pdf',
          tracking_url: 'https://nimbuspost.com/track/AWB9876543210',
        },
      }),
    };
  };

  const shipmentReq = {
    order_number: 'Aishu-0010008',
    payment_type: 'prepaid',
    order_amount: 548,
    package_weight_kg: 0.5,
    package_length_cm: 15,
    package_width_cm: 12,
    package_height_cm: 10,
    pickup_location_name: 'Kukatpally Central Kitchen',
    consignee: {
      name: 'Ettela Maneesh',
      phone: '9000000000',
      address: 'Plot 42, Green Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500072',
    },
    items: [
      { name: 'Kaju Katli Special', qty: 1, price: 548, sku: 'KK-500G' },
    ],
  };

  const res = await createNimbusShipment('token_123', shipmentReq, fakeFetch);
  assert.equal(res.success, true);
  assert.equal(res.awb_number, 'AWB9876543210');
  assert.equal(res.courier_name, 'Delhivery Surface');
  assert.equal(res.label_url, 'https://api.nimbuspost.com/labels/AWB9876543210.pdf');
});

test('NimbusPost Client: createNimbusShipment marks ambiguous network timeouts as uncertain', async () => {
  const fakeFetch = async () => {
    throw new Error('Connection reset / Gateway timeout');
  };

  const shipmentReq = {
    order_number: 'Aishu-TIMEOUT-1',
    payment_type: 'prepaid',
    order_amount: 500,
    package_weight_kg: 0.5,
    package_length_cm: 15,
    package_width_cm: 10,
    package_height_cm: 10,
    pickup_location_name: 'Main Kitchen',
    consignee: { name: 'Customer', phone: '9000000000', address: 'Street', city: 'Hyd', state: 'TS', pincode: '500001' },
    items: [{ name: 'Item', qty: 1, price: 500 }],
  };

  const res = await createNimbusShipment('token_123', shipmentReq, fakeFetch);
  assert.equal(res.success, false);
  assert.equal(res.is_uncertain, true);
  assert.match(res.error, /Connection reset/);
});

test('NimbusPost Client: trackNimbusShipment retrieves live tracking history', async () => {
  const fakeFetch = async (url) => {
    assert.match(url, /track\/AWB9876543210/);
    return {
      ok: true,
      json: async () => ({
        status: true,
        data: {
          awb: 'AWB9876543210',
          current_status: 'Out for Delivery',
          history: [
            { status: 'Booked', location: 'Hyderabad Hub', time: '2026-11-01 10:00:00' },
            { status: 'Out for Delivery', location: 'Delivery Hub', time: '2026-11-01 15:30:00' },
          ],
        },
      }),
    };
  };

  const res = await trackNimbusShipment('token_123', 'AWB9876543210', fakeFetch);
  assert.equal(res.success, true);
  assert.equal(res.status, 'Out for Delivery');
  assert.equal(res.history.length, 2);
});

test('NimbusPost Client: rejects invalid serviceability inputs without calling provider', async () => {
  let called = false;
  const res = await checkCourierServiceability('token', {
    pickup_pincode: '500001', delivery_pincode: 'bad', weight_kg: 0, cod: 0,
  }, async () => { called = true; throw new Error('must not be called'); });
  assert.equal(res.success, false);
  assert.equal(called, false);
});

test('NimbusPost Client: preserves ambiguous success as uncertain when no booking ID is returned', async () => {
  const res = await createNimbusShipment('token', {
    order_number: 'Aishu-MALFORMED-1', payment_type: 'prepaid', order_amount: 500,
    package_weight_kg: 0.5, package_length_cm: 15, package_width_cm: 10, package_height_cm: 10,
    pickup_location_name: 'Main Kitchen',
    consignee: { name: 'Customer', phone: '9000000000', address: 'Street', city: 'Hyd', state: 'TS', pincode: '500001' },
    items: [{ name: 'Item', qty: 1, price: 500 }],
  }, async () => ({ ok: true, json: async () => ({ status: true, data: {} }) }));
  assert.equal(res.success, false);
  assert.equal(res.is_uncertain, true);
});

test('NimbusPost webhook utilities authenticate, map terminal statuses, and reject unknown values', async () => {
  assert.equal(equalSecret('shared-secret', 'shared-secret'), true);
  assert.equal(equalSecret('shared-secret', 'wrong-secret'), false);
  assert.equal(equalSecret('shared-secret', 'shared-secret-extra'), false);
  assert.equal(mapNimbusStatusToInternal('RTO Delivered'), 'rto_delivered');
  assert.equal(mapNimbusStatusToInternal('Returned to Sender'), 'returned');
  assert.equal(mapNimbusStatusToInternal('provider invented state'), null);
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
