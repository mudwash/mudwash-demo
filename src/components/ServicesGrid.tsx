"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getServices, Service } from "@/lib/services";
import { getCategories, Category } from "@/lib/categories";
import {
  Loader2, ArrowRight, Check, X, ChevronRight,
  Waves, Sparkles, Car, ShieldCheck, Paintbrush, Wrench, Droplets,
  Zap, Snowflake, Settings, Disc, Clock, Package, SprayCan, Brush,
  Wind, Sun, Shield, Crown, Diamond, Star, Flame, Award, BadgeCheck,
  CheckCircle, Clock3, Timer, Fuel, Gauge, Navigation, Smartphone,
  Trophy, Activity, Heart, Palette, Droplet, GlassWater, CloudRain,
  Search, Settings2, Layers,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Waves, Sparkles, Car, ShieldCheck, Paintbrush, Wrench, Droplets, Zap,
  Snowflake, Settings, Disc, Clock, Package, SprayCan, Brush, Wind, Sun,
  Shield, Crown, Diamond, Star, Flame, Award, BadgeCheck, CheckCircle,
  Clock3, Timer, Fuel, Gauge, Navigation, Smartphone, Trophy, Activity,
  Heart, Palette, Droplet, GlassWater, CloudRain, Search, Settings2, Layers,
};

const ICON_COLORS: Record<string, string> = {
  Waves: "#00BFFF",     Droplets: "#FF4D4D",  Droplet: "#60A5FA",
  Zap: "#FFD700",       Snowflake: "#40E0D0", Disc: "#FF4444",
  ShieldCheck: "#32CD32", Shield: "#BA55D3",  Sparkles: "#FFD700",
  Car: "#DA70D6",       Settings: "#32CD32",  Settings2: "#f69621",
  Wrench: "#f69621",    Activity: "#f69621",  Clock: "#f69621",
  Paintbrush: "#FF6B9D", SprayCan: "#FF8C42", Brush: "#FFB347",
  Wind: "#7DD3FC",      Sun: "#FDE68A",       CloudRain: "#93C5FD",
  Package: "#A78BFA",   Crown: "#F59E0B",     Diamond: "#67E8F9",
  Star: "#FCD34D",      Flame: "#FB923C",     Award: "#34D399",
  BadgeCheck: "#6EE7B7", CheckCircle: "#4ADE80", Timer: "#FB923C",
  Fuel: "#FCA5A5",      Gauge: "#C4B5FD",     Navigation: "#6EE7B7",
  Smartphone: "#93C5FD", Trophy: "#FDE68A",   Heart: "#F9A8D4",
  Palette: "#DDD6FE",   GlassWater: "#BAE6FD", Layers: "#A5B4FC",
  Search: "#A0C2C2",    Clock3: "#f69621",
};

const getIconForService = (service: Service): { Icon: React.ElementType; color: string } => {
  const iconKey = service.icon || "";
  if (iconKey && ICON_MAP[iconKey]) return { Icon: ICON_MAP[iconKey], color: ICON_COLORS[iconKey] || "#f69621" };
  const caseMatch = Object.keys(ICON_MAP).find(k => k.toLowerCase() === iconKey.toLowerCase());
  if (caseMatch) return { Icon: ICON_MAP[caseMatch], color: ICON_COLORS[caseMatch] || "#f69621" };
  const src = `${service.name} ${service.category || ""}`.toLowerCase();
  if (src.includes("wash") || src.includes("exterior")) return { Icon: Waves, color: "#00BFFF" };
  if (src.includes("oil") || src.includes("fluid"))     return { Icon: Droplets, color: "#FF4D4D" };
  if (src.includes("battery"))                          return { Icon: Zap, color: "#FFD700" };
  if (src.includes("ceramic") || src.includes("coat"))  return { Icon: Sparkles, color: "#FFD700" };
  if (src.includes("brake"))                            return { Icon: Disc, color: "#FF4444" };
  if (src.includes("engine") || src.includes("tune"))  return { Icon: Settings2, color: "#f69621" };
  if (src.includes("interior") || src.includes("seat")) return { Icon: Car, color: "#DA70D6" };
  return { Icon: Wrench, color: "#f69621" };
};

