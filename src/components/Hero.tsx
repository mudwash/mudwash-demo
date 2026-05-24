'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, MapPin, ChevronDown, Car, User, Crosshair, Plus, Check, MessageCircle, LogIn, Home, Key, Zap, Wrench, Crown, Lock } from "lucide-react";
import { auth } from "@/lib/firebase";
import { getVehicleTypes, VehicleType } from "@/lib/vehicleTypes";

import BottomSheet from "@/components/BottomSheet";
import dynamic from "next/dynamic";
import { useTracking } from "@/lib/TrackingContext";

const InteractiveMapModal = dynamic(() => import("@/components/InteractiveMapModal"), { ssr: false });

const UAE_LOCATIONS = [
  "Downtown Dubai",
  "Dubai Marina",
  "Palm Jumeirah",
  "Abu Dhabi Corniche",
  "Yas Island, Abu Dhabi",
  "Al Majaz, Sharjah",
  "Ajman Corniche",
  "Al Hamra, Ras Al Khaimah",
  "Fujairah City",
  "Jumeirah Village Circle",
  "Business Bay",
  "JLT",
  "Al Barsha",
  "Dubai Hills",
  "Mirdif",
  "Deira",
  "Bur Dubai",
  "Silicon Oasis",
  "Jumeirah",
  "Al Quoz"
];

const POPULAR_CARS = [
  "Toyota Land Cruiser",
  "Toyota Prado",
  "Toyota Camry",
  "Toyota Corolla",
  "Toyota Yaris",
  "Toyota RAV4",
  "Toyota Fortuner",
  "Toyota Hilux",
  "Nissan Patrol",
  "Nissan Sunny",
  "Nissan Altima",
  "Nissan X-Trail",
  "Nissan Pathfinder",
  "Nissan Kicks",
  "Mitsubishi Pajero",
  "Mitsubishi Lancer",
  "Mitsubishi Outlander",
  "Honda Civic",
  "Honda Accord",
  "Honda CR-V",
  "Honda Pilot",
  "Honda City",
  "Hyundai Tucson",
  "Hyundai Elantra",
  "Hyundai Santa Fe",
  "Hyundai Accent",
  "Lexus LX570",
  "Lexus RX",
  "Lexus ES",
  "Lexus GX",
  "Ford Mustang",
  "Ford Explorer",
  "Ford F-150",
  "Chevrolet Tahoe",
  "Chevrolet Corvette",
  "Chevrolet Silverado",
  "Chevrolet Captiva",
  "Jeep Wrangler",
  "Jeep Grand Cherokee",
  "Range Rover Sport",
  "Range Rover Vogue",
  "Land Rover Defender",
  "BMW 3 Series",
  "BMW 5 Series",
  "BMW X5",
  "Mercedes-Benz G-Class",
  "Mercedes-Benz C-Class",
  "Mercedes-Benz E-Class",
  "Mercedes-Benz S-Class",
  "Mercedes-Benz GLC",
  "Audi A4",
  "Audi A6",
  "Audi Q7",
  "Porsche Cayenne",
  "Porsche Macan",
  "Tesla Model 3",
  "Tesla Model Y"
];

