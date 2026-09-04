import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/ProductCard';
import { BuyAlsoSection } from '../../components/BuyAlsoSection';
import { Heart, Plus, Minus, Star, ShieldCheck, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, wishlistProductIds, toggleWishlist } = useApp();

  const product = products.find((p) => p.id === id) || products[0];
  const isWishlisted = wishlistProductIds.includes(product.id);

  const [selectedWeight, setSelectedWeight] = useState(product.defaultWeight || product.weightOptions[0]?.weight);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [showLightbox, setShowLightbox] = useState(false);

  const selectedOption = product.weightOptions.find((w) => w.weight === selectedWeight) || product.weightOptions[0];
  const currentPrice = selectedOption ? selectedOption.price : product.price;

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const galleryImages = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];

  const handleBuyNow = () => {
    addToCart(product, selectedWeight, quantity);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-12">
      
      {/* Top Back Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">{product.category}</span>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div
            onClick={() => setShowLightbox(true)}
            className="relative rounded-3xl overflow-hidden aspect-square border border-neutral-200 bg-neutral-100 cursor-zoom-in group shadow-subtle"
          >
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <span className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
              Click to Enlarge 🔍
            </span>
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImage === img ? 'border-black shadow-subtle' : 'border-neutral-200 opacity-60'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Specs & Actions */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">{product.category}</span>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-black">
                <Star className="w-4 h-4 fill-black text-black" />
                <span>{product.rating}</span>
                <span className="text-neutral-400 font-normal">({product.reviewsCount} reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">{product.name}</h1>
            <p className="text-2xl font-black font-mono text-black">₹{currentPrice * quantity}</p>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{product.description}</p>

          {/* Weight Options Selector */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-500">
              Select Package Weight
            </label>
            <div className="flex flex-wrap gap-2">
              {product.weightOptions.map((opt) => (
                <button
                  key={opt.weight}
                  onClick={() => setSelectedWeight(opt.weight)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    selectedWeight === opt.weight
                      ? 'bg-black text-white border-black shadow-subtle'
                      : 'bg-white text-black border-neutral-200 hover:border-black'
                  }`}
                >
                  <span>{opt.weight}</span>
                  <span className="font-mono text-[11px] opacity-80">₹{opt.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Checklist */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                Ingredients & Recipe
              </label>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((ing, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-medium border border-neutral-200">
                    ✓ {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls & Actions */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase text-neutral-500">Quantity</span>
              <div className="flex items-center border border-neutral-300 rounded-2xl p-1 bg-neutral-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-black hover:bg-neutral-200 rounded-xl cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-xs font-mono font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-black hover:bg-neutral-200 rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => addToCart(product, selectedWeight, quantity)}
                className="flex-1 py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add To Cart • ₹{currentPrice * quantity}</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-4 bg-white border-2 border-black text-black text-xs font-extrabold rounded-2xl hover:bg-neutral-100 transition-all cursor-pointer"
              >
                Buy Now
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isWishlisted ? 'bg-black text-white border-black' : 'border-neutral-200 text-black hover:border-black'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500 font-semibold pt-2">
            <ShieldCheck className="w-4 h-4 text-black shrink-0" />
            <span>Thermal Sealed Hygienic Packaging • 100% Homemade Guarantee</span>
          </div>

        </div>

      </div>

      {/* 2. GRANDMA SAYS... HERITAGE MEMORY STORY BLOCK */}
      <section className="mt-12 pt-8 border-t border-neutral-200">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-4 text-left relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-neutral-200 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-subtle">
              👵
            </div>
            <div>
              <h3 className="text-xl font-black text-black tracking-tight font-serif">Grandma says...</h3>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Authentic Family Memories & Heritage Taste</span>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed space-y-3 font-sans italic pt-1">
            {product.grandmaStory ? (
              <div className="whitespace-pre-line not-italic">{product.grandmaStory}</div>
            ) : (
              <>
                <p>
                  "I was about 9 then. I hurriedly finished my lunch with freshly prepared Avakaya and rushed to the river bank behind my house. My friends were waiting for me.<br />
                  “What took you so long?” asked Adilakshmi.<br />
                  I said “Avakaya”, with a blissful expression on.<br />
                  “With Mudda Pappu*?” asked Balli, a lot of happiness with a hint of jealousy was written all over his face.<br />
                  “Yesss” I said as if I won a prize in school.<br />
                  Such is the taste of Avakaya that it makes everyone feel excited."
                </p>
                <p>
                  "It is always a moment of celebration during the summer when nanna used to get fresh juicy mangoes from Nuziveedu especially for Avakaya. My grandmother would sit in the courtyard mixing the mango pieces and all other ingredients to prepare the magic. My brother, sister and I used to hover around watching the entire process with total awe."
                </p>
                <p className="text-[11px] font-mono font-bold text-neutral-500 not-italic pt-2 border-t border-neutral-200">
                  * Mudda Pappu - A traditional lentil preparation made with Red Gram.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. Buy These Products Also Section (Frequently Bought Together Bundle) */}
      <BuyAlsoSection currentProduct={product} />

      {/* 4. RECOMMENDED PRODUCTS FOR YOU */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-neutral-200 text-left">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Handcrafted Recommendations</span>
              <h3 className="text-2xl font-black text-black tracking-tight mt-0.5">Recommended Products For You</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (
          <div
            onClick={() => setShowLightbox(false)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={activeImage}
              alt={product.name}
              className="max-w-4xl max-h-[85vh] object-contain rounded-2xl shadow-modal"
            />
          </div>
        )}
      </AnimatePresence>

      {/* Sticky Mobile Purchase Bar */}
      <div className="fixed bottom-14 left-0 right-0 z-40 bg-white border-t border-neutral-200 p-3 lg:hidden flex items-center justify-between shadow-modal">
        <div>
          <p className="text-[10px] text-neutral-400 font-bold uppercase">{selectedWeight}</p>
          <p className="text-base font-extrabold font-mono text-black">₹{currentPrice * quantity}</p>
        </div>
        <button
          onClick={() => addToCart(product, selectedWeight, quantity)}
          className="px-6 py-3 bg-black text-white text-xs font-bold rounded-xl shadow-subtle flex items-center gap-1.5 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add To Cart</span>
        </button>
      </div>

    </div>
  );
};
