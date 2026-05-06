"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  Clock,
  Loader2,
  Edit3,
  Calendar,
  Zap
} from "lucide-react";

import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { getUserBookings, Booking, COLLECTION_NAME } from "@/lib/bookings";
import { signOut } from "firebase/auth";
import { doc, updateDoc, onSnapshot, query, where, collection } from "firebase/firestore";
import { UserGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { profile: authProfile, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'settings'>('overview');
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    address: "",
    city: ""
  });

  useEffect(() => {
    if (authProfile) {
      setEditData({
        name: authProfile.name || "",
        phone: authProfile.phone || "",
        address: authProfile.address || "",
        city: authProfile.city || ""
      });
    }
  }, [authProfile]);

  useEffect(() => {
    if (!authProfile?.email) return;

    const bookingsCol = collection(db, COLLECTION_NAME);
    const q = query(bookingsCol, where("email", "==", authProfile.email));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      // Sort in memory
      const sortedBookings = bookingsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setBookings(sortedBookings);
    }, (error) => {
      console.error("Error listening to bookings:", error);
    });

    return () => unsubscribe();
  }, [authProfile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!authProfile?.uid) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", authProfile.uid);
      await updateDoc(userRef, {
        ...editData,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(false);
      // Profile will refresh via AuthContext
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="text-brand-orange animate-spin" size={40} />
      </div>
    );
  }

  return (
    <UserGuard>
      <div className="min-h-screen bg-[#050505] text-white">

        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-24 md:pt-20 lg:pt-24">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            
            {/* Sidebar */}
            <div className="w-full lg:w-80 space-y-8">
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-orange to-brand-orange/20 flex items-center justify-center text-black border-4 border-[#0A0A0A] shadow-2xl relative group overflow-hidden">
                    <span className="text-4xl font-black">
                      {authProfile?.name ? authProfile.name.charAt(0).toUpperCase() : authProfile?.email?.charAt(0).toUpperCase() || 'M'}
                    </span>
                    <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-brand-orange transition-colors" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-tight mb-2">
                      {authProfile?.name || authProfile?.email?.split('@')[0] || "Valued Member"}
                    </h1>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] bg-white/5 inline-block px-3 py-1 rounded-full border border-white/10">
                      Mudwash Member
                    </p>
                    <div className="flex flex-col items-center gap-1.5 mt-4">
                      <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                        <Mail size={12} className="text-brand-orange" />
                        <span>{authProfile?.email || "No Email Provided"}</span>
                      </div>
                      {authProfile?.phone && (
                        <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                          <Phone size={12} className="text-brand-orange" />
                          <span>{authProfile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'overview', icon: User, label: 'Account Overview' },
                    { id: 'orders', icon: Package, label: 'Service History' },
                    { id: 'settings', icon: Settings, label: 'Settings' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                        ? 'bg-white text-black' 
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-all"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-8">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-12">
                          <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange">
                            <ShieldCheck size={24} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Active</span>
                        </div>
                        <div>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Member Since</p>
                          <p className="text-2xl font-black uppercase tracking-tighter">
                            {authProfile?.createdAt ? new Date(authProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Join Date N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-brand-orange rounded-[2rem] p-8 flex flex-col justify-between text-black">
                        <div className="flex justify-between items-start mb-12">
                          <div className="p-3 bg-black/10 rounded-2xl">
                            <Clock size={24} />
                          </div>
                        </div>
                        <div>
                          <p className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-1">Total Bookings</p>
                          <div className="flex items-end justify-between">
                            <p className="text-5xl font-black tracking-tighter">
                              {bookings.length.toString().padStart(2, '0')}
                            </p>
                            <button 
                              onClick={() => setActiveTab('orders')}
                              className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                            >
                              View All
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 md:p-10">
                      <div className="flex justify-between items-center mb-10">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Personal Information</h2>
                        {!isEditing ? (
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-white transition-colors"
                          >
                            <Edit3 size={14} /> Edit Profile
                          </button>
                        ) : (
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setIsEditing(false)}
                              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleSaveProfile}
                              disabled={isSaving}
                              className="bg-brand-orange text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2"
                            >
                              {isSaving ? <Loader2 size={12} className="animate-spin" /> : "Save Changes"}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Full Name</p>
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editData.name}
                              onChange={(e) => setEditData({...editData, name: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
                            />
                          ) : (
                            <div className="flex items-center gap-3 text-white/80">
                              <User size={16} className="text-brand-orange" />
                              <p className="font-bold">{authProfile?.name || 'Not Provided'}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Email Address</p>
                          <div className="flex items-center gap-3 text-white/40">
                            <Mail size={16} className="text-brand-orange/40" />
                            <p className="font-bold">{authProfile?.email}</p>
                            <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">Locked</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Phone Number</p>
                          {isEditing ? (
                            <input 
                              type="tel"
                              value={editData.phone}
                              onChange={(e) => setEditData({...editData, phone: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
                            />
                          ) : (
                            <div className="flex items-center gap-3 text-white/80">
                              <Phone size={16} className="text-brand-orange" />
                              <p className="font-bold">{authProfile?.phone || "Not Provided"}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Default Address</p>
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editData.address}
                              onChange={(e) => setEditData({...editData, address: e.target.value})}
                              placeholder="Address line"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange/50 transition-colors mb-2"
                            />
                          ) : (
                            <div className="flex items-center gap-3 text-white/80">
                              <MapPin size={16} className="text-brand-orange" />
                              <p className="font-bold">{authProfile?.address ? `${authProfile.address}${authProfile.city ? `, ${authProfile.city}` : ""}` : "Not Provided"}</p>
                            </div>
                          )}
                          {isEditing && (
                             <input 
                              type="text"
                              value={editData.city}
                              onChange={(e) => setEditData({...editData, city: e.target.value})}
                              placeholder="City"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 md:p-10">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight">Recent Activity</h2>
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Your latest service engagements</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('orders')}
                          className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-white transition-colors"
                        >
                          View All
                        </button>
                      </div>

                      {bookings.length === 0 ? (
                        <div className="py-12 border border-dashed border-white/5 rounded-3xl text-center">
                          <Clock size={32} className="mx-auto text-white/10 mb-3" />
                          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">No recent activity found</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookings.slice(0, 3).map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-brand-orange/30 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-black transition-all">
                                  <Zap size={18} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black uppercase tracking-tight text-white">{booking.service}</h4>
                                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{booking.date} @ {booking.time}</p>
                                </div>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                booking.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                booking.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Service History</h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Track your vehicle maintenance journey</p>
                      </div>
                      <button 
                        onClick={() => router.push('/bookings')}
                        className="bg-brand-orange text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                      >
                        New Booking
                      </button>
                    </div>
                    <div className="space-y-4">
                      {bookings.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                          <Package size={40} className="mx-auto text-white/10 mb-4" />
                          <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Your booking history is empty</p>
                          <button 
                            onClick={() => router.push('/bookings')}
                            className="mt-6 text-brand-orange hover:underline text-xs font-black uppercase tracking-widest"
                          >
                            Book a Service
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                           {bookings.map((booking) => (
                            <div 
                              key={booking.id}
                              className="bg-[#111111] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-orange/30 transition-all group relative overflow-hidden"
                            >
                              {/* Background Glow */}
                              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl -mr-16 -mt-16 group-hover:bg-brand-orange/10 transition-colors" />
                              
                              <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-black transition-all duration-500">
                                  <Zap size={24} />
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-black uppercase tracking-tight text-lg text-white">{booking.service}</h4>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                      booking.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                      booking.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                      'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-2"><Calendar size={12} className="text-brand-orange" /> {booking.date}</span>
                                    <span className="flex items-center gap-2"><Clock size={12} className="text-brand-orange" /> {booking.time}</span>
                                    <span className="flex items-center gap-2"><MapPin size={12} className="text-brand-orange" /> {booking.location}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-10 pt-6 md:pt-0 border-t md:border-t-0 border-white/5 relative z-10">
                                <div className="text-right">
                                  <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">Service Value</p>
                                  <p className="text-2xl font-black text-white tracking-tighter group-hover:text-brand-orange transition-colors">
                                    {booking.amount === "₹ TBD" ? "TBD" : booking.amount}
                                  </p>
                                </div>
                                <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-all">
                                  <ChevronRight size={20} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 md:p-10"
                  >
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Account Settings</h2>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div>
                          <p className="font-bold uppercase tracking-tight text-sm mb-1">Email Notifications</p>
                          <p className="text-white/40 text-[10px] uppercase tracking-widest">Receive updates about your orders</p>
                        </div>
                        <div className="w-12 h-6 bg-brand-orange rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-black rounded-full absolute right-1" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div>
                          <p className="font-bold uppercase tracking-tight text-sm mb-1">Privacy Mode</p>
                          <p className="text-white/40 text-[10px] uppercase tracking-widest">Hide profile details from public searches</p>
                        </div>
                        <div className="w-12 h-6 bg-white/10 rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-white/40 rounded-full absolute left-1" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </UserGuard>
  );
}
