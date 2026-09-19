import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Utensils } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center">
        <Utensils className="w-9 h-9 text-neutral-400" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">404 — Page Not Found</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Looking for Delicious Homemade Delicacies?</h1>
        <p className="text-xs text-neutral-500 leading-relaxed">
          The page you requested could not be found or has moved. Explore our freshly prepared authentic pickles, sweets, and savories.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-subtle"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </button>
        <button
          onClick={() => navigate('/products')}
          className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-neutral-200"
        >
          <span>Browse All Products 🛍️</span>
        </button>
      </div>
    </div>
  );
};
