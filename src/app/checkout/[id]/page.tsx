"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
import Image from "next/image";
import { 
  ChevronLeft, 
  CreditCard, 
  Apple, 
  Smartphone, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  Loader2
} from "lucide-react";

import Footer from "@/components/Footer";
import { getParts, Part } from "@/lib/parts";
import { auth } from "@/lib/firebase";
import { saveUserToFirestore, UserProfile } from "@/lib/users";

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: ""
  });

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push(`/sign-in?returnTo=/checkout/${id}`);
      } else {
        setAuthChecked(true);
      }
    });

    const fetchPart = async () => {
      try {
        const parts = await getParts();
        const foundPart = parts.find(p => p.id === id);
        if (foundPart) {
          setPart(foundPart);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPart();
    return () => unsubscribe();
  }, [id, router]);

  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      setFormData(prev => ({ ...prev, address: savedLocation }));
    }
  }, []);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!part) return;
    
    setIsProcessing(true);

    const res = await loadRazorpay();

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsProcessing(false);
      return;
    }

    const amount = parseInt(part.price.replace(/[^0-9]/g, "")) || 0;

    if (paymentMethod === 'cod') {
      // Save user details for COD as well
      const user = auth.currentUser;
      if (user) {
        const userProfile: UserProfile = {
          uid: user.uid,
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          role: 'user',
          createdAt: new Date().toISOString()
        };
        await saveUserToFirestore(userProfile);
      }

      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 2000);
      return;
    }

    const options = {
      key: "rzp_test_SavjbONhdqNazv", // Your Actual Razorpay Key ID
      amount: amount * 100,
      currency: "INR",
      name: "MUDWASH",
      description: `Purchase of ${part.name}`,
      image: "https://mudwash.ae/logo.png",
      handler: async function (response: any) {
        console.log("Payment Successful:", response.razorpay_payment_id);
        
        // Save user details to Firestore for future use
        const user = auth.currentUser;
        if (user) {
          const userProfile: UserProfile = {
            uid: user.uid,
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            role: 'user',
            createdAt: new Date().toISOString()
          };
          await saveUserToFirestore(userProfile);
        }

        setIsProcessing(false);
        setIsSuccess(true);
      },
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
      },
      notes: {
        address: formData.address,
        city: formData.city,
      },
      theme: {
        color: "#f69621",
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
    
    paymentObject.on('payment.failed', function (response: any) {
      alert("Payment Failed: " + response.error.description);
      setIsProcessing(false);
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="text-brand-orange animate-spin" size={40} />
      </div>
    );
  }

  if (!part) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 lg:py-40">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left: Checkout Form */}
          <div className="flex-[2] space-y-12">
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Back to Product</span>
            </motion.button>

            <div className="space-y-10">
              <div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Checkout</h1>
                <p className="text-white/40 text-sm md:text-base max-w-xl">Complete your order for the <span className="text-white font-bold">{part.name}</span> by providing your shipping and payment details below.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Shipping Details */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange border border-brand-orange/20">
                      <MapPin size={20} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Shipping Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                          required
                          type="text" 
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-brand-orange focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                          required
                          type="tel" 
                          placeholder="+971 00 000 0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-brand-orange focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Shipping Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        required
                        type="text" 
                        placeholder="Street Address, Building Name, etc."
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-brand-orange focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">City / Emirate</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Dubai"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-orange focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Email (For Updates)</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                          required
                          type="email" 
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-brand-orange focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment Method Selection */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange border border-brand-orange/20">
                      <CreditCard size={20} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Payment Method</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Razorpay Option */}
                    <button 
                      type="button" 
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                        paymentMethod === 'razorpay' 
                        ? 'bg-brand-orange/10 border-brand-orange text-white' 
                        : 'bg-white/[0.03] border-white/5 text-white/40 hover:border-white/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <CreditCard className={paymentMethod === 'razorpay' ? 'text-brand-orange' : 'text-white/20'} size={24} />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Razorpay</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 italic">Cards, UPI, Netbanking</span>
                      </div>
                    </button>

                    {/* COD Option */}
                    <button 
                      type="button" 
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                        paymentMethod === 'cod' 
                        ? 'bg-brand-orange/10 border-brand-orange text-white' 
                        : 'bg-white/[0.03] border-white/5 text-white/40 hover:border-white/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Package className={paymentMethod === 'cod' ? 'text-brand-orange' : 'text-white/20'} size={24} />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Cash on Delivery</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 italic">Pay when you receive</span>
                      </div>
                    </button>
                  </div>
                </section>

                <motion.button 
                  type="submit"
                  disabled={isProcessing}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-brand-orange text-black py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-white transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-brand-orange/20"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : "Finalize Order"}
                </motion.button>
              </form>
            </div>
          </div>

          {/* Right: Order Summary Sticky Card */}
          <div className="flex-1 lg:max-w-md">
            <div className="sticky top-40 bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 md:p-10 space-y-8">
              <div className="flex items-center gap-4 pb-8 border-b border-white/5">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Order Summary</p>
                  <p className="text-lg font-black uppercase tracking-tight">1 Item in Cart</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-5">
                  <div className="w-20 h-20 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 relative">
                    {part.image && <Image src={part.image} alt={part.name} fill className="object-cover" sizes="80px" priority />}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-xs font-black uppercase tracking-widest text-brand-orange mb-1">{part.category}</p>
                    <p className="text-lg font-black uppercase tracking-tighter leading-tight">{part.name}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/40 uppercase font-bold tracking-widest text-[10px]">Subtotal</span>
                    <span className="font-bold">{part.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/40 uppercase font-bold tracking-widest text-[10px]">Shipping</span>
                    <span className="text-green-500 font-bold uppercase tracking-widest text-[10px]">Free Delivery</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-white/40 uppercase font-black tracking-[0.2em] text-xs">Total Amount</span>
                    <span className="text-3xl font-black text-brand-orange tracking-tighter">{part.price}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-center gap-3 text-white/20">
                <Shield size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">SSL Secured Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-12 text-center space-y-10 shadow-2xl"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                className="w-24 h-24 bg-brand-orange rounded-full flex items-center justify-center text-black mx-auto shadow-2xl shadow-brand-orange/40"
              >
                <CheckCircle2 size={48} />
              </motion.div>
              
              <div className="space-y-4">
                <h3 className="text-4xl font-black uppercase tracking-tighter">Order Success!</h3>
                <p className="text-white/40 text-sm md:text-base leading-relaxed">
                  Thank you for choosing MUDWASH. Your order for the <span className="text-white font-bold">{part.name}</span> has been confirmed. You will receive a tracking link via email soon.
                </p>
              </div>

              <button 
                onClick={() => router.push('/spare-parts')}
                className="group w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-brand-orange transition-all duration-500 shadow-xl"
              >
                Continue Shopping <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
