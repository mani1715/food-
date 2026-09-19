import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { sendPasswordResetEmail } from '../../lib/supabase/auth';

export const AdminProfileTab: React.FC = () => {
  const { addToast, currentAdminRole, currentAdminEmail, currentAdminIdentity } = useApp();

  const isSuperAdmin = currentAdminRole === 'super_admin';
  const email = currentAdminEmail || 'admin@aishufoods.com';
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSendPasswordReset = async () => {
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(email);
      setResetSent(true);
      addToast(
        'Password Reset Email Sent 📧',
        `A secure password reset link has been dispatched to ${email}.`,
        'success'
      );
    } catch (err: any) {
      console.error('Password reset dispatch error:', err);
      addToast('Reset Error', 'Could not send reset email. Please try again.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-black tracking-tight">
            {isSuperAdmin ? 'Super Admin Profile & Governance' : 'Admin Profile & Account Security'}
          </h2>
          {isSuperAdmin ? (
            <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black px-2.5 py-0.5 rounded-full uppercase border border-amber-500/30 shadow-xs">
              👑 Super Admin
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-neutral-200 text-neutral-800 px-2.5 py-0.5 rounded-full uppercase">
              {currentAdminRole?.replace('_', ' ') || 'Staff'}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          {isSuperAdmin 
            ? 'Platform owner profile with database governance rights.' 
            : 'Manage administrator account profile and security credentials.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 text-xs font-bold">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <div className={`w-10 h-10 rounded-2xl ${isSuperAdmin ? 'bg-amber-400 text-black font-black' : 'bg-black text-white font-extrabold'} flex items-center justify-center text-sm shadow-xs`}>
              {isSuperAdmin ? '👑' : 'A'}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-black">
                {currentAdminIdentity?.name || 'Store Administrator'}
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                {isSuperAdmin ? 'Super Admin / Platform Owner' : `Role: ${currentAdminRole}`}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Registered Administrator Email</label>
            <input
              type="email"
              readOnly
              value={email}
              className="w-full p-3 rounded-2xl border border-neutral-200 bg-neutral-50 font-mono text-neutral-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Account Status</label>
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified & Active (Database Enforced)</span>
            </div>
          </div>
        </div>

        {/* Security Password Change Card */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 text-xs">
          <div className="flex items-center gap-3 border-b border-neutral-200 pb-3">
            <KeyRound className="w-5 h-5 text-black" />
            <h3 className="text-sm font-extrabold text-black">Authentication & Password Reset</h3>
          </div>

          <p className="text-neutral-600 font-medium leading-relaxed">
            Administrative passwords are authenticated securely using Supabase Auth. To change your password, trigger a secure one-time reset link.
          </p>

          <button
            type="button"
            onClick={handleSendPasswordReset}
            disabled={isSendingReset}
            className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-subtle"
          >
            {isSendingReset ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending Reset Link...</span>
              </>
            ) : resetSent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Reset Link Sent (Check Inbox)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Send Password Reset Email</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
