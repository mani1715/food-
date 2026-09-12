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

  return data.map((b: any) => ({
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
    imageScale: b.image_scale !== undefined && b.image_scale !== null ? Number(b.image_scale) : (b.imageScale !== undefined ? Number(b.imageScale) : 1),
    panOffsetX: b.pan_offset_x !== undefined && b.pan_offset_x !== null ? Number(b.pan_offset_x) : (b.panOffsetX !== undefined ? Number(b.panOffsetX) : 0),
    panOffsetY: b.pan_offset_y !== undefined && b.pan_offset_y !== null ? Number(b.pan_offset_y) : (b.panOffsetY !== undefined ? Number(b.panOffsetY) : 0),
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

export const saveHomeSectionInDb = async (section: HomeSection, displayOrder = 0) => {
  const { error: secErr } = await supabase.from('home_sections').upsert([
    {
      id: section.id,
      title: section.title,
      subtitle: section.subtitle || null,
      badge: section.badge || null,
      category_filter: section.categoryFilter || 'all',
      is_enabled: section.enabled,
      display_order: displayOrder,
    },
  ]);

  if (secErr) {
    console.warn('Error saving home section in Supabase:', secErr.message);
    return;
  }

  // Sync assigned product IDs in home_section_products
  await supabase.from('home_section_products').delete().eq('section_id', section.id);

  if (section.productIds && section.productIds.length > 0) {
    const productRows = section.productIds.map((prodId, idx) => ({
      section_id: section.id,
      product_id: prodId,
      display_order: idx,
    }));
    await supabase.from('home_section_products').insert(productRows);
  }
};

export const deleteHomeSectionFromDb = async (id: string) => {
  await supabase.from('home_section_products').delete().eq('section_id', id);
  await supabase.from('home_sections').delete().eq('id', id);
};

export const saveHeroBannersInDb = async (banners: HeroBannerSlide[]) => {
  for (let idx = 0; idx < banners.length; idx++) {
    const b = banners[idx];
    const payload: any = {
      id: b.id,
      image_url: b.image,
      badge: b.badge || null,
      title: b.title,
      subtitle: b.subtitle || null,
      cta_text: b.ctaText || 'Shop Now',
      cta_link: b.ctaLink || '/products',
      is_enabled: b.enabled,
      display_order: idx,
      object_position: b.objectPosition || 'center',
      object_fit: b.objectFit || 'cover',
      image_scale: b.imageScale ?? 1,
      pan_offset_x: b.panOffsetX ?? 0,
      pan_offset_y: b.panOffsetY ?? 0,
    };
    const { error } = await supabase.from('hero_banners').upsert([payload]);
    if (error) {
      delete payload.image_scale;
      delete payload.pan_offset_x;
      delete payload.pan_offset_y;
      await supabase.from('hero_banners').upsert([payload]);
    }
  }
};