const heroData = [
  {
    video: "/0426.mp4",
    subtitle: "ESTABLISHED 2024 — DUBAI, UAE",
    title: "5-Star Rated\nDoorstep",
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
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => setIsLoggedIn(!!user));
    return () => unsub();
  }, []);

  const [selectedLocation, setSelectedLocation] = useState("Choose Location");
  const [selectedCar, setSelectedCar] = useState("Select Vehicle");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showCarPopup, setShowCarPopup] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  const [carHistory, setCarHistory] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapCoords, setMapCoords] = useState({ lat: 25.2048, lng: 55.2708 });

  const { trackEvent } = useTracking();

  const [isAddingCar, setIsAddingCar] = useState(false);
  const [newCarModel, setNewCarModel] = useState("");
  const [newCarType, setNewCarType] = useState("Sedan");
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [carSuggestions, setCarSuggestions] = useState<string[]>([]);

  const getAutoVehicleType = (model: string): string => {
    const lower = model.toLowerCase();
    const suvKeywords = ["cruiser", "prado", "patrol", "pajero", "tahoe", "wrangler", "cherokee", "defender", "explorer", "fortuner", "x5", "x6", "q7", "q8", "cayenne", "macan", "rx", "gx", "lx", "gle", "glc", "y"];
    const sedanKeywords = ["camry", "corolla", "yaris", "sunny", "altima", "lancer", "civic", "accord", "city", "elantra", "sonata", "accent", "optima", "cerato", "picanto", "es", "is", "3 series", "5 series", "7 series", "c-class", "e-class", "s-class", "a4", "a6", "model 3"];
    
    if (suvKeywords.some(keyword => lower.includes(keyword))) {
      return "SUV";
    }
    if (sedanKeywords.some(keyword => lower.includes(keyword))) {
      return "Sedan";
    }
    return "Sedan"; // default fallback
  };

  const handleCarModelChange = (value: string) => {
    setNewCarModel(value);
    if (!value.trim()) {
      setCarSuggestions([]);
      return;
    }
    const filtered = POPULAR_CARS.filter(car => 
      car.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);
    setCarSuggestions(filtered);

    // Auto-detect type as they type!
    const autoType = getAutoVehicleType(value);
    const matchedType = vehicleTypes.find(t => t.name.toLowerCase() === autoType.toLowerCase());
    if (matchedType) {
      setNewCarType(matchedType.name);
    }
  };

  const selectCarSuggestion = (carName: string) => {
    setNewCarModel(carName);
    setCarSuggestions([]);
    
    const autoType = getAutoVehicleType(carName);
    const matchedType = vehicleTypes.find(t => t.name.toLowerCase() === autoType.toLowerCase());
    if (matchedType) {
      setNewCarType(matchedType.name);
    }
  };

  useEffect(() => {
    getVehicleTypes().then(types => {
      if (types && types.length > 0) {
        setVehicleTypes(types);
        setNewCarType(types[0].name);
      } else {
        const fallback = [
          { id: "sedan", name: "Sedan", surcharge: 0, order: 1 },
          { id: "suv", name: "SUV", surcharge: 100, order: 2 },
          { id: "van", name: "Van", surcharge: 150, order: 3 },
          { id: "adventure", name: "Adventure", surcharge: -100, order: 4 },
        ];
        setVehicleTypes(fallback);
        setNewCarType(fallback[0].name);
      }
    });
  }, []);

  // Address details
  const [locationType, setLocationType] = useState<"Home" | "Work" | "Other">("Home");
  const [buildingName, setBuildingName] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [locationDirections, setLocationDirections] = useState("");
  const [locationStep, setLocationStep] = useState<"area" | "details">("area");

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
              
              const savedCar = localStorage.getItem("mudwash_carDetails");
              if (!savedCar) {
                setShowCarPopup(true);
              }
            })
            .catch(err => {
              console.error("Geocoding error:", err);
              setSelectedLocation(locStr);
              localStorage.setItem("userLocation", locStr);
              window.dispatchEvent(new Event("locationChanged"));
              
              const savedCar = localStorage.getItem("mudwash_carDetails");
              if (!savedCar) {
                setShowCarPopup(true);
              }
            });

        },
        (error) => {
          console.error("Error getting location:", error);
          console.log("Could not get your location.");
        }
      );
    } else {
      console.log("Geolocation is not supported by your browser.");
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

  useEffect(() => {
    const savedLoc = localStorage.getItem("userLocation");
    const savedCar = localStorage.getItem("mudwash_carDetails");
    const savedAddrDetails = localStorage.getItem("mudwash_addressDetails");
    
    if (savedLoc) {
      setSelectedLocation(savedLoc);
    }
    if (savedAddrDetails) {
      try {
        const d = JSON.parse(savedAddrDetails);
        if (d.type) setLocationType(d.type);
        if (d.buildingName) setBuildingName(d.buildingName);
        if (d.flatNo) setFlatNo(d.flatNo);
        if (d.directions) setLocationDirections(d.directions);
      } catch (e) {}
    }
    if (savedCar) {
      try {
        const car = JSON.parse(savedCar);
        setSelectedCar(car.model);
      } catch (e) {}
    }

    if (!savedLoc || savedLoc === "Choose Location") {
      setShowLocationPopup(true);
    } else if (!savedCar || savedCar === "Select Vehicle") {
      setShowCarPopup(true);
    }
  }, []);

  const saveLocationDetails = (area: string) => {
    setSelectedLocation(area);
    localStorage.setItem("userLocation", area);
    window.dispatchEvent(new Event("locationChanged"));
    setLocationStep("details");
  };

  const confirmLocationDetails = () => {
    const details = { type: locationType, buildingName, flatNo, directions: locationDirections };
    localStorage.setItem("mudwash_addressDetails", JSON.stringify(details));
    // also write to bookings pre-fill keys
    localStorage.setItem("mudwash_locationType", locationType);
    setShowLocationPopup(false);
    setLocationStep("area");
    const savedCar = localStorage.getItem("mudwash_carDetails");
    if (!savedCar) setShowCarPopup(true);
  };

  useEffect(() => {
    if (locationSearchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${locationSearchQuery}&countrycodes=ae&limit=5`);
        const data = await res.json();
        const uniqueNames = Array.from(new Set(data.map((item: any) => item.display_name))) as string[];
        setSuggestions(uniqueNames);
      } catch (error) {
        console.error(error);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [locationSearchQuery]);

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

  const badges = [
    {
      icon: <Home size={16} className="text-[#22C55E]" />,
      line1: "Home",
      line2: "Service",
    },
    {
      icon: <Key size={16} className="text-[#3B82F6]" />,
      line1: "Pick n",
      line2: "Drop",
    },
    {
      icon: <Zap size={16} className="text-[#F69621]" />,
      line1: "Instant",
      line2: "Booking",
    },
    {
      icon: <Wrench size={16} className="text-[#06B6D4]" />,
      line1: "Expert",
      line2: "Techs",
    },
    {
      icon: <Crown size={16} className="text-[#FCD34D]" />,
      line1: "Elite",
      line2: "Quality",
    },
    {
      icon: <Lock size={16} className="text-[#10B981]" />,
      line1: "Secure",
      line2: "Checkout",
    },
  ];

  return (
    <section className="relative w-full px-0">
      {/* ═══ MOBILE APP HERO ═══ */}
      <div className="relative w-full h-[45svh] md:h-screen bg-[#050505] overflow-hidden">





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

        {/* ── TOP BAR: Logo + Selectors ── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute top-0 left-0 right-0 z-30 pt-4 px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6"
        >
          {/* Mobile: Top Row (Logo + WhatsApp) / Desktop: Just Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="shrink-0">
              <img src="/mudwash-logo-final.png" alt="MUDWASH" className="h-10 md:h-14 w-auto object-contain" />
            </Link>
            
            {/* Profile/Sign-in Icon (Mobile only inside this div) */}
            <button 
              onClick={() => router.push(isLoggedIn ? '/profile' : '/sign-up')}
              className="w-9 h-9 md:hidden rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            >
              {isLoggedIn ? <User size={18} /> : <LogIn size={18} />}
            </button>
          </div>

          {/* Desktop: Right side container (Bar + WhatsApp) / Mobile: Just Bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto">
            {/* Unified Location & Car Bar */}
            <div className="grid grid-cols-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl h-12 md:h-14 md:w-[450px]">

              {/* Location Selector */}
              <div className="relative min-w-0 border-r border-white/10 flex items-center justify-between">
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

            {/* Profile/Sign-in Icon (Desktop only here) */}
            <button 
              onClick={() => router.push(isLoggedIn ? '/profile' : '/sign-up')}
              className="hidden md:flex w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white shadow-lg active:scale-95 transition-transform shrink-0 hover:bg-white/10 hover:text-brand-orange hover:border-brand-orange/30"
            >
              {isLoggedIn ? <User size={19} /> : <LogIn size={19} />}
            </button>
          </div>
        </motion.div>


        {/* ── CENTRE: Hero Tagline ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 pt-8"
        >
          <div className="text-center">
            <h1 className="text-[1.5rem] md:text-[4.5rem] font-black text-white uppercase italic leading-[1] tracking-tighter drop-shadow-lg">
              5-Star Rated Doorstep<br />
              <span className="text-brand-orange">Detailing</span>
            </h1>
            
            {/* CTA Button Removed */}
          </div>
        </motion.div>


        {/* ── BOTTOM CARD: Quick Actions + CTA ── */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7, type: 'spring', stiffness: 120 }}
          className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4"
        >
          {/* Quick service / feature badges - Infinite Auto-sliding Loop */}
          <div className="w-full overflow-hidden relative mb-3 py-1 mask-marquee">
            <div className="flex gap-2.5 animate-marquee">
              {/* Loop 1 */}
              {badges.map((badge, i) => (
                <div
                  key={`b1-${i}`}
                  className="flex-shrink-0 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-3.5 py-2 flex items-center gap-2.5 transition-colors cursor-default"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  <div className="shrink-0 flex items-center justify-center">
                    {badge.icon}
                  </div>
                  <div className="flex flex-col text-left leading-[1.1]">
                    <span className="text-white text-[9px] font-black uppercase tracking-wider">{badge.line1}</span>
                    <span className="text-white text-[9px] font-black uppercase tracking-wider">{badge.line2}</span>
                  </div>
                </div>
              ))}
              {/* Loop 2 (seamless duplicate for infinite scrolling) */}
              {badges.map((badge, i) => (
                <div
                  key={`b2-${i}`}
                  className="flex-shrink-0 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-3.5 py-2 flex items-center gap-2.5 transition-colors cursor-default"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  <div className="shrink-0 flex items-center justify-center">
                    {badge.icon}
                  </div>
                  <div className="flex flex-col text-left leading-[1.1]">
                    <span className="text-white text-[9px] font-black uppercase tracking-wider">{badge.line1}</span>
                    <span className="text-white text-[9px] font-black uppercase tracking-wider">{badge.line2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </motion.div>
      </div>





      {/* Popups */}
      <BottomSheet
        isOpen={showLocationPopup}
        onClose={() => {
          if (selectedLocation !== "Choose Location") {
            setShowLocationPopup(false);
            setLocationStep("area");
          }
        }}
        title={locationStep === "area" ? "Choose Location" : "Add Address Details"}
      >
        {locationStep === "area" ? (
        <div className="space-y-4 p-6">
          <div className="sticky top-0 bg-[#0A0A0A] z-10 -mx-6 px-6 -mt-6 pt-6 space-y-4 pb-4 border-b border-white/5">
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search area..." 
                value={locationSearchQuery}
                onChange={e => setLocationSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && locationSearchQuery.trim() !== '') {
                    saveLocationDetails(locationSearchQuery);
                  }
                }}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none transition-all text-white placeholder:text-white/20"
              />
              
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden backdrop-blur-xl max-h-48 overflow-y-auto no-scrollbar">
                  <div className="flex flex-col">
                    {suggestions.map((loc, index) => (
                      <button
                        key={`${loc}-${index}`}
                        onClick={() => {
                          if (!loc.includes(',')) {
                            setLocationSearchQuery(loc + ", ");
                          } else {
                            saveLocationDetails(loc);
                          }
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 text-xs font-bold text-white/70 hover:text-white border-b border-white/5 last:border-none transition-colors"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Type tabs */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              {(["Home", "Work", "Other"] as const).map(t => (
                <button key={t} onClick={() => setLocationType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${locationType === t ? 'bg-brand-orange text-black' : 'text-white/30 hover:text-white'}`}
                >{t}</button>
              ))}
            </div>

            <button
              onClick={() => {
                setIsMapOpen(true);
                setShowLocationPopup(false);
              }}
              className="w-full bg-brand-orange text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Crosshair size={16} />
              Use Current Location
            </button>

          </div>

          {locationSearchQuery.trim() !== '' && (
            <button
              onClick={() => saveLocationDetails(locationSearchQuery)}
              className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-white text-sm">Use: "{locationSearchQuery}"</p>
                <p className="text-xs text-white/40">Custom location</p>
              </div>
              <div className="text-brand-orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </button>
          )}



          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-white/30 mb-1">Popular Locations</p>
            <div className="grid grid-cols-2 gap-2">
              {UAE_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => saveLocationDetails(loc)}
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
        </div>
        ) : (
        <div className="space-y-4 p-6">
          <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <MapPin size={16} className="text-brand-orange shrink-0" />
            <p className="text-xs font-bold text-white">{selectedLocation}</p>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Building / Villa Name</label>
            <input type="text" placeholder="e.g. Al Barsha Tower B" value={buildingName}
              onChange={e => setBuildingName(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none text-white placeholder:text-white/10"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Flat / Villa No.</label>
            <input type="text" placeholder="e.g. Flat 402 or Villa 12" value={flatNo}
              onChange={e => setFlatNo(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none text-white placeholder:text-white/10"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Landmark / Directions (Optional)</label>
            <input type="text" placeholder="e.g. Near the park" value={locationDirections}
              onChange={e => setLocationDirections(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none text-white placeholder:text-white/10"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setLocationStep("area")} className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-black text-white/40 hover:text-white uppercase tracking-widest transition-all">← Back</button>
            <button onClick={confirmLocationDetails} className="flex-2 flex-grow py-3 bg-brand-orange text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white active:scale-95">Save Location ✓</button>
          </div>
        </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showCarPopup}
        onClose={() => {
          if (selectedCar !== "Select Vehicle") {
            setShowCarPopup(false);
            setIsAddingCar(false);
          }
        }}
        title={isAddingCar ? "Add New Car" : "Select Vehicle"}
      >
        <div className="space-y-4 p-6">
          {isAddingCar ? (
            <div className="space-y-4">
              <div className="relative">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Car Make & Model</label>
                <input
                  type="text"
                  placeholder="e.g. Nissan Patrol or Toyota Camry"
                  value={newCarModel}
                  onChange={(e) => handleCarModelChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none text-white placeholder:text-white/20"
                />

                {/* Suggestions Dropdown Overlay */}
                <AnimatePresence>
                  {carSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute left-0 right-0 mt-1 bg-[#15191c] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[100] max-h-[200px] overflow-y-auto"
                    >
                      {carSuggestions.map((suggestion) => (
                        <div
                          key={suggestion}
                          onClick={() => selectCarSuggestion(suggestion)}
                          className="px-4 py-3 text-xs font-bold text-white/80 hover:text-black hover:bg-brand-orange cursor-pointer transition-colors border-b border-white/[0.03] last:border-b-0 flex items-center justify-between"
                        >
                          <span>{suggestion}</span>
                          <span className="text-[8px] opacity-60 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-md text-white group-hover:text-black shrink-0">
                            {getAutoVehicleType(suggestion)}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block font-bold">Vehicle Class / Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {vehicleTypes.map((type) => (
                    <button
                      key={type.name}
                      onClick={() => setNewCarType(type.name)}
                      className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        newCarType === type.name
                          ? 'bg-brand-orange border-brand-orange text-black'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsAddingCar(false)}
                  className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-black text-white/40 hover:text-white uppercase tracking-widest transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!newCarModel.trim()) return;
                    const newCar = { model: newCarModel.trim(), type: newCarType };
                    
                    // Save to details
                    localStorage.setItem("mudwash_carDetails", JSON.stringify(newCar));
                    window.dispatchEvent(new Event("carChanged"));
                    
                    // Save to history
                    const currentHistory = localStorage.getItem("mudwash_carHistory");
                    let historyArr: any[] = [];
                    if (currentHistory) {
                      try {
                        historyArr = JSON.parse(currentHistory);
                      } catch (e) {}
                    }
                    const filtered = historyArr.filter(item => item.model !== newCar.model);
                    const newHistory = [newCar, ...filtered].slice(0, 3);
                    localStorage.setItem("mudwash_carHistory", JSON.stringify(newHistory));
                    setCarHistory(newHistory);
                    
                    // Reset
                    setNewCarModel("");
                    setIsAddingCar(false);
                    setShowCarPopup(false);
                  }}
                  className="flex-2 flex-grow py-3 bg-brand-orange text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white active:scale-95"
                >
                  Save Vehicle ✓
                </button>
              </div>
            </div>
          ) : (
            <>
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
              
              <button
                onClick={() => setIsAddingCar(true)}
                className="w-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange font-bold uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-brand-orange/20 active:scale-95"
              >
                <Plus size={16} />
                Add New Car
              </button>
            </>
          )}
        </div>
      </BottomSheet>

      <AnimatePresence>
        {isMapOpen && (
          <InteractiveMapModal
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            onConfirm={(address) => {
              setSelectedLocation(address);
              localStorage.setItem("userLocation", address);
              window.dispatchEvent(new Event("locationChanged"));
              setIsMapOpen(false);
              
              const savedCar = localStorage.getItem("mudwash_carDetails");
              if (!savedCar) {
                setShowCarPopup(true);
              }
            }}
            initialCoords={mapCoords}
          />
        )}
      </AnimatePresence>
    </section>
  );
}


