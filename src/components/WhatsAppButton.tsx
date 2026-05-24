'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';

export default function WhatsAppButton() {
  const phoneNumber = '971502374199';
  const message = "Hi Mudwash! I'd like to book a service for my car. Can you share your packages and availability?";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  const x = useMotionValue(0);
  
  // Transform x (ranges from -150 to 0) to capsule width (expanded: 196px, closed: 46px)
  const trackWidth = useTransform(x, [-150, 0], [196, 46], { clamp: false });
  const opacity = useTransform(x, [-100, 0], [1, 0]);
  
  const [hasTriggered, setHasTriggered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Auto-dismiss tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const openWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
    setShowTooltip(false);
  };

  const handleTap = () => {
    // Immediate click / tap opens WhatsApp directly
    openWhatsApp();
  };

  const handleDragEnd = (event: any, info: any) => {
    // Dismiss tooltip on drag
    setShowTooltip(false);

    // Require a full slide (dragged past -110px) to trigger the WhatsApp link
    if ((info.offset.x < -110 || x.get() < -110) && !hasTriggered) {
      setHasTriggered(true);
      openWhatsApp();
      // Reset trigger state after a delay
      setTimeout(() => setHasTriggered(false), 1000);
    }
    
    // Auto back: Smoothly animate the handle position (x) back to 0 on release
    animate(x, 0, { type: 'spring', stiffness: 350, damping: 28 });
  };

  return (
    <div className="fixed right-0 top-[88%] -translate-y-1/2 z-[1000] flex items-center justify-end select-none h-[100px] w-[350px] pointer-events-none">
      
      {/* Tooltip hint for direct visual explanation */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleTap}
            className="absolute right-[62px] top-1/2 -translate-y-1/2 bg-[#0c1510]/95 border border-[#25D366]/40 text-[#25D366] text-[11px] font-bold py-2 px-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center gap-2 pointer-events-auto cursor-pointer whitespace-nowrap z-30"
          >
            {/* Pulsing online green dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]"></span>
            </span>
            <span className="tracking-wider">Chat on WhatsApp</span>
            
            {/* Close button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-white/40 hover:text-white/80 ml-1 transition-colors text-[9px] flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/10"
              aria-label="Close tooltip"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background slide reveal track - Expands dynamically to the left of the handle */}
      <motion.div
        style={{ width: trackWidth, opacity }}
        className="absolute right-0 flex items-center justify-start bg-[#0a110d]/95 border border-[#25D366]/35 rounded-l-[20px] rounded-r-none backdrop-blur-md shadow-[0_0_20px_rgba(37,211,102,0.15)] h-[84px] overflow-hidden z-10"
      >
        {/* Inner wrapper to prevent content squishing during expand (mask reveal effect) */}
        <div className="flex items-center gap-3 min-w-[190px] pl-[56px] h-full">
          {/* Outlined WhatsApp brand icon */}
          <div className="flex items-center justify-center shrink-0">
            <svg 
              viewBox="0 0 24 24" 
              width="18" 
              height="18" 
              fill="currentColor"
              className="text-[#25D366]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          
          {/* Clean text displayed inside the track */}
          <span className="text-[#25D366] text-[10px] font-black uppercase tracking-widest whitespace-nowrap select-none">Open WhatsApp</span>
        </div>
      </motion.div>

      {/* Pulsing glow underlay for the closed handle to draw positive UX attention */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[46px] h-[84px] rounded-l-[20px] bg-[#25D366]/20 blur-md pointer-events-none animate-pulse z-15" />

      {/* Draggable side tab / handle - Branded in WhatsApp Green gradient, clickable and slideable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.05}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        className="pointer-events-auto flex items-center justify-center w-[46px] h-[84px] bg-gradient-to-b from-[#25D366] via-[#128C7E] to-[#0b663b] backdrop-blur-xl border border-white/[0.15] hover:border-[#25D366]/50 rounded-l-[20px] shadow-[-6px_4px_24px_rgba(37,211,102,0.35)] cursor-pointer group select-none relative overflow-hidden z-20"
      >
        {/* Shimmer light reflect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.08] to-transparent pointer-events-none" />
        
        {/* Main White WhatsApp Icon perfectly centered and slightly smaller */}
        <div className="flex items-center justify-center text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
          <svg 
            viewBox="0 0 24 24" 
            width="20" 
            height="20" 
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
      </motion.div>

    </div>
  );
}
