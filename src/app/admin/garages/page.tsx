'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  Edit2,
  Loader2,
  X,
  Upload,
  ExternalLink
} from "lucide-react";
import { getGarages, createGarage, updateGarage, deleteGarage, Garage } from "@/lib/garages";

export default function AdminGarages() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGarage, setEditingGarage] = useState<Garage | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    image: "",
    distance: "",
    location: ""
  });

  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async () => {
    setLoading(true);
    try {
      const data = await getGarages();
      setGarages(data);
    } catch (error) {
      console.error("Error fetching garages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingGarage?.id) {
        await updateGarage(editingGarage.id, formData);
      } else {
        await createGarage(formData);
      }
      setIsModalOpen(false);
      setEditingGarage(null);
      setFormData({ name: "", image: "", distance: "", location: "" });
      fetchGarages();
    } catch (error) {
      console.error("Error saving garage:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this garage?")) return;
    try {
      await deleteGarage(id);
      fetchGarages();
    } catch (error) {
      console.error("Error deleting garage:", error);
    }
  };

  const openEditModal = (garage: Garage) => {
    setEditingGarage(garage);
    setFormData({
      name: garage.name,
      image: garage.image,
      distance: garage.distance,
      location: garage.location || ""
    });
    setIsModalOpen(true);
  };

  const filteredGarages = garages.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Garages</h1>
          <p className="text-white/40 text-sm font-medium">Manage and add nearby garages for your customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingGarage(null);
              setFormData({ name: "", image: "", distance: "", location: "" });
              setIsModalOpen(true);
            }}
            className="bg-brand-orange text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
          >
            <Plus size={18} />
            <span>Add Garage</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search garages by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-all"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-orange" size={32} />
        </div>
      ) : filteredGarages.length === 0 ? (
        <div className="text-center py-20 text-white/20 border border-dashed border-white/10 rounded-2xl">
          <MapPin size={48} className="mx-auto mb-4 opacity-10" />
          <p>No garages found. Start by adding one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredGarages.map((garage) => (
            <motion.div
              layout
              key={garage.id}
              className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/20 transition-all flex flex-col h-full shadow-2xl"
            >
              <div className="relative h-28 sm:h-48">
                <img
                  src={garage.image}
                  alt={garage.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4">
                  <span className="bg-brand-orange text-black text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded uppercase tracking-wider">
                    {garage.distance}
                  </span>
                </div>
              </div>
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 flex-1 flex flex-col">
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5 sm:mb-1 line-clamp-1">{garage.name}</h3>
                  <p className="text-white/40 text-[9px] sm:text-xs flex items-center gap-1 line-clamp-1">
                    <MapPin size={10} className="text-brand-orange shrink-0" />
                    {garage.location || "Location not specified"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 sm:pt-2 mt-auto">
                  <button
                    onClick={() => openEditModal(garage)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => garage.id && handleDelete(garage.id)}
                    className="p-2 sm:p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all flex items-center justify-center"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="text-xl font-bold">{editingGarage ? "Edit Garage" : "Add New Garage"}</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Garage Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Auto Precision Lab"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black border border-white/5 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-brand-orange transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Distance</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 2.5 km"
                        value={formData.distance}
                        onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                        className="w-full bg-black border border-white/5 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-brand-orange transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Location Area</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Al Quoz, Dubai"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-black border border-white/5 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-brand-orange transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Image URL</label>
                    <div className="relative">
                      <input
                        required
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full bg-black border border-white/5 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-brand-orange transition-all pr-12"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                        <Upload size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-brand-orange text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingGarage ? "Update Garage" : "Create Garage")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
