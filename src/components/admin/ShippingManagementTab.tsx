import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Plus,
  Settings,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Filter,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign,
  Info,
  ChevronRight,
  Eye,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  DbShipment,
  fetchShippingSettingsFromDb,
  updateShippingSettingsInDb,
  fetchPickupLocationsFromDb,
  savePickupLocationInDb,
  fetchAllShipmentsFromDb,
  createManualShipmentInDb,
  updateShipmentStatusInDb,
  dispositionReturnedFoodStockInDb,
  calculateOrderPackageFromDb,
  checkOrderShipmentEligibility,
} from '../../lib/supabase/shipping';
import {
  ShippingSettings,
  PickupLocation,
  ShipmentStatus,
  FoodDispositionStatus,
} from '../../lib/shipping/types';
import { Order } from '../../types';

const COURIER_PRESETS = [
  'Delhivery Logistics',
  'DTDC Express',
  'BlueDart Couriers',
  'India Post (Speed Post)',
  'Porter / Dunzo Express',
  'Aishu Foods Local Delivery',
];

export const ShippingManagementTab: React.FC = () => {
  const { orders, products, addToast } = useApp();

  const [shipments, setShipments] = useState<DbShipment[]>([]);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);

  // Modals
  const [showManualDispatchModal, setShowManualDispatchModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Selected Records for Modals
  const [selectedShipment, setSelectedShipment] = useState<DbShipment | null>(null);

  // Manual Dispatch Form
  const [dispatchOrderId, setDispatchOrderId] = useState('');
  const [dispatchCourier, setDispatchCourier] = useState('Delhivery Logistics');
  const [dispatchAwb, setDispatchAwb] = useState('');
  const [dispatchTrackingUrl, setDispatchTrackingUrl] = useState('');
  const [dispatchWeightGrams, setDispatchWeightGrams] = useState<number>(500);
  const [dispatchShippingCost, setDispatchShippingCost] = useState<number>(0);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatchEligibility, setDispatchEligibility] = useState<any>(null);
  const [packageCalc, setPackageCalc] = useState<any>(null);
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);

  // Status Transition Form
  const [newStatus, setNewStatus] = useState<string>('in_transit');
  const [statusLocation, setStatusLocation] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Food Disposition Form (RTO / Returns)
  const [dispositionAction, setDispositionAction] = useState<'discard' | 'non_sellable' | 'approved_for_restock'>('discard');
  const [dispositionNotes, setDispositionNotes] = useState('');
  const [dispositionSubmitting, setDispositionSubmitting] = useState(false);

  // Pickup Location Form
  const [pickupName, setPickupName] = useState('Aishu Foods Central Kitchen');
  const [pickupContact, setPickupContact] = useState('Store Manager');
  const [pickupPhone, setPickupPhone] = useState('9876543210');
  const [pickupAddress, setPickupAddress] = useState('Road No 12, Jubilee Hills');
  const [pickupCity, setPickupCity] = useState('Hyderabad');
  const [pickupState, setPickupState] = useState('Telangana');
  const [pickupPincode, setPickupPincode] = useState('500033');

  // Load Data
  const loadShippingData = async () => {
    try {
      setRefreshing(true);
      const [shipmentsData, settingsData, locationsData] = await Promise.all([
        fetchAllShipmentsFromDb(),
        fetchShippingSettingsFromDb(),
        fetchPickupLocationsFromDb(),
      ]);

      setShipments(shipmentsData);
      setShippingSettings(settingsData);
      setPickupLocations(locationsData);
    } catch (err: any) {
      console.warn('Failed loading shipping data:', err);
      addToast('Error', 'Failed to load shipping records from database.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadShippingData();
  }, []);

  // When selected order changes in Manual Dispatch modal, check eligibility and calc package
  useEffect(() => {
    if (dispatchOrderId) {
      checkOrderShipmentEligibility(dispatchOrderId).then(setDispatchEligibility);
      calculateOrderPackageFromDb(dispatchOrderId).then((res) => {
        setPackageCalc(res);
        if (res && res.dead_weight_grams) {
          setDispatchWeightGrams(res.dead_weight_grams);
        }
      });
    } else {
      setDispatchEligibility(null);
      setPackageCalc(null);
    }
  }, [dispatchOrderId]);

  // Copy AWB Helper
  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    addToast('Copied', `AWB ${awb} copied to clipboard.`, 'success');
    setTimeout(() => setCopiedAwb(null), 2500);
  };

  // Metrics Calculations
  const readyToShipOrders = useMemo(() => {
    const shippedOrderIds = new Set(shipments.filter(s => s.shipping_status !== 'cancelled').map(s => s.order_id));
    return orders.filter(o => (o.orderStatus === 'ready_to_ship' || o.orderStatus === 'confirmed' || o.orderStatus === 'processing') && !shippedOrderIds.has(o.id) && o.status !== 'Cancelled');
  }, [orders, shipments]);

  const activeShipmentsCount = shipments.filter(s => ['shipment_created', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s.shipping_status)).length;
  const deliveredCount = shipments.filter(s => s.shipping_status === 'delivered').length;
  const ndrCount = shipments.filter(s => s.shipping_status === 'ndr').length;
  const rtoCount = shipments.filter(s => ['rto_initiated', 'rto_in_transit', 'rto_delivered', 'return_requested', 'return_in_transit', 'returned'].includes(s.shipping_status)).length;

  const totalLogisticsCost = shipments.reduce((sum, s) => sum + Number(s.shipping_cost || 0), 0);
  const totalCustomerDeliveryCharge = shipments.reduce((sum, s) => sum + Number(s.customer_delivery_charge || 0), 0);

  // Filtered Shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.order_id.toLowerCase().includes(q) ||
        (s.awb_number && s.awb_number.toLowerCase().includes(q)) ||
        (s.courier_name && s.courier_name.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'all' ||
        s.shipping_status === statusFilter ||
        (statusFilter === 'active' && ['shipment_created', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s.shipping_status)) ||
        (statusFilter === 'ndr' && s.shipping_status === 'ndr') ||
        (statusFilter === 'rto' && ['rto_initiated', 'rto_in_transit', 'rto_delivered', 'returned'].includes(s.shipping_status));

      return matchSearch && matchStatus;
    });
  }, [shipments, searchTerm, statusFilter]);

  // Handle Manual Dispatch Submit
  const handleCreateManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrderId) {
      addToast('Order Required', 'Please select an order to dispatch.', 'error');
      return;
    }
    if (!dispatchAwb.trim()) {
      addToast('AWB Required', 'Please enter a valid AWB / Tracking number.', 'error');
      return;
    }

    try {
      setDispatchSubmitting(true);
      await createManualShipmentInDb({
        orderId: dispatchOrderId,
        courierName: dispatchCourier,
        awbNumber: dispatchAwb.trim(),
        trackingUrl: dispatchTrackingUrl.trim() || undefined,
        deadWeightGrams: dispatchWeightGrams,
        shippingCost: dispatchShippingCost,
        notes: dispatchNotes,
      });

      addToast('Shipment Created', `Order successfully dispatched with ${dispatchCourier} (AWB: ${dispatchAwb}).`, 'success');
      setShowManualDispatchModal(false);
      setDispatchOrderId('');
      setDispatchAwb('');
      setDispatchTrackingUrl('');
      setDispatchNotes('');
      await loadShippingData();
    } catch (err: any) {
      addToast('Dispatch Failed', err.message || 'Could not create shipment.', 'error');
    } finally {
      setDispatchSubmitting(false);
    }
  };

  // Handle Status Update Submit
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    try {
      setStatusSubmitting(true);
      await updateShipmentStatusInDb({
        shipmentId: selectedShipment.id,
        newStatus,
        location: statusLocation.trim() || undefined,
        description: statusDescription.trim() || undefined,
        reason: statusReason.trim() || undefined,
      });

      addToast('Status Updated', `Shipment transitioned to ${newStatus}.`, 'success');
      setShowStatusModal(false);
      setSelectedShipment(null);
      await loadShippingData();
    } catch (err: any) {
      addToast('Update Failed', err.message || 'Invalid state transition.', 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Handle Food Safety Return Disposition Submit
  const handleDispositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    if (!dispositionNotes.trim()) {
      addToast('Notes Required', 'Please provide detailed kitchen inspection notes for this returned food parcel.', 'error');
      return;
    }

    try {
      setDispositionSubmitting(true);
      await dispositionReturnedFoodStockInDb({
        shipmentId: selectedShipment.id,
        action: dispositionAction,
        notes: dispositionNotes.trim(),
      });

      addToast('Disposition Logged', `Food safety review saved (${dispositionAction}).`, 'success');
      setShowDispositionModal(false);
      setSelectedShipment(null);
      setDispositionNotes('');
      await loadShippingData();
    } catch (err: any) {
      addToast('Disposition Failed', err.message || 'Could not process disposition.', 'error');
    } finally {
      setDispositionSubmitting(false);
    }
  };

  // Handle Save Pickup Location Submit
  const handleSavePickupLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePickupLocationInDb({
        name: pickupName,
        contactName: pickupContact,
        phone: pickupPhone,
        addressLine1: pickupAddress,
        city: pickupCity,
        state: pickupState,
        postalCode: pickupPincode,
        isDefault: true,
      });

      addToast('Location Saved', 'Warehouse pickup location updated.', 'success');
      setShowPickupModal(false);
      await loadShippingData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to save pickup location.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
          Loading Logistics & Shipping Domain...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Top Header & Actions */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-black text-white rounded-2xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-black tracking-tight flex items-center gap-2">
                <span>Shipping & Logistics Control</span>
                <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  NimbusPost Ready
                </span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage shipments, dispatch orders, track courier AWBs, and monitor food safety returns.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPickupModal(true)}
            className="px-3.5 py-2 bg-white border border-neutral-200 hover:border-black text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-neutral-600" />
            <span>Pickup Warehouse</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-2 bg-white border border-neutral-200 hover:border-black text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-600" />
            <span>Settings</span>
          </button>

          <button
            onClick={loadShippingData}
            disabled={refreshing}
            className="p-2 bg-white border border-neutral-200 hover:border-black text-black text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh Shipping Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-neutral-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (readyToShipOrders.length > 0) {
                setDispatchOrderId(readyToShipOrders[0].id);
              }
              setShowManualDispatchModal(true);
            }}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Create Dispatch</span>
          </button>
        </div>
      </div>

      {/* Integration Readiness Notice */}
      <div className="bg-gradient-to-r from-purple-50 via-neutral-50 to-amber-50 border border-purple-200 rounded-3xl p-5 shadow-subtle space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-black">
                NimbusPost Logistics Integration Architecture
              </h3>
              <p className="text-xs text-neutral-600">
                Logistics schemas, package weight calculators, state machines, and fail-closed boundaries are active.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full shrink-0">
            Manual Dispatch Fallback: ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="bg-white/80 border border-neutral-200 rounded-2xl p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-neutral-800">Variant Weight Support</span>
          </div>
          <div className="bg-white/80 border border-neutral-200 rounded-2xl p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-neutral-800">State Machine Enforced</span>
          </div>
          <div className="bg-white/80 border border-neutral-200 rounded-2xl p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-neutral-800">Food Safety Restock Review</span>
          </div>
          <div className="bg-white/80 border border-neutral-200 rounded-2xl p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-neutral-800">Official API Keys Pending</span>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Ready to Ship */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
            Ready to Ship
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-black">{readyToShipOrders.length}</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[10px] text-neutral-500 font-medium">Orders awaiting dispatch</p>
        </div>

        {/* Active In Transit */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
            In Transit
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-purple-600">{activeShipmentsCount}</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-[10px] text-neutral-500 font-medium">With courier partner</p>
        </div>

        {/* Delivered */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
            Delivered
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-600">{deliveredCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-neutral-500 font-medium">Successfully received</p>
        </div>

        {/* NDR */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
            NDR Exceptions
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${ndrCount > 0 ? 'text-amber-600' : 'text-black'}`}>
              {ndrCount}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[10px] text-neutral-500 font-medium">Delivery reattempt needed</p>
        </div>

        {/* RTO / Returns */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
            RTO & Returns
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${rtoCount > 0 ? 'text-rose-600' : 'text-black'}`}>
              {rtoCount}
            </span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-[10px] text-neutral-500 font-medium">Inspection required</p>
        </div>

        {/* Logistics Margin Analysis */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
            Logistics Expense
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-black">₹{totalLogisticsCost}</span>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-[10px] text-neutral-500 font-medium">Charged: ₹{totalCustomerDeliveryCharge}</p>
        </div>
      </div>

      {/* Shipments Table Section */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-black">Shipments & Consignments</h3>
            <p className="text-xs text-neutral-500">
              Showing {filteredShipments.length} of {shipments.length} total shipments
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search AWB, Order #, Courier..."
                className="pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:border-black bg-neutral-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:border-black bg-neutral-50 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (In Transit / Scheduled)</option>
              <option value="delivered">Delivered</option>
              <option value="ndr">NDR Exception</option>
              <option value="rto">RTO / Returns</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table / List */}
        {filteredShipments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-y border-neutral-200 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="py-3 px-4">Order & Date</th>
                  <th className="py-3 px-4">Courier & AWB</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Weight & Dimensions</th>
                  <th className="py-3 px-4">Cost vs Charged</th>
                  <th className="py-3 px-4">COD / Remittance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {filteredShipments.map((s) => {
                  const linkedOrder = orders.find((o) => o.id === s.order_id);
                  const isFoodReviewNeeded = s.food_disposition_status === 'inspection_required';

                  return (
                    <tr key={s.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Order & Date */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <span className="font-extrabold font-mono text-black block">
                          #{linkedOrder ? linkedOrder.orderNumber : s.order_id.substring(0, 8)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {s.created_at ? s.created_at.split('T')[0] : 'N/A'}
                        </span>
                      </td>

                      {/* Courier & AWB */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-black">{s.courier_name || 'Delhivery'}</span>
                          {s.is_manual_dispatch && (
                            <span className="text-[9px] font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded">
                              Manual
                            </span>
                          )}
                        </div>
                        {s.awb_number ? (
                          <div className="flex items-center gap-1 font-mono text-neutral-600">
                            <span>{s.awb_number}</span>
                            <button
                              onClick={() => handleCopyAwb(s.awb_number)}
                              className="p-1 hover:text-black transition-colors cursor-pointer"
                              title="Copy AWB"
                            >
                              {copiedAwb === s.awb_number ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {s.tracking_url && (
                              <a
                                href={s.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:text-black transition-colors"
                                title="Open Courier Tracking Page"
                              >
                                <ExternalLink className="w-3 h-3 text-blue-600" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">No AWB Assigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              s.shipping_status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : s.shipping_status === 'ndr'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : s.shipping_status.includes('rto') || s.shipping_status.includes('return')
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            ● {s.shipping_status.replace(/_/g, ' ')}
                          </span>

                          {isFoodReviewNeeded && (
                            <span className="block text-[9px] font-bold text-rose-600 animate-pulse">
                              ⚠️ Kitchen Inspection Required
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Weight & Dimensions */}
                      <td className="py-3.5 px-4 space-y-0.5 font-mono text-[11px]">
                        <div>
                          <span className="text-neutral-400">Dead Weight: </span>
                          <span className="font-bold text-black">{s.dead_weight_grams || 500}g</span>
                        </div>
                        {s.package_length_cm && (
                          <div className="text-[10px] text-neutral-500">
                            {s.package_length_cm}×{s.package_width_cm}×{s.package_height_cm} cm
                          </div>
                        )}
                      </td>

                      {/* Cost vs Charged */}
                      <td className="py-3.5 px-4 space-y-0.5 font-mono text-[11px]">
                        <div>
                          <span className="text-neutral-400">Cost: </span>
                          <span className="font-bold text-black">₹{s.shipping_cost || 0}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          Charged: ₹{s.customer_delivery_charge || 0}
                        </div>
                      </td>

                      {/* COD / Remittance */}
                      <td className="py-3.5 px-4 space-y-0.5 text-[11px]">
                        {s.cod_amount > 0 ? (
                          <>
                            <span className="font-bold font-mono text-amber-700">₹{s.cod_amount} COD</span>
                            <span className="block text-[10px] text-neutral-400 uppercase font-mono">
                              Remit: {s.cod_remittance_status}
                            </span>
                          </>
                        ) : (
                          <span className="text-neutral-400">Prepaid</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {isFoodReviewNeeded && (
                          <button
                            onClick={() => {
                              setSelectedShipment(s);
                              setShowDispositionModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                            title="Inspect Returned Food & Choose Disposition"
                          >
                            Inspect Return
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedShipment(s);
                            setNewStatus(s.shipping_status);
                            setShowStatusModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-black hover:text-white text-black font-bold rounded-lg text-[10px] transition-all cursor-pointer border border-neutral-200"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2 border border-dashed border-neutral-200 rounded-2xl">
            <Package className="w-8 h-8 text-neutral-400 mx-auto" />
            <p className="text-xs font-bold text-neutral-600">No shipments found matching filters</p>
            <p className="text-[10px] text-neutral-400">
              Orders marked Ready to Ship can be dispatched using the "Create Dispatch" button.
            </p>
          </div>
        )}
      </div>

      {/* Manual Dispatch Modal */}
      {showManualDispatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-modal text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-black" />
                <h3 className="text-lg font-black text-black">Create Shipment Dispatch</h3>
              </div>
              <button onClick={() => setShowManualDispatchModal(false)} className="text-neutral-400 hover:text-black">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualDispatch} className="space-y-4 text-xs">
              {/* Select Order */}
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Select Order to Dispatch
                </label>
                <select
                  value={dispatchOrderId}
                  onChange={(e) => setDispatchOrderId(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-bold bg-neutral-50 focus:outline-none focus:border-black cursor-pointer"
                  required
                >
                  <option value="">-- Choose Ready Order --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.orderNumber} • {o.customerName || 'Customer'} • ₹{o.total} ({o.orderStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Eligibility Check Banner */}
              {dispatchEligibility && (
                <div
                  className={`p-3 rounded-2xl border text-[11px] ${
                    dispatchEligibility.eligible
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {dispatchEligibility.eligible ? (
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Order is eligible for dispatch ({dispatchEligibility.is_cod ? 'COD' : 'Prepaid Verified'})</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Shipment Ineligible:</span>
                      </div>
                      <ul className="list-disc list-inside text-[10px] pl-2">
                        {dispatchEligibility.reasons?.map((r: string, idx: number) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Courier Selection */}
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Courier Partner
                </label>
                <select
                  value={dispatchCourier}
                  onChange={(e) => setDispatchCourier(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-bold bg-neutral-50 focus:outline-none focus:border-black cursor-pointer"
                >
                  {COURIER_PRESETS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* AWB & Tracking URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                    AWB / Waybill Number *
                  </label>
                  <input
                    type="text"
                    value={dispatchAwb}
                    onChange={(e) => setDispatchAwb(e.target.value)}
                    placeholder="e.g. DEL-889374921"
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-mono text-xs font-bold bg-neutral-50 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                    Package Dead Weight (grams)
                  </label>
                  <input
                    type="number"
                    value={dispatchWeightGrams}
                    onChange={(e) => setDispatchWeightGrams(Number(e.target.value))}
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-mono text-xs font-bold bg-neutral-50 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Tracking URL */}
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Courier Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  value={dispatchTrackingUrl}
                  onChange={(e) => setDispatchTrackingUrl(e.target.value)}
                  placeholder="https://www.delhivery.com/track/package/..."
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-medium bg-neutral-50 focus:outline-none focus:border-black"
                />
              </div>

              {/* Shipping Logistics Expense */}
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Actual Logistics Cost (₹)
                </label>
                <input
                  type="number"
                  value={dispatchShippingCost}
                  onChange={(e) => setDispatchShippingCost(Number(e.target.value))}
                  placeholder="e.g. 65"
                  className="w-full p-3 border border-neutral-200 rounded-2xl font-mono text-xs font-bold bg-neutral-50 focus:outline-none focus:border-black"
                />
                <p className="text-[10px] text-neutral-400">
                  This is your internal courier expense, kept separate from the customer delivery fee.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Dispatch Notes (Optional)
                </label>
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="e.g. Dispatched in insulated bubble pack with ice gel pouch"
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-medium bg-neutral-50 focus:outline-none focus:border-black"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualDispatchModal(false)}
                  className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl font-bold text-black transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchSubmitting || (dispatchEligibility && !dispatchEligibility.eligible)}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-2xl font-extrabold transition-all cursor-pointer shadow-subtle flex items-center justify-center gap-2"
                >
                  {dispatchSubmitting ? 'Creating Dispatch...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipment Status Transition Modal */}
      {showStatusModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-modal text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-black text-black">Update Shipment Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-neutral-400 hover:text-black">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400 font-medium">Current Status:</span>
                <span className="font-extrabold uppercase text-purple-700">{selectedShipment.shipping_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-medium">AWB:</span>
                <span className="font-mono font-bold text-black">{selectedShipment.awb_number || 'N/A'}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-bold bg-neutral-50 focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="pickup_scheduled">pickup_scheduled</option>
                  <option value="picked_up">picked_up</option>
                  <option value="in_transit">in_transit</option>
                  <option value="out_for_delivery">out_for_delivery</option>
                  <option value="delivered">delivered</option>
                  <option value="delivery_failed">delivery_failed</option>
                  <option value="ndr">ndr (Non-Delivery Report)</option>
                  <option value="rto_initiated">rto_initiated (Return to Origin)</option>
                  <option value="rto_in_transit">rto_in_transit</option>
                  <option value="rto_delivered">rto_delivered (Parcel in Kitchen)</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  placeholder="e.g. Hyderabad Hub / Secunderabad Hub"
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-medium bg-neutral-50 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Reason / Description
                </label>
                <input
                  type="text"
                  value={statusDescription}
                  onChange={(e) => setStatusDescription(e.target.value)}
                  placeholder="e.g. Out for delivery with delivery agent"
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-medium bg-neutral-50 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl font-bold text-black transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusSubmitting}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl font-extrabold transition-all cursor-pointer shadow-subtle"
                >
                  {statusSubmitting ? 'Updating...' : 'Apply Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Food Safety Return Disposition Modal */}
      {showDispositionModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-modal text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-lg font-black text-black">Food Safety Return Review</h3>
              </div>
              <button onClick={() => setShowDispositionModal(false)} className="text-neutral-400 hover:text-black">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2 text-rose-900">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Food Safety Mandate</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Returned perishable and handcrafted food parcels MUST NOT be automatically restocked into sellable inventory. Inspect the packaging seal, freshness, and transit time carefully.
              </p>
            </div>

            <form onSubmit={handleDispositionSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Select Disposition Outcome
                </label>

                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${dispositionAction === 'discard' ? 'border-rose-600 bg-rose-50/50' : 'border-neutral-200'}`}>
                    <input
                      type="radio"
                      name="disposition"
                      value="discard"
                      checked={dispositionAction === 'discard'}
                      onChange={() => setDispositionAction('discard')}
                      className="mt-1 accent-rose-600"
                    />
                    <div>
                      <span className="font-bold text-black block">Discard / Destroy (Safe Standard)</span>
                      <span className="text-[10px] text-neutral-500">
                        Batch will NOT be restocked. Parcel is discarded per kitchen hygiene standards.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${dispositionAction === 'non_sellable' ? 'border-amber-600 bg-amber-50/50' : 'border-neutral-200'}`}>
                    <input
                      type="radio"
                      name="disposition"
                      value="non_sellable"
                      checked={dispositionAction === 'non_sellable'}
                      onChange={() => setDispositionAction('non_sellable')}
                      className="mt-1 accent-amber-600"
                    />
                    <div>
                      <span className="font-bold text-black block">Mark Non-Sellable (Internal Analysis)</span>
                      <span className="text-[10px] text-neutral-500">
                        Item held for kitchen quality inspection or sample testing. Zero inventory restored.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${dispositionAction === 'approved_for_restock' ? 'border-emerald-600 bg-emerald-50/50' : 'border-neutral-200'}`}>
                    <input
                      type="radio"
                      name="disposition"
                      value="approved_for_restock"
                      checked={dispositionAction === 'approved_for_restock'}
                      onChange={() => setDispositionAction('approved_for_restock')}
                      className="mt-1 accent-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-black block">Approved for Restock (Explicit Exception)</span>
                      <span className="text-[10px] text-neutral-500">
                        Seals 100% intact, unopened outer container, verified by kitchen supervisor.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Inspection Notes & Sign-off *
                </label>
                <textarea
                  rows={3}
                  value={dispositionNotes}
                  onChange={(e) => setDispositionNotes(e.target.value)}
                  placeholder="Detail kitchen inspection observations (e.g., outer jar seal intact, temperature maintained)..."
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-medium bg-neutral-50 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispositionModal(false)}
                  className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl font-bold text-black transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispositionSubmitting}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl font-extrabold transition-all cursor-pointer shadow-subtle"
                >
                  {dispositionSubmitting ? 'Logging...' : 'Confirm Disposition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouse Pickup Location Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-modal text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-black" />
                <h3 className="text-lg font-black text-black">Warehouse Pickup Address</h3>
              </div>
              <button onClick={() => setShowPickupModal(false)} className="text-neutral-400 hover:text-black">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePickupLocation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-bold bg-neutral-50 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={pickupContact}
                    onChange={(e) => setPickupContact(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-bold bg-neutral-50 focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-mono text-xs font-bold bg-neutral-50 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-mono text-xs font-bold bg-neutral-50 focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                  Address Line
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-medium bg-neutral-50 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                    City
                  </label>
                  <input
                    type="text"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-bold bg-neutral-50 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold uppercase text-[10px] tracking-wider text-neutral-400">
                    State
                  </label>
                  <input
                    type="text"
                    value={pickupState}
                    onChange={(e) => setPickupState(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-bold bg-neutral-50 focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPickupModal(false)}
                  className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl font-bold text-black transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl font-extrabold transition-all cursor-pointer shadow-subtle"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-modal text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-black" />
                <h3 className="text-lg font-black text-black">Logistics Settings</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-neutral-400 hover:text-black">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black">Primary Logistics Partner</span>
                  <span className="font-extrabold font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded text-[10px]">
                    NimbusPost
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Provider adapter is in fail-closed scaffolding. API secrets must be set in secure server environment variables.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-black block">Manual Shipping Fallback</span>
                  <span className="text-[10px] text-neutral-500">Allows Admin dispatch with courier name and AWB</span>
                </div>
                <span className="text-emerald-700 font-extrabold font-mono text-xs">ENABLED</span>
              </div>

              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-black block">Automatic Shipment Creation</span>
                  <span className="text-[10px] text-neutral-500">Requires Admin review before dispatching food</span>
                </div>
                <span className="text-neutral-500 font-extrabold font-mono text-xs">DISABLED (Admin Controlled)</span>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl font-extrabold transition-all cursor-pointer shadow-subtle text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
