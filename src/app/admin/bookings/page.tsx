"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2,
  XCircle,
  Eye,
  X,
  CreditCard,
  Car as CarIcon,
  Waves, Sparkles, ShieldCheck, Paintbrush, Zap, Wrench, Droplets, 
  Snowflake, Settings, Disc, Package, SprayCan, Brush, Wind, Sun, 
  Shield, Crown, Diamond, Star, Flame, Award, BadgeCheck, CheckCircle, 
  Clock3, Timer, Fuel, Gauge, Navigation, Smartphone, Trophy, Activity, 
  Heart, Palette, Droplet, GlassWater, CloudRain, Truck, Bike,
  Search, Filter, Download, Plus, MoreVertical, Mail, Phone, MessageCircle, MapPin, Calendar, Clock, Loader2, Trash2, User as UserIcon
} from "lucide-react";

const ICON_MAP: any = { 
  Waves, Sparkles, Car: CarIcon, ShieldCheck, Paintbrush, Zap, Wrench, Droplets, 
  Snowflake, Settings, Disc, Clock, Package, SprayCan, Brush, Wind, Sun, 
  Shield, Crown, Diamond, Star, Flame, Award, BadgeCheck, CheckCircle, 
  Clock3, Timer, Fuel, Gauge, Navigation, Smartphone, Trophy, Activity, 
  Heart, Palette, Droplet, GlassWater, CloudRain, Truck, Bike 
};
import { getBookings, updateBookingStatus, createBooking, deleteBooking, Booking, COLLECTION_NAME } from "@/lib/bookings";
import { getServices, Service } from "@/lib/services";
import { getCategories, Category } from "@/lib/categories";
import { getSchedule, ScheduleSettings } from "@/lib/schedule";
import { getVehicleTypes, VehicleType } from "@/lib/vehicleTypes";
import { getAddons, Addon } from "@/lib/addons";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { updateSessionBookingStatus, fireGadsConversion, AD_TRACKING_COLLECTION, markConversionSent } from "@/lib/adTracking";
import { getDocs, where } from "firebase/firestore";

