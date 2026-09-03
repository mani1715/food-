import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

export const AdminProfileTab: React.FC = () => {
  const { addToast } = useApp();

  const [email, setEmail] = useState('admin@aura.com');
  const [phone, setPhone] = useState('+91 98765 00000');

  // Security Password OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Profile Updated', 'Admin account credentials updated.', 'success');
  };

  const handleSendOTP = () => {
    setOtpSent(true);
    addToast('OTP Sent', `Verification code sent to ${email} (Demo OTP: 123456)`, 'info');
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === '123456' || otpInput.length === 6) {
      addToast('Password Changed', 'Admin master password updated successfully.', 'success');
      setShowOtpModal(false);
      setOtpSent(false);
      setOtpInput('');
      setNewPassword('');
    } else {
      addToast('Invalid OTP', 'Please enter demo code 123456.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-extrabold text-black tracking-tight">Admin Profile & Master Security</h2>
        <p className="text-xs text-neutral-500">Manage administrator account profile and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <form onSubmit={handleUpdateProfile} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 text-xs font-bold">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-extrabold text-sm">
              A
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-black">Aura Master Administrator</h3>
              <p className="text-[10px] text-neutral-400 font-mono">Store Superuser</p>
            </div>
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Admin Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-2xl border border-neutral-300" />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Contact Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 rounded-2xl border border-neutral-300 font-mono" />
          </div>

          <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl">
            Save Profile Details
          </button>
        </form>

        {/* Security Password Change Card */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 text-xs">
          <div className="flex items-center gap-3 border-b border-neutral-200 pb-3">
            <KeyRound className="w-5 h-5 text-black" />
            <h3 className="text-sm font-extrabold text-black">Security Credentials & OTP</h3>
          </div>

          <p className="text-neutral-600 font-medium">
            Updating master admin password requires OTP verification sent to your registered administrator email.
          </p>

          <button
            onClick={() => setShowOtpModal(true)}
            className="w-full py-3.5 bg-white border-2 border-black text-black text-xs font-extrabold rounded-2xl hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Request OTP & Reset Master Password</span>
          </button>
        </div>

      </div>

      {/* OTP Password Reset Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-modal text-left text-xs font-bold">
            <h3 className="text-base font-extrabold text-black">OTP Security Password Reset</h3>

            {!otpSent ? (
              <div className="space-y-3">
                <p className="text-neutral-500 font-normal">Click below to send a 6-digit OTP code to <strong className="text-black">{email}</strong>.</p>
                <button onClick={handleSendOTP} className="w-full py-3 bg-black text-white rounded-2xl font-extrabold">
                  Send OTP Code
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Enter 6-Digit OTP Code (Use 123456)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="123456"
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono text-center tracking-widest text-base"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">New Master Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 rounded-2xl border border-neutral-300"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowOtpModal(false)} className="flex-1 py-3 bg-neutral-100 text-black rounded-2xl font-extrabold">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-3 bg-black text-white rounded-2xl font-extrabold">
                    Verify & Save Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
