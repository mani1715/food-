import React from 'react';

export const DishCardSkeleton: React.FC = () => {
  return (
    <div className="border border-neutral-200 rounded-3xl overflow-hidden bg-white p-3 space-y-3 shadow-subtle">
      <div className="w-full h-48 rounded-2xl skeleton-shimmer" />
      <div className="space-y-2 px-1">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-12 rounded-lg skeleton-shimmer" />
        </div>
        <div className="h-6 w-3/4 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
        <div className="pt-2 flex items-center justify-between">
          <div className="h-6 w-16 rounded-lg skeleton-shimmer" />
          <div className="h-10 w-24 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const ChefCardSkeleton: React.FC = () => {
  return (
    <div className="border border-neutral-200 rounded-3xl overflow-hidden bg-white p-4 space-y-4 shadow-subtle min-w-[280px]">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full skeleton-shimmer shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-24 rounded-lg skeleton-shimmer" />
        </div>
      </div>
      <div className="w-full h-36 rounded-2xl skeleton-shimmer" />
      <div className="h-4 w-full rounded-lg skeleton-shimmer" />
      <div className="h-10 w-full rounded-2xl skeleton-shimmer" />
    </div>
  );
};

export const CategorySkeleton: React.FC = () => {
  return (
    <div className="border border-neutral-200 rounded-3xl p-4 bg-white flex flex-col items-center space-y-3 shadow-subtle">
      <div className="w-20 h-20 rounded-full skeleton-shimmer" />
      <div className="h-5 w-20 rounded-lg skeleton-shimmer" />
      <div className="h-3 w-12 rounded-lg skeleton-shimmer" />
    </div>
  );
};
