-- ==============================================================================
-- AISHU HOME FOODS — PHASE 1 COMPLETE SECURITY HARDENING SCRIPT
-- (CONTAINS MIGRATIONS 001, 002, 003, and 004 COMBINED)
-- Run this in your Supabase SQL Editor to apply the full Phase 1 foundation.
-- ==============================================================================

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- PART 1: TABLES & DATABASE CONSTRAINTS
-- ==============================================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADMIN ROLES
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'sub_admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    allowed_tabs JSONB NOT NULL DEFAULT '["products", "orders", "inventory", "categories"]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON public.admin_roles(role);

-- 3. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 4. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL CHECK (length(pincode) >= 5 AND length(pincode) <= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    image_scale NUMERIC DEFAULT 1,
    pan_offset_x NUMERIC DEFAULT 0,
    pan_offset_y NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order ASC);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    is_veg BOOLEAN NOT NULL DEFAULT true,
    inventory_count INT NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
    out_of_stock BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5.0),
    reviews_count INT NOT NULL DEFAULT 1 CHECK (reviews_count >= 0),
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    is_festival BOOLEAN NOT NULL DEFAULT false,
    grandma_story TEXT,
    how_we_do_text TEXT,
    sourcing_text TEXT,
    quality_guarantee_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_out_of_stock ON public.products(out_of_stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 7. PRODUCT WEIGHT OPTIONS
CREATE TABLE IF NOT EXISTS public.product_weight_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    weight_label TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_weight_options_product_id ON public.product_weight_options(product_id);

-- 8. PRODUCT GALLERY
CREATE TABLE IF NOT EXISTS public.product_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_main BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_gallery_product_id ON public.product_gallery(product_id);

-- 9. PRODUCT INGREDIENTS
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0 CHECK (display_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_product_ingredients_product_id ON public.product_ingredients(product_id);

-- 10. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    tracking_code TEXT UNIQUE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    delivery_address_json JSONB NOT NULL,
    subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    grand_total NUMERIC NOT NULL CHECK (grand_total >= 0),
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'authorized', 'paid', 'failed', 'refunded', 'cod')),
    order_status TEXT NOT NULL DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out for delivery', 'delivered', 'cancelled')),
    cancel_reason TEXT,
    admin_notes TEXT,
    delivery_days INT DEFAULT 3 CHECK (delivery_days >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status, payment_status);

-- 11. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    selected_weight TEXT NOT NULL,
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 12. STOCK HISTORY LOGS
CREATE TABLE IF NOT EXISTS public.stock_history_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('restock', 'destock')),
    quantity INT NOT NULL CHECK (quantity > 0),
    previous_stock INT CHECK (previous_stock >= 0),
    new_stock INT CHECK (new_stock >= 0),
    note TEXT,
    admin_name TEXT NOT NULL DEFAULT 'Store Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_history_logs_product_id ON public.stock_history_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_logs_created_at ON public.stock_history_logs(created_at DESC);

-- 13. HOME SECTIONS & SECTION PRODUCTS
CREATE TABLE IF NOT EXISTS public.home_sections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT,
    category_filter TEXT NOT NULL DEFAULT 'all',
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_sections_order ON public.home_sections(display_order ASC);

