'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Ahmed Al Mansoori",
    role: "Porsche 911 Owner",
    text: "The best detailing service in Dubai. They came to my home and made my car look better than the day I bought it. Highly recommended!",
    rating: 5
  },
  {
    name: "Fatima Al Hashimi",
    role: "Mercedes G-Wagon Owner",
    text: "Incredible attention to detail. The interior smells amazing and the ceramic coating has a mirror-like finish. Will definitely use them again.",
    rating: 5
  },
  {
    name: "Mohammed Al Sayed",
    role: "Nissan Patrol Owner",
    text: "Very professional and punctual. The team worked for 4 hours and didn't miss a spot. Great value for the quality of work they provide.",
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 px-4 bg-[#050505]">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <p className="text-brand-orange text-[10px] font-black uppercase tracking-[0.4em] mb-2">Wall of Love</p>
          <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight text-white">What Our Clients Say</h2>
        </div>

        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-6 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex-shrink-0 w-[85%] sm:w-[380px] snap-center bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 relative group hover:border-brand-orange/20 transition-all"
            >
              <div className="absolute top-6 right-6 text-white/5 group-hover:text-brand-orange/10 transition-colors">
                <Quote size={40} strokeWidth={3} />
              </div>
              <div className="flex gap-1">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={12} fill="#F69621" className="text-brand-orange" />
                ))}
              </div>
              <p className="text-white/70 text-sm font-medium leading-relaxed relative z-10">"{t.text}"</p>
              <div>
                <h4 className="text-white font-black text-sm uppercase italic">{t.name}</h4>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
