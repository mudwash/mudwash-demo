'use client';

import React from 'react';
import { Phone, MapPin, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#050505] overflow-hidden pt-20 border-t border-white/5">
      {/* Background Glowing Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-orange/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-brand-orange/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-8 pb-16 border-b border-white/10">
          
          {/* Column 1: Brand & Intro */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6">
            <Link href="/" className="inline-block">
              <img src="/mudwash-logo-final.png" alt="MUDWASH" className="h-10 w-auto object-contain object-left" />
            </Link>
            <p className="text-white/50 text-sm font-medium leading-relaxed max-w-sm">
              We bring premium car detailing exactly where you are. Uncompromising quality, advanced techniques, and doorstep convenience for your vehicle.
            </p>
            
            {/* Socials */}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold mr-2">Follow Us</span>
              {/* Instagram */}
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:text-black hover:border-brand-orange transition-all duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              {/* Facebook */}
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:text-black hover:border-brand-orange transition-all duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              {/* Twitter/X */}
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:text-black hover:border-brand-orange transition-all duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="w-full lg:w-[25%] flex flex-col gap-6">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Quick Links</h4>
            <div className="flex flex-col gap-4">
              {['Home', 'Our Services', 'Spare Parts', 'Booking Calendar'].map((link, i) => (
                <Link key={i} href="#" className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit text-sm font-medium">
                  <div className="w-0 h-[1px] bg-brand-orange group-hover:w-4 transition-all duration-300" />
                  {link}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Contact & Info */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Get In Touch</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                  <Phone size={16} className="text-brand-orange" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-1">Phone</span>
                  <a href="tel:+971502374199" className="text-white font-bold text-sm hover:text-brand-orange transition-colors">+971502374199</a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                  <Mail size={16} className="text-brand-orange" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-1">Email</span>
                  <a href="mailto:info@mudwash.com" className="text-white font-bold text-sm hover:text-brand-orange transition-colors">info@mudwash.com</a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                  <MapPin size={16} className="text-brand-orange" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-1">Location</span>
                  <p className="text-white/70 text-xs font-bold leading-relaxed max-w-[150px]">2106-C60 WESTBURRY TOWER 1, DUBAI</p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                  <Clock size={16} className="text-brand-orange" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-1">Hours</span>
                  <p className="text-white/70 text-xs font-bold leading-relaxed">Full week<br/>10:00 - 23:00</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom PWA Copyright Bar */}
        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4 pt-10 pb-32 lg:pb-10">
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] text-center">
            Mudwash © All Rights Reserved 2026
          </p>
          <div className="flex gap-6 text-white/30 text-[9px] uppercase tracking-widest font-bold">
            <Link href="#" className="hover:text-brand-orange transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-brand-orange transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

