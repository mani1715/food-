import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sliders,
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
  Clock,
  Sparkles,
  Save,
  ShoppingBag,
  DollarSign,
  Coffee,
  CheckCircle2,
  XCircle,
  Crown,
  ShieldAlert,
  KeyRound,
  UserX,
} from 'lucide-react';
import { DragDropImagePicker } from './DragDropImagePicker';
import { AdminTab, StoreInfo } from '../../types';

export const SettingsManagementTab: React.FC = () => {
  const {
    siteLogo,
    updateSiteLogo,
    paymentEnabled,
    setPaymentEnabled,
    headerSettings,
    updateHeaderSettings,
    categories,
    subAdmins,
    addSubAdmin,
    deleteSubAdmin,
    storeInfo,
    updateStoreInfo,
    exportStoreBackupJson,
    resetStoreToDefault,
    currentAdminRole,
    currentAdminEmail,
    storeAdminUsers,
    addStoreAdminUser,
    deleteStoreAdminUser,
  } = useApp();

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
  };

  const handleSaveCheckoutRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreInfo({
      minOrderAmount: Number(draftMinOrder) || 0,
      freeShippingThreshold: Number(draftFreeShipping) || 0,
      codEnabled: draftCodEnabled,
      deliveryTimeNotice: draftDeliveryNotice.trim(),
    });
  };

  const handleSaveOperationalStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreInfo({
      orderAcceptanceStatus: draftAcceptanceStatus,
      vacationNotice: draftVacationNotice.trim(),
    });
  };

  const isSuperAdmin = currentAdminRole === 'super_admin';

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
  };

  const toggleTabPermission = (tab: AdminTab) => {
    if (subAdminAllowedTabs.includes(tab)) {
      setSubAdminAllowedTabs(subAdminAllowedTabs.filter((t) => t !== tab));
    } else {
      setSubAdminAllowedTabs([...subAdminAllowedTabs, tab]);
    }
  };

  const toggleCategoryMenu = (catName: string) => {
    const disabledList = headerSettings?.disabledCategoryNames || [];
    const isCurrentlyDisabled = disabledList.includes(catName);

    const newDisabledList = isCurrentlyDisabled
      ? disabledList.filter((n) => n !== catName)
      : [...disabledList, catName];

    updateHeaderSettings({ disabledCategoryNames: newDisabledList });
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

  return (
    <div className="space-y-8 text-left">
      {/* Header Banner */}
      <div className="border-b border-neutral-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-black tracking-tight">Store Settings & Business Controls</h2>
              {isSuperAdmin && (
                <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black px-2.5 py-0.5 rounded-full uppercase border border-amber-500/30 shadow-xs">
                  👑 Super Admin Master Mode
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Manage complete store identity, food safety license, checkout pricing rules, vacation mode, and team administration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-neutral-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup Store Data</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 👑 MEGA SUPER ADMIN MASTER CONTROL (EXCLUSIVE & HIDDEN FROM NORMAL ADMINS) */}
        {isSuperAdmin && (
          <div className="bg-gradient-to-br from-neutral-900 via-black to-neutral-950 text-white border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-modal space-y-6 md:col-span-2 relative overflow-hidden">
            {/* Background luxury glow */}
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
                      Full Root Access
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Private master control panel. Manage, add, or permanently delete client store admins and sub-admins.
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
                  Create an admin account to provide to your client (e.g. aishuhomefoods@gmail.com). They cannot see your super admin profile or credentials.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Admin Full Name (e.g. Aishu Store Manager)"
                    value={newStoreAdminName}
                    onChange={(e) => setNewStoreAdminName(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-neutral-700 rounded-xl text-white placeholder-neutral-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Admin Email (e.g. aishuhomefoods@gmail.com)"
                    value={newStoreAdminEmail}
                    onChange={(e) => setNewStoreAdminEmail(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-neutral-700 rounded-xl text-white font-mono placeholder-neutral-500"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Admin Password"
                    value={newStoreAdminPass}
                    onChange={(e) => setNewStoreAdminPass(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-neutral-700 rounded-xl text-white placeholder-neutral-500"
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

        {/* 1. STORE & KITCHEN BUSINESS PROFILE */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-5">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Store & Kitchen Profile</h3>
              <p className="text-xs text-neutral-400">Official business name, contact helpline & food licensing</p>
            </div>
          </div>

          <form onSubmit={handleSaveBusinessProfile} className="space-y-4 text-xs font-bold">
            <div>
              <label className="block text-neutral-500 mb-1">Official Store / Brand Name *</label>
              <input
                type="text"
                required
                value={draftStoreName}
                onChange={(e) => setDraftStoreName(e.target.value)}
                placeholder="AISHU FOODS - Handcrafted Homemade Specialties"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-extrabold text-sm"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Brand Tagline & Quality Promise</label>
              <input
                type="text"
                value={draftTagline}
                onChange={(e) => setDraftTagline(e.target.value)}
                placeholder="Authentic Andhra Pickles, Pure A2 Ghee Sweets & Crunchy Savories"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Support Email</span>
                </label>
                <input
                  type="email"
                  value={draftSupportEmail}
                  onChange={(e) => setDraftSupportEmail(e.target.value)}
                  placeholder="care@aishufoods.com"
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Helpline Phone Number</span>
                </label>
                <input
                  type="text"
                  value={draftSupportPhone}
                  onChange={(e) => setDraftSupportPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span>Kitchen & Dispatch Facility Origin</span>
              </label>
              <textarea
                rows={2}
                value={draftKitchenAddress}
                onChange={(e) => setDraftKitchenAddress(e.target.value)}
                placeholder="Plot 42, Heritage Food Enclave, Near Benz Circle, Vijayawada, Andhra Pradesh - 520008"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>FSSAI Food License #</span>
                </label>
                <input
                  type="text"
                  value={draftFssaiNumber}
                  onChange={(e) => setDraftFssaiNumber(e.target.value)}
                  placeholder="10123999000142"
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span>GSTIN Number (Optional)</span>
                </label>
                <input
                  type="text"
                  value={draftGstin}
                  onChange={(e) => setDraftGstin(e.target.value)}
                  placeholder="37AAAAA0000A1Z5"
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-mono text-xs font-bold uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Business Profile</span>
            </button>
          </form>
        </div>

        {/* 2. CHECKOUT RULES & PAYMENT METHODS */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-5">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Payment & Checkout Rules</h3>
              <p className="text-xs text-neutral-400">Gateway controls, minimum orders & free delivery threshold</p>
            </div>
          </div>

          <form onSubmit={handleSaveCheckoutRules} className="space-y-4 text-xs font-bold">
            {/* Master Online Gateway Toggle */}
            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-black block">Online Payments (UPI, Cards, NetBanking)</span>
                <span className="text-[11px] text-neutral-500 font-normal">
                  {paymentEnabled ? 'Customer online checkout is active and accepting payments.' : 'Online payments temporarily disabled.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentEnabled(!paymentEnabled)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  paymentEnabled ? 'bg-black text-white' : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {paymentEnabled ? 'ACTIVE ✅' : 'DISABLED ❌'}
              </button>
            </div>

            {/* Cash on Delivery Toggle */}
            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-black block">Cash on Delivery (COD)</span>
                <span className="text-[11px] text-neutral-500 font-normal">
                  {draftCodEnabled ? 'COD checkout available for eligible delivery pin codes.' : 'COD option hidden at checkout.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDraftCodEnabled(!draftCodEnabled)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  draftCodEnabled ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {draftCodEnabled ? 'ENABLED ✅' : 'DISABLED ❌'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1">Minimum Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={draftMinOrder}
                  onChange={(e) => setDraftMinOrder(Number(e.target.value))}
                  placeholder="199"
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Free Delivery Threshold (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={draftFreeShipping}
                  onChange={(e) => setDraftFreeShipping(Number(e.target.value))}
                  placeholder="499"
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Estimated Delivery Message (Checkout Banner)</span>
              </label>
              <input
                type="text"
                value={draftDeliveryNotice}
                onChange={(e) => setDraftDeliveryNotice(e.target.value)}
                placeholder="Prepared fresh & delivered in 24-48 hours across AP & Telangana."
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Checkout Rules</span>
            </button>
          </form>
        </div>

        {/* 3. KITCHEN OPERATIONAL STATUS & VACATION MODE */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-5">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Kitchen Operational Status</h3>
              <p className="text-xs text-neutral-400">Order acceptance state & vacation/holiday notice</p>
            </div>
          </div>

          <form onSubmit={handleSaveOperationalStatus} className="space-y-4 text-xs font-bold">
            <div className="space-y-2">
              <label className="block text-neutral-500">Select Operating State</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'open', label: '🟢 Accepting Orders', desc: 'Standard Live Operations' },
                  { id: 'vacation', label: '🟡 Vacation / Holiday', desc: 'Orders queued for later dispatch' },
                  { id: 'paused', label: '🔴 Kitchen Rush Paused', desc: 'Temporary order pause' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDraftAcceptanceStatus(st.id as any)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      draftAcceptanceStatus === st.id
                        ? 'bg-black text-white border-black shadow-sm ring-2 ring-black/10'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black'
                    }`}
                  >
                    <span className="font-extrabold">{st.label}</span>
                    <span className={`text-[10px] mt-1 ${draftAcceptanceStatus === st.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {st.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Customer Notice Message (Displayed when not in standard mode)</label>
              <textarea
                rows={2}
                value={draftVacationNotice}
                onChange={(e) => setDraftVacationNotice(e.target.value)}
                placeholder="Our kitchen is currently preparing fresh holiday batches. Orders will be dispatched promptly on next working day."
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Operating Status</span>
            </button>
          </form>
        </div>

        {/* 4. STORE BRAND LOGO ASSET */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-5">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Store Brand Logo</h3>
              <p className="text-xs text-neutral-400">Drag & drop or select new transparent logo photo from files</p>
            </div>
          </div>

          <div className="space-y-4">
            <DragDropImagePicker
              label="Change Store Logo"
              value={siteLogo}
              onChange={updateSiteLogo}
              helperText="Upload transparent PNG, JPG, or SVG logo for crisp display across Header, Footer, and Invoice prints."
            />

            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Current Logo File:</span>
                <span className="font-mono text-black font-bold truncate max-w-[200px]">{siteLogo}</span>
              </div>
              <button
                type="button"
                onClick={() => updateSiteLogo('/aishu-logo.png')}
                className="text-[11px] font-extrabold text-black hover:underline cursor-pointer"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>

        {/* 5. HEADER ICONS & CATEGORY NAVIGATION VISIBILITY */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-5 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Header Navigation & Menu Display Controls</h3>
              <p className="text-xs text-neutral-400">Toggle customer header action icons and customize category navbar links</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
            {/* Header Action Icons */}
            <div className="space-y-3">
              <span className="text-[11px] uppercase text-neutral-400 font-extrabold tracking-wider block">
                Customer Header Action Icons
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'showSearch', label: 'Search 🔍' },
                  { key: 'showWishlist', label: 'Wishlist ❤️' },
                  { key: 'showAccount', label: 'Account 👤' },
                  { key: 'showTrackOrder', label: 'Track Order 📦' },
                  { key: 'showCart', label: 'Cart 🛍️' },
                ].map((item) => {
                  const isEnabled = (headerSettings as any)[item.key] !== false;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateHeaderSettings({ [item.key]: !isEnabled })}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isEnabled
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] uppercase font-mono font-bold">
                        {isEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Navigation Bar Links */}
            <div className="space-y-3">
              <span className="text-[11px] uppercase text-neutral-400 font-extrabold tracking-wider block">
                Category Navbar Links Visibility
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isDisabled = (headerSettings?.disabledCategoryNames || []).includes(cat.name);
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <img src={cat.image} alt={cat.name} className="w-7 h-7 rounded-full object-cover border border-neutral-300" />
                        <span className="font-extrabold text-black">{cat.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCategoryMenu(cat.name)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                          isDisabled ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-black text-white'
                        }`}
                      >
                        {isDisabled ? 'HIDDEN' : 'VISIBLE'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 6. SUB-ADMIN TEAM & ROLE-BASED ACCESS CONTROL (RBAC) */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-5 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Sub-Admin Team & Role-Based Access Control (RBAC)</h3>
              <p className="text-xs text-neutral-400">
                Create dedicated admin accounts and assign granular tab permissions (Products, Orders, Banners, Discounts, Settings)
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateSubAdminSubmit} className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-4 text-xs font-bold">
            <span className="text-xs font-black uppercase text-black block">Add New Team Member</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name (e.g. Rahul Sharma)"
                value={subAdminName}
                onChange={(e) => setSubAdminName(e.target.value)}
                className="p-3 bg-white border border-neutral-300 rounded-2xl"
              />
              <input
                type="email"
                required
                placeholder="Email (e.g. rahul@aishufoods.com)"
                value={subAdminEmail}
                onChange={(e) => setSubAdminEmail(e.target.value)}
                className="p-3 bg-white border border-neutral-300 rounded-2xl font-mono"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={subAdminPass}
                onChange={(e) => setSubAdminPass(e.target.value)}
                className="p-3 bg-white border border-neutral-300 rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Role Title / Designation</label>
              <input
                type="text"
                placeholder="e.g. Kitchen Logistics Manager, Catalog Specialist"
                value={subAdminRoleTitle}
                onChange={(e) => setSubAdminRoleTitle(e.target.value)}
                className="w-full p-3 bg-white border border-neutral-300 rounded-2xl font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-500 mb-1.5">Assign Tab Access Permissions</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'products', label: 'Products & Inventory' },
                  { id: 'orders', label: 'Orders & Fulfillment' },
                  { id: 'analytics', label: 'Store Analytics' },
                  { id: 'banners', label: 'Hero Banners' },
                  { id: 'bestsellers', label: 'Featured & Festival' },
                  { id: 'discounts', label: 'Coupons & Offers' },
                  { id: 'locations', label: 'Delivery Cities' },
                  { id: 'settings', label: 'Store Settings' },
                ].map((tabObj) => {
                  const isChecked = subAdminAllowedTabs.includes(tabObj.id as any);
                  return (
                    <button
                      key={tabObj.id}
                      type="button"
                      onClick={() => toggleTabPermission(tabObj.id as any)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center justify-between text-[11px] transition-all cursor-pointer ${
                        isChecked ? 'bg-black text-white border-black font-extrabold shadow-xs' : 'bg-white text-neutral-600 border-neutral-300'
                      }`}
                    >
                      <span>{tabObj.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-subtle hover:bg-neutral-800 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Sub-Admin Account</span>
            </button>
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
                      onClick={() => deleteSubAdmin(sub.id)}
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

        {/* 7. SYSTEM MAINTENANCE & RESTORE DEFAULTS */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-black flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-black">System Maintenance & Restore Defaults</h3>
                <p className="text-xs text-neutral-400">Reset configurations or clear demo sandbox state</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Settings to Default</span>
            </button>
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
                  className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-black cursor-pointer"
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
                  }}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Yes, Restore Defaults
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
