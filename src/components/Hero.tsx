'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin, ChevronDown, Car, User, Crosshair, Plus, Check, MessageCircle } from "lucide-react";

import BottomSheet from "@/components/BottomSheet";

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
  },
  {
    video: "/0426.mp4",
    subtitle: "PREMIUM SERVICE — DUBAI, UAE",
    title: "Ultimate\nShine &",
    titleAccent: "Protection",
    description: "Advanced ceramic coatings and paint correction to keep your vehicle looking brand new every single day.",
    cta: "SECURE BOOKING",
    link: "/bookings"
  },
  {
    video: "/0426.mp4",
    subtitle: "DOORSTEP CONVENIENCE — DUBAI, UAE",
    title: "Expert\nCare For Your",
    titleAccent: "Vehicle",
    description: "We bring the best detailing equipment and expertise directly to your location. Convenience without compromise.",
    cta: "SECURE BOOKING",
    link: "/bookings"
  }
];

export default function Hero() {
  const [selectedLocation, setSelectedLocation] = useState("Choose Location");
  const [selectedCar, setSelectedCar] = useState("Select Vehicle");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showCarPopup, setShowCarPopup] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  const [carHistory, setCarHistory] = useState<any[]>([]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setSelectedLocation("Locating...");
          
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            .then(res => res.json())
            .then(data => {
              const address = data.address.suburb || data.address.neighbourhood || data.address.city || data.display_name || locStr;
              setSelectedLocation(address);
              localStorage.setItem("userLocation", address);
              window.dispatchEvent(new Event("locationChanged"));
            })
            .catch(err => {
              console.error("Geocoding error:", err);
              setSelectedLocation(locStr);
              localStorage.setItem("userLocation", locStr);
              window.dispatchEvent(new Event("locationChanged"));
            });

        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };
  const images = ['/carousel-1.png', '/carousel-2.png', '/carousel-3.png'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const history = localStorage.getItem("mudwash_carHistory");
    if (history) {
      try {
        setCarHistory(JSON.parse(history));
      } catch (e) {}
    }
  }, []);

  const handleSelectCar = (car: any) => {
    setSelectedCar(car.model);
    localStorage.setItem("mudwash_carDetails", JSON.stringify(car));
    window.dispatchEvent(new Event("carChanged"));
    setShowVehicleDropdown(false);
  };

  useEffect(() => {
    const readLocation = () => {
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        setSelectedLocation(savedLocation);
      }
      const savedCar = localStorage.getItem("mudwash_carDetails");
      if (savedCar) {
        try {
          const parsed = JSON.parse(savedCar);
          if (parsed.model) setSelectedCar(parsed.model);
          else if (parsed.type) setSelectedCar(parsed.type);
        } catch (e) {}
      }
    };

    window.addEventListener("locationChanged", readLocation);
    window.addEventListener("carChanged", readLocation);
    readLocation(); // Run on mount

    return () => {
      window.removeEventListener("locationChanged", readLocation);
      window.removeEventListener("carChanged", readLocation);
    };
  }, []);

  return (
    <section className="relative w-full px-0">
      {/* ═══ MOBILE APP HERO ═══ */}
      <div className="md:hidden relative w-full h-[45svh] bg-[#050505] overflow-hidden">



        {/* Full-bleed image carousel background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.5 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={images[currentSlide]}
                alt="Premium Car Detailing"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                priority={currentSlide === 0}
                className="object-cover brightness-[0.7]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        </div>

        {/* ── TOP BAR: Greeting + Location ── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute top-0 left-0 right-0 z-30 pt-4 px-4 flex flex-col gap-3"
        >
          {/* Top Row: Logo + WhatsApp */}
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="shrink-0">
              <img src="/mudwash-logo-final.png" alt="MUDWASH" className="h-6 w-auto object-contain" />
            </Link>
            
            {/* WhatsApp Icon */}
            <a 
              href="https://wa.me/971500000000" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 448 512" fill="currentColor" className="w-5 h-5 text-white">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l114.1-29.9c32.4 18.2 69 27.8 106.6 27.8 122.4 0 222-99.6 222-222 0-59.3-23.2-115.1-65.1-157.1zM223.9 446c-33.1 0-65.6-8.9-93.9-25.7l-6.7-4-69.7 18.3 18.6-68-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.5-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 54.1 81.2 54.1 130.4 0 101.7-82.8 184.5-184.5 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.5-27.5-16.4-14.6-27.5-32.7-30.7-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.5-9.3 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
            </a>

          </div>

          {/* Bottom Row: Unified Location & Car Bar */}
          <div className="grid grid-cols-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl h-12">

            {/* Location Selector */}
            <div className="relative min-w-0 border-r border-white/10 flex items-center justify-between">
              {/* Clickable Area for Navigation */}
              <button
                onClick={() => setShowLocationPopup(true)}
                className="flex items-center gap-2 min-w-0 flex-grow hover:bg-white/5 transition-all rounded-l-xl h-full px-3"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <MapPin size={14} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[8px] font-black uppercase text-white/40 leading-none mb-0.5">Location</p>
                  <span className="text-xs font-bold text-white truncate block">{selectedLocation}</span>
                </div>
              </button>

              {/* Tracking Button (Locate Me) */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleLocateMe();
                }}
                className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors shrink-0 mr-2"
                title="Use current location"
              >
                <Crosshair size={12} />
              </button>
            </div>

            {/* Car Selector */}
            <div className="relative min-w-0">
              <button 
                onClick={() => setShowCarPopup(true)}
                className="w-full h-full px-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-all rounded-r-xl"
              >
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-brand-orange shrink-0">
                  <Car size={12} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[8px] font-black uppercase text-white/40 leading-none mb-0.5">Car</p>
                  <span className="text-xs font-bold text-white truncate block">{selectedCar}</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── CENTRE: Hero Tagline ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="absolute inset-0 z-20 flex items-center justify-center px-6 pt-8"
        >
          <div className="text-center">

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


        </motion.div>
      </div>


      {/* Desktop Hero - Full viewport height, sits behind navbar */}
      <div className="hidden md:block relative h-screen w-full overflow-hidden bg-[#050505]">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.5 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={images[currentSlide]}
                alt="Premium Car Detailing"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                priority={currentSlide === 0}
                className="object-cover grayscale-[0.2] brightness-[0.6]"
              />
            </motion.div>
          </AnimatePresence>
          
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


      {/* Popups */}
      <BottomSheet
        isOpen={showLocationPopup}
        onClose={() => setShowLocationPopup(false)}
        title="Choose Location"
      >
        <div className="space-y-4">
          <button
            onClick={() => {
              handleLocateMe();
              setShowLocationPopup(false);
            }}
            className="w-full bg-brand-orange text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Crosshair size={16} />
            Use Current Location
          </button>

          {/* Search Input */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search area..." 
              value={locationSearchQuery}
              onChange={e => setLocationSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none transition-all text-white placeholder:text-white/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DUBAI_LOCATIONS.filter(loc => loc.toLowerCase().includes(locationSearchQuery.toLowerCase())).map((loc) => (

              <button
                key={loc}
                onClick={() => {
                  setSelectedLocation(loc);
                  localStorage.setItem("userLocation", loc);
                  window.dispatchEvent(new Event("locationChanged"));
                  setShowLocationPopup(false);
                }}
                className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  selectedLocation === loc
                    ? 'bg-brand-orange border-brand-orange text-black'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={showCarPopup}
        onClose={() => setShowCarPopup(false)}
        title="Select Vehicle"
      >
        <div className="space-y-4">
          {carHistory.length > 0 ? (
            <div className="space-y-2">
              {carHistory.map((car, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectCar(car)}
                  className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-white text-sm">{car.model}</p>
                    <p className="text-white/40 text-xs">{car.type}</p>
                  </div>
                  {selectedCar === car.model && (
                    <div className="w-5 h-5 rounded-full bg-brand-orange flex items-center justify-center text-black">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-white/40 text-sm mb-4">No car history found</p>
            </div>
          )}
          
          <Link
            href="/bookings?step=1"
            className="w-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange font-bold uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-brand-orange/20"
            onClick={() => setShowCarPopup(false)}
          >
            <Plus size={16} />
            Add New Car
          </Link>
        </div>
      </BottomSheet>
    </section>
  );
}


