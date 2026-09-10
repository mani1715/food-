import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HeroBannerSlide, HeaderAnnouncement } from '../../types';
import { Image as ImageIcon, Volume2, Plus, Edit3, Trash2, Eye, EyeOff, Check, X, Clock } from 'lucide-react';
import { DragDropImagePicker } from './DragDropImagePicker';

export const BannersManagementTab: React.FC = () => {
  const {
    heroBanners,
    headerAnnouncements,
    addHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    addHeaderAnnouncement,
    updateHeaderAnnouncement,
    deleteHeaderAnnouncement,
  } = useApp();

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

  // Form state for Header Announcements
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [editingAnnText, setEditingAnnText] = useState('');

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

  // Announcement Handlers
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

  return (
    <div className="space-y-12 text-left">
      {/* SECTION 1: HERO BANNERS MANAGEMENT */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-black" />
              <h2 className="text-xl font-extrabold text-black tracking-tight">Homepage Hero Banners</h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              Auto-scrolls automatically every <strong>6 seconds (6000ms)</strong> on the Customer Homepage. Minimum 4 recommended.
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

        {/* Banners Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {heroBanners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-white border rounded-3xl overflow-hidden shadow-subtle transition-all ${
                banner.enabled ? 'border-neutral-200 hover:border-black' : 'border-neutral-200 opacity-60 bg-neutral-50'
              }`}
            >
              <div className="relative h-44 bg-neutral-900 overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover opacity-80"
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
                  <span className="font-semibold text-black">CTA:</span> {banner.ctaText} ({banner.ctaLink})
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

      {/* SECTION 2: TOP HEADER ANNOUNCEMENT TICKER */}
      <div className="space-y-6 border-t border-neutral-200 pt-8">
        <div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-black" />
            <h2 className="text-xl font-extrabold text-black tracking-tight">Top Header Announcement Ticker Text</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Manage text lines displayed on the top header marquee banner (e.g. Free shipping, coupon codes, authentic preparation details).
          </p>
        </div>

        {/* Add Announcement Input Form */}
        <form onSubmit={handleAddAnnouncement} className="flex gap-2 max-w-2xl">
          <input
            type="text"
            placeholder="e.g. 🍯 Use Code AF05 & get 5% additional discount on your First Purchase!"
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
            <span>Add Announcement</span>
          </button>
        </form>

        {/* Announcement List */}
        <div className="space-y-3 max-w-3xl">
          {headerAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                ann.enabled ? 'bg-white border-neutral-200' : 'bg-neutral-50 border-neutral-200 opacity-60'
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

      {/* HERO BANNER EDIT/ADD MODAL */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-neutral-200 my-auto max-h-[88vh] overflow-y-auto text-left animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="text-lg font-extrabold text-black">
                {editingBannerId ? 'Edit Hero Banner Slide' : 'Add New Hero Banner Slide'}
              </h3>
              <button
                onClick={() => setShowBannerModal(false)}
                className="p-1.5 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure A2 Ghee Sweets & Traditional Delicacies"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Banner Subtitle / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handcrafted using traditional recipes, cold-pressed oils & zero preservatives."
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>

              <DragDropImagePicker
                label="Hero Banner Photo Upload"
                value={bannerForm.image}
                onChange={(url) => setBannerForm({ ...bannerForm, image: url })}
                helperText="Drag & drop high resolution banner image or browse from files/folders."
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. FLAVORS OF TRADITION"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Sweets"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">CTA Button Link URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /products or /category/sweets"
                    value={bannerForm.ctaLink}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Status</label>
                  <select
                    value={bannerForm.enabled ? 'true' : 'false'}
                    onChange={(e) => setBannerForm({ ...bannerForm, enabled: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="true">Enabled (Visible on Home)</option>
                    <option value="false">Disabled (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* BANNER ALIGNMENT & POSITIONING CONTROLS */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="block text-xs font-black uppercase text-black">🎯 Image Alignment & Adjustment Settings</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Focal Alignment</label>
                    <select
                      value={bannerForm.objectPosition || 'center'}
                      onChange={(e) => setBannerForm({ ...bannerForm, objectPosition: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold"
                    >
                      <option value="center">Center 🎯</option>
                      <option value="top">Top ⬆️</option>
                      <option value="bottom">Bottom ⬇️</option>
                      <option value="left">Left ⬅️</option>
                      <option value="right">Right ➡️</option>
                      <option value="top-left">Top-Left ↖️</option>
                      <option value="top-right">Top-Right ↗️</option>
                      <option value="bottom-left">Bottom-Left ↙️</option>
                      <option value="bottom-right">Bottom-Right ↘️</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Fit Mode</label>
                    <select
                      value={bannerForm.objectFit || 'cover'}
                      onChange={(e) => setBannerForm({ ...bannerForm, objectFit: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold"
                    >
                      <option value="cover">Cover (Fill & Crop)</option>
                      <option value="contain">Contain (Fit Full Image)</option>
                      <option value="fill">Fill (Stretch)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Text Readability Overlay</label>
                    <select
                      value={bannerForm.overlayOpacity || 'dark'}
                      onChange={(e) => setBannerForm({ ...bannerForm, overlayOpacity: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold"
                    >
                      <option value="dark">Dark (Standard)</option>
                      <option value="medium">Medium</option>
                      <option value="light">Light</option>
                      <option value="heavy">Maximum Dark</option>
                    </select>
                  </div>
                </div>
              </div>

              <DragDropImagePicker
                label="Banner Background Image *"
                value={bannerForm.image}
                onChange={(url) => setBannerForm({ ...bannerForm, image: url })}
                helperText="Drag & drop banner image from your computer, select file/folder, or enter image URL."
              />

              {bannerForm.image && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block">Live Alignment Preview</span>
                  <div className="h-36 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-300 relative">
                    <img
                      src={bannerForm.image}
                      alt="Preview"
                      style={{
                        objectFit: bannerForm.objectFit || 'cover',
                        objectPosition: bannerForm.objectPosition ? bannerForm.objectPosition.replace('-', ' ') : 'center',
                      }}
                      className="w-full h-full opacity-60 transition-all duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
                      <span className="text-white text-xs font-extrabold line-clamp-1">{bannerForm.title || 'Banner Title Preview'}</span>
                      <span className="text-neutral-300 text-[11px] line-clamp-1">{bannerForm.subtitle || 'Banner subtitle preview text...'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-5 py-2.5 bg-neutral-100 text-neutral-700 text-xs font-extrabold rounded-2xl hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  {editingBannerId ? 'Save Banner Changes' : 'Create Hero Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
