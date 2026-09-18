import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  Trash2,
  Image as ImageIcon,
  ShieldCheck,
  UserPlus,
  Users,
  Check,
  Building,
  Truck,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertTriangle,
  Download,
  RotateCcw,
  Coffee,
  Crown,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  Settings as SettingsIcon,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { DragDropImagePicker } from './DragDropImagePicker';
import { AdminTab } from '../../types';

export const SettingsManagementTab: React.FC = () => {
  const {
    siteLogo,
    updateSiteLogo,
    paymentEnabled,
    setPaymentEnabled,
    subAdmins,
    addSubAdmin,
    deleteSubAdmin,
    storeInfo,
    updateStoreInfo,
    exportStoreBackupJson,
    resetStoreToDefault,
    currentAdminRole,
    storeAdminUsers,
    addStoreAdminUser,
    deleteStoreAdminUser,
  } = useApp();

  const isSuperAdmin = currentAdminRole === 'super_admin';

  // Active Settings Sub-Tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'profile' | 'checkout' | 'operations' | 'team' | 'system' | 'superadmin'>('all');

  // Temporary visual feedback state for save buttons
  const [savedSections, setSavedSections] = useState<Record<string, boolean>>({});

  const showSaveSuccess = (sectionKey: string) => {
    setSavedSections((prev) => ({ ...prev, [sectionKey]: true }));
    setTimeout(() => {
      setSavedSections((prev) => ({ ...prev, [sectionKey]: false }));
    }, 2500);
  };

  // Mega Super Admin Local Form States
  const [newStoreAdminName, setNewStoreAdminName] = useState('');
  const [newStoreAdminEmail, setNewStoreAdminEmail] = useState('');
  const [newStoreAdminPass, setNewStoreAdminPass] = useState('');

  // Local Draft States for Business Details
  const [draftStoreName, setDraftStoreName] = useState(storeInfo.storeName || '');
  const [draftTagline, setDraftTagline] = useState(storeInfo.tagline || '');
  const [draftSupportEmail, setDraftSupportEmail] = useState(storeInfo.supportEmail || '');
  const [draftSupportPhone, setDraftSupportPhone] = useState(storeInfo.supportPhone || '');
  const [draftKitchenAddress, setDraftKitchenAddress] = useState(storeInfo.kitchenAddress || '');
  const [draftFssaiNumber, setDraftFssaiNumber] = useState(storeInfo.fssaiNumber || '');
  const [draftGstin, setDraftGstin] = useState(storeInfo.gstin || '');
  const [draftMinOrder, setDraftMinOrder] = useState<number>(storeInfo.minOrderAmount || 199);
  const [draftFreeShipping, setDraftFreeShipping] = useState<number>(storeInfo.freeShippingThreshold || 499);
  const [draftCodEnabled, setDraftCodEnabled] = useState<boolean>(storeInfo.codEnabled !== false);
  const [draftDeliveryNotice, setDraftDeliveryNotice] = useState(storeInfo.deliveryTimeNotice || '');
  const [draftAcceptanceStatus, setDraftAcceptanceStatus] = useState<'open' | 'vacation' | 'paused'>(storeInfo.orderAcceptanceStatus || 'open');
  const [draftVacationNotice, setDraftVacationNotice] = useState(storeInfo.vacationNotice || '');

  // Sub-Admin Form State
  const [subAdminName, setSubAdminName] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPass, setSubAdminPass] = useState('');
  const [subAdminRoleTitle, setSubAdminRoleTitle] = useState('Catalog & Inventory Admin');
  const [subAdminAllowedTabs, setSubAdminAllowedTabs] = useState<AdminTab[]>(['products', 'orders']);

  // Reset Confirmation Modal State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveBusinessProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreInfo({
      storeName: draftStoreName.trim(),
      tagline: draftTagline.trim(),
      supportEmail: draftSupportEmail.trim(),
      supportPhone: draftSupportPhone.trim(),
      kitchenAddress: draftKitchenAddress.trim(),
      fssaiNumber: draftFssaiNumber.trim(),
      gstin: draftGstin.trim(),
    });
    showSaveSuccess('profile');
  };

  const handleSaveCheckoutRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreInfo({
      minOrderAmount: Number(draftMinOrder) || 0,
      freeShippingThreshold: Number(draftFreeShipping) || 0,
      codEnabled: draftCodEnabled,
      deliveryTimeNotice: draftDeliveryNotice.trim(),
    });
    showSaveSuccess('checkout');
  };

  const handleSaveOperationalStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreInfo({
      orderAcceptanceStatus: draftAcceptanceStatus,
      vacationNotice: draftVacationNotice.trim(),
    });
    showSaveSuccess('operations');
  };

  const handleCreateStoreAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreAdminName.trim() || !newStoreAdminEmail.trim() || !newStoreAdminPass.trim()) return;

    addStoreAdminUser({
      name: newStoreAdminName.trim(),
      email: newStoreAdminEmail.trim(),
      password: newStoreAdminPass.trim(),
      role: 'admin',
    });

    setNewStoreAdminName('');
    setNewStoreAdminEmail('');
    setNewStoreAdminPass('');
    showSaveSuccess('superadmin');
  };

  const handleCreateSubAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subAdminName.trim() || !subAdminEmail.trim() || !subAdminPass.trim()) return;

    addSubAdmin({
      name: subAdminName.trim(),
      email: subAdminEmail.trim(),
      password: subAdminPass.trim(),
      roleTitle: subAdminRoleTitle.trim(),
      allowedTabs: subAdminAllowedTabs,
    });

    setSubAdminName('');
    setSubAdminEmail('');
    setSubAdminPass('');
    showSaveSuccess('team');
  };

  const toggleTabPermission = (tab: AdminTab) => {
    if (subAdminAllowedTabs.includes(tab)) {
      setSubAdminAllowedTabs(subAdminAllowedTabs.filter((t) => t !== tab));
    } else {
      setSubAdminAllowedTabs([...subAdminAllowedTabs, tab]);
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportStoreBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aishu-foods-store-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shouldShowSection = (sectionId: string) => {
    return activeSubTab === 'all' || activeSubTab === sectionId;
  };

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto">
      {/* Top Header Banner */}
      <div className="border-b border-neutral-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">Store Settings & Business Controls</h2>
                  {isSuperAdmin && (
                    <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black px-2.5 py-0.5 rounded-full uppercase border border-amber-500/30 shadow-xs">
                      👑 Master Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure store identity, logo, kitchen operations, checkout rules, and administrative team access.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-black rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-neutral-300 shadow-xs"
              title="Export complete store catalog, orders, and settings as JSON"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span>Export Store Backup</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Navigation Subtabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-5">
          {[
            { id: 'all', label: 'All Settings', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'profile', label: 'Store Identity & Branding', icon: <Building className="w-3.5 h-3.5" /> },
            { id: 'checkout', label: 'Payments & Checkout', icon: <CreditCard className="w-3.5 h-3.5" /> },
            { id: 'operations', label: 'Kitchen & Operating Mode', icon: <Coffee className="w-3.5 h-3.5" /> },
            { id: 'team', label: 'Team Access (RBAC)', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'system', label: 'Data & Maintenance', icon: <RotateCcw className="w-3.5 h-3.5" /> },
            ...(isSuperAdmin ? [{ id: 'superadmin', label: '👑 Master Governance', icon: <Crown className="w-3.5 h-3.5" /> }] : []),
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-black text-white shadow-subtle'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-black hover:text-black'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">

        {/* 👑 MEGA SUPER ADMIN MASTER CONTROL (EXCLUSIVE & PRIVATE FOR ROOT SUPER ADMIN) */}
        {isSuperAdmin && shouldShowSection('superadmin') && (
          <div className="bg-gradient-to-br from-neutral-900 via-black to-neutral-950 text-white border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-modal space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center shrink-0 shadow-lg">
                  <Crown className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-white">
                      Mega Super Admin Master Governance
                    </h3>
                    <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      Root Access
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Private master control panel. Create or permanently delete client store admins and sub-admins.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-800/80 border border-neutral-700 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-neutral-400">Master User:</span>
                <span className="font-extrabold text-amber-300">ettelamaneesh@gmail.com</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 relative z-10">
              {/* Active Store Admins List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                    Active Store Admin Accounts ({storeAdminUsers.length})
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold">Can delete any admin below</span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {storeAdminUsers.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic p-6 border border-dashed border-neutral-800 rounded-2xl text-center">
                      No store admins registered.
                    </p>
                  ) : (
                    storeAdminUsers.map((admin) => (
                      <div
                        key={admin.id}
                        className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between text-xs hover:border-neutral-700 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">{admin.name}</span>
                            <span className="bg-neutral-800 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-md border border-neutral-700">
                              Store Admin
                            </span>
                          </div>
                          <p className="text-neutral-400 font-mono text-[11px]">{admin.email}</p>
                          <p className="text-[10px] text-neutral-500">Created: {admin.createdAt}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete store admin "${admin.name}" (${admin.email})? They will lose all access immediately.`)) {
                              deleteStoreAdminUser(admin.id);
                            }
                          }}
                          className="px-3 py-2 bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-800/50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Delete Store Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Admin</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add New Store Admin */}
              <form onSubmit={handleCreateStoreAdminSubmit} className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3.5 text-xs font-bold">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                  Create Client Store Admin Account
                </span>
                <p className="text-[11px] text-neutral-400 font-normal">
                  Create an admin account to provide to your client (e.g. aishuhomefoods@gmail.com). They cannot see your super admin credentials.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Admin Full Name (e.g. Aishu Store Manager)"
                    value={newStoreAdminName}
                    onChange={(e) => setNewStoreAdminName(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Admin Email (e.g. aishuhomefoods@gmail.com)"
                    value={newStoreAdminEmail}
                    onChange={(e) => setNewStoreAdminEmail(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-neutral-700 rounded-xl text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Admin Password"
                    value={newStoreAdminPass}
                    onChange={(e) => setNewStoreAdminPass(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Store Admin Account</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 1. STORE PROFILE & BRAND IDENTITY */}
        {shouldShowSection('profile') && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">Store Profile & Brand Identity</h3>
                  <p className="text-xs text-neutral-400">Official brand name, tagline, support helpline, address & food licensing</p>
                </div>
              </div>
              {savedSections['profile'] && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Profile Saved
                </span>
              )}
            </div>

            {/* Brand Logo Component */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-neutral-600" />
                    <span>Store Brand Logo Asset</span>
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Upload transparent PNG/JPG logo displayed on Header, Footer, and Invoice receipts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSiteLogo('/aishu-logo.png')}
                  className="text-xs font-bold text-neutral-500 hover:text-black hover:underline cursor-pointer"
                >
                  Reset Default Logo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-3 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-neutral-200 text-center space-y-2">
                  <div className="w-20 h-20 rounded-full border-2 border-black overflow-hidden bg-black flex items-center justify-center shadow-sm">
                    <img src={siteLogo || '/aishu-logo.png'} alt="Current Logo" className="w-full h-full object-cover scale-105" />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 font-bold truncate max-w-[150px]">{siteLogo}</span>
                </div>
                <div className="sm:col-span-9">
                  <DragDropImagePicker
                    label="Upload New Brand Logo"
                    value={siteLogo}
                    onChange={updateSiteLogo}
                    helperText="Upload transparent PNG, JPG, or SVG for crisp high-resolution logo display."
                  />
                </div>
              </div>
            </div>

            {/* Business Information Form */}
            <form onSubmit={handleSaveBusinessProfile} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1">Official Store / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={draftStoreName}
                    onChange={(e) => setDraftStoreName(e.target.value)}
                    placeholder="AISHU FOODS - Handcrafted Homemade Specialties"
                    className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-extrabold text-sm focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Brand Tagline & Quality Promise</label>
                  <input
                    type="text"
                    value={draftTagline}
                    onChange={(e) => setDraftTagline(e.target.value)}
                    placeholder="Authentic Andhra Pickles, Pure A2 Ghee Sweets & Savories"
                    className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-sans focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Customer Support Email</span>
                  </label>
                  <input
                    type="email"
                    value={draftSupportEmail}
                    onChange={(e) => setDraftSupportEmail(e.target.value)}
                    placeholder="care@aishufoods.com"
                    className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-mono text-xs focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Customer Helpline Phone / WhatsApp</span>
                  </label>
                  <input
                    type="text"
                    value={draftSupportPhone}
                    onChange={(e) => setDraftSupportPhone(e.target.value)}
                    placeholder="+91 98480 12345"
                    className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-mono text-xs focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Kitchen & Dispatch Facility Origin Address</span>
                </label>
                <textarea
                  rows={2}
                  value={draftKitchenAddress}
                  onChange={(e) => setDraftKitchenAddress(e.target.value)}
                  placeholder="Heritage Food Kitchen, Near Benz Circle, Vijayawada, Andhra Pradesh - 520008"
                  className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-medium focus:bg-white focus:border-black focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>FSSAI Food License # (Safety Certified)</span>
                  </label>
                  <input
                    type="text"
                    value={draftFssaiNumber}
                    onChange={(e) => setDraftFssaiNumber(e.target.value)}
                    placeholder="10123999000142"
                    className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-mono text-xs font-bold focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span>GSTIN Business Registration # (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={draftGstin}
                    onChange={(e) => setDraftGstin(e.target.value)}
                    placeholder="37AAAAA0000A1Z5"
                    className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-mono text-xs font-bold uppercase focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-subtle active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Brand Profile</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. PAYMENTS & CHECKOUT RULES */}
        {shouldShowSection('checkout') && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">Payment Gateways & Checkout Rules</h3>
                  <p className="text-xs text-neutral-400">Online UPI/Cards gateway, Cash on Delivery, minimum order limit & free delivery cutoff</p>
                </div>
              </div>
              {savedSections['checkout'] && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Checkout Rules Saved
                </span>
              )}
            </div>

            <form onSubmit={handleSaveCheckoutRules} className="space-y-5 text-xs font-bold">
              {/* Payment Methods Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Master Online Gateway Toggle */}
                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-extrabold text-black block">Online Payments (UPI, Cards, NetBanking)</span>
                    <span className="text-[11px] text-neutral-500 font-normal mt-0.5 block">
                      {paymentEnabled ? 'Razorpay live checkout accepting UPI, GPay, PhonePe, Cards.' : 'Online payment checkout disabled.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentEnabled(!paymentEnabled)}
                    className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs ${
                      paymentEnabled ? 'bg-black text-white' : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {paymentEnabled ? 'ACTIVE ✓' : 'DISABLED ✕'}
                  </button>
                </div>

                {/* Cash on Delivery Toggle */}
                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-extrabold text-black block">Cash on Delivery (COD)</span>
                    <span className="text-[11px] text-neutral-500 font-normal mt-0.5 block">
                      {draftCodEnabled ? 'Cash on delivery available at checkout for eligible pin codes.' : 'COD option hidden at checkout.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftCodEnabled(!draftCodEnabled)}
                    className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs ${
                      draftCodEnabled ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {draftCodEnabled ? 'ENABLED ✓' : 'DISABLED ✕'}
                  </button>
                </div>
              </div>

              {/* Min Order & Free Shipping Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1">Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={draftMinOrder}
                    onChange={(e) => setDraftMinOrder(Number(e.target.value))}
                    placeholder="199"
                    className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-mono text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">Customers cannot proceed to checkout below this subtotal.</span>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Free Delivery Eligibility Threshold (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={draftFreeShipping}
                    onChange={(e) => setDraftFreeShipping(Number(e.target.value))}
                    placeholder="499"
                    className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-mono text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">Orders equal or above this value automatically get free shipping.</span>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Estimated Delivery Message Banner</span>
                </label>
                <input
                  type="text"
                  value={draftDeliveryNotice}
                  onChange={(e) => setDraftDeliveryNotice(e.target.value)}
                  placeholder="Prepared fresh & delivered in 24-48 hours across AP & Telangana."
                  className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-sans focus:bg-white focus:border-black focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-subtle active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Payment & Checkout Rules</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. KITCHEN OPERATIONAL STATUS & VACATION MODE */}
        {shouldShowSection('operations') && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">Kitchen Operational Mode & Holiday Controls</h3>
                  <p className="text-xs text-neutral-400">Order acceptance state, vacation mode notice & holiday announcements</p>
                </div>
              </div>
              {savedSections['operations'] && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Status Updated
                </span>
              )}
            </div>

            <form onSubmit={handleSaveOperationalStatus} className="space-y-5 text-xs font-bold">
              <div className="space-y-2">
                <label className="block text-neutral-500">Select Operating State</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'open', label: '🟢 Accepting Orders', desc: 'Standard Live Store Operations & Fulfillment' },
                    { id: 'vacation', label: '🟡 Vacation / Festival Mode', desc: 'Orders accepted and queued for upcoming dispatch' },
                    { id: 'paused', label: '🔴 Kitchen Rush Paused', desc: 'Temporary order pause during peak rush or inventory restock' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDraftAcceptanceStatus(st.id as any)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        draftAcceptanceStatus === st.id
                          ? 'bg-black text-white border-black shadow-subtle ring-2 ring-black/10'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black'
                      }`}
                    >
                      <span className="font-black text-sm">{st.label}</span>
                      <span className={`text-[11px] font-medium mt-1.5 ${draftAcceptanceStatus === st.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {st.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Customer Notice Message (Shown when in Vacation or Paused mode)</label>
                <textarea
                  rows={3}
                  value={draftVacationNotice}
                  onChange={(e) => setDraftVacationNotice(e.target.value)}
                  placeholder="Our kitchen is currently preparing fresh holiday batches. Orders will be dispatched promptly on the next working day."
                  className="w-full p-3.5 rounded-2xl border border-neutral-300 bg-neutral-50/50 font-medium focus:bg-white focus:border-black focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-subtle active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Kitchen Operating Status</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. SUB-ADMIN TEAM & ROLE-BASED ACCESS CONTROL (RBAC) */}
        {shouldShowSection('team') && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">Sub-Admin Team & Role-Based Access Control (RBAC)</h3>
                  <p className="text-xs text-neutral-400">
                    Create dedicated sub-admin accounts with granular tab permissions (Products, Orders, Banners, Discounts, Settings)
                  </p>
                </div>
              </div>
              {savedSections['team'] && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Team Updated
                </span>
              )}
            </div>

            {/* Create Sub-Admin Form */}
            <form onSubmit={handleCreateSubAdminSubmit} className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50/80 space-y-4 text-xs font-bold">
              <span className="text-xs font-black uppercase text-black block">Add New Team Member</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Rahul Sharma)"
                  value={subAdminName}
                  onChange={(e) => setSubAdminName(e.target.value)}
                  className="p-3 bg-white border border-neutral-300 rounded-2xl focus:border-black focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Email (e.g. rahul@aishufoods.com)"
                  value={subAdminEmail}
                  onChange={(e) => setSubAdminEmail(e.target.value)}
                  className="p-3 bg-white border border-neutral-300 rounded-2xl font-mono focus:border-black focus:outline-none"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={subAdminPass}
                  onChange={(e) => setSubAdminPass(e.target.value)}
                  className="p-3 bg-white border border-neutral-300 rounded-2xl focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Role Title / Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen Logistics Manager, Catalog Specialist"
                  value={subAdminRoleTitle}
                  onChange={(e) => setSubAdminRoleTitle(e.target.value)}
                  className="w-full p-3 bg-white border border-neutral-300 rounded-2xl font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 mb-1.5">Assign Tab Access Permissions</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'products', label: 'Products & Inventory' },
                    { id: 'orders', label: 'Orders & Fulfillment' },
                    { id: 'analytics', label: 'Store Analytics' },
                    { id: 'banners', label: 'Hero Banners & Header' },
                    { id: 'bestsellers', label: 'Featured & Festival' },
                    { id: 'discounts', label: 'Coupons & Offers' },
                    { id: 'settings', label: 'Store Settings' },
                  ].map((tabObj) => {
                    const isChecked = subAdminAllowedTabs.includes(tabObj.id as any);
                    return (
                      <button
                        key={tabObj.id}
                        type="button"
                        onClick={() => toggleTabPermission(tabObj.id as any)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center justify-between text-[11px] transition-all cursor-pointer ${
                          isChecked ? 'bg-black text-white border-black font-extrabold shadow-xs' : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
                        }`}
                      >
                        <span>{tabObj.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-subtle hover:bg-neutral-800 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Sub-Admin Account</span>
                </button>
              </div>
            </form>

            {/* Active Sub-Admins List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-black uppercase text-black block">Active Sub-Admin Team ({subAdmins.length})</span>
              {subAdmins.length === 0 ? (
                <p className="text-xs text-neutral-400 italic p-6 border border-dashed rounded-3xl text-center">
                  No sub-admin accounts created yet. Master admin has full access.
                </p>
              ) : (
                <div className="space-y-2">
                  {subAdmins.map((sub) => (
                    <div key={sub.id} className="p-4 rounded-3xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-black text-sm">{sub.name}</span>
                          <span className="bg-black text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full">{sub.roleTitle}</span>
                        </div>
                        <p className="text-neutral-500 font-mono text-[11px] mt-0.5">{sub.email} • Created: {sub.createdAt}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">Allowed Tabs:</span>
                          {sub.allowedTabs.map((t) => (
                            <span key={t} className="bg-neutral-200 text-black text-[9px] font-bold px-2 py-0.5 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Revoke access for sub-admin "${sub.name}" (${sub.email})?`)) {
                            deleteSubAdmin(sub.id);
                          }
                        }}
                        className="p-2.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Revoke Sub-Admin Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. SYSTEM MAINTENANCE & RESTORE DEFAULTS */}
        {shouldShowSection('system') && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-black flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">System Maintenance & Reset Controls</h3>
                  <p className="text-xs text-neutral-400">Download data backup or restore store configurations to initial factory presets</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-black rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Store to Default</span>
                </button>
              </div>
            </div>

            {showResetConfirm && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Are you sure you want to restore default store settings? Business info will return to initial presets.</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-black cursor-pointer hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetStoreToDefault();
                      setShowResetConfirm(false);
                      setDraftStoreName(storeInfo.storeName);
                      setDraftTagline(storeInfo.tagline);
                      setDraftSupportEmail(storeInfo.supportEmail);
                      setDraftSupportPhone(storeInfo.supportPhone);
                      setDraftKitchenAddress(storeInfo.kitchenAddress);
                      setDraftFssaiNumber(storeInfo.fssaiNumber);
                      showSaveSuccess('profile');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold cursor-pointer"
                  >
                    Yes, Restore Defaults
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
