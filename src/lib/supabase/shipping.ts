import { supabase } from './client';
import {
  ShippingSettings,
  PickupLocation,
  ShipmentStatus,
  FoodDispositionStatus,
} from '../shipping/types';

export interface DbShipment {
  id: string;
  order_id: string;
  provider: string;
  courier_name: string;
  awb_number: string;
  tracking_url?: string;
  shipping_status: ShipmentStatus;
  pickup_status: string;
  shipped_at?: string;
  delivered_at?: string;
  ndr_at?: string;
  ndr_reason?: string;
  rto_at?: string;
  rto_reason?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  shipping_cost: number;
  customer_delivery_charge: number;
  cod_amount: number;
  cod_collection_status: string;
  cod_remittance_status: string;
  dead_weight_grams?: number;
  volumetric_weight_grams?: number;
  package_length_cm?: number;
  package_width_cm?: number;
  package_height_cm?: number;
  is_manual_dispatch: boolean;
  food_disposition_status: FoodDispositionStatus;
  food_disposition_notes?: string;
  food_disposition_by?: string;
  food_disposition_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch general shipping settings
 */
export const fetchShippingSettingsFromDb = async (): Promise<ShippingSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('shipping_settings')
      .select('*')
      .eq('id', 'default_shipping_config')
      .maybeSingle();

    if (error) {
      console.warn('Could not fetch shipping settings:', error.message);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      shippingProvider: data.shipping_provider || 'nimbuspost',
      enabled: data.enabled ?? false,
      testMode: data.test_mode ?? true,
      manualShippingEnabled: data.manual_shipping_enabled ?? true,
      automaticShipmentCreation: data.automatic_shipment_creation ?? false,
      defaultPackageDimensions: data.default_package_dimensions || { lengthCm: 15, widthCm: 12, heightCm: 10 },
      defaultShippingWeightBufferGrams: data.default_shipping_weight_buffer_grams ?? 50,
      volumetricDivisor: data.volumetric_divisor ?? null,
      serviceabilityRequired: data.serviceability_required ?? false,
      allowCod: data.allow_cod ?? true,
      allowReturns: data.allow_returns ?? false,
      trackingEnabled: data.tracking_enabled ?? true,
    };
  } catch (err) {
    console.warn('Error fetching shipping settings:', err);
    return null;
  }
};

/**
 * Update shipping settings (Requires staff RBAC)
 */
export const updateShippingSettingsInDb = async (
  settings: Partial<ShippingSettings>
): Promise<void> => {
  const dbPayload: any = {
    updated_at: new Date().toISOString(),
  };

  if (settings.shippingProvider !== undefined) dbPayload.shipping_provider = settings.shippingProvider;
  if (settings.enabled !== undefined) dbPayload.enabled = settings.enabled;
  if (settings.testMode !== undefined) dbPayload.test_mode = settings.testMode;
  if (settings.manualShippingEnabled !== undefined) dbPayload.manual_shipping_enabled = settings.manualShippingEnabled;
  if (settings.automaticShipmentCreation !== undefined) dbPayload.automatic_shipment_creation = settings.automaticShipmentCreation;
  if (settings.defaultPackageDimensions !== undefined) dbPayload.default_package_dimensions = settings.defaultPackageDimensions;
  if (settings.defaultShippingWeightBufferGrams !== undefined) dbPayload.default_shipping_weight_buffer_grams = settings.defaultShippingWeightBufferGrams;
  if (settings.volumetricDivisor !== undefined) dbPayload.volumetric_divisor = settings.volumetricDivisor;
  if (settings.serviceabilityRequired !== undefined) dbPayload.serviceability_required = settings.serviceabilityRequired;
  if (settings.allowCod !== undefined) dbPayload.allow_cod = settings.allowCod;
  if (settings.allowReturns !== undefined) dbPayload.allow_returns = settings.allowReturns;
  if (settings.trackingEnabled !== undefined) dbPayload.tracking_enabled = settings.trackingEnabled;

  const { error } = await supabase
    .from('shipping_settings')
    .update(dbPayload)
    .eq('id', 'default_shipping_config');

  if (error) throw error;
};

/**
 * Fetch pickup locations list
 */
export const fetchPickupLocationsFromDb = async (): Promise<PickupLocation[]> => {
  try {
    const { data, error } = await supabase
      .from('shipping_pickup_locations')
      .select('*')
      .order('is_default', { ascending: false });

    if (error) {
      console.warn('Error fetching pickup locations:', error.message);
      return [];
    }

    return (data || []).map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      contactName: loc.contact_name,
      phone: loc.phone,
      addressLine1: loc.address_line_1,
      addressLine2: loc.address_line_2,
      landmark: loc.landmark,
      city: loc.city,
      state: loc.state,
      postalCode: loc.postal_code,
      country: loc.country || 'India',
      provider: loc.provider || 'nimbuspost',
      providerLocationId: loc.provider_location_id,
      isDefault: loc.is_default ?? false,
      isActive: loc.is_active ?? true,
    }));
  } catch (err) {
    console.warn('Failed to load pickup locations:', err);
    return [];
  }
};

