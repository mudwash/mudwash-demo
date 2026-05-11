'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink } from 'lucide-react';

const reviews = [
  {
    name: "Jad Salman",
    time: "4 weeks ago",
    text: "Great services, Mohammed Kashif and Seth owusu did a great job",
    rating: 5,
    initial: "J"
  },
  {
    name: "Артур Кешишян",
    time: "4 weeks ago",
    text: "Clear and fast seth owusu and muhammad kashif",
    rating: 5,
    initial: "A"
  },
  {
    name: "Dina Badran",
    time: "4 weeks ago",
    text: "Had an excellent experience with Mudwash. My SUV had a strong humidity smell after being parked for over a month and...",
    rating: 5,
    initial: "D"
  },
  {
    name: "Mohamad Mourad",
    time: "4 weeks ago",
    text: "Amazing work and service. The people here are absolute pros. Big thanks to Seth and Muhammad Kashif for the professionalism and attention to detail!!!",
    rating: 5,
    initial: "M"
  }
];

export default function GoogleReviews() {
  return (
    <section className="pt-20 pb-0 px-4 bg-[#050505]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header with Google Style */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Google Reviews</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-brand-orange font-bold text-lg">5.0</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#F69621" className="text-brand-orange" />
                  ))}
                </div>
                <span className="text-white/40 text-xs font-bold">(137 reviews)</span>
              </div>
            </div>
          </div>
          <a 
            href="https://g.page/r/CS9ohyKvW8CkEAE/review" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all border border-white/5"
          >
            Write a Review <ExternalLink size={14} />
          </a>
        </div>

        {/* Reviews Slider */}
        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-6 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {reviews.map((r, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex-shrink-0 w-[85%] sm:w-[350px] snap-center bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm">
                    {r.initial}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{r.name}</h4>
                    <p className="text-white/30 text-[10px] font-bold">{r.time}</p>
                  </div>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Verified</div>
              </div>
              <div className="flex gap-0.5">
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} size={12} fill="#F69621" className="text-brand-orange" />
                ))}
              </div>
              <p className="text-white/70 text-sm font-medium leading-relaxed">"{r.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
