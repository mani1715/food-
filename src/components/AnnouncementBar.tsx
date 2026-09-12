import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const DEFAULT_ANNOUNCEMENTS = [
  '🌶️ Fresh Homemade Andhra Pickles Delivered Daily Nationwide',
  '🍯 Pure Ghee Sweets & Authentic Delicacies Crafted with Love',
  '🎁 Festival Gift Boxes & Return Gift Hampers Special Discount',
  '✨ Free Shipping On Orders Above ₹499 • Fresh Batch Guarantee',
];

export const AnnouncementBar: React.FC = () => {
  const { headerSettings } = useApp();
  const [index, setIndex] = useState(0);

  if (headerSettings?.showTopRotatingBar === false) {
    return null;
  }

  const rawList =
    headerSettings?.topRotatingAnnouncements && headerSettings.topRotatingAnnouncements.length > 0
      ? headerSettings.topRotatingAnnouncements.filter((a) => a.enabled !== false).map((a) => a.text)
      : DEFAULT_ANNOUNCEMENTS;

  const announcements = rawList.length > 0 ? rawList : DEFAULT_ANNOUNCEMENTS;

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const safeIndex = index % (announcements.length || 1);

  return (
    <div className="bg-black text-white py-2 px-4 text-center text-xs font-semibold overflow-hidden border-b border-neutral-800">
      <AnimatePresence mode="wait">
        <motion.div
          key={safeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="truncate tracking-wide"
        >
          {announcements[safeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
