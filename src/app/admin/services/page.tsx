"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowUp,
  ArrowDown,
  Sparkles, 
  MoreVertical,
  X,
  Loader2,
  Image as ImageIcon,
  Clock,
  Droplets, 
  Zap, 
  Snowflake, 
  Waves, 
  Wrench, 
  Settings, 
  Disc, 
  Car,
  ShieldCheck,
  Package,
  SprayCan,
  Brush,
  Wind,
  Sun,
  Shield,
  Crown,
  Diamond,
  Star,
  Flame,
  Award,
  BadgeCheck,
  CheckCircle,
  Clock3,
  Timer,
  Fuel,
  Gauge,
  Navigation,
  Smartphone,
  Trophy,
  Activity,
  Heart,
  Palette,
  Droplet,
  GlassWater,
  CloudRain,
  List,
  Check,
  ChevronRight,
  LayoutGrid,
  CreditCard,
  History,
  Paintbrush,
  PlusCircle,
  Settings2,
  Upload
} from "lucide-react";
import { getServices, addService, updateService, deleteService, Service } from "@/lib/services";
import { getCategories, addCategory, updateCategory, deleteCategory, Category } from "@/lib/categories";
import { getVehicleTypes, VehicleType } from "@/lib/vehicleTypes";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const ICON_MAP: any = { Waves, Sparkles, Car, ShieldCheck, Paintbrush, Wrench, Droplets, Zap, Snowflake, Settings, Disc, Clock, Package, SprayCan, Brush, Wind, Sun, Shield, Crown, Diamond, Star, Flame, Award, BadgeCheck, CheckCircle, Clock3, Timer, Fuel, Gauge, Navigation, Smartphone, Trophy, Activity, Heart, Palette, Droplet, GlassWater, CloudRain };

const ICON_OPTIONS = Object.keys(ICON_MAP).map(key => ({
  id: key,
  icon: ICON_MAP[key],
  label: key
}));

