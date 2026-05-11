"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Search, Filter, ShoppingCart, Star, Loader2 } from "lucide-react";
import gsap from "gsap";

import Footer from "@/components/Footer";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getParts, Part } from "@/lib/parts";

const spareParts = [
  {
    id: 1,
    name: "Premium Ceramic Brake Pads",
    category: "Brakes",
    price: "AED 89.99",
    rating: 4.8,
    image:
      "https://i.pinimg.com/1200x/ea/08/3d/ea083d1077d63ed81ebb8b259f19495d.jpg",
  },
  {
    id: 2,
    name: "High-Performance Oil Filter",
    category: "Filters",
    price: "AED 24.50",
    rating: 4.9,
    image:
      "https://i.pinimg.com/1200x/ed/32/09/ed3209c97b6b2a084664a2894e9f2543.jpg",
  },
  {
    id: 3,
    name: "AGM Automotive Battery",
    category: "Electrical",
    price: "AED 210.00",
    rating: 4.7,
    image:
      "https://i.pinimg.com/736x/4e/41/8e/4e418ea1c6fe71e4e43b6d7096f1318d.jpg",
  },
  {
    id: 4,
    name: "Synthetic Motor Oil 5W-30",
    category: "Fluids",
    price: "AED 45.00",
    rating: 4.9,
    image:
      "https://i.pinimg.com/736x/cb/ba/91/cbba91ef02413a6c3d4c76ef164f1b8b.jpg",
  },
  {
    id: 5,
    name: "LED Headlight Bulbs",
    category: "Lighting",
    price: "AED 55.00",
    rating: 4.6,
    image:
      "https://i.pinimg.com/1200x/71/b3/15/71b315bf7293ab337bd8dd8af703ab21.jpg",
  },
  {
    id: 6,
    name: "All-Terrain Tire V2",
    category: "Wheels",
    price: "AED 145.00",
    rating: 4.8,
    image:
      "https://i.pinimg.com/736x/31/09/e6/3109e695900d6e40b13e5183860f851f.jpg",
  },
];

function SparePartsContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const data = await getParts();
        setParts(data);
      } catch (error) {
        console.error("Error fetching parts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchParts();
  }, []);

  const searchQuery = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "All Parts";

  const updateQuery = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filteredParts = parts.filter((part) => {
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All Parts" || part.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation
      gsap.from(headerRef.current, {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.1,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <>

      <main
        ref={containerRef}
        className="min-h-screen bg-[#111111] pt-24 sm:pt-32 pb-24 px-4 sm:px-6 md:px-8"
      >
        <div className="w-full mx-auto relative z-10">
          {/* Header Section */}
          <div
            ref={headerRef}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 md:mb-12 gap-6"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2">
                Spare <span className="text-brand-orange italic">Parts</span>
              </h1>
              <p className="text-white/60 text-xs sm:text-sm md:text-base max-w-xl">
                Premium quality OEM and aftermarket components for your vehicle.
                Engineered for performance, designed to last.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => updateQuery("search", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 sm:py-3 pl-11 pr-4 text-xs sm:text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
                />
              </div>
              <button className="p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-full hover:bg-brand-orange/10 hover:border-brand-orange/50 transition-colors">
                <Filter size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            {[
              "All Parts",
              "Brakes",
              "Filters",
              "Electrical",
              "Fluids",
              "Lighting",
              "Wheels",
            ].map((cat, i) => (
              <button
                key={cat}
                onClick={() => updateQuery("category", cat === "All Parts" ? null : cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-brand-orange text-black border border-brand-orange"
                    : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand-orange" size={32} />
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-20 text-white/20">
              <p>No parts found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredParts.map((part, i) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.1,
                    duration: 0.8,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="group relative"
                >
                  {/* Card Body */}
                  <div 
                    onClick={() => router.push(`/spare-parts/${part.id}`)}
                    className="relative bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-500 h-full flex flex-col group cursor-pointer"
                  >
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
                      <Image
                        src={part.image}
                        alt={part.name}
                        fill
                        priority={i < 5}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>

                    {/* Hover highlight ring (matching ServicesGrid) */}
                    <div className="absolute inset-0 border border-white/0 group-hover:border-white/20 transition-colors duration-500 pointer-events-none rounded-xl md:rounded-2xl z-30" />

                    {/* Content Section */}
                    <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                      <div className="mb-3 sm:mb-4">
                        <h3 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight tracking-tight mb-1.5 sm:mb-2 group-hover:text-brand-orange transition-colors">
                          {part.name}
                        </h3>
                        <div className="text-sm sm:text-base md:text-lg font-black text-brand-orange tracking-tighter">
                          {part.price}
                        </div>
                      </div>

                      <motion.button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const user = auth.currentUser;
                          if (!user) {
                            router.push(`/sign-in?returnTo=/checkout/${part.id}`);
                          } else {
                            router.push(`/checkout/${part.id}`);
                          }
                        }}
                        className="w-full py-2.5 sm:py-4 bg-white text-black rounded-md sm:rounded font-black text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-brand-orange transition-all duration-500 cursor-pointer relative z-40"
                      >
                        BOOK NOW
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SparePartsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111] flex items-center justify-center text-white font-black tracking-widest uppercase animate-pulse">Loading Catalog...</div>}>
      <SparePartsContent />
    </Suspense>
  );
}