/**
 * Save or update pickup location
 */
export const savePickupLocationInDb = async (
  location: Partial<PickupLocation>
): Promise<void> => {
  const payload: any = {
    name: location.name,
    contact_name: location.contactName,
    phone: location.phone,
    address_line_1: location.addressLine1,
    address_line_2: location.addressLine2 || null,
    landmark: location.landmark || null,
    city: location.city,
    state: location.state,
    postal_code: location.postalCode,
    country: location.country || 'India',
    is_default: location.isDefault ?? false,
    is_active: location.isActive ?? true,
    updated_at: new Date().toISOString(),
  };

  if (location.isDefault) {
    // Unset other defaults
    await supabase.from('shipping_pickup_locations').update({ is_default: false }).neq('id', location.id || 'new');
  }

  if (location.id) {
    const { error } = await supabase
      .from('shipping_pickup_locations')
      .update(payload)
      .eq('id', location.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('shipping_pickup_locations')
      .insert([payload]);
    if (error) throw error;
  }
};

/**
 * Fetch all shipments with joined order numbers for Admin Dashboard
 */
export const fetchAllShipmentsFromDb = async (): Promise<DbShipment[]> => {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching shipments from Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch shipments:', err);
    return [];
  }
};

/**
 * Check if order is eligible for shipment creation (Server Authoritative)
 */
export const checkOrderShipmentEligibility = async (orderId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('is_order_ready_for_shipment', {
      p_order_id: orderId,
    });
    if (error) throw error;
    return data;
  } catch (err: any) {
    return { eligible: false, error: err.message };
  }
};

/**
 * Calculate deterministic package weights and dimensions (Server Authoritative)
 */
export const calculateOrderPackageFromDb = async (orderId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('calculate_order_package_details', {
      p_order_id: orderId,
    });
    if (error) throw error;
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Create a manual shipment record via secure RPC (Admin Fallback)
 */
export const createManualShipmentInDb = async (params: {
  orderId: string;
  courierName: string;
  awbNumber: string;
  trackingUrl?: string;
  deadWeightGrams?: number;
  shippingCost?: number;
  notes?: string;
}): Promise<any> => {
  const { data, error } = await supabase.rpc('create_manual_shipment', {
    p_order_id: params.orderId,
    p_courier_name: params.courierName,
    p_awb_number: params.awbNumber,
    p_tracking_url: params.trackingUrl || null,
    p_dead_weight_grams: params.deadWeightGrams || null,
    p_shipping_cost: params.shippingCost || 0.00,
    p_notes: params.notes || null,
  });

  if (error) throw error;
  if (data && data.success === false) {
    throw new Error(data.error || 'Failed to create manual shipment');
  }
  return data;
};

/**
 * Server-Enforced Shipment State Transition RPC
 */
export const updateShipmentStatusInDb = async (params: {
  shipmentId: string;
  newStatus: string;
  location?: string;
  description?: string;
  reason?: string;
}): Promise<any> => {
  const { data, error } = await supabase.rpc('update_shipment_status_secure', {
    p_shipment_id: params.shipmentId,
    p_new_status: params.newStatus,
    p_location: params.location || null,
    p_description: params.description || null,
    p_reason: params.reason || null,
  });

  if (error) throw error;
  if (data && data.success === false) {
    throw new Error(data.error || 'Failed to update shipment status');
  }
  return data;
};

/**
 * Food Safety Review & Disposition RPC for Returned Food
 */
export const dispositionReturnedFoodStockInDb = async (params: {
  shipmentId: string;
  action: 'discard' | 'non_sellable' | 'approved_for_restock';
  notes: string;
  restockItems?: any[];
}): Promise<any> => {
  const { data, error } = await supabase.rpc('disposition_returned_food_stock', {
    p_shipment_id: params.shipmentId,
    p_action: params.action,
    p_notes: params.notes,
    p_restock_items: params.restockItems || [],
  });

  if (error) throw error;
  if (data && data.success === false) {
    throw new Error(data.error || 'Failed to process food return disposition');
  }
  return data;
};

/**
 * Get sanitized or admin shipping details for an order
 */
export const fetchOrderShippingDetailsFromDb = async (orderId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('get_order_shipping_details', {
      p_order_id: orderId,
    });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.warn('Could not load shipping details:', err);
    return null;
  }
};
