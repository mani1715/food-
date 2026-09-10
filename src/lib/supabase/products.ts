import { supabase } from './client';
import { Product, ProductCategory, WeightOption } from '../../types';
import { DbProduct, DbCategory, DbProductWeightOption, DbProductGallery, DbProductIngredient } from './types';

// Transform DB representations into full frontend Product interface
export const mapDbProductToProduct = (
  dbProd: DbProduct,
  categoryName: string = 'General',
  weightOptions: WeightOption[] = [],
  gallery: string[] = [],
  ingredients: string[] = []
): Product => {
  const defaultWeight = weightOptions[0]?.weight || '500g';
  const price = weightOptions[0]?.price || 299;

  return {
    id: dbProd.id,
    name: dbProd.name,
    category: categoryName,
    price,
    rating: dbProd.rating || 5.0,
    reviewsCount: dbProd.reviews_count || 1,
    image: gallery[0] || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
    gallery: gallery.length > 0 ? gallery : [gallery[0] || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop'],
    description: dbProd.description,
    ingredients: ingredients.length > 0 ? ingredients : undefined,
    weightOptions: weightOptions.length > 0 ? weightOptions : [{ weight: '500g', price: 299 }],
    defaultWeight,
    isVeg: dbProd.is_veg,
    isBestSeller: dbProd.is_bestseller,
    isNewArrival: dbProd.is_new_arrival,
    isFestival: dbProd.is_festival,
    inventoryCount: dbProd.inventory_count,
    outOfStock: dbProd.out_of_stock || dbProd.inventory_count <= 0,
    inStock: !dbProd.out_of_stock && dbProd.inventory_count > 0,
    grandmaStory: dbProd.grandma_story || undefined,
    howWeDoText: dbProd.how_we_do_text || undefined,
    sourcingText: dbProd.sourcing_text || undefined,
    qualityGuaranteeText: dbProd.quality_guarantee_text || undefined,
  };
};

export const fetchAllCategories = async (): Promise<ProductCategory[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.warn('Error fetching categories from Supabase:', error.message);
    return [];
  }

  return (data || []).map((c: DbCategory) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    itemCount: 0,
    image: c.image_url || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
    description: c.description || '',
  }));
};

export const fetchAllProducts = async (): Promise<Product[]> => {
  const { data: dbProducts, error: prodErr } = await supabase
    .from('products')
    .select(`
      *,
      categories ( name ),
      product_weight_options ( weight_label, price ),
      product_gallery ( image_url, is_main, display_order ),
      product_ingredients ( ingredient_name, display_order )
    `)
    .order('created_at', { ascending: false });

  if (prodErr) {
    console.warn('Error fetching products from Supabase:', prodErr.message);
    return [];
  }

  if (!dbProducts) return [];

  return dbProducts.map((p: any) => {
    const catName = p.categories?.name || 'General';

    const weightOpts: WeightOption[] = (p.product_weight_options || []).map((w: any) => ({
      weight: w.weight_label,
      price: Number(w.price),
    }));

    const galleryImgs: string[] = (p.product_gallery || [])
      .sort((a: any, b: any) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0) || a.display_order - b.display_order)
      .map((g: any) => g.image_url);

    const ings: string[] = (p.product_ingredients || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((i: any) => i.ingredient_name);

    return mapDbProductToProduct(p, catName, weightOpts, galleryImgs, ings);
  });
};

export const createProductInDb = async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
  const prodId = product.id || `prod-${Date.now()}`;
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // 1. Fetch category ID if exists
  const { data: catData } = await supabase
    .from('categories')
    .select('id')
    .eq('name', product.category)
    .maybeSingle();

  const categoryId = catData ? catData.id : null;

  // 2. Insert main product row
  const { error: prodErr } = await supabase.from('products').insert([
    {
      id: prodId,
      name: product.name,
      slug,
      category_id: categoryId,
      description: product.description,
      is_veg: product.isVeg,
      inventory_count: product.inventoryCount ?? 100,
      out_of_stock: Boolean(product.outOfStock),
      rating: product.rating || 5.0,
      reviews_count: product.reviewsCount || 1,
      is_bestseller: Boolean(product.isBestSeller),
      is_new_arrival: Boolean(product.isNewArrival),
      is_festival: Boolean(product.isFestival),
      grandma_story: product.grandmaStory || null,
      how_we_do_text: product.howWeDoText || null,
      sourcing_text: product.sourcingText || null,
      quality_guarantee_text: product.qualityGuaranteeText || null,
    },
  ]);

  if (prodErr) throw prodErr;

  // 3. Insert weight options
  if (product.weightOptions && product.weightOptions.length > 0) {
    const weightRows = product.weightOptions.map((w) => ({
      product_id: prodId,
      weight_label: w.weight,
      price: w.price,
    }));
    await supabase.from('product_weight_options').insert(weightRows);
  }

  // 4. Insert gallery images
  if (product.gallery && product.gallery.length > 0) {
    const galleryRows = product.gallery.map((url, idx) => ({
      product_id: prodId,
      image_url: url,
      is_main: idx === 0,
      display_order: idx,
    }));
    await supabase.from('product_gallery').insert(galleryRows);
  }

  // 5. Insert ingredients
  if (product.ingredients && product.ingredients.length > 0) {
    const ingRows = product.ingredients.map((ing, idx) => ({
      product_id: prodId,
      ingredient_name: ing,
      display_order: idx,
    }));
    await supabase.from('product_ingredients').insert(ingRows);
  }

  return { ...product, id: prodId };
};

