"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Droplet, Calendar, Clock, Timer, Receipt, ArrowRight, Loader2, CheckCircle2, ShieldCheck, CreditCard } from "lucide-react";
import { createBooking } from "@/lib/bookings";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const summaryData = [
  {
    icon: <Car size={20} />,
    label: "Vehicle Class",
    value: "Sedan",
    key: "class"
  },
  {
    icon: <Droplet size={20} />,
    label: "Washing Plan",
    value: "Choose Your Plan",
    key: "plan"
  },
  {
    icon: <Calendar size={20} />,
    label: "Booking Date",
    value: "Choose Date",
    key: "date"
  },
  {
    icon: <Clock size={20} />,
    label: "Arrival Time",
    value: "Choose Time",
    key: "time"
  },
  {
    icon: <Timer size={20} />,
    label: "Est. Duration",
    value: "0 min",
    key: "duration"
  }
];

export default function BookingContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    terms: false
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.terms) return;

    const { auth } = await import("@/lib/firebase");
    if (!auth.currentUser) {
      router.push("/sign-in?returnTo=/");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createBooking({
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: "Full Detailing", 
        date: "2024-04-22", 
        time: "10:00 AM", 
        location: "Mobile Detailing",
        amount: "AED 450",
        carDetails: "Sedan - Standard",
        status: "Pending"
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="relative w-full min-h-screen py-24 flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
        {/* Success Background Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-8 px-6"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/30">
              <CheckCircle2 size={56} />
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-2 -right-2 bg-emerald-500 text-black p-1.5 rounded-full"
            >
              <ShieldCheck size={20} />
            </motion.div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
              Booking <span className="text-emerald-500">Confirmed</span>
            </h2>
            <p className="text-white/40 max-w-md mx-auto text-sm font-medium leading-relaxed">
              Your premium detailing session has been successfully scheduled. Our team is now preparing the gear to deliver automotive excellence to your doorstep.
            </p>
          </div>

          <div className="pt-6">
            <button 
              onClick={() => router.push('/')}
              className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase italic text-xs tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              Return to Dashboard
            </button>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="booking-contact-form" className="relative w-full min-h-screen py-24 flex flex-col justify-center bg-[#050505] overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full -ml-64 -mb-64" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-8 h-[2px] bg-brand-orange" />
            <span className="text-brand-orange text-[10px] font-black tracking-[0.5em] uppercase italic">Step 03 — Checkout</span>
            <div className="w-8 h-[2px] bg-brand-orange" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">
            Finalize Your <span className="text-brand-orange">Booking</span>
          </h2>
          <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">
            No Service in RTA paid parking & unauthorized building areas
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* Left Side: Receipt-style Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[40%] flex flex-col"
          >
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10 flex-1 flex flex-col relative overflow-hidden group">
              {/* Subtle pattern background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              
              <div className="flex items-center justify-between mb-10 relative z-10">
                <h3 className="text-white font-black uppercase italic tracking-widest text-lg">Order Summary</h3>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                  <Receipt size={20} />
                </div>
              </div>

              <div className="space-y-6 flex-1 relative z-10">
                {summaryData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group/item">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 group-hover/item:text-brand-orange transition-colors">
                        {item.icon}
                      </div>
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className={`text-sm font-black uppercase italic ${item.value.includes('Choose') ? 'text-brand-orange animate-pulse' : 'text-white'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Price Section */}
              <div className="mt-10 pt-10 border-t border-dashed border-white/10 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Investment</span>
                  <span className="text-brand-orange font-black text-3xl italic tracking-tighter">AED 450</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  <CreditCard size={12} />
                  <span>Secure Pay on Service</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: High-end Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[60%] bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative"
          >
            <div className="mb-10">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">
                Contact Information
              </h3>
              <p className="text-white/40 text-xs font-medium">
                Enter your professional details below to authorize this session.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="relative group">
                <input
                  required
                  type="text"
                  placeholder="FULL NAME"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/[0.03] text-white px-6 py-5 rounded-2xl border border-white/5 focus:border-brand-orange/50 focus:bg-white/[0.06] placeholder:text-white/10 text-[11px] font-black uppercase tracking-[0.2em] transition-all outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  required
                  type="tel"
                  placeholder="PHONE NUMBER"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/[0.03] text-white px-6 py-5 rounded-2xl border border-white/5 focus:border-brand-orange/50 focus:bg-white/[0.06] placeholder:text-white/10 text-[11px] font-black uppercase tracking-[0.2em] transition-all outline-none"
                />
                <input
                  required
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/[0.03] text-white px-6 py-5 rounded-2xl border border-white/5 focus:border-brand-orange/50 focus:bg-white/[0.06] placeholder:text-white/10 text-[11px] font-black uppercase tracking-[0.2em] transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-4 py-4 px-2">
                <input
                  required
                  type="checkbox"
                  id="terms"
                  checked={formData.terms}
                  onChange={(e) => setFormData({...formData, terms: e.target.checked})}
                  className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-brand-orange accent-brand-orange cursor-pointer"
                />
                <label htmlFor="terms" className="text-white/40 text-[10px] font-black uppercase tracking-[0.1em] cursor-pointer hover:text-white transition-colors">
                  I accept the <span className="text-white border-b border-white/20">Terms of Service</span> and <span className="text-white border-b border-white/20">Privacy Protocol</span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.terms}
                  className="group relative w-full bg-brand-orange text-black px-8 py-6 rounded-2xl font-black uppercase italic text-sm tracking-[0.3em] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <span>Confirm Session</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                  {/* Button Shine */}
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </button>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-2 mt-8 text-white/20">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted Booking</span>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
