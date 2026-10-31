-- Staging only: mjnktiyufvzkibrsdxug. Generated from production catalog, no production rows.
BEGIN;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions, pg_catalog;
CREATE TABLE public."admin_profiles" (
 "id" uuid NOT NULL,
 "name" text NOT NULL,
 "role_title" text DEFAULT 'Store Manager'::text NOT NULL,
 "allowed_tabs" jsonb DEFAULT '["analytics", "products", "orders"]'::jsonb NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."admin_roles" (
 "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
 "user_id" uuid NOT NULL,
 "role" text NOT NULL,
 "status" text DEFAULT 'active'::text NOT NULL,
 "allowed_tabs" text[] DEFAULT ARRAY['analytics'::text, 'notifications'::text, 'products'::text, 'orders'::text, 'shipping'::text, 'banners'::text, 'bestsellers'::text, 'discounts'::text, 'settings'::text, 'newsletter'::text, 'profile'::text] NOT NULL,
 "permissions" text[] DEFAULT ARRAY['*'::text] NOT NULL,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."categories" (
 "id" text DEFAULT ('cat-'::text || (gen_random_uuid())::text) NOT NULL,
 "name" text NOT NULL,
 "slug" text NOT NULL,
 "image_url" text NOT NULL,
 "description" text,
 "display_order" integer DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."coupons" (
 "id" text DEFAULT ('cpn-'::text || (gen_random_uuid())::text) NOT NULL,
 "code" text NOT NULL,
 "description" text,
 "discount_type" text NOT NULL,
 "discount_value" numeric(10,2) NOT NULL,
 "min_order_amount" numeric(10,2) DEFAULT 0 NOT NULL,
 "applies_to" text DEFAULT 'all'::text NOT NULL,
 "target_category" text,
 "target_product_id" text,
 "expiry_date" timestamp with time zone,
 "is_enabled" boolean DEFAULT true NOT NULL,
 "usage_count" integer DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."customer_addresses" (
 "id" text DEFAULT ('loc-'::text || (gen_random_uuid())::text) NOT NULL,
 "user_id" uuid NOT NULL,
 "label" text DEFAULT 'Home'::text NOT NULL,
 "address_line" text NOT NULL,
 "city" text NOT NULL,
 "state" text DEFAULT 'Telangana'::text NOT NULL,
 "pincode" text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."delivery_cities" (
 "id" text DEFAULT ('city-'::text || (gen_random_uuid())::text) NOT NULL,
 "name" text NOT NULL,
 "state" text DEFAULT 'Telangana'::text NOT NULL,
 "charge" numeric(10,2) DEFAULT 0 NOT NULL,
 "free_delivery_threshold" numeric(10,2),
 "is_enabled" boolean DEFAULT true NOT NULL
);
CREATE TABLE public."header_announcements" (
 "id" text DEFAULT ('ann-'::text || (gen_random_uuid())::text) NOT NULL,
 "text" text NOT NULL,
 "is_enabled" boolean DEFAULT true NOT NULL,
 "display_order" integer DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."hero_banners" (
 "id" text DEFAULT ('banner-'::text || (gen_random_uuid())::text) NOT NULL,
 "image_url" text NOT NULL,
 "badge" text NOT NULL,
 "title" text NOT NULL,
 "subtitle" text NOT NULL,
 "cta_text" text DEFAULT 'Shop Now'::text NOT NULL,
 "cta_link" text DEFAULT '/'::text NOT NULL,
 "is_enabled" boolean DEFAULT true NOT NULL,
 "object_position" text DEFAULT 'center'::text,
 "object_fit" text DEFAULT 'cover'::text,
 "overlay_opacity" text DEFAULT 'medium'::text,
 "display_order" integer DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."home_section_products" (
 "section_id" text NOT NULL,
 "product_id" text NOT NULL
);
CREATE TABLE public."home_sections" (
 "id" text DEFAULT ('sec-'::text || (gen_random_uuid())::text) NOT NULL,
 "title" text NOT NULL,
 "subtitle" text,
 "badge" text,
 "category_filter" text DEFAULT 'all'::text,
 "is_enabled" boolean DEFAULT true NOT NULL,
 "display_order" integer DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."order_items" (
 "id" text DEFAULT ('oitem-'::text || (gen_random_uuid())::text) NOT NULL,
 "order_id" text NOT NULL,
 "product_id" text,
 "product_name_snapshot" text NOT NULL,
 "selected_weight" text NOT NULL,
 "unit_price" numeric(10,2) NOT NULL,
 "quantity" integer DEFAULT 1 NOT NULL
);
CREATE TABLE public."orders" (
 "id" text DEFAULT ('ord-'::text || (gen_random_uuid())::text) NOT NULL,
 "order_number" text NOT NULL,
 "tracking_code" text,
 "customer_id" uuid,
 "customer_name" text NOT NULL,
 "customer_phone" text NOT NULL,
 "customer_email" text NOT NULL,
 "delivery_address_json" jsonb NOT NULL,
 "subtotal" numeric(10,2) NOT NULL,
 "delivery_fee" numeric(10,2) DEFAULT 0 NOT NULL,
 "discount_amount" numeric(10,2) DEFAULT 0 NOT NULL,
 "grand_total" numeric(10,2) NOT NULL,
 "payment_method" text NOT NULL,
 "payment_status" text DEFAULT 'completed'::text NOT NULL,
 "order_status" text DEFAULT 'placed'::text NOT NULL,
 "admin_notes" text,
 "delivery_days" integer DEFAULT 3,
 "cancel_reason" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "shipped_at" timestamp with time zone,
 "delivered_at" timestamp with time zone
);
CREATE TABLE public."product_gallery" (
 "id" text DEFAULT ('gal-'::text || (gen_random_uuid())::text) NOT NULL,
 "product_id" text NOT NULL,
 "image_url" text NOT NULL,
 "is_main" boolean DEFAULT false NOT NULL,
 "display_order" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public."product_ingredients" (
 "id" text DEFAULT ('ing-'::text || (gen_random_uuid())::text) NOT NULL,
 "product_id" text NOT NULL,
 "ingredient_name" text NOT NULL,
 "display_order" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public."product_weight_options" (
 "id" text DEFAULT ('wopt-'::text || (gen_random_uuid())::text) NOT NULL,
 "product_id" text NOT NULL,
 "weight_label" text NOT NULL,
 "price" numeric(10,2) NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."products" (
 "id" text DEFAULT ('prod-'::text || (gen_random_uuid())::text) NOT NULL,
 "name" text NOT NULL,
 "slug" text NOT NULL,
 "category_id" text,
 "description" text NOT NULL,
 "is_veg" boolean DEFAULT true NOT NULL,
 "inventory_count" integer DEFAULT 100 NOT NULL,
 "out_of_stock" boolean DEFAULT false NOT NULL,
 "rating" numeric(3,2) DEFAULT 5.00 NOT NULL,
 "reviews_count" integer DEFAULT 1 NOT NULL,
 "is_bestseller" boolean DEFAULT false NOT NULL,
 "is_new_arrival" boolean DEFAULT false NOT NULL,
 "is_festival" boolean DEFAULT false NOT NULL,
 "discount_percentage" numeric(5,2) DEFAULT 0,
 "discount_expiry_date" timestamp with time zone,
 "grandma_story" text,
 "how_we_do_text" text,
 "sourcing_text" text,
 "quality_guarantee_text" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."profiles" (
 "id" uuid NOT NULL,
 "full_name" text NOT NULL,
 "phone_number" text,
 "avatar_url" text DEFAULT '/aishu-logo.jpg'::text,
 "role" text DEFAULT 'customer'::text NOT NULL,
 "joined_date" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."stock_history_logs" (
 "id" text DEFAULT ('log-'::text || (gen_random_uuid())::text) NOT NULL,
 "product_id" text NOT NULL,
 "product_name" text NOT NULL,
 "type" text NOT NULL,
 "quantity" integer NOT NULL,
 "note" text,
 "admin_name" text DEFAULT 'Store Admin'::text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."store_settings" (
 "id" text DEFAULT 'default'::text NOT NULL,
 "site_logo_url" text DEFAULT '/aishu-logo.jpg'::text,
 "header_settings_json" jsonb,
 "payment_enabled" boolean DEFAULT true NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);
ALTER TABLE public."admin_profiles" ADD CONSTRAINT "admin_profiles_pkey" PRIMARY KEY (id);
ALTER TABLE public."customer_addresses" ADD CONSTRAINT "customer_addresses_label_check" CHECK ((label = ANY (ARRAY['Home'::text, 'Work'::text, 'Other'::text])));
ALTER TABLE public."customer_addresses" ADD CONSTRAINT "customer_addresses_pkey" PRIMARY KEY (id);
ALTER TABLE public."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY (id);
ALTER TABLE public."categories" ADD CONSTRAINT "categories_name_key" UNIQUE (name);
ALTER TABLE public."categories" ADD CONSTRAINT "categories_slug_key" UNIQUE (slug);
ALTER TABLE public."products" ADD CONSTRAINT "products_inventory_count_check" CHECK ((inventory_count >= 0));
ALTER TABLE public."products" ADD CONSTRAINT "products_rating_check" CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)));
ALTER TABLE public."products" ADD CONSTRAINT "products_reviews_count_check" CHECK ((reviews_count >= 0));
ALTER TABLE public."products" ADD CONSTRAINT "products_discount_percentage_check" CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric)));
ALTER TABLE public."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY (id);
ALTER TABLE public."products" ADD CONSTRAINT "products_slug_key" UNIQUE (slug);
ALTER TABLE public."product_weight_options" ADD CONSTRAINT "product_weight_options_price_check" CHECK ((price >= (0)::numeric));
ALTER TABLE public."product_weight_options" ADD CONSTRAINT "product_weight_options_pkey" PRIMARY KEY (id);
ALTER TABLE public."product_gallery" ADD CONSTRAINT "product_gallery_pkey" PRIMARY KEY (id);
ALTER TABLE public."product_ingredients" ADD CONSTRAINT "product_ingredients_pkey" PRIMARY KEY (id);
ALTER TABLE public."orders" ADD CONSTRAINT "orders_subtotal_check" CHECK ((subtotal >= (0)::numeric));
ALTER TABLE public."orders" ADD CONSTRAINT "orders_delivery_fee_check" CHECK ((delivery_fee >= (0)::numeric));
ALTER TABLE public."orders" ADD CONSTRAINT "orders_discount_amount_check" CHECK ((discount_amount >= (0)::numeric));
ALTER TABLE public."orders" ADD CONSTRAINT "orders_grand_total_check" CHECK ((grand_total >= (0)::numeric));
ALTER TABLE public."orders" ADD CONSTRAINT "orders_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])));
ALTER TABLE public."orders" ADD CONSTRAINT "orders_order_status_check" CHECK ((order_status = ANY (ARRAY['placed'::text, 'pending'::text, 'confirmed'::text, 'processing'::text, 'ready_to_ship'::text, 'shipped'::text, 'out for delivery'::text, 'delivered'::text, 'cancelled'::text])));
ALTER TABLE public."orders" ADD CONSTRAINT "orders_delivery_days_check" CHECK ((delivery_days >= 0));
ALTER TABLE public."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY (id);
ALTER TABLE public."orders" ADD CONSTRAINT "orders_order_number_key" UNIQUE (order_number);
ALTER TABLE public."orders" ADD CONSTRAINT "orders_tracking_code_key" UNIQUE (tracking_code);
ALTER TABLE public."order_items" ADD CONSTRAINT "order_items_unit_price_check" CHECK ((unit_price >= (0)::numeric));
ALTER TABLE public."order_items" ADD CONSTRAINT "order_items_quantity_check" CHECK ((quantity > 0));
ALTER TABLE public."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY (id);
ALTER TABLE public."stock_history_logs" ADD CONSTRAINT "stock_history_logs_type_check" CHECK ((type = ANY (ARRAY['restock'::text, 'destock'::text])));
ALTER TABLE public."stock_history_logs" ADD CONSTRAINT "stock_history_logs_pkey" PRIMARY KEY (id);
ALTER TABLE public."home_sections" ADD CONSTRAINT "home_sections_pkey" PRIMARY KEY (id);
ALTER TABLE public."home_section_products" ADD CONSTRAINT "home_section_products_pkey" PRIMARY KEY (section_id, product_id);
ALTER TABLE public."hero_banners" ADD CONSTRAINT "hero_banners_pkey" PRIMARY KEY (id);
ALTER TABLE public."header_announcements" ADD CONSTRAINT "header_announcements_pkey" PRIMARY KEY (id);
ALTER TABLE public."coupons" ADD CONSTRAINT "coupons_discount_type_check" CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'flat'::text])));
ALTER TABLE public."coupons" ADD CONSTRAINT "coupons_discount_value_check" CHECK ((discount_value >= (0)::numeric));
ALTER TABLE public."coupons" ADD CONSTRAINT "coupons_min_order_amount_check" CHECK ((min_order_amount >= (0)::numeric));
ALTER TABLE public."coupons" ADD CONSTRAINT "coupons_applies_to_check" CHECK ((applies_to = ANY (ARRAY['all'::text, 'category'::text, 'product'::text])));
ALTER TABLE public."coupons" ADD CONSTRAINT "coupons_usage_count_check" CHECK ((usage_count >= 0));
ALTER TABLE public."coupons" ADD CONSTRAINT "coupons_pkey" PRIMARY KEY (id);
ALTER TABLE public."coupons" ADD CONSTRAINT "coupons_code_key" UNIQUE (code);
ALTER TABLE public."delivery_cities" ADD CONSTRAINT "delivery_cities_charge_check" CHECK ((charge >= (0)::numeric));
ALTER TABLE public."delivery_cities" ADD CONSTRAINT "delivery_cities_free_delivery_threshold_check" CHECK (((free_delivery_threshold IS NULL) OR (free_delivery_threshold >= (0)::numeric)));
ALTER TABLE public."delivery_cities" ADD CONSTRAINT "delivery_cities_pkey" PRIMARY KEY (id);
ALTER TABLE public."delivery_cities" ADD CONSTRAINT "delivery_cities_name_key" UNIQUE (name);
ALTER TABLE public."store_settings" ADD CONSTRAINT "store_settings_pkey" PRIMARY KEY (id);
ALTER TABLE public."admin_roles" ADD CONSTRAINT "admin_roles_role_check" CHECK ((role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sub_admin'::text])));
ALTER TABLE public."admin_roles" ADD CONSTRAINT "admin_roles_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'revoked'::text])));
ALTER TABLE public."admin_roles" ADD CONSTRAINT "admin_roles_pkey" PRIMARY KEY (id);
ALTER TABLE public."admin_roles" ADD CONSTRAINT "admin_roles_user_id_key" UNIQUE (user_id);
ALTER TABLE public."product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."admin_profiles" ADD CONSTRAINT "admin_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE public."product_weight_options" ADD CONSTRAINT "product_weight_options_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE public."product_gallery" ADD CONSTRAINT "product_gallery_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE public."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE public."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE public."home_section_products" ADD CONSTRAINT "home_section_products_section_id_fkey" FOREIGN KEY (section_id) REFERENCES home_sections(id) ON DELETE CASCADE;
ALTER TABLE public."home_section_products" ADD CONSTRAINT "home_section_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE public."coupons" ADD CONSTRAINT "coupons_target_product_id_fkey" FOREIGN KEY (target_product_id) REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE public."admin_roles" ADD CONSTRAINT "admin_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."admin_roles" ADD CONSTRAINT "admin_roles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX idx_admin_roles_user_id ON public.admin_roles USING btree (user_id);
CREATE INDEX idx_admin_roles_role ON public.admin_roles USING btree (role);
CREATE INDEX idx_customer_addresses_user_id ON public.customer_addresses USING btree (user_id);
CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);
CREATE INDEX idx_orders_tracking_code ON public.orders USING btree (tracking_code);
CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);
CREATE INDEX idx_home_section_products_product_id ON public.home_section_products USING btree (product_id);
CREATE INDEX idx_coupons_code ON public.coupons USING btree (code);
CREATE INDEX idx_products_slug ON public.products USING btree (slug);
CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);
CREATE INDEX idx_product_gallery_product_id ON public.product_gallery USING btree (product_id);
CREATE INDEX idx_product_weight_options_product_id ON public.product_weight_options USING btree (product_id);
CREATE INDEX idx_product_ingredients_product_id ON public.product_ingredients USING btree (product_id);
CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);
CREATE INDEX idx_stock_history_product_id ON public.stock_history_logs USING btree (product_id);
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER customer_addresses_updated_at BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER home_sections_updated_at BEFORE UPDATE ON public.home_sections FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
SELECT EXISTS(SELECT FROM public.admin_roles WHERE user_id=auth.uid() AND status='active' AND role IN ('admin','super_admin'));
$$;
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
SELECT EXISTS(SELECT FROM public.admin_roles WHERE user_id=auth.uid() AND status='active'
AND (role IN ('admin','super_admin') OR (role='sub_admin' AND p_permission=ANY(permissions))));
$$;
REVOKE ALL ON FUNCTION public.is_admin(),public.has_admin_permission(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(),public.has_admin_permission(text) TO authenticated,service_role;

ALTER TABLE public.admin_roles ALTER COLUMN permissions SET DEFAULT ARRAY[]::text[];
CREATE SEQUENCE public.order_number_seq START WITH 10001;
CREATE SEQUENCE public.tracking_code_seq START WITH 100001;
-- REVISED REVIEW ONLY. Fresh baseline; no remote execution authorized.

REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA public,extensions TO anon,authenticated,service_role;
DO $$ DECLARE t text; cols text; BEGIN
 FOREACH t IN ARRAY ARRAY['admin_profiles','admin_roles','profiles','categories','products','product_weight_options','coupons','orders','order_items','stock_history_logs'] LOOP
 IF EXISTS(SELECT FROM pg_policies WHERE schemaname='public' AND tablename=t) THEN
 RAISE EXCEPTION 'Unexpected policies on %; fresh baseline required',t; END IF;
 EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM PUBLIC,anon,authenticated',t);
 SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_attribute WHERE attrelid=format('public.%I',t)::regclass AND attnum>0 AND NOT attisdropped;
 EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON public.%I FROM PUBLIC,anon,authenticated',cols,t);
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 EXECUTE format('CREATE POLICY service_access ON public.%I FOR ALL TO service_role USING(true) WITH CHECK(true)',t);
 END LOOP;
END $$;
REVOKE ALL ON SEQUENCE order_number_seq,tracking_code_seq FROM PUBLIC,anon,authenticated;
GRANT USAGE,SELECT ON SEQUENCE order_number_seq,tracking_code_seq TO service_role;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
GRANT SELECT ON admin_profiles,admin_roles,profiles TO authenticated;
CREATE POLICY own_admin_profile ON admin_profiles FOR SELECT TO authenticated USING(id=auth.uid());
CREATE POLICY own_admin_role ON admin_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY own_profile_read ON profiles FOR SELECT TO authenticated USING(id=auth.uid());
GRANT UPDATE(full_name,phone_number,avatar_url) ON profiles TO authenticated;
CREATE POLICY own_profile_update ON profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
GRANT SELECT ON products TO anon,authenticated;
CREATE POLICY catalog_read ON products FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON products TO authenticated;
CREATE POLICY admin_insert ON products FOR INSERT TO authenticated WITH CHECK(public.has_admin_permission('products.write'));
CREATE POLICY admin_update ON products FOR UPDATE TO authenticated USING(public.has_admin_permission('products.write')) WITH CHECK(public.has_admin_permission('products.write'));
CREATE POLICY admin_delete ON products FOR DELETE TO authenticated USING(public.has_admin_permission('products.write'));
GRANT SELECT ON product_weight_options TO anon,authenticated;
CREATE POLICY catalog_read ON product_weight_options FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON product_weight_options TO authenticated;
CREATE POLICY admin_insert ON product_weight_options FOR INSERT TO authenticated WITH CHECK(public.has_admin_permission('products.write'));
CREATE POLICY admin_update ON product_weight_options FOR UPDATE TO authenticated USING(public.has_admin_permission('products.write')) WITH CHECK(public.has_admin_permission('products.write'));
CREATE POLICY admin_delete ON product_weight_options FOR DELETE TO authenticated USING(public.has_admin_permission('products.write'));
GRANT SELECT ON categories TO anon,authenticated;
CREATE POLICY catalog_read ON categories FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON categories TO authenticated;
CREATE POLICY admin_insert ON categories FOR INSERT TO authenticated WITH CHECK(public.has_admin_permission('categories.write'));
CREATE POLICY admin_update ON categories FOR UPDATE TO authenticated USING(public.has_admin_permission('categories.write')) WITH CHECK(public.has_admin_permission('categories.write'));
CREATE POLICY admin_delete ON categories FOR DELETE TO authenticated USING(public.has_admin_permission('categories.write'));
GRANT SELECT ON coupons TO anon,authenticated;
CREATE POLICY catalog_read ON coupons FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON coupons TO authenticated;
CREATE POLICY admin_insert ON coupons FOR INSERT TO authenticated WITH CHECK(public.has_admin_permission('discounts.write'));
CREATE POLICY admin_update ON coupons FOR UPDATE TO authenticated USING(public.has_admin_permission('discounts.write')) WITH CHECK(public.has_admin_permission('discounts.write'));
CREATE POLICY admin_delete ON coupons FOR DELETE TO authenticated USING(public.has_admin_permission('discounts.write'));
GRANT SELECT,INSERT,UPDATE,DELETE ON orders TO authenticated;
CREATE POLICY order_read ON orders FOR SELECT TO authenticated USING(customer_id=auth.uid() OR public.has_admin_permission('orders.read'));
CREATE POLICY admin_insert ON orders FOR INSERT TO authenticated WITH CHECK(public.has_admin_permission('orders.write'));
CREATE POLICY admin_update ON orders FOR UPDATE TO authenticated USING(public.has_admin_permission('orders.write')) WITH CHECK(public.has_admin_permission('orders.write'));
CREATE POLICY admin_delete ON orders FOR DELETE TO authenticated USING(public.has_admin_permission('orders.write'));
GRANT SELECT,INSERT,UPDATE,DELETE ON order_items TO authenticated;
CREATE POLICY order_read ON order_items FOR SELECT TO authenticated USING(EXISTS(SELECT FROM public.orders o WHERE o.id=order_items.order_id AND o.customer_id=auth.uid()) OR public.has_admin_permission('orders.read'));
CREATE POLICY admin_insert ON order_items FOR INSERT TO authenticated WITH CHECK(public.has_admin_permission('orders.write'));
CREATE POLICY admin_update ON order_items FOR UPDATE TO authenticated USING(public.has_admin_permission('orders.write')) WITH CHECK(public.has_admin_permission('orders.write'));
CREATE POLICY admin_delete ON order_items FOR DELETE TO authenticated USING(public.has_admin_permission('orders.write'));
GRANT SELECT,INSERT ON stock_history_logs TO authenticated;
CREATE POLICY stock_read ON stock_history_logs FOR SELECT TO authenticated USING(public.has_admin_permission('inventory.read'));
CREATE POLICY stock_append ON stock_history_logs FOR INSERT TO authenticated WITH CHECK(public.has_admin_permission('inventory.write'));
-- Product inventory updates require products.write; inventory.write permits append-only logs.


REVOKE ALL ON public."customer_addresses" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."customer_addresses" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."customer_addresses" TO service_role;
CREATE POLICY service_access ON public."customer_addresses" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.customer_addresses TO authenticated;
CREATE POLICY own_address ON public.customer_addresses FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
REVOKE ALL ON public."home_section_products" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."home_section_products" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."home_section_products" TO service_role;
CREATE POLICY service_access ON public."home_section_products" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT ON public."home_section_products" TO anon,authenticated;
CREATE POLICY catalog_read ON public."home_section_products" FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON public."home_section_products" TO authenticated;
CREATE POLICY staff_write ON public."home_section_products" FOR ALL TO authenticated USING(public.has_admin_permission('banners.write')) WITH CHECK(public.has_admin_permission('banners.write'));
REVOKE ALL ON public."delivery_cities" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."delivery_cities" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."delivery_cities" TO service_role;
CREATE POLICY service_access ON public."delivery_cities" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT ON public."delivery_cities" TO anon,authenticated;
CREATE POLICY catalog_read ON public."delivery_cities" FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON public."delivery_cities" TO authenticated;
CREATE POLICY staff_write ON public."delivery_cities" FOR ALL TO authenticated USING(public.has_admin_permission('settings.write')) WITH CHECK(public.has_admin_permission('settings.write'));
REVOKE ALL ON public."product_gallery" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."product_gallery" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."product_gallery" TO service_role;
CREATE POLICY service_access ON public."product_gallery" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT ON public."product_gallery" TO anon,authenticated;
CREATE POLICY catalog_read ON public."product_gallery" FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON public."product_gallery" TO authenticated;
CREATE POLICY staff_write ON public."product_gallery" FOR ALL TO authenticated USING(public.has_admin_permission('products.write')) WITH CHECK(public.has_admin_permission('products.write'));
REVOKE ALL ON public."product_ingredients" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."product_ingredients" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."product_ingredients" TO service_role;
CREATE POLICY service_access ON public."product_ingredients" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT ON public."product_ingredients" TO anon,authenticated;
CREATE POLICY catalog_read ON public."product_ingredients" FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON public."product_ingredients" TO authenticated;
CREATE POLICY staff_write ON public."product_ingredients" FOR ALL TO authenticated USING(public.has_admin_permission('products.write')) WITH CHECK(public.has_admin_permission('products.write'));
REVOKE ALL ON public."home_sections" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."home_sections" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."home_sections" TO service_role;
CREATE POLICY service_access ON public."home_sections" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT ON public."home_sections" TO anon,authenticated;
CREATE POLICY catalog_read ON public."home_sections" FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON public."home_sections" TO authenticated;
CREATE POLICY staff_write ON public."home_sections" FOR ALL TO authenticated USING(public.has_admin_permission('banners.write')) WITH CHECK(public.has_admin_permission('banners.write'));
REVOKE ALL ON public."hero_banners" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."hero_banners" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."hero_banners" TO service_role;
CREATE POLICY service_access ON public."hero_banners" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT ON public."hero_banners" TO anon,authenticated;
CREATE POLICY catalog_read ON public."hero_banners" FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON public."hero_banners" TO authenticated;
CREATE POLICY staff_write ON public."hero_banners" FOR ALL TO authenticated USING(public.has_admin_permission('banners.write')) WITH CHECK(public.has_admin_permission('banners.write'));
REVOKE ALL ON public."header_announcements" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."header_announcements" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."header_announcements" TO service_role;
CREATE POLICY service_access ON public."header_announcements" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT ON public."header_announcements" TO anon,authenticated;
CREATE POLICY catalog_read ON public."header_announcements" FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON public."header_announcements" TO authenticated;
CREATE POLICY staff_write ON public."header_announcements" FOR ALL TO authenticated USING(public.has_admin_permission('banners.write')) WITH CHECK(public.has_admin_permission('banners.write'));
REVOKE ALL ON public."store_settings" FROM PUBLIC,anon,authenticated;
ALTER TABLE public."store_settings" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."store_settings" TO service_role;
CREATE POLICY service_access ON public."store_settings" FOR ALL TO service_role USING(true) WITH CHECK(true);
GRANT SELECT ON public."store_settings" TO anon,authenticated;
CREATE POLICY catalog_read ON public."store_settings" FOR SELECT TO anon,authenticated USING(true);
GRANT INSERT,UPDATE,DELETE ON public."store_settings" TO authenticated;
CREATE POLICY staff_write ON public."store_settings" FOR ALL TO authenticated USING(public.has_admin_permission('settings.write')) WITH CHECK(public.has_admin_permission('settings.write'));
CREATE OR REPLACE FUNCTION public.get_current_admin_identity()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_role_row RECORD;
    v_email TEXT;
    v_full_name TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
    SELECT full_name INTO v_full_name FROM public.profiles WHERE id = auth.uid();

    SELECT role, status, allowed_tabs, permissions, created_at
    INTO v_role_row
    FROM public.admin_roles
    WHERE user_id = auth.uid();

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    IF v_role_row.status <> 'active' THEN
        RETURN jsonb_build_object(
            'user_id', auth.uid(),
            'email', v_email,
            'role', v_role_row.role,
            'status', v_role_row.status,
            'is_active', false,
            'error', 'Account is suspended or revoked'
        );
    END IF;

    RETURN jsonb_build_object(
        'user_id', auth.uid(),
        'email', v_email,
        'name', COALESCE(v_full_name, split_part(v_email, '@', 1)),
        'role', v_role_row.role,
        'status', v_role_row.status,
        'is_active', true,
        'allowed_tabs', v_role_row.allowed_tabs,
        'permissions', v_role_row.permissions,
        'created_at', v_role_row.created_at
    );
END;
$function$
;
REVOKE ALL ON FUNCTION public.get_current_admin_identity() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_current_admin_identity() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO pg_catalog, public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      'Customer'
    ),
    NEW.raw_user_meta_data ->> 'phone_number',
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      '/aishu-logo.jpg'
    ),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$
;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
COMMIT;
