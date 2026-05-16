"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Calendar, Plus, Trash2, Save, RotateCcw, X, Check, AlertTriangle
} from "lucide-react";
import { getSchedule, updateSchedule, ScheduleSettings } from "@/lib/schedule";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_SLOTS = [
  "08:00 AM","09:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "01:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM",
  "06:00 PM","07:00 PM","08:00 PM","09:00 PM","10:00 PM"
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newSlot, setNewSlot] = useState("");
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editSlotValue, setEditSlotValue] = useState("");
  const [selectedDayForSlots, setSelectedDayForSlots] = useState<string>("Global"); // "Global" or "0"-"6"
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState("");
  const isMountedRef = useRef(true);
  const editInputRef = useRef<HTMLInputElement>(null);
  const editDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    fetchSchedule();
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchSchedule = async () => {
    try {
      const data = await getSchedule();
      if (isMountedRef.current) setSchedule(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    try {
      await updateSchedule(schedule);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
      console.log("Failed to save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    if (!schedule) return;
    const days = schedule.workingDays.includes(day)
      ? schedule.workingDays.filter(d => d !== day)
      : [...schedule.workingDays, day].sort();
    setSchedule({ ...schedule, workingDays: days });
  };

  const addSlot = () => {
    if (!schedule || !newSlot) return;
    const [h, m] = newSlot.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const formatted = `${String(h12).padStart(2, "0")}:${m} ${ampm}`;

    const currentSlots = selectedDayForSlots === "Global" 
      ? schedule.timeSlots 
      : (schedule.daySpecificSlots?.[selectedDayForSlots] || []);

    if (currentSlots.includes(formatted)) return;
    
    const sorted = [...currentSlots, formatted].sort((a, b) => {
      const toMinutes = (s: string) => {
        const [time, period] = s.split(" ");
        const [hh, mm] = time.split(":").map(Number);
        return (period === "PM" && hh !== 12 ? hh + 12 : period === "AM" && hh === 12 ? 0 : hh) * 60 + mm;
      };
      return toMinutes(a) - toMinutes(b);
    });

    if (selectedDayForSlots === "Global") {
      setSchedule({ ...schedule, timeSlots: sorted });
    } else {
      setSchedule({ 
        ...schedule, 
        daySpecificSlots: { 
          ...(schedule.daySpecificSlots || {}), 
          [selectedDayForSlots]: sorted 
        } 
      });
    }
    setNewSlot("");
  };

  const removeSlot = (slot: string) => {
    if (!schedule) return;
    if (selectedDayForSlots === "Global") {
      setSchedule({ ...schedule, timeSlots: schedule.timeSlots.filter(s => s !== slot) });
    } else {
      const currentSlots = schedule.daySpecificSlots?.[selectedDayForSlots] || [];
      setSchedule({ 
        ...schedule, 
        daySpecificSlots: { 
          ...(schedule.daySpecificSlots || {}), 
          [selectedDayForSlots]: currentSlots.filter(s => s !== slot) 
        } 
      });
    }
  };

  const slotTo24h = (slot: string): string => {
    const [time, period] = slot.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const startEditSlot = (slot: string) => {
    setEditingSlot(slot);
    setEditSlotValue(slotTo24h(slot));
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const saveEditSlot = () => {
    if (!schedule || !editingSlot || !editSlotValue) { setEditingSlot(null); return; }
    const [h, m] = editSlotValue.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const formatted = `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
    if (formatted === editingSlot) { setEditingSlot(null); return; }
    
    const currentSlots = selectedDayForSlots === "Global" 
      ? schedule.timeSlots 
      : (schedule.daySpecificSlots?.[selectedDayForSlots] || []);

    if (currentSlots.includes(formatted)) { setEditingSlot(null); return; }
    
    const updated = currentSlots.map(s => s === editingSlot ? formatted : s).sort((a, b) => {
      const toMin = (s: string) => {
        const [time, period] = s.split(" ");
        const [hh, mm] = time.split(":").map(Number);
        return (period === "PM" && hh !== 12 ? hh + 12 : period === "AM" && hh === 12 ? 0 : hh) * 60 + mm;
      };
      return toMin(a) - toMin(b);
    });

    if (selectedDayForSlots === "Global") {
      setSchedule({ ...schedule, timeSlots: updated });
    } else {
      setSchedule({ 
        ...schedule, 
        daySpecificSlots: { 
          ...(schedule.daySpecificSlots || {}), 
          [selectedDayForSlots]: updated 
        } 
      });
    }
    setEditingSlot(null);
  };

  const addBlockedDate = () => {
    if (!schedule || !newBlockedDate) return;
    if (schedule.blockedDates.includes(newBlockedDate)) return;
    setSchedule({ ...schedule, blockedDates: [...schedule.blockedDates, newBlockedDate].sort() });
    setNewBlockedDate("");
  };

  const removeBlockedDate = (date: string) => {
    if (!schedule) return;
    setSchedule({ ...schedule, blockedDates: schedule.blockedDates.filter(d => d !== date) });
  };

  const startEditDate = (date: string) => {
    setEditingDate(date);
    setEditDateValue(date);
    setTimeout(() => editDateInputRef.current?.focus(), 50);
  };

  const saveEditDate = () => {
    if (!schedule || !editingDate || !editDateValue) { setEditingDate(null); return; }
    if (editDateValue === editingDate) { setEditingDate(null); return; }
    if (schedule.blockedDates.includes(editDateValue)) { setEditingDate(null); return; }
    const updated = [...schedule.blockedDates.filter(d => d !== editingDate), editDateValue].sort();
    setSchedule({ ...schedule, blockedDates: updated });
    setEditingDate(null);
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Loading Schedule...</p>
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white italic uppercase tracking-tighter">Schedule</h1>
          <p className="text-white/40 text-sm font-medium">Manage working hours, days, and blocked dates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSchedule()}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
            title="Reset"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-orange text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50"
          >
            {saved ? <Check size={18} /> : saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save size={18} />}
            {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Days */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="font-black text-white uppercase italic text-sm tracking-tight">Working Days</h2>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Toggle available days</p>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {DAY_NAMES.map((day, i) => {
              const isActive = schedule.workingDays.includes(i);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(i)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${isActive ? "bg-brand-orange/10 border-brand-orange/30 text-brand-orange" : "bg-white/5 border-white/5 text-white/30 hover:border-white/20"}`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest">{day.slice(0, 3)}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? "border-brand-orange bg-brand-orange" : "border-white/20"}`}>
                    {isActive && <Check size={10} strokeWidth={4} className="text-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Max Bookings Per Slot */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="font-black text-white uppercase italic text-sm tracking-tight">Capacity</h2>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Max bookings per slot</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSchedule({ ...schedule, maxBookingsPerSlot: Math.max(1, schedule.maxBookingsPerSlot - 1) })}
              className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-xl transition-all"
            >−</button>
            <div className="flex-1 text-center">
              <span className="text-5xl font-black text-white italic">{schedule.maxBookingsPerSlot}</span>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">bookings/slot</p>
            </div>
            <button
              onClick={() => setSchedule({ ...schedule, maxBookingsPerSlot: Math.min(20, schedule.maxBookingsPerSlot + 1) })}
              className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-xl transition-all"
            >+</button>
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="font-black text-white uppercase italic text-sm tracking-tight">Time Slots</h2>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Configure daily operating hours</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 flex-grow max-w-2xl">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {["Global", ...DAY_NAMES].map((day, i) => {
                  const val = day === "Global" ? "Global" : (DAY_NAMES.indexOf(day)).toString();
                  const isActive = selectedDayForSlots === val;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDayForSlots(val)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                        isActive 
                          ? "bg-brand-orange border-brand-orange text-black shadow-[0_10px_20px_rgba(246,150,33,0.2)]" 
                          : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-2 pl-4">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-brand-orange/40" />
                  <input
                    type="time"
                    value={newSlot}
                    onChange={e => setNewSlot(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-bold text-white w-32 [color-scheme:dark]"
                  />
                </div>
                <button
                  onClick={addSlot}
                  disabled={!newSlot}
                  className="bg-brand-orange text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all disabled:opacity-40 disabled:grayscale shadow-lg shadow-brand-orange/10"
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>Add Slot {selectedDayForSlots !== "Global" ? `to ${DAY_NAMES[parseInt(selectedDayForSlots)]}` : ""}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            {(selectedDayForSlots === "Global" ? schedule.timeSlots : (schedule.daySpecificSlots?.[selectedDayForSlots] || [])).map(slot => (
              <div
                key={slot}
                className={`flex items-center gap-1.5 border rounded-full transition-all group ${
                  editingSlot === slot
                    ? "bg-brand-orange/10 border-brand-orange/40 px-3 py-1.5"
                    : "bg-white/5 border-white/10 px-4 py-2 hover:border-brand-orange/40 hover:bg-brand-orange/5"
                }`}
              >
                {editingSlot === slot ? (
                  <>
                    <input
                      ref={editInputRef}
                      type="time"
                      value={editSlotValue}
                      onChange={e => setEditSlotValue(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEditSlot(); if (e.key === "Escape") setEditingSlot(null); }}
                      className="bg-transparent border-none outline-none text-xs font-bold text-brand-orange w-24"
                    />
                    <button onClick={saveEditSlot} className="text-brand-orange hover:text-white transition-colors">
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <button onClick={() => setEditingSlot(null)} className="text-white/30 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      onClick={() => startEditSlot(slot)}
                      className="text-[10px] font-black text-white group-hover:text-brand-orange transition-colors cursor-pointer uppercase tracking-tight"
                    >
                      {slot}
                    </span>
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => startEditSlot(slot)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white/20 hover:text-brand-orange hover:bg-brand-orange/10 transition-all"
                        title="Edit Slot"
                      >
                        <Save size={10} />
                      </button>
                      <button
                        onClick={() => removeSlot(slot)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Delete Slot"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="font-black text-white uppercase italic text-sm tracking-tight">Blocked Dates</h2>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Holidays, closures & maintenance</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-2 pl-4">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-red-400/40" />
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={e => setNewBlockedDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold text-white w-36 [color-scheme:dark] uppercase"
                />
              </div>
              <button
                onClick={addBlockedDate}
                disabled={!newBlockedDate}
                className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-red-400 transition-all disabled:opacity-40 disabled:grayscale shadow-lg shadow-red-500/10"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Block Date</span>
              </button>
            </div>
          </div>
          {schedule.blockedDates.length === 0 ? (
            <p className="text-white/20 text-xs font-bold uppercase tracking-widest text-center py-4">No blocked dates</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {schedule.blockedDates.map(date => (
                <div key={date} className={`flex items-center gap-2 border rounded-full transition-all group ${
                  editingDate === date
                    ? "bg-red-500/10 border-red-500/40 px-3 py-1.5"
                    : "bg-red-500/5 border-red-500/10 px-4 py-2 hover:border-red-500/40"
                }`}>
                  {editingDate === date ? (
                    <>
                      <input
                        ref={editDateInputRef}
                        type="date"
                        value={editDateValue}
                        onChange={e => setEditDateValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEditDate(); if (e.key === "Escape") setEditingDate(null); }}
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-red-400 w-32"
                      />
                      <button onClick={saveEditDate} className="text-red-400 hover:text-white transition-colors">
                        <Check size={12} strokeWidth={3} />
                      </button>
                      <button onClick={() => setEditingDate(null)} className="text-white/30 hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span 
                        onClick={() => startEditDate(date)}
                        className="text-[10px] font-black text-red-400 cursor-pointer hover:text-white transition-colors uppercase tracking-tight"
                      >
                        {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => startEditDate(date)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Edit Date"
                        >
                          <Plus size={10} className="rotate-45" />
                        </button>
                        <button
                          onClick={() => removeBlockedDate(date)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Delete Date"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
