'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, Loader2 } from 'lucide-react';
import { getGarages, Garage } from '@/lib/garages';

const FALLBACK_GARAGES: Garage[] = [
  { id: 'g1', name: "Al Quoz Detail Center", location: "Dubai, Al Quoz", distance: "2.4 km", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2000&auto=format&fit=crop" },
  { id: 'g2', name: "Marina Auto Care", location: "Dubai Marina", distance: "5.1 km", image: "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=2000&auto=format&fit=crop" },
];

export default function NearbyGarages() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("NearbyGarages: Fetching timed out, using fallback.");
        setGarages(FALLBACK_GARAGES);
        setLoading(false);
      }
    }, 5000);

    const fetchGarages = async () => {
      try {
        const data = await getGarages();
        if (isMounted) {
          if (data && data.length > 0) {
            setGarages(data);
          } else {
            setGarages(FALLBACK_GARAGES);
          }
        }
      } catch (error) {
        console.error("Error fetching garages:", error);
        if (isMounted) setGarages(FALLBACK_GARAGES);
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };
    fetchGarages();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-brand-orange animate-spin" size={32} />
        <p className="text-white/20 text-xs font-black uppercase tracking-widest">Scanning Nearby Garages...</p>
      </div>
    );
  }

  if (garages.length === 0) return null;

  return (
    <section className="py-8 px-6 pb-32">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Nearby Garages</h2>
        <button className="text-brand-orange text-sm font-semibold hover:opacity-80 transition-opacity">See All</button>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
        {garages.map((garage, index) => (
          <motion.div
            key={garage.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="flex-shrink-0 w-[280px] bg-[#1A1A1A] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl snap-center group"
          >
            <div className="relative h-40">
              <Image src={garage.image || '/car-clean.png'} alt={garage.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="280px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <button className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-brand-orange transition-colors">
                <Heart size={16} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{garage.name}</h3>
                  {garage.location && <span className="text-[9px] text-white/30 font-medium uppercase tracking-widest mt-0.5">{garage.location}</span>}
                </div>
                <span className="text-[10px] font-bold text-brand-orange">{garage.distance}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

