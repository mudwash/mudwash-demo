'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function AppSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    if (typeof window !== 'undefined') {
      const hasSeenSplash = localStorage.getItem('mudwash_splash_seen');
      
      // Only show on mobile and if not seen before
      if (window.innerWidth < 768 && !hasSeenSplash) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('mudwash_splash_seen', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.1,
            filter: "blur(20px)",
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden md:hidden"
        >
          {/* Background Image Container */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/car-wash-pro.png"
              alt="Professional Car Washer"
              fill
              priority
              className="object-cover object-center brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          </div>

          {/* Top Logo Area */}
          <div className="relative z-10 flex justify-center pt-12">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <img src="/mudwash-logo-final.png" alt="MUDWASH" className="h-14 w-auto object-contain drop-shadow-2xl" />
            </motion.div>
          </div>

          {/* Bottom Content Area */}
          <div className="relative z-10 mt-auto px-8 pb-14 space-y-8">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="space-y-4"
            >
              <h2 className="text-white text-[44px] leading-[0.95] font-black uppercase italic tracking-tighter">
                All-In-One App <br />
                For <span className="text-brand-orange">Car Care</span>
              </h2>

              <div className="inline-flex items-center px-4 py-2 bg-[#F69621] rounded-full">
                <span className="text-black text-[10px] font-black uppercase tracking-wider">
                  5k+ successful washes completed.
                </span>
              </div>
            </motion.div>

            {/* Awards / Trust Badges Area */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-white">
                    <div className="text-2xl font-black leading-none">50+</div>
                    <div className="text-[8px] uppercase tracking-widest opacity-60">Services</div>
                  </div>
                  <div className="w-[1px] h-8 bg-white/20" />
                  <div>
                    <div className="text-xs text-white font-bold">Premium Quality</div>
                    <div className="text-[8px] text-white/60 uppercase tracking-widest">Certified 2024</div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-brand-orange animate-pulse" />
                </div>
              </div>
            </motion.div>

            {/* Action Button - Always Visible */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <button
                onClick={handleGetStarted}
                className="w-full bg-[#f69621] text-black py-5 rounded-2xl font-black uppercase italic text-sm tracking-[0.2em] shadow-[0_15px_35px_rgba(246,150,33,0.4)] active:scale-95 transition-all"
              >
                Get Started →
              </button>
            </motion.div>

            {/* Home Bar */}
            <div className="flex justify-center">
              <div className="w-32 h-1.5 bg-white/20 rounded-full" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
