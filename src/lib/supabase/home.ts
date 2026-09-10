import { supabase } from './client';
import { HomeSection, HeroBannerSlide, HeaderAnnouncement, Coupon, HeaderSettings } from '../../types';
import { DbHomeSection, DbHeroBanner, DbHeaderAnnouncement, DbCoupon, DbStoreSettings } from './types';

export const fetchHomeSections = async (): Promise<HomeSection[]> => {
  const { data: dbSections, error } = await supabase
    .from('home_sections')
    .select(`
      *,
      home_section_products ( product_id )
    `)
    .order('display_order', { ascending: true });

  if (error) {
    console.warn('Error fetching home sections from Supabase:', error.message);
    return [];
  }

  if (!dbSections) return [];

  return dbSections.map((sec: any) => ({
    id: sec.id,
    title: sec.title,
    subtitle: sec.subtitle || undefined,
    badge: sec.badge || undefined,
    productIds: (sec.home_section_products || []).map((p: any) => p.product_id),
    categoryFilter: sec.category_filter || 'all',
    enabled: sec.is_enabled,
  }));
};

export const fetchHeroBanners = async (): Promise<HeroBannerSlide[]> => {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.warn('Error fetching hero banners from Supabase:', error.message);
    return [];
  }

  if (!data) return [];

  return data.map((b: DbHeroBanner) => ({
    id: b.id,
    image: b.image_url,
    badge: b.badge,
    title: b.title,
    subtitle: b.subtitle,
    ctaText: b.cta_text,
    ctaLink: b.cta_link,
    enabled: b.is_enabled,
    objectPosition: (b.object_position as any) || 'center',
    objectFit: (b.object_fit as any) || 'cover',
  }));
};

export const fetchHeaderAnnouncements = async (): Promise<HeaderAnnouncement[]> => {
  const { data, error } = await supabase
    .from('header_announcements')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.warn('Error fetching header announcements:', error.message);
    return [];
  }

  if (!data) return [];

  return data.map((a: DbHeaderAnnouncement) => ({
    id: a.id,
    text: a.text,
    enabled: a.is_enabled,
  }));
};

export const fetchCoupons = async (): Promise<Coupon[]> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching coupons:', error.message);
    return [];
  }

  if (!data) return [];

  return data.map((c: DbCoupon) => ({
    id: c.id,
    code: c.code,
    description: `Discount coupon for ${c.code}`,
    discountType: c.discount_type,
    discountValue: Number(c.discount_value),
    minOrderAmount: Number(c.min_order_amount || 0),
    appliesTo: 'all',
    expiryDate: c.expiry_date || undefined,
    enabled: c.is_active,
    usageCount: c.usage_count || 0,
  }));
};

export const fetchStoreSettings = async (): Promise<{ logoUrl: string | null; headerSettings: HeaderSettings | null }> => {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  if (error || !data) {
    return { logoUrl: null, headerSettings: null };
  }

  return {
    logoUrl: data.site_logo_url,
    headerSettings: data.header_settings_json as HeaderSettings,
  };
};

export const saveStoreSettingsInDb = async (siteLogoUrl?: string, headerSettings?: HeaderSettings) => {
  const payload: Partial<DbStoreSettings> = {
    id: 'default',
    updated_at: new Date().toISOString(),
  };
  if (siteLogoUrl !== undefined) payload.site_logo_url = siteLogoUrl;
  if (headerSettings !== undefined) payload.header_settings_json = headerSettings;

  const { error } = await supabase.from('store_settings').upsert([payload]);
  if (error) console.warn('Could not save store settings to Supabase:', error.message);
};
