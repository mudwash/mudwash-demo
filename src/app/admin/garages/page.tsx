'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, Clock, Truck } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ScheduleSettings() {
  const [maxBookings, setMaxBookings] = useState(3);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "schedule");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMaxBookings(docSnap.data().maxBookingsPerSlot || 3);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    try {
      const docRef = doc(db, "settings", "schedule");
      await setDoc(docRef, { maxBookingsPerSlot: maxBookings }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      console.log("Failed to save settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Schedule Settings</h1>
        <p className="text-white/40 text-sm font-medium">Manage booking capacity and time slots.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-orange" size={32} />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-8 max-w-2xl space-y-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Service Capacity</h3>
                  <p className="text-white/40 text-xs">How many vehicles/teams can serve at the same time.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Max Bookings Per Slot</label>
                <div className="relative group">
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={isNaN(maxBookings) ? "" : maxBookings}
                    onChange={(e) => setMaxBookings(e.target.value === "" ? NaN : parseInt(e.target.value))}
                    className="w-full bg-black border border-white/5 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-brand-orange transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-orange text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Save size={16} />
                    Save Settings
                  </>
                )}
              </button>
              {success && (
                <p className="text-emerald-500 text-xs font-bold text-center mt-2">Settings saved successfully!</p>
              )}
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
