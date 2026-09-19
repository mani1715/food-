-- ==============================================================================
-- MIGRATION 003: AISHU HOME FOODS — ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- This migration enables Row Level Security on all application tables and
-- defines explicit, granular access control policies.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------------------------
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


-- ------------------------------------------------------------------------------
-- 2. CATALOG & PUBLIC STOREFRONT POLICIES
-- ------------------------------------------------------------------------------

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

-- PRODUCT WEIGHT OPTIONS
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

-- HOME SECTIONS & SECTION PRODUCTS
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

-- COUPONS (Public reads active coupons; Admins manage all coupons)
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


-- ------------------------------------------------------------------------------
-- 3. CUSTOMER DATA POLICIES (Profiles & Addresses)
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- 4. ORDER & ORDER ITEM POLICIES (Privacy & Anti-Enumeration)
-- ------------------------------------------------------------------------------

-- ORDERS:
-- 1. Customers can view only their own orders.
-- 2. Staff/Admins can view and manage all orders.
-- 3. Order insertion is allowed during checkout.
-- 4. Public broad SELECT is strictly blocked.
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


-- ------------------------------------------------------------------------------
-- 5. ADMIN ROLES, AUDIT LOGS & STOCK LOG POLICIES
-- ------------------------------------------------------------------------------

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

-- AUDIT LOGS (Immutable Action Trail)
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

-- No UPDATE or DELETE policies on audit_logs -> Ensures complete immutability

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
