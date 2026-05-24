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
                    <div className="text-[8px] text-white/60 uppercase tracking-widest">Certified 2026</div>
                  </div>
                </div>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://wa.me/971502374199?text=${encodeURIComponent("Hi Mudwash! I'd like to book a services for my car. Can you share your packages and availability?")}`, '_blank');
                  }}
                  className="px-3 py-2 rounded-full bg-[#25D366]/20 border border-[#25D366]/35 flex items-center gap-1.5 cursor-pointer hover:bg-[#25D366]/35 active:scale-95 transition-all shadow-[0_0_15px_rgba(37,211,102,0.15)] pointer-events-auto shrink-0"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="14" 
                    height="14" 
                    fill="currentColor"
                    className="text-[#25D366]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="text-[#25D366] text-[9px] font-black uppercase tracking-wider select-none">
                    Book Chat
                  </span>
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
                className="w-full bg-[#f69621] text-black py-5 rounded-2xl font-black uppercase italic text-sm tracking-[0.2em] shadow-[0_15px_35px_rgba(246,150,33,0.4)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Get Started</span>
                <svg 
                  className="w-4 h-4 text-black shrink-0 stroke-[3.5] -italic" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
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