function InlineFacilityInput({ serviceId, currentItems, onSave }: { serviceId: string; currentItems: string[]; onSave: () => void }) {
  const [val, setVal] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const add = async () => {
    if (!val.trim()) return;
    setSaving(true);
    await updateService(serviceId, { includedItems: [...currentItems, val.trim()] });
    setVal('');
    setSaving(false);
    onSave();
  };
  return (
    <div className="flex gap-2 mt-1">
      <input
        type="text" placeholder="Add facility..." value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
        className="flex-grow bg-black border border-white/8 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F59E0B] text-white placeholder:text-white/20"
      />
      <button onClick={add} disabled={saving||!val.trim()} className="px-4 py-2.5 bg-[#F59E0B] text-black rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
        {saving ? <Loader2 size={12} className="animate-spin"/> : <><Plus size={12} strokeWidth={3}/> Add</>}
      </button>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentFormStep, setCurrentFormStep] = useState(1);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `services/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      setFormData(prev => ({ 
        ...prev, 
        image: prev.image || url,
        images: [...(prev.images || []), url]
      }));
    } catch (error) {
      console.error("Error uploading image to ImgBB:", error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState<Service>({
    name: "",
    price: "",
    duration: "",
    category: "Exterior Wash",
    description: "",
    image: "",
    images: [],
    icon: "Waves",
    active: true,
    includedItems: []
  });

  const [newCatData, setNewCatData] = useState({ name: "", icon: "Waves" });
  const [newItem, setNewItem] = useState("");
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<string>('');
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    initData();
    return () => { isMountedRef.current = false; };
  }, []);

  // Set first category as default when categories load
  React.useEffect(() => {
    if (categories.length > 0 && !selectedAdminCategory) {
      setSelectedAdminCategory(categories[0].name);
    }
  }, [categories]);

  const initData = async () => {
    try {
      const [srvData, catData, vData] = await Promise.all([getServices(), getCategories(), getVehicleTypes()]);
      if (isMountedRef.current) {
        setServices(srvData);
        setCategories(catData);
        setVehicleTypes(vData);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleSyncData = async () => {
    if (!confirm("This will synchronize all existing services with the current category engine. Proceed?")) return;
    setIsSubmitting(true);
    try {
      const allServices = await getServices();
      for (const s of allServices) {
        let newCat = s.category;
        const currentCat = (s.category || "").toLowerCase();
        
        if (currentCat.includes("wash") || currentCat.includes("exterior")) newCat = "Exterior Wash";
        else if (currentCat.includes("interior") || currentCat.includes("cleaning")) newCat = "Interior Cleaning";
        else if (currentCat.includes("detailing") || currentCat.includes("full")) newCat = "Full Detailing";
        else if (currentCat.includes("ceramic") || currentCat.includes("coating")) newCat = "Ceramic Coating";
        else if (currentCat.includes("paint") || currentCat.includes("protection")) newCat = "Paint Protection";
        else if (currentCat.includes("enhancement") || currentCat.includes("add")) newCat = "Enhancements";
        
        if (newCat !== s.category) {
          await updateService(s.id!, { category: newCat });
        }
      }
      initData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setCurrentFormStep(1);
    setFormData({
      name: "", price: "", duration: "", category: selectedAdminCategory || categories[0]?.name || "Exterior Wash", description: "", image: "", images: [], icon: "Waves", active: true, includedItems: []
    });
    setIsPanelOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id!);
    setCurrentFormStep(1);
    setFormData({
      ...service,
      category: service.category || categories[0]?.name || "Exterior Wash",
      includedItems: service.includedItems || [],
      images: service.images || []
    });
    setIsPanelOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id || null);
    setNewCatData({ name: cat.name, icon: cat.icon });
    setIsAddingCategory(true);
  };

  const handleSaveCategory = async () => {
    if (!newCatData.name) return;
    setIsSubmitting(true);
    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, {
          name: newCatData.name,
          icon: newCatData.icon
        });
      } else {
        await addCategory({
          name: newCatData.name,
          icon: newCatData.icon,
          order: categories.length + 1
        });
      }
      const updatedCats = await getCategories();
      setCategories(updatedCats);
      setFormData({ ...formData, category: newCatData.name });
      setIsAddingCategory(false);
      setEditingCategoryId(null);
      setNewCatData({ name: "", icon: "Waves" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? Services using this category will still exist but won't be grouped under it.")) {
      try {
        await deleteCategory(id);
        const updatedCats = await getCategories();
        setCategories(updatedCats);
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateService(editingId, formData);
      } else {
        await addService(formData);
      }
      setIsPanelOpen(false);
      initData();
    } catch (error) {
      console.error("Error saving service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(id);
        initData();
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  const handleMoveUp = async (service: Service, idx: number, catServices: Service[]) => {
    if (idx === 0) return;
    setIsSubmitting(true);
    try {
      const prevService = catServices[idx - 1];
      const currentOrder = service.order !== undefined ? service.order : idx;
      const prevOrder = prevService.order !== undefined ? prevService.order : idx - 1;
      
      await Promise.all([
        updateService(service.id!, { order: prevOrder }),
        updateService(prevService.id!, { order: currentOrder })
      ]);
      initData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveDown = async (service: Service, idx: number, catServices: Service[]) => {
    if (idx === catServices.length - 1) return;
    setIsSubmitting(true);
    try {
      const nextService = catServices[idx + 1];
      const currentOrder = service.order !== undefined ? service.order : idx;
      const nextOrder = nextService.order !== undefined ? nextService.order : idx + 1;
      
      await Promise.all([
        updateService(service.id!, { order: nextOrder }),
        updateService(nextService.id!, { order: currentOrder })
      ]);
      initData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIncludedItem = () => {
    if (!newItem.trim()) return;
    setFormData({
      ...formData,
      includedItems: [...(formData.includedItems || []), newItem.trim()]
    });
    setNewItem("");
  };

  const removeIncludedItem = (index: number) => {
    setFormData({
      ...formData,
      includedItems: formData.includedItems?.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#F59E0B]/30 font-sans">
      <div className="px-0 sm:px-8 py-4 sm:py-8 max-w-[1600px] mx-auto space-y-8 sm:space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F59E0B] rounded-xl flex items-center justify-center text-black shrink-0">
                <LayoutGrid size={24} strokeWidth={3} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">Services Dashboard</h1>
            </div>
            <p className="text-white/40 text-sm font-medium max-w-xl">
              Manage your premium detailing Treatments and Categories.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
             <button onClick={handleSyncData} disabled={isSubmitting} className="flex-1 sm:flex-none bg-white/5 text-white/40 hover:bg-white/10 hover:text-white px-5 sm:px-6 py-4 sm:py-5 rounded-2xl font-black uppercase italic tracking-widest text-[9px] sm:text-[10px] transition-all flex items-center justify-center gap-3 border border-white/5">
               {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <History size={14} />}
               <span>Sync Engine</span>
             </button>
             <button onClick={handleAddNew} className="flex-1 sm:flex-none bg-[#F59E0B] text-black px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase italic tracking-widest text-[11px] sm:text-xs flex items-center justify-center gap-3 sm:gap-4 hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-[#F59E0B]/20">
               <Plus size={20} strokeWidth={4} />
               <span>New Package</span>
             </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-8">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-[#F59E0B]/10 border-t-[#F59E0B] rounded-full animate-spin" />
              <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#F59E0B] animate-pulse" size={28} />
            </div>
            <p className="text-white/20 font-black uppercase tracking-[0.4em] text-xs">Accessing Catalog...</p>
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── Category Icon Row ── */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-8 min-w-max pb-4 pt-5 overflow-visible">
                {categories.map(cat => {
                  const IC = ICON_MAP[cat.icon] || Package;
                  const isActive = selectedAdminCategory === cat.name;
                  const count = services.filter(s => (s.category||'').toLowerCase().trim() === (cat.name||'').toLowerCase().trim()).length;
                  return (
                    <button key={cat.id} onClick={() => setSelectedAdminCategory(cat.name)} className="flex flex-col items-center gap-3 group relative">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 relative overflow-visible ${isActive ? 'bg-[#F59E0B] text-black shadow-[0_12px_30px_rgba(245,158,11,0.3)] scale-110' : 'bg-white/5 border border-white/5 text-white/30 hover:border-white/15 hover:text-white/60'}`}>
                        <IC size={30} />
                        <span className={`absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center shadow-lg z-10 ${isActive ? 'bg-black text-[#F59E0B]' : 'bg-[#1a1a1a] border border-white/10 text-white/40'}`}>{count}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-[#F59E0B]' : 'text-white/20'}`}>{cat.name}</span>
                    </button>
                  );
                })}
                {/* Add category */}
                <button onClick={() => { setEditingCategoryId(null); setNewCatData({name:'',icon:'Waves'}); setIsAddingCategory(true); setIsPanelOpen(true); }} className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/15 hover:border-[#F59E0B]/40 hover:text-[#F59E0B]/40 transition-all">
                    <Plus size={24} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/10">New Category</span>
                </button>
              </div>
            </div>


            {/* ── Services under selected category ── */}
            {(() => {
              const catServices = services.filter(s => (s.category||'').toLowerCase().trim() === (selectedAdminCategory||'').toLowerCase().trim());
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">{selectedAdminCategory}</h2>
                      <span className="px-3 py-1 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-full text-[9px] font-black text-[#F59E0B] uppercase tracking-widest">{catServices.length} services</span>
                    </div>
                    <button onClick={handleAddNew} className="flex items-center gap-2 bg-[#F59E0B] text-black px-5 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-[#F59E0B]/20">
                      <Plus size={16} strokeWidth={4}/> Add Service
                    </button>
                  </div>

                  {catServices.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/8 rounded-3xl">
                      <Package size={36} className="text-white/10 mx-auto mb-4"/>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/15">No services in this category</p>
                      <button onClick={handleAddNew} className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors"><Plus size={14}/> Add first service</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {catServices.map((service, idx) => {
                        const IC = (service.icon && ICON_MAP[service.icon]) || Package;
                        const facilities = service.includedItems || [];
                        const isExpanded = expandedServiceId === service.id;
                        return (
                          <motion.div key={service.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:idx*0.05}} className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all">
                            {/* Service row */}
                            <div className="flex items-start sm:items-center gap-3 sm:gap-5 px-4 sm:px-5 py-4">
                              {/* Icon */}
                              <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/15 flex items-center justify-center text-[#F59E0B] shrink-0">
                                <IC size={22}/>
                              </div>
                              {/* Info */}
                              <div className="flex-grow min-w-0 flex flex-col justify-center gap-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-black italic uppercase tracking-tight text-white leading-none">{service.name}</h3>
                                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase leading-none ${service.active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/20 border border-white/5'}`}>{service.active ? 'Live' : 'Draft'}</span>
                                </div>
                                {service.description && <p className="text-[11px] text-white/25 truncate leading-none">{service.description}</p>}
                                <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1">
                                  <span className="text-sm font-black text-white italic leading-none">{service.price}</span>
                                  {service.duration && <span className="text-[10px] text-white/20 flex items-center gap-1 leading-none"><Clock size={9}/> {service.duration}</span>}
                                  <span className="text-[10px] text-white/15 leading-none">{facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'}</span>
                                </div>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => handleMoveUp(service, idx, catServices)} disabled={idx === 0} title="Move Up" className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-white/5 text-white/30 hover:bg-white hover:text-black'}`}>
                                  <ArrowUp size={14}/>
                                </button>
                                <button onClick={() => handleMoveDown(service, idx, catServices)} disabled={idx === catServices.length - 1} title="Move Down" className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${idx === catServices.length - 1 ? 'opacity-30 cursor-not-allowed' : 'bg-white/5 text-white/30 hover:bg-white hover:text-black'}`}>
                                  <ArrowDown size={14}/>
                                </button>
                                <button onClick={() => setExpandedServiceId(isExpanded ? null : (service.id||null))} title="Manage facilities" className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}>
                                  <ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}/>
                                </button>
                                <button onClick={() => handleEdit(service)} title="Edit" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:bg-white hover:text-black transition-all">
                                  <Edit2 size={14}/>
                                </button>
                                <button onClick={() => service.id && handleDelete(service.id)} title="Delete" className="w-9 h-9 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/30 hover:bg-red-500 hover:text-white transition-all">
                                  <Trash2 size={14}/>
                                </button>
                              </div>
                            </div>

                            {/* Expanded: facilities */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25}} className="overflow-hidden">
                                  <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#F59E0B]">Included Facilities</p>
                                    {/* Existing facilities */}
                                    <div className="flex flex-wrap gap-2">
                                      {facilities.map((item, i) => (
                                        <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 group/fac">
                                          <Check size={10} strokeWidth={4} className="text-[#F59E0B]/60"/>
                                          <span className="text-[11px] font-semibold text-white/50">{item}</span>
                                          <button onClick={async () => {
                                            const updated = facilities.filter((_,fi) => fi !== i);
                                            await updateService(service.id!, { includedItems: updated });
                                            initData();
                                          }} className="w-4 h-4 rounded-full flex items-center justify-center text-white/10 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover/fac:opacity-100 transition-all ml-1">
                                            <X size={9}/>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    {/* Inline add facility */}
                                    <InlineFacilityInput serviceId={service.id!} currentItems={facilities} onSave={initData}/>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* Slide-over Wizard — 2 Phase */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPanelOpen(false)} className="fixed inset-0 z-[199] bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 35, stiffness: 350 }} className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0A0A0A] border-l border-white/10 z-[200] shadow-2xl flex flex-col">
              
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-[#0F0F0F]">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F59E0B]">
                    {editingId ? `Edit Mode: ${formData.name || 'Service Detail'}` : `Phase 0${currentFormStep} Configuration`}
                  </span>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                    {editingId ? "Update Treatment" : "Initialize Package"}
                  </h2>
                </div>
                <button onClick={() => setIsPanelOpen(false)} className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all"><X size={24} /></button>
              </div>

              
              {/* Phase tabs */}
              <div className="flex bg-[#0F0F0F]/50 border-b border-white/5">
                {[{n:1,label:'Service Details'},{n:2,label:'Facilities'}].map(({n,label})=>(
                  <button key={n} onClick={()=>n<currentFormStep&&setCurrentFormStep(n)}
                    className={`flex-1 py-5 text-[9px] font-black uppercase tracking-[0.3em] transition-all relative flex items-center justify-center gap-2 ${currentFormStep===n?'text-[#F59E0B]':n<currentFormStep?'text-white/40 cursor-pointer':'text-white/10 cursor-not-allowed'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border ${currentFormStep===n?'bg-[#F59E0B] border-[#F59E0B] text-black':n<currentFormStep?'bg-white/10 border-white/10 text-white/40':'border-white/10 text-white/10'}`}>{n}</span>
                    {label}
                    {currentFormStep===n&&<motion.div layoutId="step-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F59E0B]"/>}
                  </button>
                ))}
              </div>
              <div className="flex-grow overflow-y-auto p-10 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {currentFormStep===1&&(
                    <motion.div key="p1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Service Name</label>
                        <input type="text" placeholder="e.g. Premium Full Detail" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#F59E0B]"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Description</label>
                        <textarea rows={3} placeholder="Short summary..." value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#F59E0B] resize-none italic"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Default Price</label>
                          <input type="text" placeholder="450" value={formData.price} onChange={e=>setFormData({...formData,price:e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-lg font-black italic focus:outline-none focus:border-[#F59E0B]"/>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Duration</label>
                          <input type="text" placeholder="2-3 Hours" value={formData.duration} onChange={e=>setFormData({...formData,duration:e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-lg font-black italic focus:outline-none focus:border-[#F59E0B]"/>
                        </div>
                      </div>

                      {/* Vehicle Pricing Section */}
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Vehicle Pricing (Overrides)</label>
                        <p className="text-[10px] text-white/40 mt-1">Set specific prices for each vehicle type. If empty, the default price will be used.</p>
                        <div className="grid grid-cols-2 gap-4">
                          {vehicleTypes.map(v => (
                            <div key={v.id} className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-white/40">{v.name}</label>
                              <input 
                                type="text" 
                                placeholder={`e.g. ${formData.price || '450'}`} 
                                value={formData.vehiclePricing?.[v.name] || ""} 
                                onChange={e => setFormData({
                                  ...formData, 
                                  vehiclePricing: {
                                    ...(formData.vehiclePricing || {}),
                                    [v.name]: e.target.value
                                  }
                                })} 
                                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#F59E0B] text-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Category</label>
                          <button onClick={()=>{setEditingCategoryId(null);setNewCatData({name:'',icon:'Waves'});setIsAddingCategory(true);}} className="flex items-center gap-1 text-[9px] font-black uppercase text-white/30 hover:text-[#F59E0B] transition-colors"><PlusCircle size={12}/> New</button>
                        </div>
                        {isAddingCategory?(
                          <div className="p-5 bg-[#111] rounded-2xl border border-[#F59E0B]/30 space-y-4">
                            <input type="text" placeholder="Category name" value={newCatData.name} onChange={e=>setNewCatData({...newCatData,name:e.target.value})} className="w-full bg-black border border-white/5 rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-[#F59E0B]"/>
                            <div className="grid grid-cols-7 gap-2">
                              {ICON_OPTIONS.map(opt=>(<button key={opt.id} onClick={()=>setNewCatData({...newCatData,icon:opt.id})} className={`aspect-square rounded-xl border flex items-center justify-center ${newCatData.icon===opt.id?'bg-[#F59E0B] text-black border-[#F59E0B]':'bg-white/5 border-white/5 text-white/20'}`}><opt.icon size={14}/></button>))}
                            </div>
                            <div className="flex gap-3">
                              <button onClick={handleSaveCategory} disabled={isSubmitting} className="flex-grow bg-[#F59E0B] text-black py-3 rounded-xl font-black uppercase italic text-[9px] tracking-widest">{editingCategoryId?'Update':'Create'}</button>
                              <button onClick={()=>{setIsAddingCategory(false);setEditingCategoryId(null);}} className="px-5 bg-white/5 text-white/40 rounded-xl font-black uppercase italic text-[9px]">Cancel</button>
                            </div>
                          </div>
                        ):(
                          <div className="grid grid-cols-3 gap-3">
                            {categories.map(cat=>{
                              const IC=ICON_MAP[cat.icon]||Package;
                              const on=(formData.category||'').toLowerCase().trim()===(cat.name||'').toLowerCase().trim();
                              return(
                                <div key={cat.id} className="relative group/cat">
                                  <button onClick={()=>setFormData({...formData,category:cat.name})} className={`w-full p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${on?'bg-[#F59E0B] border-[#F59E0B] text-black shadow-xl':'bg-[#111] border-white/5 text-white/30 hover:border-white/15'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${on?'bg-black/10 text-black':'bg-white/5 text-white/30'}`}><IC size={20}/></div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">{cat.name}</span>
                                    {on&&<Check size={10} strokeWidth={4} className="absolute top-2 right-2"/>}
                                  </button>
                                  <button onClick={e=>{e.stopPropagation();handleEditCategory(cat);}} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white flex items-center justify-center text-black hover:bg-[#F59E0B] z-20 transition-all shadow-lg" title="Edit Category"><Settings2 size={12}/></button>
                                  <button onClick={e=>{e.stopPropagation();cat.id && handleDeleteCategory(cat.id);}} className="absolute top-9 left-2 w-6 h-6 rounded-full bg-white flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white z-20 transition-all shadow-lg" title="Delete Category"><Trash2 size={12}/></button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Service Icon</label>
                        <div className="grid grid-cols-7 gap-2 max-h-44 overflow-y-auto custom-scrollbar">
                          {ICON_OPTIONS.map(opt=>(<button key={opt.id} onClick={()=>setFormData({...formData,icon:opt.id})} className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${formData.icon===opt.id?'bg-[#F59E0B] text-black border-[#F59E0B] shadow-lg':'bg-white/5 border-white/5 text-white/25 hover:text-white/60'}`}><opt.icon size={16}/><span className="text-[6px] font-black uppercase leading-none opacity-60">{opt.label}</span></button>))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Service Images</label>
                        <div className="space-y-3">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                            id="service-image-upload" 
                          />
                          <label 
                            htmlFor="service-image-upload" 
                            className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#F59E0B] cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                          >
                            <Upload size={16} className="text-[#F59E0B]" />
                            <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">
                              {uploading ? "Uploading..." : "Upload Image"}
                            </span>
                          </label>
                          
                          {formData.images && formData.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-3">
                              {formData.images.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-white/10 relative group">
                                  <img src={img} alt="Service" className="w-full h-full object-cover" />
                                  <button 
                                    onClick={() => setFormData(prev => {
                                      const newImages = prev.images?.filter((_, i) => i !== idx) || [];
                                      return {
                                        ...prev,
                                        images: newImages,
                                        image: prev.image === img ? (newImages[0] || "") : prev.image
                                      };
                                    })} 
                                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={10} />
                                  </button>
                                  {formData.image === img && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-[#F59E0B] text-black text-[8px] font-black uppercase text-center py-0.5">Cover</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-5 bg-[#F59E0B]/5 border border-[#F59E0B]/10 rounded-2xl">
                        <div><p className="text-xs font-black uppercase text-white">Publish Service</p><p className="text-[10px] text-white/20 mt-0.5">Visible in booking engine</p></div>
                        <button onClick={()=>setFormData({...formData,active:!formData.active})} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.active?'bg-[#F59E0B]':'bg-white/10'}`}><motion.div animate={{x:formData.active?24:3}} className="absolute top-1 w-6 h-6 rounded-full bg-white shadow"/></button>
                      </div>
                    </motion.div>
                  )}
                  {currentFormStep===2&&(
                    <motion.div key="p2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-[#111] rounded-2xl border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
                          {(()=>{const IC=(formData.icon && ICON_MAP[formData.icon])||Package;return<IC size={22}/>;})()}
                        </div>
                        <div>
                          <p className="text-sm font-black italic uppercase tracking-tight text-white">{formData.name||'Service Name'}</p>
                          <p className="text-[10px] text-white/30">{formData.category} · {formData.price} · {formData.duration}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F59E0B]">Service Facilities</h3>
                        <p className="text-[10px] text-white/20 mt-1">Add what is included. Press Enter or click Add.</p>
                      </div>
                      <div className="flex gap-3">
                        <input type="text" placeholder="e.g. Full exterior hand wash" value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addIncludedItem())} className="flex-grow bg-[#111] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#F59E0B]"/>
                        <button onClick={addIncludedItem} className="px-6 bg-[#F59E0B] text-black rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:scale-[1.03] active:scale-95 shadow-lg"><Plus size={15} strokeWidth={3}/> Add</button>
                      </div>
                      {formData.includedItems&&formData.includedItems.length>0?(
                        <div className="space-y-3">
                          {formData.includedItems.map((item,i)=>(
                            <motion.div key={i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-white/5 group">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#F59E0B]/15 flex items-center justify-center text-[#F59E0B] shrink-0"><Check size={12} strokeWidth={4}/></div>
                                <span className="text-sm font-semibold text-white/70 italic">{item}</span>
                              </div>
                              <button onClick={()=>removeIncludedItem(i)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/10 hover:bg-red-500/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                            </motion.div>
                          ))}
                        </div>
                      ):(
                        <div className="text-center py-12 border border-dashed border-white/8 rounded-2xl">
                          <List size={28} className="text-white/10 mx-auto mb-3"/>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/15">No facilities added yet</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="p-8 border-t border-white/5 bg-[#0F0F0F] flex gap-4">
                {currentFormStep===1?(
                  <button onClick={()=>setCurrentFormStep(2)} disabled={!formData.name||!formData.price} className="flex-grow bg-white text-black py-5 rounded-2xl font-black uppercase italic tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-30 disabled:cursor-not-allowed">
                    Next — Add Facilities <ChevronRight size={18} strokeWidth={4}/>
                  </button>
                ):(
                  <>
                    <button onClick={()=>setCurrentFormStep(1)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all">
                      <ChevronRight size={20} className="rotate-180"/>
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex-grow bg-[#F59E0B] text-black py-5 rounded-2xl font-black uppercase italic tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#F59E0B]/20">
                      {isSubmitting?<Loader2 className="animate-spin" size={20}/>:<>{editingId?'Save Changes':'Deploy Service'}</>}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
