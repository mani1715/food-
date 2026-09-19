import {
  IShippingProvider,
  ShippingProviderType,
  ServiceabilityRequest,
  ServiceabilityResponse,
  CreateShipmentRequest,
  CreateShipmentResponse,
  TrackingResponse,
} from './types';

/**
 * NimbusPost Logistics Provider Adapter (Foundation Boundary)
 *
 * NOTE: This adapter is strictly server-oriented and fail-closed.
 * Real API endpoints, auth signatures, payload serializers, and webhooks will be connected
 * only when official NimbusPost documentation and server-side credentials are provided.
 *
 * Under no circumstances does this adapter invent fake endpoints or expose secrets.
 */
export class NimbusPostAdapter implements IShippingProvider {
  public readonly providerName: ShippingProviderType = 'nimbuspost';

  public isConfigured(): boolean {
    // Fail-closed until official server-side credentials and configuration are injected
    return false;
  }

  public async checkServiceability(
    _req: ServiceabilityRequest
  ): Promise<ServiceabilityResponse> {
    return {
      serviceable: false,
      provider: 'nimbuspost',
      status: 'PROVIDER_NOT_CONFIGURED',
      message:
        'NimbusPost integration is pending official API documentation and server-side credentials.',
      availableCouriers: [],
    };
  }

  public async getRates(
    _req: ServiceabilityRequest
  ): Promise<ServiceabilityResponse> {
    return {
      serviceable: false,
      provider: 'nimbuspost',
      status: 'PROVIDER_NOT_CONFIGURED',
      message:
        'NimbusPost rate calculation is pending official API integration.',
      availableCouriers: [],
    };
  }

  public async createShipment(
    _req: CreateShipmentRequest
  ): Promise<CreateShipmentResponse> {
    return {
      success: false,
      status: 'PROVIDER_NOT_CONFIGURED',
      error:
        'Cannot create automated NimbusPost shipment: API credentials and official endpoints not configured. Use Manual Shipping Mode for current fulfillments.',
    };
  }

  public async schedulePickup(
    _shipmentId: string,
    _pickupDate: string
  ): Promise<{ success: boolean; status: string; error?: string }> {
    return {
      success: false,
      status: 'PROVIDER_NOT_CONFIGURED',
      error:
        'Automated pickup scheduling requires official NimbusPost API credentials.',
    };
  }

  public async getTracking(
    _awbOrShipmentId: string
  ): Promise<TrackingResponse> {
    return {
      success: false,
      status: 'PROVIDER_NOT_CONFIGURED',
      events: [],
      error:
        'Automated NimbusPost tracking sync requires official API credentials.',
    };
  }

  public async cancelShipment(
    _shipmentId: string,
    _reason?: string
  ): Promise<{ success: boolean; status: string; error?: string }> {
    return {
      success: false,
      status: 'PROVIDER_NOT_CONFIGURED',
      error:
        'Automated NimbusPost shipment cancellation requires official API credentials.',
    };
  }

  public async downloadLabel(
    _shipmentId: string
  ): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
    return {
      success: false,
      error:
        'Official NimbusPost shipping label generation requires active provider integration.',
    };
  }
}

export const nimbusPostAdapter = new NimbusPostAdapter();