export default function ServicesGrid() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const tid = setTimeout(() => { if (isMounted && loading) setLoading(false); }, 6000);
    
    Promise.all([getServices(true), getCategories()])
      .then(([srvData, catData]) => {
        if (isMounted) {
          setServices(srvData ?? []);
          setCategories(catData ?? []);
        }
      })
      .catch((err) => {
        console.error("Error fetching data in ServicesGrid:", err);
        if (isMounted) {
          setServices([]);
          setCategories([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          clearTimeout(tid);
        }
      });
      
    return () => { isMounted = false; clearTimeout(tid); };
  }, []);

  // Scroll panel into view when a service is selected
  useEffect(() => {
    if (selected && panelRef.current) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
    }
  }, [selected]);

  const handleCardClick = (service: Service) => {
    router.push(`/bookings?service=${service.id}`);
  };

  return (
    <section className="pt-0 pb-12 md:py-12 px-4 md:px-6 bg-[#0A0A0A] w-full">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl md:text-2xl text-white font-bold tracking-tight">Top Services</h2>
          <Link href="/bookings" className="flex items-center gap-1.5 text-brand-orange text-sm font-semibold hover:opacity-80 transition-opacity group">
            See All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
          </Link>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-orange" size={32}/>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10 space-y-3">
            <p className="text-white/40 text-sm font-semibold italic uppercase tracking-widest">No active services yet.</p>
            <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.4em]">Stay Tuned</p>
          </div>
        ) : (
          <>
            {/* Service icon grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-5">
              {(() => {
                return categories
                  .filter(cat => services.some(s => s.category === cat.name))
                  .slice(0, 8)
                  .map((cat, index) => {
                    const catName = cat.name;
                    const service = services.find(s => s.category === catName);
                    if (!service) return null;
                    const Icon = ICON_MAP[cat.icon] || Package;
                    const color = ICON_COLORS[cat.icon] || "#f69621";
                    const isActive = selected?.category === catName;
                    
                    return (
                    <motion.button
                      key={catName}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handleCardClick(service)}
                      className="flex flex-col items-center gap-2.5 group cursor-pointer w-full focus:outline-none"
                      aria-label={`View ${catName}`}
                    >
                      {/* Icon box */}
                      <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 border relative overflow-hidden
                        ${isActive
                          ? 'bg-brand-orange border-brand-orange shadow-[0_0_28px_rgba(246,150,33,0.35)] scale-105'
                          : 'bg-[#1C1C1E] border-white/5 group-hover:bg-[#252525] group-hover:border-brand-orange/30 group-hover:shadow-[0_0_20px_rgba(246,150,33,0.1)]'
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br from-brand-orange/8 to-transparent transition-opacity duration-300 pointer-events-none ${isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}/>
                        <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          <Icon size={28} style={{ color: isActive ? '#000' : color }}/>
                        </div>
                      </div>
                      <span className={`text-[10px] md:text-xs font-medium text-center truncate w-full px-1 leading-tight transition-colors
                        ${isActive ? 'text-brand-orange font-bold' : 'text-white/60 group-hover:text-white'}`}>
                        {catName}
                      </span>
                    </motion.button>
                  );
                });
              })()}
            </div>

            {/* Sub-services / Facilities panel */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  ref={panelRef}
                  key={selected.id}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#111] border border-brand-orange/20 rounded-2xl overflow-hidden">
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const { Icon, color } = getIconForService(selected);
                          return (
                            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                              <Icon size={20} style={{ color }}/>
                            </div>
                          );
                        })()}
                        <div>
                          <h3 className="text-sm font-black italic uppercase tracking-tight text-white leading-none">{selected.name}</h3>
                          <p className="text-[10px] text-white/30 mt-0.5 flex items-center gap-2">
                            <span className="font-black text-brand-orange">AED {selected.price}</span>
                            {selected.duration && <span className="flex items-center gap-1"><Clock size={9}/> {selected.duration}</span>}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all">
                        <X size={13}/>
                      </button>
                    </div>

                    {/* Facilities list */}
                    <div className="px-5 py-4">
                      {(!selected.includedItems || selected.includedItems.length === 0) ? (
                        <p className="text-xs text-white/20 italic">No included facilities listed for this service.</p>
                      ) : (
                        <>
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-orange/70 mb-3">What's Included</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selected.includedItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                                  <Check size={10} strokeWidth={4} className="text-brand-orange"/>
                                </div>
                                <span className="text-xs font-medium text-white/60">{item}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Book CTA */}
                    <div className="px-5 pb-5">
                      <Link
                        href={`/bookings?service=${selected.id}`}
                        className="flex items-center justify-center gap-2 w-full bg-brand-orange text-black font-black uppercase italic tracking-widest text-xs py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_20px_rgba(246,150,33,0.25)]"
                      >
                        Book This Service <ArrowRight size={16} strokeWidth={3}/>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
}
