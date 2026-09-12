import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HeroBannerSlide, HeaderAnnouncement, CustomHeaderMenuItem, HeaderSubMenuItem } from '../../types';
import {
  Image as ImageIcon,
  Volume2,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  Menu,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Search,
  Heart,
  User,
  Package,
  ShoppingBag,
  RotateCcw,
  Layers,
  Tag,
} from 'lucide-react';
import { DragDropImagePicker } from './DragDropImagePicker';

export const BannersManagementTab: React.FC = () => {
  const {
    heroBanners,
    headerAnnouncements,
    headerSettings,
    categories,
    products,
    addHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    addHeaderAnnouncement,
    updateHeaderAnnouncement,
    deleteHeaderAnnouncement,
    updateHeaderSettings,
  } = useApp();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'banners' | 'top_rotating' | 'marquee' | 'categories' | 'icons'>('banners');

  // Modal / Form state for Hero Banners
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<Omit<HeroBannerSlide, 'id'>>({
    title: '',
    subtitle: '',
    badge: 'FRESH HOMEMADE',
    image: '',
    ctaText: 'Shop Collection',
    ctaLink: '/products',
    enabled: true,
  });

  // State for Top Rotating Announcements
  const [newTopAnnText, setNewTopAnnText] = useState('');
  const [editingTopAnnId, setEditingTopAnnId] = useState<string | null>(null);
  const [editingTopAnnText, setEditingTopAnnText] = useState('');

  // Form state for Marquee Announcements
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [editingAnnText, setEditingAnnText] = useState('');

  // Modal / Form state for Header Categories Menu Manager
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState<{
    label: string;
    path: string;
    isSpecial: boolean;
    subCategories: HeaderSubMenuItem[];
  }>({
    label: '',
    path: '/products',
    isSpecial: false,
    subCategories: [],
  });

  // Sub-category form picker
  const [subItemType, setSubItemType] = useState<'category' | 'product' | 'custom'>('category');
  const [selectedCatName, setSelectedCatName] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [customSubLabel, setCustomSubLabel] = useState('');
  const [customSubPath, setCustomSubPath] = useState('');

  // Open modal for new banner
  const handleOpenAddBanner = () => {
    setEditingBannerId(null);
    setBannerForm({
      title: '',
      subtitle: '',
      badge: 'LIMITED TIME OFFER',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1200&auto=format&fit=crop',
      ctaText: 'Explore Now',
      ctaLink: '/products',
      enabled: true,
      objectPosition: 'center',
      objectFit: 'cover',
      overlayOpacity: 'dark',
    });
    setShowBannerModal(true);
  };

  // Open modal for editing banner
  const handleOpenEditBanner = (banner: HeroBannerSlide) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      badge: banner.badge,
      image: banner.image,
      ctaText: banner.ctaText,
      ctaLink: banner.ctaLink,
      enabled: banner.enabled,
      objectPosition: banner.objectPosition || 'center',
      objectFit: banner.objectFit || 'cover',
      overlayOpacity: banner.overlayOpacity || 'dark',
    });
    setShowBannerModal(true);
  };

  // Submit banner form
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim() || !bannerForm.image.trim()) return;

    if (editingBannerId) {
      updateHeroBanner(editingBannerId, bannerForm);
    } else {
      addHeroBanner(bannerForm);
    }

    setShowBannerModal(false);
    setEditingBannerId(null);
  };

  // Top Rotating Announcements Handlers
  const currentTopAnnouncements = headerSettings?.topRotatingAnnouncements || [
    { id: 'top-1', text: '🌶️ Fresh Homemade Andhra Pickles Delivered Daily Nationwide', enabled: true },
    { id: 'top-2', text: '🍯 Pure Ghee Sweets & Authentic Delicacies Crafted with Love', enabled: true },
    { id: 'top-3', text: '🎁 Festival Gift Boxes & Return Gift Hampers Special Discount', enabled: true },
    { id: 'top-4', text: '✨ Free Shipping On Orders Above ₹499 • Fresh Batch Guarantee', enabled: true },
  ];

  const handleAddTopAnn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopAnnText.trim()) return;
    const newItem: HeaderAnnouncement = {
      id: `top-${Date.now()}`,
      text: newTopAnnText.trim(),
      enabled: true,
    };
    const updated = [...currentTopAnnouncements, newItem];
    updateHeaderSettings({ topRotatingAnnouncements: updated });
    setNewTopAnnText('');
  };

  const handleToggleTopAnn = (id: string) => {
    const updated = currentTopAnnouncements.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    updateHeaderSettings({ topRotatingAnnouncements: updated });
  };

  const handleDeleteTopAnn = (id: string) => {
    const updated = currentTopAnnouncements.filter((a) => a.id !== id);
    updateHeaderSettings({ topRotatingAnnouncements: updated });
  };

  const handleSaveEditTopAnn = (id: string) => {
    if (!editingTopAnnText.trim()) return;
    const updated = currentTopAnnouncements.map((a) =>
      a.id === id ? { ...a, text: editingTopAnnText.trim() } : a
    );
    updateHeaderSettings({ topRotatingAnnouncements: updated });
    setEditingTopAnnId(null);
    setEditingTopAnnText('');
  };

  // Marquee Announcement Handlers
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    addHeaderAnnouncement(newAnnouncementText.trim());
    setNewAnnouncementText('');
  };

  const handleStartEditAnn = (ann: HeaderAnnouncement) => {
    setEditingAnnId(ann.id);
    setEditingAnnText(ann.text);
  };

  const handleSaveEditAnn = (id: string) => {
    if (!editingAnnText.trim()) return;
    updateHeaderAnnouncement(id, { text: editingAnnText.trim() });
    setEditingAnnId(null);
    setEditingAnnText('');
  };

  // -------------------------------------------------------------
  // HEADER CATEGORIES & MENU MANAGER
  // -------------------------------------------------------------
  const defaultMenuItems: CustomHeaderMenuItem[] = [
    ...(categories || []).map((cat, index) => ({
      id: `menu-cat-${cat.id || index}`,
      label: cat.name.toUpperCase(),
      path: `/products?category=${encodeURIComponent(cat.name)}`,
      enabled: !(headerSettings?.disabledCategoryNames || []).includes(cat.name),
      order: index,
      subCategories: [
        {
          id: `sub-all-${cat.id || index}`,
          label: `All ${cat.name} Collection`,
          path: `/products?category=${encodeURIComponent(cat.name)}`,
          type: 'category' as const,
        },
      ],
    })),
    {
      id: 'menu-bestsellers',
      label: 'BEST SELLERS',
      path: '/products',
      enabled: true,
      order: 100,
      subCategories: [
        { id: 'sub-top-rated', label: 'Top Rated Items ⭐', path: '/products', type: 'custom' },
        { id: 'sub-grandma-sp', label: 'Grandma Specials 📜', path: '/products', type: 'custom' },
      ],
    },
    {
      id: 'menu-offers',
      label: 'OFFERS & SPECIALS',
      path: '/products?filter=new-arrivals',
      isSpecial: true,
      enabled: true,
      order: 101,
      subCategories: [
        { id: 'sub-af05', label: 'Use Code AF05 (5% OFF) 🎉', path: '/products', type: 'custom' },
        { id: 'sub-new', label: 'New Arrivals ✨', path: '/products?filter=new-arrivals', type: 'custom' },
        { id: 'sub-gift', label: 'Festival Gift Hampers 🎁', path: '/products?category=Gift%20Boxes', type: 'custom' },
      ],
    },
    {
      id: 'menu-process',
      label: 'OUR PROCESS',
      path: '/our-process',
      enabled: true,
      order: 102,
      subCategories: [
        { id: 'sub-grandma-proc', label: '5-Step Grandma Process 📜', path: '/our-process', type: 'custom' },
        { id: 'sub-sourcing', label: 'Regional Farm Sourcing 📍', path: '/sourcing', type: 'custom' },
        { id: 'sub-quality', label: '0% Preservative Guarantee 🛡️', path: '/quality-promise', type: 'custom' },
      ],
    },
  ];

  const currentMenuItems: CustomHeaderMenuItem[] =
    headerSettings?.customMenuItems && headerSettings.customMenuItems.length > 0
      ? headerSettings.customMenuItems
      : defaultMenuItems;

  const handleOpenAddMenu = () => {
    setEditingMenuId(null);
    setMenuForm({
      label: '',
      path: '/products',
      isSpecial: false,
      subCategories: [],
    });
    setSubItemType('category');
    setShowMenuModal(true);
  };

  const handleOpenEditMenu = (menu: CustomHeaderMenuItem) => {
    setEditingMenuId(menu.id);
    setMenuForm({
      label: menu.label,
      path: menu.path,
      isSpecial: !!menu.isSpecial,
      subCategories: menu.subCategories ? [...menu.subCategories] : [],
    });
    setSubItemType('category');
    setShowMenuModal(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.label.trim()) return;

    if (editingMenuId) {
      const updated = currentMenuItems.map((item) =>
        item.id === editingMenuId
          ? {
              ...item,
              label: menuForm.label.trim().toUpperCase(),
              path: menuForm.path.trim(),
              isSpecial: menuForm.isSpecial,
              subCategories: menuForm.subCategories,
            }
          : item
      );
      updateHeaderSettings({ customMenuItems: updated });
    } else {
      const newItem: CustomHeaderMenuItem = {
        id: `menu-custom-${Date.now()}`,
        label: menuForm.label.trim().toUpperCase(),
        path: menuForm.path.trim(),
        isSpecial: menuForm.isSpecial,
        subCategories: menuForm.subCategories,
        enabled: true,
        order: currentMenuItems.length,
      };
      const updated = [...currentMenuItems, newItem];
      updateHeaderSettings({ customMenuItems: updated });
    }

    setShowMenuModal(false);
    setEditingMenuId(null);
  };

  const handleToggleMenu = (id: string) => {
    const updated = currentMenuItems.map((item) =>
      item.id === id ? { ...item, enabled: item.enabled === false ? true : false } : item
    );
    updateHeaderSettings({ customMenuItems: updated });
  };

  const handleDeleteMenu = (id: string) => {
    const updated = currentMenuItems.filter((item) => item.id !== id);
    updateHeaderSettings({ customMenuItems: updated });
  };

  const handleMoveMenu = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentMenuItems.length) return;

    const list = [...currentMenuItems];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    updateHeaderSettings({ customMenuItems: list });
  };

  const handleResetMenus = () => {
    if (confirm('Reset header category menus back to the default store categories and special links?')) {
      updateHeaderSettings({ customMenuItems: defaultMenuItems });
    }
  };

  // Sub-items builder actions
  const handleAddSubItem = () => {
    if (subItemType === 'category') {
      const cat = categories.find((c) => c.name === selectedCatName) || categories[0];
      if (!cat) return;
      const subItem: HeaderSubMenuItem = {
        id: `sub-${Date.now()}`,
        label: `${cat.name} Collection`,
        path: `/products?category=${encodeURIComponent(cat.name)}`,
        type: 'category',
        targetId: cat.name,
      };
      setMenuForm((prev) => ({ ...prev, subCategories: [...prev.subCategories, subItem] }));
    } else if (subItemType === 'product') {
      const prod = products.find((p) => p.id === selectedProdId) || products[0];
      if (!prod) return;
      const subItem: HeaderSubMenuItem = {
        id: `sub-${Date.now()}`,
        label: prod.name,
        path: `/product/${prod.id}`,
        type: 'product',
        targetId: prod.id,
      };
      setMenuForm((prev) => ({ ...prev, subCategories: [...prev.subCategories, subItem] }));
    } else {
      if (!customSubLabel.trim() || !customSubPath.trim()) return;
      const subItem: HeaderSubMenuItem = {
        id: `sub-${Date.now()}`,
        label: customSubLabel.trim(),
        path: customSubPath.trim(),
        type: 'custom',
      };
      setMenuForm((prev) => ({ ...prev, subCategories: [...prev.subCategories, subItem] }));
      setCustomSubLabel('');
      setCustomSubPath('');
    }
  };

  const handleRemoveSubItem = (subId: string) => {
    setMenuForm((prev) => ({
      ...prev,
      subCategories: prev.subCategories.filter((s) => s.id !== subId),
    }));
  };

  return (
    <div className="space-y-8 text-left">
      {/* HEADER CONTROLS NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200">
        <button
          onClick={() => setActiveSubTab('banners')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'banners' ? 'bg-black text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Homepage Hero Banners</span>
        </button>

        <button
          onClick={() => setActiveSubTab('top_rotating')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'top_rotating' ? 'bg-black text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Top Rotating Bar (Changing Text)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('marquee')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'marquee' ? 'bg-black text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Marquee Scrolling Ticker</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'categories' ? 'bg-black text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span>Header Categories & Menus</span>
        </button>

        <button
          onClick={() => setActiveSubTab('icons')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'icons' ? 'bg-black text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Header Action Icons</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. HOMEPAGE HERO BANNERS */}
      {/* ============================================================== */}
      {activeSubTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-black" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Homepage Hero Banners</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                Auto-scrolls smoothly on the Customer Homepage with full-bleed scenic view.
              </p>
            </div>

            <button
              onClick={handleOpenAddBanner}
              className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Hero Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {heroBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`bg-white border rounded-3xl overflow-hidden shadow-subtle transition-all ${
                  banner.enabled ? 'border-neutral-200 hover:border-black' : 'border-neutral-200 opacity-60 bg-neutral-50'
                }`}
              >
                <div className="relative h-48 bg-neutral-900 overflow-hidden">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover opacity-85"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-black text-[10px] font-black uppercase tracking-wider rounded-full">
                        {banner.badge || `Slide #${index + 1}`}
                      </span>

                      <button
                        onClick={() => updateHeroBanner(banner.id, { enabled: !banner.enabled })}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                          banner.enabled ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {banner.enabled ? (
                          <>
                            <Eye className="w-3 h-3 text-white" /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Hidden
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-white text-base font-extrabold line-clamp-1">{banner.title}</h3>
                      <p className="text-neutral-300 text-xs line-clamp-1">{banner.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white flex items-center justify-between gap-2 border-t border-neutral-100">
                  <div className="text-[11px] text-neutral-500 truncate">
                    <span className="font-semibold text-black">Button:</span> {banner.ctaText} ({banner.ctaLink})
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditBanner(banner)}
                      className="p-2 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Edit Banner"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteHeroBanner(banner.id)}
                      className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TOP ROTATING ANNOUNCEMENT BAR (CHANGING TEXT AT VERY TOP) */}
      {/* ============================================================== */}
      {activeSubTab === 'top_rotating' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-black" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Top Rotating Announcement Bar</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Manage the text lines that rotate one by one at the very top of the website (above the header).
              </p>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200">
              <span className="text-xs font-extrabold text-neutral-800">Show Top Rotating Bar:</span>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showTopRotatingBar: headerSettings?.showTopRotatingBar === false ? true : false,
                  })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  headerSettings?.showTopRotatingBar !== false
                    ? 'bg-black text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showTopRotatingBar !== false ? 'Active (ON)' : 'Hidden (OFF)'}
              </button>
            </div>
          </div>

          {/* Add New Top Announcement Form */}
          <form onSubmit={handleAddTopAnn} className="flex gap-2 max-w-2xl">
            <input
              type="text"
              placeholder="e.g. 🍯 Pure Ghee Sweets & Authentic Delicacies Crafted with Love"
              value={newTopAnnText}
              onChange={(e) => setNewTopAnnText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newTopAnnText.trim()}
              className="px-5 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Top Text</span>
            </button>
          </form>

          {/* Top Announcements List */}
          <div className="space-y-3 max-w-3xl">
            {currentTopAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  ann.enabled !== false ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                {editingTopAnnId === ann.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTopAnnText}
                      onChange={(e) => setEditingTopAnnText(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      onClick={() => handleSaveEditTopAnn(ann.id)}
                      className="p-2 bg-black text-white rounded-xl text-xs hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingTopAnnId(null)}
                      className="p-2 bg-neutral-200 text-neutral-700 rounded-xl text-xs hover:bg-neutral-300 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 text-xs font-semibold text-neutral-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>{ann.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleTopAnn(ann.id)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                      ann.enabled !== false ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {ann.enabled !== false ? 'Enabled' : 'Disabled'}
                  </button>

                  {editingTopAnnId !== ann.id && (
                    <button
                      onClick={() => {
                        setEditingTopAnnId(ann.id);
                        setEditingTopAnnText(ann.text);
                      }}
                      className="p-2 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Edit Text"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTopAnn(ann.id)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Delete Text"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MARQUEE SCROLLING TICKER */}
      {/* ============================================================== */}
      {activeSubTab === 'marquee' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-black" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Marquee Scrolling Ticker</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Manage the animated scrolling marquee ticker above the navigation header.
              </p>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200">
              <span className="text-xs font-extrabold text-neutral-800">Show Marquee Ticker:</span>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showMarqueeTicker: headerSettings?.showMarqueeTicker === false ? true : false,
                  })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  headerSettings?.showMarqueeTicker !== false
                    ? 'bg-black text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showMarqueeTicker !== false ? 'Active (ON)' : 'Hidden (OFF)'}
              </button>
            </div>
          </div>

          {/* Add Announcement Input Form */}
          <form onSubmit={handleAddAnnouncement} className="flex gap-2 max-w-2xl">
            <input
              type="text"
              placeholder="e.g. ⚡ Use Code AF05 & get 5% additional discount on your First Purchase!"
              value={newAnnouncementText}
              onChange={(e) => setNewAnnouncementText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newAnnouncementText.trim()}
              className="px-5 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Marquee Text</span>
            </button>
          </form>

          {/* Announcement List */}
          <div className="space-y-3 max-w-3xl">
            {headerAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  ann.enabled ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                {editingAnnId === ann.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingAnnText}
                      onChange={(e) => setEditingAnnText(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      onClick={() => handleSaveEditAnn(ann.id)}
                      className="p-2 bg-black text-white rounded-xl text-xs hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingAnnId(null)}
                      className="p-2 bg-neutral-200 text-neutral-700 rounded-xl text-xs hover:bg-neutral-300 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 text-xs font-semibold text-neutral-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                    <span>{ann.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateHeaderAnnouncement(ann.id, { enabled: !ann.enabled })}
                    className={`px-3 py-1 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                      ann.enabled ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {ann.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  {editingAnnId !== ann.id && (
                    <button
                      onClick={() => handleStartEditAnn(ann)}
                      className="p-2 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Edit Announcement"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteHeaderAnnouncement(ann.id)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. HEADER CATEGORIES & CUSTOM MENUS MANAGER */}
      {/* ============================================================== */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-black" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Header Navigation & Categories Manager</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Customize, add, remove, and reorder category links in the header. Create custom items like <strong>Special Offers</strong> and select which categories or products appear in their dropdowns!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResetMenus}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer border border-neutral-300"
                title="Reset to default store categories"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={handleOpenAddMenu}
                className="px-4 py-2 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Header Category / Menu</span>
              </button>
            </div>
          </div>

          {/* Menus List */}
          <div className="space-y-3">
            {currentMenuItems.map((menu, index) => (
              <div
                key={menu.id}
                className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  menu.enabled !== false
                    ? 'bg-white border-neutral-200 shadow-sm hover:border-black'
                    : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                {/* Menu Info */}
                <div className="flex items-start sm:items-center gap-3">
                  {/* Reorder Arrows */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveMenu(index, 'up')}
                      className="p-1 text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === currentMenuItems.length - 1}
                      onClick={() => handleMoveMenu(index, 'down')}
                      className="p-1 text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-neutral-900 tracking-wider">
                        {menu.label}
                      </span>
                      {menu.isSpecial && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full">
                          Special Badge
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 font-medium">
                      Link: <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">{menu.path}</code> • Dropdown Sub-Items:{' '}
                      <span className="font-bold text-black">{menu.subCategories?.length || 0}</span>
                    </p>

                    {/* Sub-items preview pills */}
                    {menu.subCategories && menu.subCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {menu.subCategories.map((sub) => (
                          <span
                            key={sub.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-semibold text-neutral-700"
                          >
                            <Tag className="w-2.5 h-2.5 text-neutral-400" />
                            <span>{sub.label}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleMenu(menu.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                      menu.enabled !== false ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {menu.enabled !== false ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hidden
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEditMenu(menu)}
                    className="p-2 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Edit Menu & Sub-Items"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteMenu(menu.id)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Delete Menu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. HEADER ACTION ICONS TOGGLE & ALIGNMENT */}
      {/* ============================================================== */}
      {activeSubTab === 'icons' && (
        <div className="space-y-6">
          <div className="border-b border-neutral-200 pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-black" />
              <h2 className="text-xl font-extrabold text-black tracking-tight">Header Action Icons & Right Alignment</h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Enable or disable specific icons in the header. Remaining icons will automatically align neatly to the right edge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Search Store</h3>
                  <p className="text-[11px] text-neutral-500">Live search modal</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showSearch: headerSettings?.showSearch === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showSearch !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showSearch !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Wishlist */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Wishlist</h3>
                  <p className="text-[11px] text-neutral-500">Saved favorite items</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showWishlist: headerSettings?.showWishlist === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showWishlist !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showWishlist !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Account Profile */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">My Account Profile</h3>
                  <p className="text-[11px] text-neutral-500">User profile & addresses</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showAccount: headerSettings?.showAccount === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showAccount !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showAccount !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Track Order */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Track Order</h3>
                  <p className="text-[11px] text-neutral-500">Order tracking page</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showTrackOrder: headerSettings?.showTrackOrder === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showTrackOrder !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showTrackOrder !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Cart */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Shopping Bag / Cart</h3>
                  <p className="text-[11px] text-neutral-500">Cart drawer & counter</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showCart: headerSettings?.showCart === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showCart !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showCart !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT HERO BANNER */}
      {/* ============================================================== */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl my-8 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-black text-black">
                {editingBannerId ? 'Edit Hero Banner Slide' : 'Add New Hero Banner Slide'}
              </h3>
              <button
                onClick={() => setShowBannerModal(false)}
                className="p-1 text-neutral-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Badge / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Grandma's Special Recipe"
                  value={bannerForm.badge}
                  onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Andhra Avakaya & Pickles"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Subtitle / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prepared at home with 100% pure cold-pressed oils..."
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Banner Image URL / Upload *</label>
                <DragDropImagePicker
                  label="Hero Banner Photo Upload"
                  value={bannerForm.image}
                  onChange={(url) => setBannerForm({ ...bannerForm, image: url })}
                  helperText="Drag & drop high resolution banner image or browse from files/folders."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Collection"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Button Link</label>
                  <input
                    type="text"
                    placeholder="e.g. /products?category=Pickles"
                    value={bannerForm.ctaLink}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white text-xs font-extrabold rounded-xl hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle"
                >
                  Save Banner Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT HEADER CATEGORY / MENU */}
      {/* ============================================================== */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl my-8 text-left max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-black">
                  {editingMenuId ? 'Edit Header Category / Menu' : 'Add New Header Category / Menu'}
                </h3>
                <p className="text-xs text-neutral-500">Configure title, link, and dropdown items.</p>
              </div>
              <button
                onClick={() => setShowMenuModal(false)}
                className="p-1 text-neutral-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Menu Title / Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPECIAL OFFERS or PICKLES"
                    value={menuForm.label}
                    onChange={(e) => setMenuForm({ ...menuForm, label: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Main Destination Link *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /products?filter=offers or /products"
                    value={menuForm.path}
                    onChange={(e) => setMenuForm({ ...menuForm, path: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSpecialCheck"
                  checked={menuForm.isSpecial}
                  onChange={(e) => setMenuForm({ ...menuForm, isSpecial: e.target.checked })}
                  className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="isSpecialCheck" className="text-xs font-bold text-neutral-800 cursor-pointer">
                  Highlight as Special Offer / Featured Link (accent tag)
                </label>
              </div>

              {/* DROPDOWN SUB-ITEMS BUILDER */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-black" />
                    <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">
                      Dropdown Sub-Menu Items ({menuForm.subCategories.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-neutral-500">Opens when user hovers on this menu</span>
                </div>

                {/* Sub-item creator form */}
                <div className="p-3 bg-white border border-neutral-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span>Add Item From:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="subType"
                        checked={subItemType === 'category'}
                        onChange={() => setSubItemType('category')}
                      />
                      <span>Store Category</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="subType"
                        checked={subItemType === 'product'}
                        onChange={() => setSubItemType('product')}
                      />
                      <span>Specific Product</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="subType"
                        checked={subItemType === 'custom'}
                        onChange={() => setSubItemType('custom')}
                      />
                      <span>Custom Promo Link</span>
                    </label>
                  </div>

                  {/* If Category */}
                  {subItemType === 'category' && (
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedCatName}
                        onChange={(e) => setSelectedCatName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSubItem}
                        disabled={!selectedCatName}
                        className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        + Add Category
                      </button>
                    </div>
                  )}

                  {/* If Product */}
                  {subItemType === 'product' && (
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedProdId}
                        onChange={(e) => setSelectedProdId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.category}) - ₹{p.price}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSubItem}
                        disabled={!selectedProdId}
                        className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        + Add Product
                      </button>
                    </div>
                  )}

                  {/* If Custom */}
                  {subItemType === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. 5% OFF Coupon Code)"
                        value={customSubLabel}
                        onChange={(e) => setCustomSubLabel(e.target.value)}
                        className="px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Path (e.g. /products?category=Gift%20Boxes)"
                          value={customSubPath}
                          onChange={(e) => setCustomSubPath(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubItem}
                          disabled={!customSubLabel.trim() || !customSubPath.trim()}
                          className="px-3 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-items List */}
                <div className="space-y-2">
                  {menuForm.subCategories.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-2 text-center">
                      No sub-items added. This menu item will act as a direct single link without a dropdown.
                    </p>
                  ) : (
                    menuForm.subCategories.map((sub, sIdx) => (
                      <div
                        key={sub.id || sIdx}
                        className="p-2.5 bg-white border border-neutral-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                          <span className="font-bold text-neutral-900 truncate">{sub.label}</span>
                          <span className="text-[11px] text-neutral-400 truncate">({sub.path})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubItem(sub.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white text-xs font-extrabold rounded-xl hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle"
                >
                  Save Header Category Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
