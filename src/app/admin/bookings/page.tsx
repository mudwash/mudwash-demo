"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Clock,
  Loader2,
  Trash2,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Car as CarIcon
} from "lucide-react";
import { getBookings, updateBookingStatus, createBooking, deleteBooking, Booking, COLLECTION_NAME } from "@/lib/bookings";
import { getServices, Service } from "@/lib/services";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection } from "firebase/firestore";

const statusStyles = {
  Completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
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
    fetchBookings();
    fetchServices();
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchServices = async () => {
    try {
      const data = await getServices(true);
      if (isMountedRef.current) setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      if (isMountedRef.current) setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: Booking["status"]) => {
    try {
      await updateBookingStatus(id, status);
      fetchBookings();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createBooking(formData);
      setIsModalOpen(false);
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

  const handleServiceChange = (serviceName: string) => {
    const selected = services.find(s => s.name === serviceName);
    setFormData({
      ...formData,
      service: serviceName,
      amount: selected ? selected.price : "AED 0"
    });
  };

  const handleViewDetails = (booking: Booking, tab: 'info' | 'customer' = 'info') => {
    setSelectedBooking(booking);
    setDetailTab(tab);
    setIsDetailModalOpen(true);
    setActiveDropdown(null);
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
            {/* Desktop View */}
            <div className="hidden lg:block overflow-visible">
              <table className="w-full text-left overflow-visible">
                <thead>
                  <tr className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="px-6 py-5">Booking</th>
                    <th className="px-6 py-5">Customer</th>
                    <th className="px-6 py-5">Vehicle</th>
                    <th className="px-6 py-5">Service</th>
                    <th className="px-6 py-5">Location</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Amount</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group overflow-visible">
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-black text-[10px] text-brand-orange uppercase tracking-widest">#{booking.id?.slice(-6)}</span>
                          <div className="flex items-center gap-3 text-white/40 text-[9px] font-black uppercase">
                            <span className="flex items-center gap-1"><Calendar size={10} /> {booking.date}</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {booking.time}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 min-w-[220px]">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-black text-white italic uppercase tracking-tight text-base leading-none">{booking.customerName}</span>
                          <div className="flex flex-col gap-1 text-white/40 text-[10px] font-bold mt-1">
                            <span className="flex items-center gap-2 hover:text-brand-orange transition-colors cursor-pointer">
                              <Mail size={12} className="shrink-0" /> {booking.email}
                            </span>
                            <span className="flex items-center gap-2 hover:text-brand-orange transition-colors cursor-pointer">
                              <Phone size={12} className="shrink-0" /> {booking.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 min-w-[180px]">
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-2">
                              <CarIcon size={14} className="text-brand-orange" />
                              <span className="font-black text-white italic uppercase tracking-tight text-sm">{(booking as any).carDetails?.split(' - ')[1] || "N/A"}</span>
                           </div>
                           <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] bg-white/5 px-2 py-0.5 rounded-md w-fit">
                              {(booking as any).carDetails?.split(' - ')[0] || "Standard"}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                           {booking.service.split(', ').map((s, i) => (
                             <span key={i} className="px-3 py-1 bg-black border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-orange italic shadow-xl whitespace-nowrap">
                               {s}
                             </span>
                           ))}
                        </div>
                      </td>
                      <td className="px-6 py-6 min-w-[280px]">
                        <div className="flex flex-col gap-2">
                           <a 
                             href={`https://www.google.com/maps?q=${encodeURIComponent(booking.location)}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-start gap-2 group/loc hover:bg-white/5 p-2 -m-2 rounded-xl transition-all"
                           >
                              <MapPin size={16} className="text-brand-orange shrink-0 mt-0.5" />
                                 <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[11px] font-black text-white italic uppercase tracking-tighter line-clamp-2 leading-tight group-hover/loc:text-brand-orange transition-colors underline decoration-brand-orange/30 decoration-2 underline-offset-4">
                                          {booking.location}
                                       </span>
                                       <div className="px-1.5 py-0.5 bg-brand-orange/10 border border-brand-orange/20 rounded text-[7px] font-black uppercase tracking-widest text-brand-orange shrink-0">
                                          Pin
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="flex items-center gap-1.5">
                                          <div className="w-1 h-1 rounded-full bg-brand-orange animate-pulse" />
                                          <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] group-hover/loc:text-white/70 transition-colors">Navigation Active</span>
                                       </div>
                                       {booking.location.includes(',') && (
                                          <span className="text-[7px] font-medium text-white/20 tracking-widest">
                                             SECURE GPS HANDOFF
                                          </span>
                                       )}
                                    </div>
                                 </div>
                           </a>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2">
                          <select 
                            value={booking.status}
                            onChange={(e) => booking.id && handleStatusUpdate(booking.id, e.target.value as any)}
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-transparent focus:outline-none cursor-pointer transition-all ${statusStyles[booking.status]}`}
                          >
                            <option value="Pending" className="bg-[#0A0A0A] text-amber-500">Pending</option>
                            <option value="Completed" className="bg-[#0A0A0A] text-emerald-500">Completed</option>
                            <option value="Cancelled" className="bg-[#0A0A0A] text-red-500">Cancelled</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <input 
                          type="text"
                          value={booking.amount}
                          onChange={(e) => booking.id && handleAmountUpdate(booking.id, e.target.value)}
                          className="bg-transparent border-none p-0 focus:outline-none font-black text-brand-orange italic tracking-tighter text-lg w-24 hover:bg-white/5 rounded px-2"
                        />
                      </td>
                      <td className="px-6 py-6 text-right overflow-visible">
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === booking.id ? null : (booking.id || null))}
                            className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          <AnimatePresence>
                            {activeDropdown === booking.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute right-0 mt-2 w-48 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                  <div className="p-2 flex flex-col">
                                    <button 
                                      onClick={() => handleViewDetails(booking, 'info')}
                                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-all"
                                    >
                                      <Eye size={14} /> View Details
                                    </button>
                                    <button 
                                      onClick={() => handleViewDetails(booking, 'customer')}
                                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-all"
                                    >
                                      <UserIcon size={14} /> Customer Info
                                    </button>
                                    <div className="h-px bg-white/5 my-1" />
                                    <button 
                                      onClick={() => booking.id && handleDelete(booking.id)}
                                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-lg text-xs font-bold text-red-500 transition-all"
                                    >
                                      <Trash2 size={14} /> Delete Booking
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

            {/* Mobile View */}
            <div className="lg:hidden divide-y divide-white/5">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-5 space-y-4 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="font-black text-[9px] text-brand-orange uppercase tracking-[0.2em]">#{booking.id?.slice(-6)}</span>
                      <h3 className="font-black text-white italic uppercase tracking-tight text-lg leading-none">{booking.customerName}</h3>
                      <div className="flex items-center gap-3 text-white/40 text-[9px] font-bold uppercase mt-1">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {booking.date}</span>
                        <span className="flex items-center gap-1 border-l border-white/5 pl-3"><Clock size={10} /> {booking.time}</span>
                      </div>
                    </div>
                    <select 
                      value={booking.status}
                      onChange={(e) => booking.id && handleStatusUpdate(booking.id, e.target.value as any)}
                      className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-transparent focus:outline-none cursor-pointer transition-all ${statusStyles[booking.status]}`}
                    >
                      <option value="Pending" className="bg-[#0A0A0A] text-amber-500">Pending</option>
                      <option value="Completed" className="bg-[#0A0A0A] text-emerald-500">Completed</option>
                      <option value="Cancelled" className="bg-[#0A0A0A] text-red-500">Cancelled</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Service</p>
                      <p className="text-[10px] font-black text-white italic uppercase">{booking.service}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Amount</p>
                      <p className="text-sm font-black text-brand-orange italic">{booking.amount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wide">
                      <MapPin size={12} className="text-brand-orange shrink-0" />
                      <span className="line-clamp-1">{booking.location}</span>
                    </div>
                    <div className="flex gap-2 relative">
                      <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30">
                        <Phone size={14} />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30">
                        <Mail size={14} />
                      </button>
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === booking.id ? null : (booking.id || null))}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30"
                      >
                        <MoreVertical size={14} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === booking.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, x: 20 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95, x: 20 }}
                              className="absolute right-0 bottom-10 w-40 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                            >
                              <div className="p-1 flex flex-col">
                                <button 
                                  onClick={() => handleViewDetails(booking, 'info')}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-[10px] font-bold text-white/60"
                                >
                                  <Eye size={12} /> View
                                </button>
                                <button 
                                  onClick={() => booking.id && handleDelete(booking.id)}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 rounded-lg text-[10px] font-bold text-red-500"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
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
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Create New Booking</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Manual administrative entry</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
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
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Select Service</label>
                    <select 
                      required
                      value={formData.service}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-black italic uppercase text-brand-orange"
                    >
                      <option value="" className="bg-[#0A0A0A] text-white">Choose a service...</option>
                      {services.map(s => (
                        <option key={s.id} value={s.name} className="bg-[#0A0A0A] text-white">{s.name} ({s.price})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Booking Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Preferred Time</label>
                    <input 
                      required
                      type="time" 
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Vehicle Info (Make, Model, Type)</label>
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

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Amount</p>
                    <p className="text-2xl font-black text-brand-orange italic">{formData.amount}</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
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
    </div>
  );
}

