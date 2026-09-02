import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Check, X, FileText, AlertCircle } from 'lucide-react';

export const AdminVerificationPage: React.FC = () => {
  const { chefs, updateChefStatus, addToast } = useApp();

  const pendingChefs = chefs.filter((c) => c.status === 'Pending');

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Compliance & Safety</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Chef Verification Workspace</h1>
      </div>

      {pendingChefs.length === 0 ? (
        <div className="p-12 border border-dashed border-neutral-300 rounded-3xl text-center bg-neutral-50 space-y-2">
          <ShieldCheck className="w-10 h-10 text-black mx-auto" />
          <h3 className="text-base font-extrabold text-black">All Partner Chefs Verified</h3>
          <p className="text-xs text-neutral-500">There are no pending kitchen verification applications right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingChefs.map((chef) => (
            <div key={chef.id} className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-modal space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-4">
                  <img src={chef.avatar} alt={chef.name} className="w-14 h-14 rounded-full object-cover border border-neutral-200" />
                  <div>
                    <h3 className="text-lg font-bold text-black">{chef.name}</h3>
                    <p className="text-xs text-neutral-500">{chef.location} • Applied on {chef.joinedDate}</p>
                  </div>
                </div>
                <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                  Status: {chef.status}
                </span>
              </div>

              {/* Specialty & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div>
                  <p className="text-neutral-400 uppercase text-[10px]">Cuisine Specialty</p>
                  <p className="text-black">{chef.specialty}</p>
                </div>
                <div>
                  <p className="text-neutral-400 uppercase text-[10px]">Experience</p>
                  <p className="text-black">{chef.experienceYears} Years</p>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black">Uploaded Regulatory Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(chef.documents || []).map((doc) => (
                    <div key={doc.id} className="p-3.5 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-black" />
                        <div>
                          <p className="text-xs font-bold text-black">{doc.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">Type: {doc.type}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-neutral-100 text-black font-bold px-2 py-0.5 rounded border border-neutral-200">
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => updateChefStatus(chef.id, 'Verified')}
                  className="flex-1 py-3 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Enable Kitchen</span>
                </button>

                <button
                  onClick={() => {
                    addToast('Changes Requested', 'Notification sent to chef asking for updated document re-upload.', 'info');
                  }}
                  className="flex-1 py-3 bg-white border border-neutral-300 text-black text-xs font-extrabold rounded-2xl hover:bg-neutral-100"
                >
                  Request Document Changes
                </button>

                <button
                  onClick={() => updateChefStatus(chef.id, 'Rejected')}
                  className="py-3 px-5 border border-neutral-300 text-rose-600 text-xs font-extrabold rounded-2xl hover:border-rose-600"
                >
                  Reject
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
