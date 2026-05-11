'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const comparisons = [
    { title: "Exterior", before: "/car-dirty.png", after: "/car-clean.png" },
    { title: "Interior", before: "/interior-dirty.png", after: "/interior-clean.png" },
    { title: "Detailing", before: "/detailing-dirty.png", after: "/detailing-clean.png" }
  ];

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', stopDragging);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging]);

  return (
    <section className="py-24 bg-[#0A0A0A] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <span className="text-brand-orange text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
            Transformation
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            See the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-yellow-500">Difference</span>
          </h2>
          <p className="text-white/50 text-sm max-w-xl mx-auto mb-8">
            Drag the slider to see our premium detailing transformation. From heavily soiled to showroom perfection.
          </p>

          {/* Tabs */}
          <div className="flex justify-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/5 max-w-sm mx-auto mb-8">
            {comparisons.map((tab, i) => (
              <button
                key={tab.title}
                onClick={() => setActiveTab(i)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === i ? 'bg-brand-orange text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`relative w-full max-w-5xl mx-auto aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group cursor-ew-resize ${isDragging ? 'select-none' : ''}`}
          ref={containerRef}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleMove(e.touches[0].clientX);
          }}
        >
          {/* Dirty Car Image (Background) */}
          <div className="absolute inset-0 pointer-events-none">
            <Image 
              src={comparisons[activeTab].before} 
              alt="Before" 
              fill 
              className="object-cover" 
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>

          {/* Clean Car Image (Clipped Overlay) */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{ 
              clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
              WebkitClipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`
            }}
          >
            <Image 
              src={comparisons[activeTab].after} 
              alt="After" 
              fill 
              className="object-cover" 
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>

          {/* Slider Handle Line */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Slider Handle Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-brand-orange rounded-full flex items-center justify-center shadow-lg border-2 border-white pointer-events-auto shadow-[0_0_15px_rgba(246,150,33,0.5)] transition-transform group-hover:scale-110 active:scale-95">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 8L4 12L8 16" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 8L20 12L16 16" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest pointer-events-none z-10">
            Before
          </div>
          <div className="absolute top-6 right-6 bg-brand-orange/20 text-brand-orange backdrop-blur-md border border-brand-orange/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest pointer-events-none z-10">
            After
          </div>

        </motion.div>
      </div>
    </section>
  );
}
