/**
 * NimbusPost API Client & Utilities (JavaScript for Node tests & Deno compatibility)
 * Official API Base: https://api.nimbuspost.com/v1
 * Docs: https://nimbuspost.com/api-documentation
 */

export const NIMBUS_BASE_URL = 'https://api.nimbuspost.com/v1';

export function redactSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const k of Object.keys(clone)) {
    if (/password|token|secret|key|authorization/i.test(k)) {
      clone[k] = '[REDACTED]';
    } else if (typeof clone[k] === 'object') {
      clone[k] = redactSensitive(clone[k]);
    }
  }
  return clone;
}

/**
 * Authenticates with NimbusPost and returns a Bearer token.
 */
export async function getNimbusAuthToken(env, fetchImpl = fetch) {
  if (env.token && env.token.trim().length > 10) {
    return { token: env.token.trim() };
  }

  if (!env.apiKey || !env.email || !env.password) {
    return { token: null, error: 'Missing NimbusPost credentials (NIMBUSPOST_API_KEY / NIMBUSPOST_EMAIL / NIMBUSPOST_PASSWORD or NIMBUSPOST_TOKEN)' };
  }

  try {
    const res = await fetchImpl(`${NIMBUS_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: env.apiKey, email: env.email, password: env.password }),
    });

    const json = await res.json();
    if (!res.ok || !json.status) {
      return { token: null, error: json.message || `NimbusPost login failed (HTTP ${res.status})` };
    }

    const token = typeof json.data === 'string' ? json.data : json.data?.token;
    if (!token) {
      return { token: null, error: 'NimbusPost login response did not contain an auth token' };
    }

    return { token };
  } catch (err) {
    return { token: null, error: `Network exception during NimbusPost authentication: ${err?.message || err}` };
  }
}

/**
 * Check Courier Serviceability & Rates
 */
export async function checkCourierServiceability(token, params, fetchImpl = fetch) {
  if (!/^\d{6}$/.test(params.pickup_pincode) || !/^\d{6}$/.test(params.delivery_pincode) ||
      !Number.isFinite(params.weight_kg) || params.weight_kg <= 0) {
    return { success: false, couriers: [], error: 'Valid pickup/delivery pincodes and positive parcel weight are required' };
  }
  try {
    const res = await fetchImpl(`${NIMBUS_BASE_URL}/courier/serviceability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pickup_pincode: params.pickup_pincode,
        destination_pincode: params.delivery_pincode,
        weight: params.weight_kg.toString(),
        cod: params.cod.toString(),
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.status) {
      return { success: false, couriers: [], error: json.message || `Serviceability check failed (HTTP ${res.status})` };
    }

    const rawList = Array.isArray(json.data) ? json.data : [];
    const couriers = rawList.map((item) => ({
      courier_id: item.courier_id || item.id,
      courier_name: item.courier_name || item.name || 'Standard Courier',
      freight_charge: Number(item.freight_charge || item.charge || 0),
      cod_charge: Number(item.cod_charges || item.cod_charge || 0),
      total_charge: Number(item.total_charge || item.charge || 0),
      estimated_delivery_days: item.edd || item.estimated_delivery_days,
    }));

    if (couriers.some((courier) => !courier.courier_id || !Number.isFinite(courier.total_charge))) {
      return { success: false, couriers: [], error: 'NimbusPost returned an invalid courier response' };
    }
    return { success: true, couriers };
  } catch (err) {
    return { success: false, couriers: [], error: `Network exception during serviceability check: ${err?.message || err}` };
  }
}

/**
 * Create Shipment with NimbusPost
 */
export async function createNimbusShipment(token, req, fetchImpl = fetch) {
  const payload = {
    order_number: req.order_number,
    payment_type: req.payment_type === 'cod' ? 'COD' : 'prepaid',
    sub_total: req.order_amount,
    weight: req.package_weight_kg,
    length: req.package_length_cm,
    breadth: req.package_width_cm,
    height: req.package_height_cm,
    pickup_location: req.pickup_location_name,
    consignee: {
      name: req.consignee.name,
      phone: req.consignee.phone,
      email: req.consignee.email || '',
      address: req.consignee.address,
      city: req.consignee.city,
      state: req.consignee.state,
      pincode: req.consignee.pincode,
      country: 'India',
    },
    products: req.items.map((i) => ({
      name: i.name,
      units: i.qty,
      selling_price: i.price,
      sku: i.sku || i.name.slice(0, 15),
    })),
  };

  if (req.courier_id) {
    payload.courier_id = req.courier_id;
  }

  try {
    const res = await fetchImpl(`${NIMBUS_BASE_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok || !json.status) {
      return {
        success: false,
        error: json.message || `Shipment creation failed (HTTP ${res.status})`,
        is_uncertain: res.status >= 500,
      };
    }

    const d = json.data || {};
    const shipmentId = d.shipment_id?.toString() || d.id?.toString();
    const awbNumber = d.awb_number || d.awb;
    if (!shipmentId && !awbNumber) {
      return {
        success: false,
        error: 'NimbusPost response did not identify the created shipment; provider state must be reconciled',
        is_uncertain: true,
      };
    }
    return {
      success: true,
      shipment_id: shipmentId,
      awb_number: awbNumber,
      courier_id: d.courier_id?.toString(),
      courier_name: d.courier_name,
      label_url: d.label_url || d.label,
      tracking_url: d.tracking_url,
    };
  } catch (err) {
    return {
      success: false,
      error: `Network timeout/error dispatching shipment: ${err?.message || err}`,
      is_uncertain: true,
    };
  }
}

/**
 * Fetch authoritative tracking status from NimbusPost by AWB
 */
export async function trackNimbusShipment(token, awb, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(`${NIMBUS_BASE_URL}/shipments/track/${encodeURIComponent(awb)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok || !json.status) {
      return { success: false, error: json.message || `Tracking lookup failed (HTTP ${res.status})` };
    }

    const d = json.data || {};
    return {
      success: true,
      status: d.status || d.current_status,
      history: Array.isArray(d.history) ? d.history : [],
    };
  } catch (err) {
    return { success: false, error: `Network exception tracking shipment: ${err?.message || err}` };
  }
}
