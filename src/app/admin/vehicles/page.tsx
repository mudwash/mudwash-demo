'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Car, 
  Bike,
  ArrowUpDown, 
  X,
  Save,
  ImageIcon,
  Hash,
  DollarSign,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getVehicleTypes, 
  updateVehicleType, 
  VehicleType 
} from '@/lib/vehicleTypes';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export default function VehicleTypesAdmin() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Omit<VehicleType, 'id'>>({
    name: '',
    surcharge: 0,
    order: 0,
    icon: 'Car',
    image: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await getVehicleTypes();
    setVehicleTypes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (type: VehicleType | null = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        surcharge: type.surcharge,
        order: type.order,
        icon: type.icon || 'Car',
        image: type.image || ''
      });
    } else {
      setEditingType(null);
      setFormData({
        name: '',
        surcharge: 0,
        order: vehicleTypes.length + 1,
        icon: 'Car',
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `vehicles/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, image: downloadURL }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType?.id) {
        await updateVehicleType(editingType.id, formData);
      } else {
        await addDoc(collection(db, 'vehicleTypes'), formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      alert('Failed to save vehicle type');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle type?')) return;
    try {
      await deleteDoc(doc(db, 'vehicleTypes', id));
      fetchData();
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      alert('Failed to delete vehicle type');
    }
  };

  const filteredTypes = vehicleTypes.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Vehicle Management</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Configure vehicle categories and pricing surcharges</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-orange text-black px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-orange/20"
        >
          <Plus size={18} strokeWidth={3} />
          New Category
        </button>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search vehicle categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-orange/50 transition-all placeholder:text-white/10"
            />
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Total: {vehicleTypes.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-4 sm:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 hidden sm:table-cell">Preview</th>
                <th className="px-4 sm:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5">Category Name</th>
                <th className="px-4 sm:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 text-right">Surcharge</th>
                <th className="px-4 sm:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 text-center hidden sm:table-cell">Order</th>
                <th className="px-4 sm:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-10"><div className="h-8 bg-white/5 rounded-xl w-full" /></td>
                  </tr>
                ))
              ) : filteredTypes.map((type) => (
                <tr key={type.id} className="group hover:bg-white/[0.02] transition-all">
                  <td className="px-4 sm:px-8 py-6 hidden sm:table-cell">
                    <div className="w-16 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden relative">
                      {type.image ? (
                        <img src={type.image} alt={type.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <Car size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black italic uppercase tracking-tight text-white">{type.name}</span>
                      <span className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Icon: {type.icon || 'Default'}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-6 text-right">
                    <span className="text-sm font-black text-brand-orange italic">AED {type.surcharge}</span>
                  </td>
                  <td className="px-4 sm:px-8 py-6 text-center hidden sm:table-cell">
                    <span className="inline-flex w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center text-[10px] font-black text-white/40">
                      {type.order}
                    </span>
                  </td>
                  <td className="px-4 sm:px-8 py-6">
                    <div className="flex items-center justify-end gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenModal(type)}
                        className="p-3 bg-white/5 text-white/40 hover:bg-brand-orange hover:text-black rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => type.id && handleDelete(type.id)}
                        className="p-3 bg-white/5 text-white/40 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0D0D0D] border border-white/10 rounded-[3.5rem] z-[101] overflow-hidden shadow-2xl"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                      {editingType ? 'Edit Category' : 'New Vehicle Category'}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange">Vehicle Configuration</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 text-white/20 hover:text-white rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Category Name</label>
                      <div className="relative group">
                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-orange/50 transition-all text-white font-bold"
                          placeholder="e.g. Luxury SUV"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Surcharge (₹)</label>
                      <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={18} />
                        <input 
                          type="number" 
                          required
                          value={formData.surcharge}
                          onChange={(e) => setFormData({...formData, surcharge: parseInt(e.target.value) || 0})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-orange/50 transition-all text-white font-bold"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Display Order</label>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={18} />
                        <input 
                          type="number" 
                          required
                          value={formData.order}
                          onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-orange/50 transition-all text-white font-bold"
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Icon Alias</label>
                      <div className="relative group">
                        <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={18} />
                        <select 
                          value={formData.icon}
                          onChange={(e) => setFormData({...formData, icon: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-orange/50 transition-all text-white font-bold appearance-none cursor-pointer"
                        >
                          <option value="Car" className="bg-black text-white">Default Car</option>
                          <option value="ShieldCheck" className="bg-black text-white">Shield (SUV)</option>
                          <option value="Package" className="bg-black text-white">Box (Van)</option>
                          <option value="Truck" className="bg-black text-white">Truck (Heavy)</option>
                          <option value="Bike" className="bg-black text-white">Bike</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Visual Preview (Image File or URL)</label>
                    <div className="flex gap-4">
                       <div className="relative group flex-1">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={18} />
                        <input 
                          type="url" 
                          value={formData.image}
                          onChange={(e) => setFormData({...formData, image: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-orange/50 transition-all text-white font-bold"
                          placeholder="https://..."
                        />
                      </div>
                      <label className="flex flex-col items-center justify-center px-6 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group min-w-[140px]">
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus size={18} className="text-white/20 group-hover:text-brand-orange mb-1" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Upload File</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  {formData.image && (
                    <div className="h-40 w-full rounded-3xl overflow-hidden border border-white/10">
                      <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase italic tracking-widest py-5 rounded-2xl transition-all text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] bg-brand-orange text-black font-black uppercase italic tracking-widest py-5 rounded-2xl shadow-xl shadow-brand-orange/20 hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <Save size={18} strokeWidth={3} />
                      {editingType ? 'Save Changes' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
