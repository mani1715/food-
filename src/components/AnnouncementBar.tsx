import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ANNOUNCEMENTS = [
  '🌶️ Fresh Homemade Andhra Pickles Delivered Daily Nationwide',
  '🍯 Pure Ghee Sweets & Authentic Delicacies Crafted with Love',
  '🎁 Festival Gift Boxes & Return Gift Hampers Special Discount',
  '✨ Free Shipping On Orders Above $35 • Fresh Batch Guarantee',
];

export const AnnouncementBar: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-black text-white py-2 px-4 text-center text-xs font-semibold overflow-hidden border-b border-neutral-800">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="truncate"
        >
          {ANNOUNCEMENTS[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
