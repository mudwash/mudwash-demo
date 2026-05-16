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
  const isMountedRef = useRef(true);
  const editInputRef = useRef<HTMLInputElement>(null);

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
    // Convert 24h to 12h format for display
    const [h, m] = newSlot.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const formatted = `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
    if (schedule.timeSlots.includes(formatted)) return;
    const sorted = [...schedule.timeSlots, formatted].sort((a, b) => {
      const toMinutes = (s: string) => {
        const [time, period] = s.split(" ");
        const [hh, mm] = time.split(":").map(Number);
        return (period === "PM" && hh !== 12 ? hh + 12 : period === "AM" && hh === 12 ? 0 : hh) * 60 + mm;
      };
      return toMinutes(a) - toMinutes(b);
    });
    setSchedule({ ...schedule, timeSlots: sorted });
    setNewSlot("");
  };

  const removeSlot = (slot: string) => {
    if (!schedule) return;
    setSchedule({ ...schedule, timeSlots: schedule.timeSlots.filter(s => s !== slot) });
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
    if (schedule.timeSlots.includes(formatted)) { setEditingSlot(null); return; }
    const updated = schedule.timeSlots.map(s => s === editingSlot ? formatted : s).sort((a, b) => {
      const toMin = (s: string) => {
        const [time, period] = s.split(" ");
        const [hh, mm] = time.split(":").map(Number);
        return (period === "PM" && hh !== 12 ? hh + 12 : period === "AM" && hh === 12 ? 0 : hh) * 60 + mm;
      };
      return toMin(a) - toMin(b);
    });
    setSchedule({ ...schedule, timeSlots: updated });
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
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="font-black text-white uppercase italic text-sm tracking-tight">Time Slots</h2>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{schedule.timeSlots.length} slots active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newSlot}
                onChange={e => setNewSlot(e.target.value)}
                className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-all"
              />
              <button
                onClick={addSlot}
                disabled={!newSlot}
                className="bg-brand-orange text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-white transition-colors disabled:opacity-40"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule.timeSlots.map(slot => (
              <div
                key={slot}
                className={`flex items-center gap-1.5 border rounded-full transition-all group ${
                  editingSlot === slot
                    ? "bg-brand-orange/10 border-brand-orange/40 px-3 py-1.5"
                    : "bg-white/5 border-white/10 px-4 py-2 hover:border-brand-orange/40 hover:bg-brand-orange/5 cursor-pointer"
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
                      className="text-xs font-bold text-white group-hover:text-brand-orange transition-colors"
                    >
                      {slot}
                    </span>
                    <button
                      onClick={() => removeSlot(slot)}
                      className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                    >
                      <X size={12} />
                    </button>
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
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={e => setNewBlockedDate(e.target.value)}
                className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-all"
              />
              <button
                onClick={addBlockedDate}
                disabled={!newBlockedDate}
                className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-red-400 transition-colors disabled:opacity-40"
              >
                <Plus size={14} /> Block
              </button>
            </div>
          </div>
          {schedule.blockedDates.length === 0 ? (
            <p className="text-white/20 text-xs font-bold uppercase tracking-widest text-center py-4">No blocked dates</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {schedule.blockedDates.map(date => (
                <div key={date} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 group">
                  <span className="text-xs font-bold text-red-400">
                    {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <button
                    onClick={() => removeBlockedDate(date)}
                    className="text-red-400/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
