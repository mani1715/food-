import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_ANNOUNCEMENTS } from '../data/mockData';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MOCK_ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-black text-white text-xs py-2.5 px-4 border-b border-neutral-800 tracking-wide font-medium relative z-40"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse-subtle" />
          <span className="uppercase tracking-widest text-[10px] font-bold text-neutral-300">Aura Kitchens</span>
        </div>

        <div className="flex-1 overflow-hidden h-5 flex items-center justify-center text-center px-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-neutral-100 truncate cursor-pointer font-sans"
            >
              {MOCK_ANNOUNCEMENTS[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIndex((prev) => (prev === 0 ? MOCK_ANNOUNCEMENTS.length - 1 : prev - 1))}
            className="p-1 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors"
            aria-label="Previous announcement"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-neutral-500">
            {index + 1}/{MOCK_ANNOUNCEMENTS.length}
          </span>
          <button
            onClick={() => setIndex((prev) => (prev + 1) % MOCK_ANNOUNCEMENTS.length)}
            className="p-1 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors"
            aria-label="Next announcement"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