const statusStyles = {
  Completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  Accepted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'customer'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("Sedan");
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null);
  const [modalServiceCategory, setModalServiceCategory] = useState<string>("All");
  const [addonsList, setAddonsList] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    time: "",
    location: "",
    amount: "AED 0",
    carDetails: "",
    status: "Pending" as Booking["status"]
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    // Real-time listener for bookings
    const bookingsCol = collection(db, COLLECTION_NAME);
    const q = query(bookingsCol, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isMountedRef.current) return;
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Booking[];
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error("Realtime bookings error:", error);
      setLoading(false);
    });
    fetchServices();
    fetchCategories();
    fetchScheduleSettings();
    fetchVehicleTypes();
    fetchAddons();
    return () => { isMountedRef.current = false; unsubscribe(); };
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const data = await getVehicleTypes();
      if (isMountedRef.current) {
        setVehicleTypes(data);
        if (data.length > 0) {
          setSelectedVehicleType(data[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
    }
  };

  const fetchScheduleSettings = async () => {
    try {
      const data = await getSchedule();
      if (isMountedRef.current) setScheduleSettings(data);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      if (isMountedRef.current) setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await getServices(true);
      if (isMountedRef.current) setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchAddons = async () => {
    try {
      const data = await getAddons(true);
      if (isMountedRef.current) setAddonsList(data);
    } catch (error) {
      console.error("Error fetching addons:", error);
    }
  };

  // kept for compatibility but no longer needed for bookings (onSnapshot handles it)
  const fetchBookings = () => {};


  const handleAmountUpdate = async (id: string, amount: string) => {
    try {
      const bookingRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(bookingRef, { amount });
      fetchBookings();
    } catch (error) {
      console.error("Error updating amount:", error);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      await deleteBooking(id);
      fetchBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setSelectedAddons([]);
    setFormData({
      customerName: "", email: "", phone: "", service: "",
      date: "", time: "", location: "", amount: "AED 0", 
      carDetails: "", status: "Pending"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const addonSummary = selectedAddons
        .map(id => addonsList.find(a => a.id === id)?.name)
        .filter(Boolean)
        .join(", ");

      await createBooking({
        ...formData,
        addons: addonSummary || ""
      });
      setIsModalOpen(false);
      setSelectedAddons([]);
      setFormData({
        customerName: "", email: "", phone: "", service: "",
        date: "", time: "", location: "", amount: "AED 0", 
        carDetails: "", status: "Pending"
      });
      fetchBookings();
    } catch (error) {
      console.error("Error creating booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePrice = (serviceName: string, vehicleTypeName: string, addonIds: string[]) => {
    const selected = services.find(s => s.name === serviceName);
    let basePrice = 0;
    if (selected) {
      const matchedKey = Object.keys(selected.vehiclePricing || {}).find(
        key => key.toLowerCase() === vehicleTypeName.toLowerCase()
      );
      const priceStr = (matchedKey && selected.vehiclePricing?.[matchedKey]) ? selected.vehiclePricing[matchedKey] : selected.price;
      basePrice = parseInt(priceStr.replace(/[^\d]/g, "")) || 0;
    }
    
    let addonsPrice = 0;
    addonIds.forEach(id => {
      const addon = addonsList.find(a => a.id === id);
      if (addon) {
        addonsPrice += parseInt(addon.price.replace(/[^\d]/g, "")) || 0;
      }
    });

    setFormData(prev => ({
      ...prev,
      amount: `AED ${basePrice + addonsPrice}`
    }));
  };

  const handleServiceChange = (serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      service: serviceName
    }));
    updatePrice(serviceName, selectedVehicleType, selectedAddons);
  };

  const handleVehicleTypeChange = (vName: string) => {
    setSelectedVehicleType(vName);
    updatePrice(formData.service, vName, selectedAddons);
    setFormData(prev => {
      let currentVal = prev.carDetails || "";
      const match = currentVal.match(/^([^ -]+) - (.*)$/);
      if (match) {
        const possibleCats = ["sedan", "suv", "van", "motorcycle", "adventure"];
        if (possibleCats.includes(match[1].toLowerCase())) {
          return {
            ...prev,
            carDetails: `${vName} - ${match[2]}`
          };
        }
      }
      return {
        ...prev,
        carDetails: `${vName} - ${currentVal.replace(/^(Sedan|SUV|Van|Adventure|Motorcycle) - /, "")}`
      };
    });
  };

  const handleViewDetails = (booking: Booking, tab: 'info' | 'customer' = 'info') => {
    setSelectedBooking(booking);
    setDetailTab(tab);
    setIsDetailModalOpen(true);
    setActiveDropdown(null);
  };

  // --- WhatsApp Helpers ---
  const ADMIN_PHONE = "971504xxxxxx"; // Replace with your admin WhatsApp number

  const sendWhatsAppConfirmation = (booking: Booking) => {
    const phone = booking.phone?.replace(/[^\d]/g, "");
    if (!phone) { console.log("No phone number for this booking."); return; }
    const msg = encodeURIComponent(
      `Hello ${booking.customerName}! ðŸš—âœ¨\n\nYour Mudwash booking has been *CONFIRMED*!\n\n` +
      `ðŸ“… Date: ${booking.date}\nâ° Time: ${booking.time}\n` +
      `ðŸ› ï¸ Service: ${booking.service}${booking.addons ? `\nâž• Add-ons: ${booking.addons}` : ""}\n` +
      `ðŸ“ Location: ${booking.location}\nðŸ’° Amount: ${booking.amount}\n\n` +
      `Our team will be there on time. Thank you for choosing Mudwash! ðŸ™Œ`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialBooking, setPartialBooking] = useState<Booking | null>(null);

  const openPartialModal = (booking: Booking) => {
    setPartialBooking(booking);
    const amt = parseInt((booking.amount || "0").replace(/[^\d]/g, ""));
    setPartialAmount(String(Math.round(amt * 0.3))); // Default 30%
    setIsPartialModalOpen(true);
    setActiveDropdown(null);
  };

  const sendPartialPaymentLink = () => {
    if (!partialBooking) return;
    const phone = partialBooking.phone?.replace(/[^\d]/g, "");
    if (!phone) { console.log("No phone number for this booking."); return; }
    const msg = encodeURIComponent(
      `Hello ${partialBooking.customerName}! ðŸš—\n\n` +
      `To confirm your Mudwash booking on *${partialBooking.date}* at *${partialBooking.time}*, ` +
      `please pay a partial amount of *AED ${partialAmount}* as a deposit.\n\n` +
      `Service: ${partialBooking.service}\nTotal: ${partialBooking.amount}\n\n` +
      `Please reply to this message once you've made the payment. Thank you! ðŸ™`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    setIsPartialModalOpen(false);
  };

  const handleStatusUpdate = async (id: string, status: Booking["status"], booking?: Booking) => {
    try {
      await updateBookingStatus(id, status);
      fetchBookings();

      // Auto-send WhatsApp on Accepted
      if (status === "Accepted" && booking) {
        setTimeout(() => sendWhatsAppConfirmation(booking), 400);
      }

      // When admin marks as Completed: sync to adTracking + fire offline conversion to Google Ads
      if (status === "Completed" && booking) {
        const bookingSessionId = (booking as any).sessionId;
        const amountNum = parseFloat((booking.amount || '0').replace(/[^0-9.]/g, '')) || 300;

        // If we have a sessionId directly on the booking, update it
        if (bookingSessionId) {
          try {
            await updateSessionBookingStatus(bookingSessionId, 'Completed', amountNum);
            // Fire Google Ads conversion for admin-confirmed completed bookings
            fireGadsConversion(amountNum, booking.id);
            await markConversionSent(amountNum);
          } catch (err) {
            console.warn('[AdTracking] Could not update adTracking on completion:', err);
          }
        } else if (booking.id) {
          // Fall back: find adTracking session by bookingId
          try {
            const adCol = collection(db, AD_TRACKING_COLLECTION);
            const q = query(adCol, where('bookingId', '==', booking.id));
            const snap = await getDocs(q);
            snap.forEach(async (d) => {
              await updateSessionBookingStatus(d.id, 'Completed', amountNum);
              fireGadsConversion(amountNum, booking.id);
            });
          } catch (err) {
            console.warn('[AdTracking] Could not find adTracking session for booking:', err);
          }
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white italic uppercase tracking-tighter">Bookings</h1>
          <p className="text-white/40 text-sm font-medium">Manage and monitor all detailing appointments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-orange text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
          >
            <Plus size={18} />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by customer, service..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-all"
          />
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-3 bg-[#0A0A0A] border border-white/5 rounded-xl text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center gap-2">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters</span>
          </button>
          <button className="px-4 py-3 bg-[#0A0A0A] border border-white/5 rounded-xl text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center gap-2">
            <Download size={18} />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-2xl pb-40">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-orange" size={32} />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <p className="font-bold uppercase tracking-widest text-xs">No bookings found</p>
          </div>
        ) : (
          <>
            {/* Unified Card Grid — all screens */}
            <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredBookings.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-[11px] text-brand-orange uppercase tracking-widest">#{booking.id?.slice(-6)}</span>
                      <div className="h-3 w-px bg-white/10" />
                      <span className="flex items-center gap-1.5 text-white/30 text-[10px] font-bold uppercase">
                        <Calendar size={10} />{booking.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-white/30 text-[10px] font-bold uppercase">
                        <Clock size={10} />{booking.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={booking.status}
                        onChange={(e) => booking.id && handleStatusUpdate(booking.id, e.target.value as any)}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-transparent focus:outline-none cursor-pointer transition-all ${statusStyles[booking.status]}`}
                      >
                        <option value="Pending" className="bg-[#0A0A0A] text-amber-500">Pending</option>
                        <option value="Accepted" className="bg-[#0A0A0A] text-blue-500">Accepted</option>
                        <option value="Completed" className="bg-[#0A0A0A] text-emerald-500">Completed</option>
                        <option value="Cancelled" className="bg-[#0A0A0A] text-red-500">Cancelled</option>
                      </select>
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === booking.id ? null : (booking.id || null))}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <AnimatePresence>
                          {activeDropdown === booking.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                                className="absolute right-0 mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                              >
                                <div className="p-2 flex flex-col">
                                  <button onClick={() => handleViewDetails(booking, 'info')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-all">
                                    <Eye size={14} /> View Details
                                  </button>
                                  <button onClick={() => handleViewDetails(booking, 'customer')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-all">
                                    <UserIcon size={14} /> Customer Info
                                  </button>
                                  <div className="h-px bg-white/5 my-1" />
                                  <button onClick={() => booking.id && handleDelete(booking.id)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-lg text-xs font-bold text-red-500 transition-all">
                                    <Trash2 size={14} /> Delete Booking
                                  </button>
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Customer */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                        <span className="text-brand-orange font-black text-sm uppercase">{booking.customerName?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-white italic uppercase tracking-tight text-base leading-none truncate">{booking.customerName}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                          <span className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold hover:text-brand-orange transition-colors cursor-pointer">
                            <Mail size={11} className="shrink-0" />{booking.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold hover:text-brand-orange transition-colors cursor-pointer">
                            <Phone size={11} className="shrink-0" />{booking.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle + Service + Add-ons */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/[0.03] rounded-xl p-3 space-y-1.5">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Vehicle</p>
                        <div className="flex items-center gap-1.5">
                          <CarIcon size={12} className="text-brand-orange shrink-0" />
                          <span className="font-black text-white italic uppercase text-[11px] leading-tight truncate">{(booking as any).carDetails?.split(' - ')[1] || 'N/A'}</span>
                        </div>
                        <span className="text-[8px] font-black text-white/30 uppercase bg-white/5 px-1.5 py-0.5 rounded w-fit block truncate">{(booking as any).carDetails?.split(' - ')[0] || 'Standard'}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-3 space-y-1.5">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Service</p>
                        <div className="flex flex-wrap gap-1">
                          {booking.service.split(', ').map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-black border border-white/10 rounded-full text-[8px] font-black uppercase tracking-wider text-brand-orange italic">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-3 space-y-1.5">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Add-ons</p>
                        {booking.addons ? (
                          <div className="flex flex-wrap gap-1">
                            {booking.addons.split(', ').filter(Boolean).map((a, i) => (
                              <span key={i} className="px-2 py-0.5 bg-brand-orange/15 border border-brand-orange/30 rounded-md text-[8px] font-black text-brand-orange uppercase">+ {a}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-white/20">â€”</span>
                        )}
                      </div>
                    </div>

                    {/* Location + Amount */}
                    <div className="flex items-start justify-between gap-4 pt-1 border-t border-white/5">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 group/loc hover:opacity-80 transition-opacity flex-1 min-w-0"
                      >
                        <MapPin size={14} className="text-brand-orange shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-black text-white italic uppercase tracking-tight hover:text-brand-orange transition-colors line-clamp-2 leading-tight underline decoration-brand-orange/30 underline-offset-2">
                            {booking.location}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse shrink-0" />
                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Navigation Active</span>
                          </div>
                        </div>
                      </a>
                      <div className="text-right shrink-0">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Total</p>
                        <input
                          type="text"
                          value={booking.amount}
                          onChange={(e) => booking.id && handleAmountUpdate(booking.id, e.target.value)}
                          className="bg-transparent border-none p-0 focus:outline-none font-black text-brand-orange italic tracking-tighter text-lg w-28 hover:bg-white/5 rounded px-1 text-right"
                        />
                        {booking.paymentStatus === 'Partial' && (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-[10px] font-bold text-emerald-500">Paid: AED {booking.paidAmount}</p>
                            <p className="text-[10px] font-bold text-red-500">Bal: AED {(parseFloat(booking.amount.replace(/[^0-9.]/g, '')) - parseFloat(booking.paidAmount?.toString() || '0')).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* New Booking Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && closeCreateModal()}
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
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Create New Booking</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Manual administrative entry</p>
                </div>
                <button 
                  onClick={() => closeCreateModal()}
                  className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Customer Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                      placeholder="e.g. Ahmed Khan"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                      placeholder="+971 -- --- ----"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold text-white/60"
                    placeholder="customer@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5 mt-4">
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Select Service</label>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {["All", ...categories.map(c => c.name)].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setModalServiceCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                              modalServiceCategory === cat
                                ? "bg-brand-orange text-black shadow-[0_5px_15px_rgba(246,150,33,0.2)]"
                                : "bg-white/5 text-white/40 hover:text-white/60"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto p-4 bg-white/[0.02] border border-white/10 rounded-3xl no-scrollbar">
                      {services
                        .filter(s => modalServiceCategory === "All" || s.category === modalServiceCategory)
                        .map(service => {
                          const isSelected = formData.service === service.name;
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => handleServiceChange(service.name)}
                              className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${
                                isSelected
                                  ? "bg-brand-orange border-brand-orange shadow-[0_10px_20px_rgba(246,150,33,0.2)] scale-[1.02]"
                                  : "bg-[#0D0D0D] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                isSelected ? "bg-black/10 text-black" : "bg-white/5 text-brand-orange"
                              }`}>
                                {(() => {
                                  const IC = ICON_MAP[service.icon as any] || Package;
                                  return <IC size={18} strokeWidth={2.5} />;
                                })()}
                              </div>

                              <div className="min-w-0">
                                <p className={`text-[11px] font-black uppercase italic tracking-tight truncate ${
                                  isSelected ? "text-black" : "text-white"
                                }`}>
                                  {service.name}
                                </p>
                                <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${
                                  isSelected ? "text-black" : "text-brand-orange"
                                }`}>
                                  {service.price}
                                </p>
                              </div>

                              {isSelected && (
                                <div className="ml-auto w-5 h-5 rounded-full bg-black text-brand-orange flex items-center justify-center">
                                  <CheckCircle size={10} strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Booking Date</label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 p-1">
                      {Array.from({ length: 14 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const full = d.toISOString().split('T')[0];
                        const dayOfWeek = d.getDay();
                        const isBlocked = scheduleSettings?.blockedDates.includes(full);
                        const isWorkingDay = scheduleSettings?.workingDays.includes(dayOfWeek);
                        const isSelected = formData.date === full;
                        const isDisabled = isBlocked || !isWorkingDay;

                        return (
                          <button
                            key={full}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setFormData({...formData, date: full, time: ""})}
                            className={`flex flex-col items-center justify-center min-w-[75px] h-20 rounded-2xl border transition-all ${
                              isSelected 
                                ? "bg-brand-orange border-brand-orange text-black shadow-[0_10px_20px_rgba(246,150,33,0.3)]" 
                                : isDisabled
                                  ? "bg-red-500/10 border-red-500/20 text-red-500/20 cursor-not-allowed opacity-50"
                                  : "bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            <span className="text-xl font-black italic">{d.getDate()}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Preferred Time</label>
                    {!formData.date ? (
                      <div className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-4 py-3 text-xs text-white/20 italic flex items-center gap-2">
                        <Clock size={14} /> Please select a date first
                      </div>
                    ) : (() => {
                      const isBlocked = scheduleSettings?.blockedDates.includes(formData.date);
                      const dayOfWeek = new Date(formData.date).getDay();
                      const isWorkingDay = scheduleSettings?.workingDays.includes(dayOfWeek);

                      if (isBlocked) return (
                        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[10px] text-red-500 font-black uppercase tracking-widest text-center">
                          This date is blocked in schedule
                        </div>
                      );

                      if (!isWorkingDay) return (
                        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[10px] text-red-500 font-black uppercase tracking-widest text-center">
                          Non-working day (Holiday)
                        </div>
                      );

                      return (
                        <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto no-scrollbar p-1">
                          {scheduleSettings?.timeSlots.map(slot => {
                            const isBooked = bookings.filter(b => b.date === formData.date && b.time === slot).length >= (scheduleSettings?.maxBookingsPerSlot || 5);
                            const isSelected = formData.time === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isBooked}
                                onClick={() => setFormData({...formData, time: slot})}
                                className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                                  isSelected 
                                    ? "bg-brand-orange border-brand-orange text-black shadow-[0_5px_15px_rgba(246,150,33,0.3)]" 
                                    : isBooked
                                      ? "bg-red-500/10 border-red-500/20 text-red-500/40 cursor-not-allowed"
                                      : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-2 ml-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Vehicle Category</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {vehicleTypes.map(v => {
                        const isSelected = selectedVehicleType.toLowerCase() === v.name.toLowerCase();
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleVehicleTypeChange(v.name)}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                              isSelected
                                ? "bg-brand-orange text-black shadow-[0_5px_15px_rgba(246,150,33,0.2)]"
                                : "bg-white/5 text-white/40 hover:text-white/60"
                            }`}
                          >
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative group">
                    <CarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={16} />
                    <input 
                      required
                      type="text" 
                      value={formData.carDetails}
                      onChange={(e) => setFormData({...formData, carDetails: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                      placeholder="e.g. SUV - Nissan Patrol"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Service Location</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={16} />
                    <input 
                      required
                      type="text" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                      placeholder="e.g. Al Barsha, Dubai"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Select Add-ons</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addonsList.map(addon => {
                      const isSelected = selectedAddons.includes(addon.id!);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            const updated = selectedAddons.includes(addon.id!)
                              ? selectedAddons.filter(id => id !== addon.id)
                              : [...selectedAddons, addon.id!];
                            setSelectedAddons(updated);
                            updatePrice(formData.service, selectedVehicleType, updated);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            isSelected
                              ? "bg-brand-orange/20 border-brand-orange text-white"
                              : "bg-white/[0.02] border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-brand-orange text-black" : "bg-white/5 text-white/40"
                          }`}>
                            {isSelected ? <CheckCircle2 size={12} strokeWidth={3} /> : <Plus size={12} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black uppercase italic truncate">{addon.name}</p>
                            <p className="text-[9px] font-bold text-brand-orange uppercase">{addon.price}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Amount</p>
                    <p className="text-2xl font-black text-brand-orange italic">{formData.amount}</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => closeCreateModal()}
                      className="px-6 py-3 text-white/40 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-brand-orange text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {isSubmitting ? "Processing..." : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                    {detailTab === 'info' ? <Calendar size={24} /> : <UserIcon size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                      {detailTab === 'info' ? "Booking Details" : "Customer Profile"}
                    </h2>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                      Order ID: #{selectedBooking.id?.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                {detailTab === 'info' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Service Type</p>
                        <p className="text-white font-black italic uppercase tracking-tight text-lg">{selectedBooking.service}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Amount</p>
                        <p className="text-brand-orange font-black italic uppercase tracking-tight text-xl">{selectedBooking.amount}</p>
                      </div>
                    </div>

                    {selectedBooking.addons && (
                      <div className="space-y-2 pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Add-ons Purchased</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedBooking.addons.split(', ').map((addon, index) => (
                            <span key={index} className="px-3 py-1.5 bg-brand-orange/10 border border-brand-orange/20 rounded-xl text-xs font-bold text-brand-orange uppercase tracking-wider">
                              + {addon}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Date</p>
                        <p className="text-white/80 font-bold text-sm uppercase tracking-widest">{selectedBooking.date}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Time Slot</p>
                        <p className="text-white/80 font-bold text-sm uppercase tracking-widest">{selectedBooking.time}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-6 border-t border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Service Location</p>
                      <div className="flex items-center gap-2 text-white/80">
                        <MapPin size={14} className="text-brand-orange" />
                        <p className="font-bold text-sm">{selectedBooking.location}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusStyles[selectedBooking.status]}`}>
                        Current Status: {selectedBooking.status}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-6 p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                      <div className="w-20 h-20 rounded-2xl bg-brand-orange flex items-center justify-center text-black">
                        <span className="text-3xl font-black italic">{selectedBooking.customerName.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black italic uppercase text-white">{selectedBooking.customerName}</h3>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Verified Customer</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-brand-orange transition-colors">
                            <Mail size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Email Address</p>
                            <p className="text-white font-bold text-sm">{selectedBooking.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-brand-orange transition-colors">
                            <Phone size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Phone Number</p>
                            <p className="text-white font-bold text-sm">{selectedBooking.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex gap-4">
                      <a 
                        href={`mailto:${selectedBooking.email}`}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all text-center"
                      >
                        Send Email
                      </a>
                      <a 
                        href={`tel:${selectedBooking.phone}`}
                        className="flex-1 bg-brand-orange text-black py-4 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all hover:bg-white text-center"
                      >
                        Call Now
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
                <button 
                  onClick={() => setDetailTab(detailTab === 'info' ? 'customer' : 'info')}
                  className="flex-1 py-4 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Switch to {detailTab === 'info' ? 'Customer Profile' : 'Booking Details'}
                </button>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-8 py-4 bg-white/5 hover:bg-white text-white hover:text-black rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Partial Payment Modal */}
      <AnimatePresence>
        {isPartialModalOpen && partialBooking && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPartialModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-blue-500/5">
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Partial Payment</h2>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Send deposit request via WhatsApp</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Customer</span>
                    <span className="text-xs font-bold text-white">{partialBooking.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total</span>
                    <span className="text-xs font-bold text-brand-orange">{partialBooking.amount}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Partial Amount (AED)</label>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-orange transition-all"
                    placeholder="e.g. 150"
                  />
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Default is 30% of total. You can change this.</p>
                </div>
              </div>
              <div className="p-6 border-t border-white/5 flex gap-3">
                <button onClick={() => setIsPartialModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold transition-all">Cancel</button>
                <button onClick={sendPartialPaymentLink} className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                  <MessageCircle size={16} /> Send via WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

