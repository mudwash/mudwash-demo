"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Eye, 
  X, 
  Upload, 
  Image as ImageIcon,
  Zap
} from "lucide-react";
import { getAddons, createAddon, updateAddon, deleteAddon, Addon } from "@/lib/addons";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    active: true,
    order: 0,
    duration: "",
    applicableCategories: [] as string[]
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAddons();
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchAddons = async () => {
    try {
      const data = await getAddons();
      if (isMountedRef.current) setAddons(data);
    } catch (error) {
      console.error("Error fetching addons:", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `addons/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({ ...prev, image: downloadURL }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedAddon && selectedAddon.id) {
        await updateAddon(selectedAddon.id, formData);
      } else {
        await createAddon(formData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchAddons();
    } catch (error) {
      console.error("Error saving addon:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      image: "",
      active: true,
      order: addons.length,
      duration: "",
      applicableCategories: []
    });
    setSelectedAddon(null);
  };

  const handleEdit = (addon: Addon) => {
    setSelectedAddon(addon);
    setFormData({
      name: addon.name,
      price: addon.price,
      description: addon.description || "",
      image: addon.image || "",
      active: addon.active !== false,
      order: addon.order || 0,
      duration: addon.duration || "",
      applicableCategories: addon.applicableCategories || []
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this addon?")) return;
    try {
      await deleteAddon(id);
      fetchAddons();
    } catch (error) {
      console.error("Error deleting addon:", error);
    }
    setActiveDropdown(null);
  };

  const toggleActive = async (addon: Addon) => {
    if (!addon.id) return;
    try {
      await updateAddon(addon.id, { active: !addon.active });
      fetchAddons();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const filteredAddons = addons.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white italic uppercase tracking-tighter">Add-ons</h1>
          <p className="text-white/40 text-sm font-medium">Manage extra items and recommendations for users.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-brand-orange text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
          >
            <Plus size={18} />
            <span>New Add-on</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Loading Add-ons...</p>
          </div>
        ) : filteredAddons.length === 0 ? (
          <div className="p-20 text-center">
            <p className="text-white/40 text-sm">No add-ons found. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Add-on</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAddons.map((addon) => (
                  <tr key={addon.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                          {addon.image ? (
                            <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                          ) : (
                            <Zap size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase italic">{addon.name}</p>
                          <p className="text-xs text-white/40 font-medium mt-0.5 line-clamp-1">{addon.description || "No description"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm font-black text-brand-orange italic">AED {addon.price}</span>
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => toggleActive(addon)}
                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${addon.active !== false ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}
                      >
                        {addon.active !== false ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="relative inline-block">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === addon.id ? null : (addon.id || null))}
                          className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        <AnimatePresence>
                          {activeDropdown === addon.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-40 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                              >
                                <div className="p-2 flex flex-col">
                                  <button 
                                    onClick={() => handleEdit(addon)}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-all"
                                  >
                                    <Edit size={14} /> Edit
                                  </button>
                                  <button 
                                    onClick={() => addon.id && handleDelete(addon.id)}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-lg text-xs font-bold text-red-500 transition-all"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
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
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-white">{selectedAddon ? "Edit Add-on" : "Create New Add-on"}</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">{selectedAddon ? "Modify existing item" : "Add a new recommendation"}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-orange transition-all"
                      placeholder="e.g. Engine Bay Detailing"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Price (AED)</label>
                    <input 
                      type="text" 
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-orange transition-all"
                      placeholder="e.g. 150"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-orange transition-all h-24"
                    placeholder="Describe the add-on service..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Duration */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Duration</label>
                    <input 
                      type="text" 
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-orange transition-all"
                      placeholder="e.g. 30 mins"
                    />
                  </div>

                  {/* Applicable Categories */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Applicable Categories</label>
                    <input 
                      type="text" 
                      value={formData.applicableCategories.join(", ")}
                      onChange={(e) => setFormData(prev => ({ ...prev, applicableCategories: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                      className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-orange transition-all"
                      placeholder="e.g. Ceramic Coating, Polish (leave empty for all)"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-center text-white/20 overflow-hidden">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <input 
                          type="file" 
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept="image/*"
                        />
                        <button 
                          type="button"
                          className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                        >
                          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          {isUploading ? "Uploading..." : "Upload Image"}
                        </button>
                      </div>
                      <p className="text-[9px] text-white/20 mt-1.5 uppercase font-bold tracking-wider">Recommended: Square image, max 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#111111] rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">Active Status</p>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-0.5">Show this add-on to users</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                    className={`w-12 h-6 rounded-full p-1 transition-all ${formData.active ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.active ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  {selectedAddon && (
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedAddon.id!)}
                      className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white transition-colors"
                    >
                      Delete Add-on
                    </button>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="bg-brand-orange hover:bg-white text-black px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : selectedAddon ? "Update Add-on" : "Create Add-on"}
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

// Add Loader2 to imports if not present
const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