export const updateProductInDb = async (id: string, updated: Partial<Product>) => {
  const payload: Partial<DbProduct> = {};
  if (updated.name !== undefined) payload.name = updated.name;
  if (updated.description !== undefined) payload.description = updated.description;
  if (updated.isVeg !== undefined) payload.is_veg = updated.isVeg;
  if (updated.inventoryCount !== undefined) payload.inventory_count = updated.inventoryCount;
  if (updated.outOfStock !== undefined) payload.out_of_stock = updated.outOfStock;
  if (updated.rating !== undefined) payload.rating = updated.rating;
  if (updated.reviewsCount !== undefined) payload.reviews_count = updated.reviewsCount;
  if (updated.isBestSeller !== undefined) payload.is_bestseller = updated.isBestSeller;
  if (updated.isNewArrival !== undefined) payload.is_new_arrival = updated.isNewArrival;
  if (updated.isFestival !== undefined) payload.is_festival = updated.isFestival;
  if (updated.grandmaStory !== undefined) payload.grandma_story = updated.grandmaStory;
  if (updated.howWeDoText !== undefined) payload.how_we_do_text = updated.howWeDoText;
  if (updated.sourcingText !== undefined) payload.sourcing_text = updated.sourcingText;
  if (updated.qualityGuaranteeText !== undefined) payload.quality_guarantee_text = updated.qualityGuaranteeText;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) throw error;
  }

  // Weight options update if provided
  if (updated.weightOptions) {
    await supabase.from('product_weight_options').delete().eq('product_id', id);
    const rows = updated.weightOptions.map((w) => ({
      product_id: id,
      weight_label: w.weight,
      price: w.price,
    }));
    await supabase.from('product_weight_options').insert(rows);
  }

  // Gallery images update if provided
  if (updated.gallery) {
    await supabase.from('product_gallery').delete().eq('product_id', id);
    const galleryRows = updated.gallery.map((url, idx) => ({
      product_id: id,
      image_url: url,
      is_main: idx === 0,
      display_order: idx,
    }));
    await supabase.from('product_gallery').insert(galleryRows);
  }

  // Ingredients update if provided
  if (updated.ingredients) {
    await supabase.from('product_ingredients').delete().eq('product_id', id);
    const ingRows = updated.ingredients.map((ing, idx) => ({
      product_id: id,
      ingredient_name: ing,
      display_order: idx,
    }));
    await supabase.from('product_ingredients').insert(ingRows);
  }
};

export const deleteProductFromDb = async (id: string) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

export const createCategoryInDb = async (name: string, image?: string, description?: string): Promise<ProductCategory> => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const catId = `cat-${Date.now()}`;

  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        id: catId,
        name,
        slug,
        image_url: image || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
        description: description || `Authentic handcrafted homemade ${name}.`,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    itemCount: 0,
    image: data.image_url || '',
    description: data.description || '',
  };
};

export const updateCategoryInDb = async (id: string, updated: Partial<ProductCategory>) => {
  const payload: Partial<DbCategory> = {};
  if (updated.name !== undefined) payload.name = updated.name;
  if (updated.image !== undefined) payload.image_url = updated.image;
  if (updated.description !== undefined) payload.description = updated.description;
  if (Object.keys(payload).length > 0) {
    const { error } = await supabase.from('categories').update(payload).eq('id', id);
    if (error) throw error;
  }
};

export const deleteCategoryFromDb = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};
