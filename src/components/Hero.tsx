'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin, ChevronDown } from "lucide-react";

const DUBAI_LOCATIONS = [
  "Downtown Dubai",
  "Dubai Marina",
  "Jumeirah Village Circle",
  "Palm Jumeirah",
  "Business Bay",
  "JLT",
  "Al Barsha",
  "Dubai Hills",
  "Mirdif",
  "Deira",
  "Bur Dubai",
  "Silicon Oasis",
  "Jumeirah",
  "Al Quoz",
  "Discovery Gardens",
  "International City",
];

const heroData = [
  {
    video: "/0426.mp4",
    subtitle: "ESTABLISHED 2024 — DUBAI, UAE",
    title: "Mastering\nThe Art Of",
    titleAccent: "Detailing",
    description: "Experience the pinnacle of automotive care with our bespoke mobile detailing services. Precision, passion, and unparalleled shine delivered to your doorstep.",
    cta: "SECURE BOOKING",
    link: "/bookings"
  }
];

export default function Hero() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Choose Location");
  const currentSlide = 0;

  useEffect(() => {
    // Fallback: Show video after 3 seconds if events don't fire
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const readLocation = () => {
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        setSelectedLocation(savedLocation);
      }
    };

    window.addEventListener("locationChanged", readLocation);
    readLocation(); // Run on mount

    return () => window.removeEventListener("locationChanged", readLocation);
  }, []);

  return (
    <section className="relative w-full px-0">
      {/* ═══ MOBILE APP HERO ═══ */}
      <div className="md:hidden relative w-full h-[45svh] bg-[#050505] overflow-hidden">

        {/* Full-bleed video background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence>
            {!videoLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-[#050505] flex items-center justify-center"
              >
                <div className="w-10 h-10 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          <video
            src="/0426.mp4"
            autoPlay muted loop playsInline preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            onPlaying={() => setVideoLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        </div>

        {/* ── TOP BAR: Greeting + Location ── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute top-0 left-0 right-0 z-30 pt-8 px-5 flex items-start justify-between"
        >
          <div>
            <p className="text-white/50 text-[9px] font-semibold uppercase tracking-widest">Good Day 👋</p>
            <h2 className="text-white text-base font-black tracking-tight mt-0.5">
              MUD<span className="text-brand-orange">WASH</span>
            </h2>
          </div>

          {/* Location pill */}
          <Link href="/location" className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 mt-1 text-white hover:bg-white/20 transition-colors">
            <MapPin size={12} className="text-brand-orange" />
            <span className="text-[10px] font-bold truncate max-w-[100px]">{selectedLocation}</span>
            <ChevronDown size={12} className="text-white/50" />
          </Link>
        </motion.div>

        {/* ── CENTRE: Hero Tagline ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="absolute inset-0 z-20 flex items-center justify-center px-6 pt-8"
        >
          <div className="text-center">
            <p className="text-brand-orange text-[8px] font-black uppercase tracking-[0.4em] mb-2">
              Premium Auto Care
            </p>
            <h1 className="text-[1.5rem] font-black text-white uppercase italic leading-[1] tracking-tighter drop-shadow-lg">
              Mastering The Art Of<br />
              <span className="text-brand-orange">Detailing</span>
            </h1>
          </div>
        </motion.div>

        {/* ── BOTTOM CARD: Quick Actions + CTA ── */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7, type: 'spring', stiffness: 120 }}
          className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4"
        >
          {/* Quick service chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
            {['Exterior Wash', 'Interior Clean', 'Ceramic Coat', 'Paint Correct', 'Full Detail'].map((service, i) => (
              <motion.div
                key={service}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5"
              >
                <span className="text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{service}</span>
              </motion.div>
            ))}
          </div>

          {/* Main CTA Card */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center justify-between shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Starting from</p>
              <p className="text-white font-black text-xl leading-tight">AED 99<span className="text-white/30 text-xs font-medium">/session</span></p>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-2.5 h-2.5 text-brand-orange fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <span className="text-white/50 text-[9px] font-bold">4.9 (5k+ washes)</span>
              </div>
            </div>

            <button
              onClick={() => {
                const contactForm = document.getElementById('booking-contact-form');
                if (contactForm) {
                  contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex items-center gap-2 bg-brand-orange text-black px-5 py-3.5 rounded-2xl font-black uppercase italic text-[11px] tracking-wider active:scale-95 transition-transform shadow-[0_8px_25px_rgba(246,150,33,0.4)]"
            >
              Book Now
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>


      {/* Desktop Hero - Full viewport height, sits behind navbar */}
      <div className="hidden md:block relative h-screen w-full overflow-hidden bg-[#050505]">
        <div className="absolute inset-0">
          <AnimatePresence>
            {!videoLoaded && (
              <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#050505] flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
                  <span className="text-xs font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">Mastering the Art...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <video 
            src={heroData[currentSlide].video}
            autoPlay 
            muted 
            loop 
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            className={`w-full h-full object-cover grayscale-[0.2] brightness-[0.7] transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {/* Dynamic Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent w-full z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(246,150,33,0.05)_0%,transparent_50%)] z-10" />
          
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-16 lg:px-24">
            <div className="max-w-3xl">
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "circOut" }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-[2px] bg-brand-orange" />
                  <span className="text-brand-orange text-[10px] font-black tracking-[0.6em] uppercase italic">
                    {heroData[currentSlide].subtitle}
                  </span>
                </div>
                
                <h1 className="text-[3.5rem] lg:text-[5.5rem] font-black text-white uppercase italic leading-[0.88] mb-6 tracking-tighter">
                  {heroData[currentSlide].title}<br/>
                  <span className="relative inline-block mt-1">
                    <span className="absolute inset-0 text-transparent pointer-events-none select-none" 
                          style={{ WebkitTextStroke: '2px #f69621' }}>
                      {heroData[currentSlide].titleAccent}
                    </span>
                    <span className="absolute inset-0 text-brand-orange mix-blend-overlay opacity-80 pointer-events-none select-none">
                      {heroData[currentSlide].titleAccent}
                    </span>
                    <span className="relative text-brand-orange">
                      {heroData[currentSlide].titleAccent}
                    </span>
                  </span>
                </h1>

                <p className="text-white/40 text-base max-w-md mb-8 font-medium leading-relaxed border-l-2 border-brand-orange/20 pl-6">
                  {heroData[currentSlide].description}
                </p>

                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => {
                      const contactForm = document.getElementById('booking-contact-form');
                      if (contactForm) {
                        contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="group inline-flex items-center gap-4 bg-brand-orange text-black px-8 py-4 rounded-xl font-black uppercase italic text-sm tracking-[0.2em] transition-all duration-500 hover:scale-105 shadow-[0_15px_30px_rgba(246,150,33,0.25)]"
                  >
                    <span>{heroData[currentSlide].cta}</span>
                    <div className="bg-black/10 p-1 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </button>

                  <div className="flex flex-col">
                    <span className="text-white font-black text-xl leading-none">4.9/5</span>
                    <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-1">Customer Rating</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

