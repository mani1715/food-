export function equalSecret(a, b) {
  const encoder = new TextEncoder();
  const left = encoder.encode(a || '');
  const right = encoder.encode(b || '');
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) mismatch |= (left[i] || 0) ^ (right[i] || 0);
  return mismatch === 0;
}

export function mapNimbusStatusToInternal(status) {
  const value = String(status || '').toLowerCase().trim();
  if (value.includes('rto delivered')) return 'rto_delivered';
  if (value.includes('rto in transit')) return 'rto_in_transit';
  if (value.includes('rto initiated') || value.includes('return to origin')) return 'rto_initiated';
  if (value.includes('return requested')) return 'return_requested';
  if (value.includes('return in transit')) return 'return_in_transit';
  if (value === 'returned' || value.includes('returned to sender')) return 'returned';
  if (value.includes('pickup failed')) return 'pickup_failed';
  if (value.includes('pickup scheduled') || value.includes('booked') || value.includes('manifest')) return 'pickup_scheduled';
  if (value.includes('picked up') || value.includes('pickup done')) return 'picked_up';
  if (value.includes('out for delivery')) return 'out_for_delivery';
  if (value.includes('in transit') || value.includes('reached') || value.includes('hub')) return 'in_transit';
  if (value === 'delivered' || value.includes('delivered to consignee')) return 'delivered';
  if (value.includes('undelivered') || value.includes('ndr') || value.includes('failed attempt')) return 'ndr';
  if (value.includes('delivery failed')) return 'delivery_failed';
  if (value.includes('cancelled')) return 'cancelled';
  return null;
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
