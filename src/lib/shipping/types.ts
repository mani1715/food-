export type ShippingProviderType = 'nimbuspost' | 'manual';

export type ShipmentStatus =
  | 'not_created'
  | 'serviceability_pending'
  | 'ready_to_ship'
  | 'shipment_created'
  | 'pickup_scheduled'
  | 'pickup_failed'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'ndr'
  | 'rto_initiated'
  | 'rto_in_transit'
  | 'rto_delivered'
  | 'return_requested'
  | 'return_in_transit'
  | 'returned'
  | 'cancelled';

export type PickupStatus =
  | 'not_scheduled'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'pickup_failed'
  | 'cancelled';

export type FoodDispositionStatus =
  | 'not_applicable'
  | 'inspection_required'
  | 'discard'
  | 'non_sellable'
  | 'approved_for_restock';

export interface PackageDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface PickupLocation {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  provider: string;
  providerLocationId?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface ShippingSettings {
  id: string;
  shippingProvider: ShippingProviderType;
  enabled: boolean;
  testMode: boolean;
  manualShippingEnabled: boolean;
  automaticShipmentCreation: boolean;
  defaultPackageDimensions: PackageDimensions;
  defaultShippingWeightBufferGrams: number;
  volumetricDivisor?: number | null; // Nullable: NO hardcoded/guessed divisor
  serviceabilityRequired: boolean;
  allowCod: boolean;
  allowReturns: boolean;
  trackingEnabled: boolean;
}

export interface ServiceabilityRequest {
  pickupPincode: string;
  deliveryPincode: string;
  weightGrams: number;
  isCod?: boolean;
  declaredValue?: number;
  dimensions?: PackageDimensions;
}

export interface AvailableCourierOption {
  courierId: string;
  courierName: string;
  estimatedDeliveryDays: number;
  shippingCharge: number;
  codAvailable: boolean;
}

export interface ServiceabilityResponse {
  serviceable: boolean;
  provider: string;
  status: 'PROVIDER_NOT_CONFIGURED' | 'SERVICEABLE' | 'UNSERVICEABLE' | 'ERROR';
  message?: string;
  availableCouriers?: AvailableCourierOption[];
}

export interface CreateShipmentRequest {
  orderId: string;
  orderNumber: string;
  pickupLocationId?: string;
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    weightGrams?: number;
    price: number;
  }>;
  deadWeightGrams: number;
  packageDimensions?: PackageDimensions;
  isCod: boolean;
  codAmount?: number;
  declaredValue: number;
}

export interface CreateShipmentResponse {
  success: boolean;
  status: 'PROVIDER_NOT_CONFIGURED' | 'CREATED' | 'FAILED';
  shipmentId?: string;
  providerShipmentId?: string;
  awbNumber?: string;
  courierName?: string;
  labelUrl?: string;
  trackingUrl?: string;
  actualLogisticsCost?: number;
  error?: string;
}

export interface TrackingEvent {
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface TrackingResponse {
  success: boolean;
  status: 'PROVIDER_NOT_CONFIGURED' | 'FOUND' | 'NOT_FOUND' | 'ERROR';
  currentStatus?: ShipmentStatus;
  courierName?: string;
  awbNumber?: string;
  trackingUrl?: string;
  events: TrackingEvent[];
  error?: string;
}

export interface IShippingProvider {
  readonly providerName: ShippingProviderType;
  isConfigured(): boolean;
  checkServiceability(req: ServiceabilityRequest): Promise<ServiceabilityResponse>;
  getRates(req: ServiceabilityRequest): Promise<ServiceabilityResponse>;
  createShipment(req: CreateShipmentRequest): Promise<CreateShipmentResponse>;
  schedulePickup(shipmentId: string, pickupDate: string): Promise<{ success: boolean; status: string; error?: string }>;
  getTracking(awbOrShipmentId: string): Promise<TrackingResponse>;
  cancelShipment(shipmentId: string, reason?: string): Promise<{ success: boolean; status: string; error?: string }>;
  downloadLabel(shipmentId: string): Promise<{ success: boolean; labelUrl?: string; error?: string }>;
}
