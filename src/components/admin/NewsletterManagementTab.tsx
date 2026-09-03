import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

export const NewsletterManagementTab: React.FC = () => {
  const { newsletterSubscribers, addToast } = useApp();

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      addToast('Broadcast Sent!', `Promotional email sent to ${newsletterSubscribers.length} subscribers.`, 'success');
      setSubject('');
      setContent('');
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-extrabold text-black tracking-tight">Newsletter & Email Broadcasts</h2>
        <p className="text-xs text-neutral-500">Send product announcement emails to subscribed homemade food lovers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email Broadcast Form */}
        <form onSubmit={handleSendBroadcast} className="lg:col-span-7 bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 text-xs font-bold">
          <h3 className="text-sm font-extrabold text-black flex items-center gap-2">
            <Mail className="w-4 h-4 text-black" />
            <span>Compose Promotional Broadcast</span>
          </h3>

          <div>
            <label className="block text-neutral-500 mb-1">Email Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. 🥭 Fresh Batch of Grandma Avakaya Mango Pickle Arrived!"
              className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50"
            />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Email Body Content</label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write announcement details..."
              className="w-full p-3 rounded-2xl border border-neutral-300 bg-neutral-50 font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-subtle"
          >
            {isSending ? (
              <span>Sending Broadcast...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Broadcast to {newsletterSubscribers.length} Subscribers</span>
              </>
            )}
          </button>
        </form>

        {/* Subscribers List */}
        <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Subscribed Customers ({newsletterSubscribers.length})</span>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {newsletterSubscribers.map((email, idx) => (
              <div key={idx} className="p-3 bg-white rounded-2xl border border-neutral-200 text-xs font-mono font-bold text-black flex items-center justify-between">
                <span>{email}</span>
                <CheckCircle2 className="w-4 h-4 text-black" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
