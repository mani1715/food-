export interface DbProfile {
  id: string; // Auth User ID
  full_name: string | null;
  phone_number: string | null;
  role: string; // 'customer' | 'admin'
  created_at: string;
  updated_at: string;
}

export interface DbAdminProfile {
  id: string; // Auth User ID
  name: string;
  role_title: string;
  allowed_tabs: string[]; // e.g. ["orders", "products", "inventory", "analytics"]
  created_at: string;
  updated_at: string;
}

export interface DbAdminRole {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'sub_admin';
  status: 'active' | 'suspended' | 'revoked';
  allowed_tabs: string[];
  permissions?: string[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAuditLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DbCustomerAddress {
  id: string;
  user_id: string;
  label: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string;
  is_veg: boolean;
  inventory_count: number;
  out_of_stock: boolean;
  rating: number;
  reviews_count: number;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_festival: boolean;
  grandma_story: string | null;
  how_we_do_text: string | null;
  sourcing_text: string | null;
  quality_guarantee_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProductWeightOption {
  id: string;
  product_id: string;
  weight_label: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface DbProductGallery {
  id: string;
  product_id: string;
  image_url: string;
  is_main: boolean;
  display_order: number;
  created_at: string;
}

export interface DbProductIngredient {
  id: string;
  product_id: string;
  ingredient_name: string;
  display_order: number;
}

export interface DbOrder {
  id: string;
  order_number: string;
  tracking_code: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address_json: Record<string, any>;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  applied_coupon_code?: string | null;
  applied_offer_title?: string | null;
  free_gift_snapshot?: string | null;
  idempotency_key?: string | null;
  cancel_reason?: string | null;
  admin_notes?: string | null;
  created_at: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  selected_weight: string;
  unit_price: number;
  quantity: number;
  line_total?: number;
  is_free_gift?: boolean;
}

export interface DbStockHistoryLog {
  id: string;
  product_id: string;
  product_name: string;
  type: 'restock' | 'destock';
  quantity: number;
  note: string | null;
  admin_name: string | null;
  created_at: string;
}

export interface DbHomeSection {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  category_filter: string | null;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbHomeSectionProduct {
  section_id: string;
  product_id: string;
}

export interface DbHeroBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  is_enabled: boolean;
  object_position: string | null;
  object_fit: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbHeaderAnnouncement {
  id: string;
  text: string;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbCoupon {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_amount: number;
  applies_to?: 'all' | 'category' | 'product';
  target_category?: string | null;
  target_product_id?: string | null;
  max_discount?: number | null;
  max_usage_limit?: number | null;
  usage_count: number;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCartOffer {
  id: string;
  title: string;
  description: string | null;
  offer_type: 'percentage' | 'flat' | 'free_shipping' | 'free_gift';
  discount_value: number;
  min_cart_value: number;
  min_cart_quantity?: number | null;
  max_discount?: number | null;
  free_gift_item_name?: string | null;
  badge_text?: string | null;
  expiry_date?: string | null;
  is_active: boolean;
  auto_apply: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbStoreSettings {
  id: string;
  site_logo_url: string | null;
  header_settings_json: Record<string, any> | null;
  delivery_cities_json: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
