'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  Car, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { createBooking } from "@/lib/bookings";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useTracking } from "@/lib/TrackingContext";
import { fireGadsConversion, markConversionSent } from "@/lib/adTracking";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
}

const steps = [
  { id: 1, title: "Vehicle", icon: Car },
  { id: 2, title: "Schedule", icon: Calendar },
  { id: 3, title: "Checkout", icon: CheckCircle2 },
];

export default function BookingModal({ isOpen, onClose, serviceName }: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [carQuery, setCarQuery] = useState("");
  const [carSuggestions, setCarSuggestions] = useState<string[]>([]);
  const [showCarDropdown, setShowCarDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [allCars, setAllCars] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const router = useRouter();
  const { trackEvent } = useTracking();

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      trackEvent('book_modal_opened', { service: serviceName });
    }
  }, [isOpen, serviceName]);

  // Reset modal
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStep(1);
        setIsSuccess(false);
        setCarQuery("");
        setDate("");
        setTime("");
      }, 300);
    }
  }, [isOpen]);

  // Fetch cars
  useEffect(() => {
    if (isOpen && allCars.length === 0) {
      fetch('/indian_cars.json')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAllCars(data); })
        .catch(err => console.error(err));
    }
  }, [isOpen, allCars.length]);

  // Filter cars
  useEffect(() => {
    if (!carQuery || !showCarDropdown) {
      setCarSuggestions([]);
      return;
    }
    const query = carQuery.toLowerCase();
    const matches = allCars.filter(car => car.toLowerCase().includes(query));
    setCarSuggestions(matches.slice(0, 5));
  }, [carQuery, allCars, showCarDropdown]);

  // Prevent scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep === 1 && !carQuery) return;
    if (currentStep === 2 && (!date || !time)) return;
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Track step completions
      if (currentStep === 1) {
        trackEvent('step_1_vehicle_selected', { vehicle: carQuery, service: serviceName });
      } else if (currentStep === 2) {
        trackEvent('step_2_schedule_selected', { date, time, service: serviceName });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const bookingAmount = 300; // Default conversion value per Google Ads setup
      const bookingId = await createBooking({
        customerName: name || auth.currentUser?.displayName || "Guest",
        phone: phone,
        email: auth.currentUser?.email || "",
        service: serviceName,
        date: date,
        time: time,
        location: "Service Center",
        amount: "AED TBD",
        carDetails: carQuery || "Not specified",
        status: "Pending"
      });

      // Track booking submission event
      trackEvent('booking_submitted', {
        service: serviceName,
        vehicle: carQuery,
        date,
        time,
        bookingId,
      });

      // Fire Google Ads conversion
      fireGadsConversion(bookingAmount, bookingId);
      markConversionSent(bookingAmount).catch(() => {});

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-[1001] flex items-center justify-center pointer-events-none px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#0A0A0A] border border-[#262626] rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto flex flex-col h-auto max-h-[90vh]"
            >
              {/* Progress Bar Top */}
              <div className="h-[2px] bg-white/5 w-full">
                <motion.div 
                  className="h-full bg-[#F59E0B]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>

              <div className="p-8 md:p-10 flex flex-col relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
                  <X size={24} />
                </button>

                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-center py-10 space-y-6"
                    >
                      <div className="w-20 h-20 bg-[#F59E0B]/20 rounded-full flex items-center justify-center text-[#F59E0B] border border-[#F59E0B]/30">
                        <Check size={40} strokeWidth={3} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter mb-2">Request Received!</h3>
                        <p className="text-white/40 text-xs max-w-[200px] leading-relaxed mx-auto">Our team will call you shortly to confirm the appointment.</p>
                      </div>
                      <button onClick={onClose} className="bg-[#F59E0B] text-black font-bold uppercase tracking-widest text-[10px] px-10 py-4 rounded-full transition-all active:scale-95">
                        Close
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col"
                    >
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-[#F59E0B]/10 text-[#F59E0B] text-[8px] font-bold uppercase tracking-widest rounded border border-[#F59E0B]/20">
                            Quick Book
                          </span>
                          <span className="text-white/20 text-[8px] font-bold uppercase tracking-widest">
                            Step {currentStep} of 3
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">
                          {serviceName}
                        </h2>
                      </div>

                      <div className="flex-grow space-y-6">
                        {currentStep === 1 && (
                          <div className="space-y-6" ref={dropdownRef}>
                            <div className="space-y-2">
                              <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-1">Vehicle Model</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="e.g. Tata Nexon"
                                  className="w-full bg-[#171717] border border-[#262626] text-white px-5 py-4 text-sm rounded-xl focus:outline-none focus:border-[#F59E0B]/50 transition-all font-medium"
                                  value={carQuery}
                                  onChange={(e) => { setCarQuery(e.target.value); setShowCarDropdown(true); }}
                                  onFocus={() => setShowCarDropdown(true)}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                                  <Car size={18} />
                                </div>
                                <AnimatePresence>
                                  {showCarDropdown && carSuggestions.length > 0 && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="absolute left-0 right-0 top-[110%] bg-[#171717] border border-[#262626] z-50 rounded-xl overflow-hidden shadow-2xl"
                                    >
                                      {carSuggestions.map((s, i) => (
                                        <div key={i} onClick={() => { setCarQuery(s); setShowCarDropdown(false); }} className="px-5 py-3 text-[10px] text-white/60 hover:bg-[#F59E0B]/10 hover:text-[#F59E0B] cursor-pointer border-b border-white/5 last:border-none font-bold uppercase tracking-widest">
                                          {s}
                                        </div>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        )}

                        {currentStep === 2 && (
                          <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-1">Select Date</label>
                                <input 
                                  type="date" 
                                  min={new Date().toISOString().split('T')[0]}
                                  className="w-full bg-[#171717] border border-[#262626] text-white px-5 py-4 text-sm rounded-xl focus:outline-none [color-scheme:dark]"
                                  value={date}
                                  onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-1">Select Slot</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"].map(t => (
                                    <button key={t} onClick={() => setTime(t)} className={`py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${time === t ? 'bg-[#F59E0B] border-[#F59E0B] text-black' : 'bg-[#171717] border-[#262626] text-white/40 hover:text-white'}`}>
                                      {t}
                                    </button>
                                  ))}
                                </div>
                            </div>
                          </div>
                        )}

                        {currentStep === 3 && (
                          <div className="space-y-6">
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-5 space-y-3">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                                <span>Vehicle</span>
                                <span className="text-white">{carQuery}</span>
                              </div>
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                                <span>Schedule</span>
                                <span className="text-white">{date} at {time}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-1">Phone Number</label>
                              <input 
                                type="tel" 
                                placeholder="+91 00000 00000"
                                className="w-full bg-[#171717] border border-[#262626] text-white px-5 py-4 text-sm rounded-xl focus:outline-none focus:border-[#F59E0B]/50 transition-all font-medium"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-10 pt-6 border-t border-white/5 flex gap-3">
                        {currentStep > 1 && (
                          <button onClick={handleBack} className="w-14 h-14 rounded-2xl bg-[#171717] border border-[#262626] flex items-center justify-center text-white/50 hover:text-white">
                            <ChevronLeft size={20} />
                          </button>
                        )}
                        <button 
                          onClick={currentStep === 3 ? handleSubmit : handleNext}
                          disabled={isSubmitting || (currentStep === 1 && !carQuery) || (currentStep === 2 && (!date || !time)) || (currentStep === 3 && !phone)}
                          className="flex-grow h-14 bg-[#F59E0B] text-black font-bold uppercase tracking-widest text-[10px] rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-30 active:scale-95 shadow-xl"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (currentStep === 3 ? 'Complete' : 'Continue')}
                          {currentStep < 3 && <ChevronRight size={18} />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
