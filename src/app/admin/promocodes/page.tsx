"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Ticket, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  X,
  Search,
  Percent,
  DollarSign
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";

interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  usedBy?: string[];
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as 'percentage' | 'fixed',
    value: 0,
    usageLimit: 100,
    active: true
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "promocodes"));
      const data: PromoCode[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as PromoCode);
      });
      setPromoCodes(data);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const codeUpper = formData.code.toUpperCase().replace(/\s+/g, '');
      if (!codeUpper) {
        alert("Please enter a valid code.");
        return;
      }

      await setDoc(doc(db, "promocodes", codeUpper), {
        code: codeUpper,
        type: formData.type,
        value: formData.value,
        usageLimit: formData.usageLimit,
        usedCount: 0,
        active: formData.active,
        usedBy: []
      });
      
      setIsModalOpen(false);
      setFormData({
        code: "",
        type: "percentage",
        value: 0,
        usageLimit: 100,
        active: true
      });
      fetchPromoCodes();
    } catch (error) {
      console.error("Error creating promo code:", error);
      alert("Failed to create promo code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await deleteDoc(doc(db, "promocodes", id));
      fetchPromoCodes();
    } catch (error) {
      console.error("Error deleting promo code:", error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "promocodes", id), {
        active: !currentStatus
      });
      fetchPromoCodes();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const filteredCodes = promoCodes.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white italic uppercase tracking-tighter">Promo Codes</h1>
          <p className="text-white/40 text-sm font-medium">Manage discounts and promotional offers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-orange text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
          >
            <Plus size={18} />
            <span>Create Code</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-all"
          />
        </div>
      </div>

      {/* Promo Codes List */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-orange" size={32} />
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <p className="font-bold uppercase tracking-widest text-xs">No promo codes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-6 py-5">Code</th>
                  <th className="px-6 py-5">Type</th>
                  <th className="px-6 py-5">Value</th>
                  <th className="px-6 py-5">Usage</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredCodes.map((code) => (
                  <tr key={code.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                          <Ticket size={18} />
                        </div>
                        <span className="font-black text-white italic uppercase tracking-tight text-lg">{code.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`text-xs font-bold uppercase tracking-widest ${code.type === 'percentage' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                        {code.type}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-black text-white text-lg italic">
                        {code.type === 'percentage' ? `${code.value}%` : `AED ${code.value}`}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-white/70 font-bold">{code.usedCount} / {code.usageLimit}</span>
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-orange rounded-full" 
                            style={{ width: `${Math.min(100, (code.usedCount / code.usageLimit) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => toggleActive(code.id, code.active)}
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          code.active 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        }`}
                      >
                        {code.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <button 
                        onClick={() => handleDelete(code.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Create Promo Code</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Add a new discount offer</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Promo Code</label>
                  <input 
                    required
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-black uppercase italic tracking-wider text-brand-orange"
                    placeholder="e.g. SUMMER50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Type</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                    >
                      <option value="percentage" className="bg-[#0A0A0A]">Percentage (%)</option>
                      <option value="fixed" className="bg-[#0A0A0A]">Fixed Amount (AED)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Value</label>
                    <div className="relative">
                      <input 
                        required
                        type="number" 
                        min="0"
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                        {formData.type === 'percentage' ? <Percent size={14} /> : <span className="text-xs font-bold">AED</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Usage Limit</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value) || 1})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="w-4 h-4 accent-brand-orange"
                    />
                    <label htmlFor="active" className="text-xs font-bold text-white/70 cursor-pointer">Active immediately</label>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 text-white/40 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-brand-orange text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {isSubmitting ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