CREATE TABLE IF NOT EXISTS public.home_section_products (
    section_id TEXT NOT NULL REFERENCES public.home_sections(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    PRIMARY KEY (section_id, product_id)
);

-- 14. HERO BANNERS & HEADER ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT,
    image_url TEXT NOT NULL,
    cta_text TEXT NOT NULL DEFAULT 'Shop Now',
    cta_link TEXT NOT NULL DEFAULT '/products',
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    object_position TEXT DEFAULT 'center',
    object_fit TEXT DEFAULT 'cover',
    image_scale NUMERIC DEFAULT 1,
    pan_offset_x NUMERIC DEFAULT 0,
    pan_offset_y NUMERIC DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_banners_order ON public.hero_banners(display_order ASC);

CREATE TABLE IF NOT EXISTS public.header_announcements (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
    usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_coupon_percentage CHECK (discount_type != 'percentage' OR discount_value <= 100)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- 16. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    site_logo_url TEXT,
    header_settings_json JSONB,
    delivery_cities_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==============================================================================
-- PART 2: FUNCTIONS, RPCS & ATOMIC INVENTORY
-- ==============================================================================

-- 1. RBAC HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_roles
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role IN ('admin', 'super_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_roles
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role = 'super_admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_roles
        WHERE user_id = auth.uid()
          AND status = 'active'
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_super() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_super() TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, anon;

-- 2. ATOMIC INVENTORY FUNCTIONS
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    p_product_id TEXT,
    p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INT;
    v_new_stock INT;
    v_is_out BOOLEAN;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid decrement quantity');
    END IF;

    SELECT inventory_count INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient stock',
            'available_stock', v_current_stock,
            'requested_qty', p_quantity
        );
    END IF;

    v_new_stock := v_current_stock - p_quantity;
    v_is_out := (v_new_stock <= 0);

    UPDATE public.products
    SET inventory_count = v_new_stock,
        out_of_stock = v_is_out,
        updated_at = NOW()
    WHERE id = p_product_id;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'out_of_stock', v_is_out
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.restock_product_stock(
    p_product_id TEXT,
    p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INT;
    v_new_stock INT;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid restock quantity');
    END IF;

    IF NOT public.is_staff() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
    END IF;

    SELECT inventory_count INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    v_new_stock := v_current_stock + p_quantity;

    UPDATE public.products
    SET inventory_count = v_new_stock,
        out_of_stock = false,
        updated_at = NOW()
    WHERE id = p_product_id;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'out_of_stock', false
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(TEXT, INT) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.restock_product_stock(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restock_product_stock(TEXT, INT) TO authenticated, service_role;

-- 3. AUDIT LOGGING FUNCTION
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_log_id UUID;
    v_actor_email TEXT;
BEGIN
    SELECT email INTO v_actor_email FROM auth.users WHERE id = auth.uid();

    INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        action,
        entity,
        entity_id,
        metadata,
        created_at
    ) VALUES (
        auth.uid(),
        v_actor_email,
        p_action,
        p_entity,
        p_entity_id,
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- 4. RESTRICTED ORDER TRACKING RPC
CREATE OR REPLACE FUNCTION public.get_order_tracking_status(
    p_order_query TEXT,
    p_verification TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_clean_query TEXT;
    v_clean_verify TEXT;
BEGIN
    v_clean_query := TRIM(UPPER(p_order_query));
    v_clean_verify := TRIM(LOWER(COALESCE(p_verification, '')));

    IF v_clean_query IS NULL OR LENGTH(v_clean_query) < 4 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid search query');
    END IF;

    SELECT
        id,
        order_number,
        tracking_code,
        order_status,
        payment_status,
        payment_method,
        subtotal,
        delivery_fee,
        discount_amount,
        grand_total,
        delivery_days,
        created_at,
        shipped_at,
        delivered_at,
        customer_phone,
        customer_email
    INTO v_order
    FROM public.orders
    WHERE order_number = v_clean_query
       OR tracking_code = v_clean_query
       OR id = p_order_query
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    IF v_clean_verify <> '' THEN
        IF NOT (
            LOWER(v_order.customer_email) = v_clean_verify OR
            RIGHT(REGEXP_REPLACE(v_order.customer_phone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(v_clean_verify, '\D', '', 'g'), 10)
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Order details could not be verified');
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_number', v_order.order_number,
        'tracking_code', v_order.tracking_code,
        'order_status', v_order.order_status,
        'payment_status', v_order.payment_status,
        'payment_method', v_order.payment_method,
        'subtotal', v_order.subtotal,
        'delivery_fee', v_order.delivery_fee,
        'discount', v_order.discount_amount,
        'grand_total', v_order.grand_total,
        'delivery_days', v_order.delivery_days,
        'created_at', v_order.created_at,
        'shipped_at', v_order.shipped_at,
        'delivered_at', v_order.delivered_at
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_order_tracking_status(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_tracking_status(TEXT, TEXT) TO anon, authenticated, service_role;


-- ==============================================================================
-- PART 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_weight_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_section_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.header_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- CATEGORIES
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
    ON public.categories FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- PRODUCTS
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- WEIGHT OPTIONS
DROP POLICY IF EXISTS "Public can view weight options" ON public.product_weight_options;
CREATE POLICY "Public can view weight options"
    ON public.product_weight_options FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage weight options" ON public.product_weight_options;
CREATE POLICY "Admins can manage weight options"
    ON public.product_weight_options FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- PRODUCT GALLERY
DROP POLICY IF EXISTS "Public can view product gallery" ON public.product_gallery;
CREATE POLICY "Public can view product gallery"
    ON public.product_gallery FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage product gallery" ON public.product_gallery;
CREATE POLICY "Admins can manage product gallery"
    ON public.product_gallery FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- PRODUCT INGREDIENTS
DROP POLICY IF EXISTS "Public can view product ingredients" ON public.product_ingredients;
CREATE POLICY "Public can view product ingredients"
    ON public.product_ingredients FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage product ingredients" ON public.product_ingredients;
CREATE POLICY "Admins can manage product ingredients"
    ON public.product_ingredients FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- HOME SECTIONS
DROP POLICY IF EXISTS "Public can view home sections" ON public.home_sections;
CREATE POLICY "Public can view home sections"
    ON public.home_sections FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage home sections" ON public.home_sections;
CREATE POLICY "Admins can manage home sections"
    ON public.home_sections FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

DROP POLICY IF EXISTS "Public can view section products" ON public.home_section_products;
CREATE POLICY "Public can view section products"
    ON public.home_section_products FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage section products" ON public.home_section_products;
CREATE POLICY "Admins can manage section products"
    ON public.home_section_products FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- HERO BANNERS
DROP POLICY IF EXISTS "Public can view hero banners" ON public.hero_banners;
CREATE POLICY "Public can view hero banners"
    ON public.hero_banners FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage hero banners" ON public.hero_banners;
CREATE POLICY "Admins can manage hero banners"
    ON public.hero_banners FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- HEADER ANNOUNCEMENTS
DROP POLICY IF EXISTS "Public can view header announcements" ON public.header_announcements;
CREATE POLICY "Public can view header announcements"
    ON public.header_announcements FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage header announcements" ON public.header_announcements;
CREATE POLICY "Admins can manage header announcements"
    ON public.header_announcements FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- STORE SETTINGS
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings"
    ON public.store_settings FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage store settings" ON public.store_settings;
CREATE POLICY "Admins can manage store settings"
    ON public.store_settings FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- COUPONS
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
    ON public.coupons FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = 'customer');

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin_or_super())
    WITH CHECK (public.is_admin_or_super());

-- CUSTOMER ADDRESSES
DROP POLICY IF EXISTS "Users can view own addresses" ON public.customer_addresses;
CREATE POLICY "Users can view own addresses"
    ON public.customer_addresses FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users can manage own addresses"
    ON public.customer_addresses FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_super())
    WITH CHECK (user_id = auth.uid() OR public.is_admin_or_super());

-- ORDERS
DROP POLICY IF EXISTS "Customers and admins can view orders" ON public.orders;
CREATE POLICY "Customers and admins can view orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "Checkout can insert orders" ON public.orders;
CREATE POLICY "Checkout can insert orders"
    ON public.orders FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        subtotal >= 0 AND
        grand_total >= 0 AND
        delivery_fee >= 0 AND
        discount_amount >= 0
    );

DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Super admins can delete orders" ON public.orders;
CREATE POLICY "Super admins can delete orders"
    ON public.orders FOR DELETE
    TO authenticated
    USING (public.is_super_admin());

-- ORDER ITEMS
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND (o.customer_id = auth.uid() OR public.is_staff())
        )
    );

DROP POLICY IF EXISTS "Checkout can insert order items" ON public.order_items;
CREATE POLICY "Checkout can insert order items"
    ON public.order_items FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        quantity > 0 AND
        unit_price >= 0
    );

DROP POLICY IF EXISTS "Staff can manage order items" ON public.order_items;
CREATE POLICY "Staff can manage order items"
    ON public.order_items FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- ADMIN ROLES
DROP POLICY IF EXISTS "Staff can view admin roles" ON public.admin_roles;
CREATE POLICY "Staff can view admin roles"
    ON public.admin_roles FOR SELECT
    TO authenticated
    USING (public.is_staff());

DROP POLICY IF EXISTS "Super admins can manage admin roles" ON public.admin_roles;
CREATE POLICY "Super admins can manage admin roles"
    ON public.admin_roles FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- AUDIT LOGS
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
CREATE POLICY "Staff can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_staff());

DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- STOCK HISTORY LOGS
DROP POLICY IF EXISTS "Staff can view stock logs" ON public.stock_history_logs;
CREATE POLICY "Staff can view stock logs"
    ON public.stock_history_logs FOR SELECT
    TO authenticated
    USING (public.is_staff());

DROP POLICY IF EXISTS "Staff can insert stock logs" ON public.stock_history_logs;
CREATE POLICY "Staff can insert stock logs"
    ON public.stock_history_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

COMMIT;
