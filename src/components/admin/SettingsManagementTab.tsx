import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, Smartphone, Plus, Trash2, Image as ImageIcon, Sliders, ShieldCheck, UserPlus, Users, Check } from 'lucide-react';
import { DragDropImagePicker } from './DragDropImagePicker';
import { AdminTab } from '../../types';

export const SettingsManagementTab: React.FC = () => {
  const {
    siteLogo,
    updateSiteLogo,
    paymentEnabled,
    setPaymentEnabled,
    whatsappContacts,
    addWhatsAppContact,
    deleteWhatsAppContact,
    headerSettings,
    updateHeaderSettings,
    categories,
    subAdmins,
    addSubAdmin,
    deleteSubAdmin,
  } = useApp();

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Sub-Admin Form State
  const [subAdminName, setSubAdminName] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPass, setSubAdminPass] = useState('');
  const [subAdminRoleTitle, setSubAdminRoleTitle] = useState('Catalog & Inventory Admin');
  const [subAdminAllowedTabs, setSubAdminAllowedTabs] = useState<AdminTab[]>(['products', 'orders']);

  const handleAddWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContactName.trim() && newContactPhone.trim()) {
      addWhatsAppContact(newContactName, newContactPhone);
      setNewContactName('');
      setNewContactPhone('');
    }
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

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-extrabold text-black tracking-tight">Store Settings & Administration Control</h2>
        <p className="text-xs text-neutral-500">Configure online payment gateways, header icon visibility, category link toggles, and sub-admin team roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Payment Gateway Toggle */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Payment Gateway Status</h3>
              <p className="text-xs text-neutral-400">Toggle customer checkout online payment status</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-black block">Online Payments (UPI / Cards / COD)</span>
              <span className="text-[11px] text-neutral-500">
                {paymentEnabled ? 'Checkout payments are active.' : 'Online payments suspended.'}
              </span>
            </div>

            <button
              onClick={() => setPaymentEnabled(!paymentEnabled)}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                paymentEnabled ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {paymentEnabled ? 'ENABLED ✅' : 'DISABLED ❌'}
            </button>
          </div>
        </div>

        {/* Header Icons & Navigation Toggles */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Header Icons & Menu Display</h3>
              <p className="text-xs text-neutral-400">Enable or disable header icons & categories with auto right-alignment</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-bold">
            <span className="text-[10px] uppercase text-neutral-400 font-extrabold tracking-wider block">Header Action Icons</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'showSearch', label: 'Search Icon 🔍' },
                { key: 'showWishlist', label: 'Wishlist Icon ❤️' },
                { key: 'showAccount', label: 'Account Icon 👤' },
                { key: 'showTrackOrder', label: 'Track Order 📦' },
                { key: 'showCart', label: 'Cart Icon 🛍️' },
              ].map((item) => {
                const isEnabled = (headerSettings as any)[item.key] !== false;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => updateHeaderSettings({ [item.key]: !isEnabled })}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isEnabled ? 'bg-black text-white border-black' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] uppercase font-mono">{isEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[10px] uppercase text-neutral-400 font-extrabold tracking-wider block pt-3">Category Navigation Menus</span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isDisabled = (headerSettings?.disabledCategoryNames || []).includes(cat.name);
                return (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                    <span className="font-bold text-black">{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleCategoryMenu(cat.name)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                        isDisabled ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-black text-white'
                      }`}
                    >
                      {isDisabled ? 'DISABLED' : 'VISIBLE'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* WhatsApp Support Hotline Manager */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">WhatsApp Concierge Hotlines</h3>
              <p className="text-xs text-neutral-400">Manage customer support contact channels</p>
            </div>
          </div>

          <form onSubmit={handleAddWhatsApp} className="space-y-3 text-xs font-bold">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Channel Name (e.g. Bulk Orders)"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="p-2.5 rounded-xl border border-neutral-300 bg-neutral-50"
              />
              <input
                type="text"
                placeholder="Phone (+91 98765 43210)"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="p-2.5 rounded-xl border border-neutral-300 bg-neutral-50 font-mono"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Add WhatsApp Channel</span>
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {whatsappContacts.map((c) => (
              <div key={c.id} className="p-3 rounded-2xl border border-neutral-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-black block">{c.name}</span>
                  <span className="font-mono text-neutral-500">{c.phone}</span>
                </div>
                <button onClick={() => deleteWhatsAppContact(c.id)} className="p-1.5 text-neutral-400 hover:text-rose-600 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Store Brand Logo Manager (Drag & Drop Photo Upload) */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Store Brand Logo</h3>
              <p className="text-xs text-neutral-400">Drag & drop or select new logo photo from your files/folder</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-4">
            <DragDropImagePicker
              label="Change Store Logo"
              value={siteLogo}
              onChange={updateSiteLogo}
              helperText="Upload transparent PNG, JPG or SVG logo for crisp display across Header and Footer."
            />
          </div>
        </div>

        {/* Sub-Admin (Baby Admin) Role & Permission Access Manager */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Sub-Admin (Baby Admin) Team Management</h3>
              <p className="text-xs text-neutral-400">Create new admin accounts and grant specific permissions to tabs (Products, Orders, Banners, Analytics)</p>
            </div>
          </div>

          <form onSubmit={handleCreateSubAdminSubmit} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-4 text-xs font-bold">
            <span className="text-xs font-black uppercase text-black block">Add New Sub-Admin Account</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name (e.g. Rahul Sharma)"
                value={subAdminName}
                onChange={(e) => setSubAdminName(e.target.value)}
                className="p-2.5 bg-white border border-neutral-300 rounded-xl"
              />
              <input
                type="email"
                required
                placeholder="Email (e.g. subadmin@aura.com)"
                value={subAdminEmail}
                onChange={(e) => setSubAdminEmail(e.target.value)}
                className="p-2.5 bg-white border border-neutral-300 rounded-xl"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={subAdminPass}
                onChange={(e) => setSubAdminPass(e.target.value)}
                className="p-2.5 bg-white border border-neutral-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Role Title / Designation</label>
              <input
                type="text"
                placeholder="e.g. Inventory Manager, Order Fulfillment Specialist"
                value={subAdminRoleTitle}
                onChange={(e) => setSubAdminRoleTitle(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-500 mb-1.5">Grant Access Permissions (Select Allowed Tabs)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'products', label: 'Products & Inventory' },
                  { id: 'orders', label: 'Orders & Fulfillment' },
                  { id: 'analytics', label: 'Store Analytics' },
                  { id: 'banners', label: 'Hero Banners' },
                  { id: 'discounts', label: 'Coupons & Discounts' },
                  { id: 'locations', label: 'Delivery Cities' },
                  { id: 'notifications', label: 'Notifications' },
                  { id: 'settings', label: 'Settings & Security' },
                ].map((tabObj) => {
                  const isChecked = subAdminAllowedTabs.includes(tabObj.id as any);
                  return (
                    <button
                      key={tabObj.id}
                      type="button"
                      onClick={() => toggleTabPermission(tabObj.id as any)}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between text-[11px] transition-all cursor-pointer ${
                        isChecked ? 'bg-black text-white border-black font-extrabold' : 'bg-white text-neutral-600 border-neutral-300'
                      }`}
                    >
                      <span>{tabObj.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="px-5 py-3 bg-black text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-subtle">
              <UserPlus className="w-4 h-4" />
              <span>Create Sub-Admin Account</span>
            </button>
          </form>

          {/* Sub-Admins List */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-black uppercase text-black block">Active Sub-Admin Team Members ({subAdmins.length})</span>
            {subAdmins.length === 0 ? (
              <p className="text-xs text-neutral-400 italic p-4 border border-dashed rounded-2xl text-center">No sub-admin accounts created yet.</p>
            ) : (
              <div className="space-y-2">
                {subAdmins.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-black text-sm">{sub.name}</span>
                        <span className="bg-black text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">{sub.roleTitle}</span>
                      </div>
                      <p className="text-neutral-500 font-mono text-[11px]">{sub.email} • Created: {sub.createdAt}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">Access:</span>
                        {sub.allowedTabs.map((t) => (
                          <span key={t} className="bg-neutral-200 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => deleteSubAdmin(sub.id)} className="p-2 text-neutral-400 hover:text-rose-600 cursor-pointer" title="Remove Sub-Admin">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
