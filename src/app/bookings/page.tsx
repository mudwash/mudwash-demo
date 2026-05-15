'use client';
// Trigger recompile to fix ChunkLoadError
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus,
  Check, 
  Clock, 
  Calendar, 
  CreditCard, 
  Info,
  ShieldCheck,
  Zap,
  Waves,
  Droplets,
  Search,
  ChevronDown,
  ChevronUp,
  Heart,
  Sparkles,
  Car as CarIcon,
  Paintbrush,
  Wrench,
  X,
  Star,
  CheckCircle,
  Clock3,
  Timer,
  Fuel,
  Gauge,
  Navigation,
  Smartphone,
  Trophy,
  Activity,
  Palette,
  Droplet,
  GlassWater,
  CloudRain,
  Snowflake,
  Settings,
  Disc,
  Package,
  SprayCan,
  Brush,
  Wind,
  Sun,
  Shield,
  Crown,
  Diamond,
  Flame,
  Map,
  User,
  Home,
  Award,
  BadgeCheck,
  Truck,
  Bike,
  Loader2,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { createBooking, getBookingsByDate } from '@/lib/bookings';
import { doc, getDoc, onSnapshot, query, collection, where, updateDoc, setDoc, deleteDoc, increment, arrayUnion, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getServices, Service } from '@/lib/services';
import { getAddons, Addon } from '@/lib/addons';
import { getSchedule, ScheduleSettings } from '@/lib/schedule';
import { getCategories, Category } from '@/lib/categories';
import { getVehicleTypes, VehicleType } from '@/lib/vehicleTypes';
import { getGarages, Garage } from '@/lib/garages';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AuthPopup from '@/components/AuthPopup';

const InteractiveMapModal = dynamic(() => import('@/components/InteractiveMapModal'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[10000] text-white/20 font-black uppercase tracking-widest italic">Initializing High-Fidelity Map...</div>
});

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`);
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

import 'leaflet/dist/leaflet.css';

const ICON_MAP: any = { 
  Waves, Sparkles, Car: CarIcon, ShieldCheck, Paintbrush, Zap, Wrench, Droplets, 
  Snowflake, Settings, Disc, Clock, Package, SprayCan, Brush, Wind, Sun, 
  Shield, Crown, Diamond, Star, Flame, Award, BadgeCheck, CheckCircle, 
  Clock3, Timer, Fuel, Gauge, Navigation, Smartphone, Trophy, Activity, 
  Heart, Palette, Droplet, GlassWater, CloudRain, Truck, Bike 
};

const VEHICLE_IMAGES: Record<string, string> = {
  "Sedan": "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800",
  "SUV": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800",
  "Van": "https://images.unsplash.com/photo-1565193998248-d5a9b71ccdb2?auto=format&fit=crop&q=80&w=800",
  "Adventure": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800"
};


// --- COMPONENTS ---

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="fixed top-0 left-0 w-full h-[3px] bg-white/5 z-[100]">
    <motion.div 
      className="h-full bg-gradient-to-r from-brand-orange to-[#FFB347] shadow-[0_0_15px_#f69621]"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    />
  </div>
);

interface SelectedService {
  id: string;
  quantity: number;
}

const ServiceDetailDrawer = ({ 
  service, 
  isOpen, 
  onClose, 
  onAdd, 
  onRemove, 
  quantity 
}: { 
  service: Service | null, 
  isOpen: boolean, 
  onClose: () => void,
  onAdd: (id: string) => void,
  onRemove: (id: string) => void,
  quantity: number
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [service]);

  useEffect(() => {
    if (!service?.images || service.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % service.images!.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [service]);

  if (!service) return null;
  
  const inclusions = service.includedItems || [
    "Premium hand wash exterior",
    "Wheel and tire deep cleaning",
    "Glass and mirror streak-free wipe",
    "Full interior vacuuming",
    "Dashboard and trim dressing",
    "Tire shine application"
  ];

  const nextImage = () => {
    if (service.images) {
      setCurrentImageIndex((currentImageIndex + 1) % service.images.length);
    }
  };

  const prevImage = () => {
    if (service.images) {
      setCurrentImageIndex((currentImageIndex - 1 + service.images.length) % service.images.length);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000]" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 rounded-t-[2.5rem] z-[10001] h-[100dvh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-grow no-scrollbar pb-24">
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{service.name}</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-brand-orange">AED {service.price}</span>
                    <span className="text-white/20 line-through text-base italic">AED {parseInt(service.price.replace(/[^\d]/g, '')) * 1.4}</span>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {service.images && service.images.length > 0 ? (
                    <div className="w-full h-48 relative rounded-2xl overflow-hidden border border-white/10 group">
                      <motion.div 
                        className="flex h-full"
                        animate={{ x: `-${currentImageIndex * 100}%` }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      >
                        {service.images.map((img, idx) => (
                          <div key={idx} className="w-full h-full flex-shrink-0">
                            <img src={img} alt={service.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </motion.div>
                      {service.images.length > 1 && (
                        <>
                          <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"><ChevronLeft size={16} /></button>
                          <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"><ChevronRight size={16} /></button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {service.images.map((_, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-[#F59E0B] w-4' : 'bg-white/30'}`} 
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : service.image ? (
                    <div className="w-full h-48 relative rounded-2xl overflow-hidden border border-white/10">
                      <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 mb-3 flex items-center gap-2"><Info size={14}/> Treatment Overview</h3>
                    <p className="text-sm text-white/60 leading-relaxed font-medium">{service.description || "Premium detailing treatment restored to showroom condition."}</p>
                  </div>
                  <div className="p-5 bg-brand-orange/5 border border-brand-orange/10 rounded-2xl">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange mb-2 flex items-center gap-2"><Clock size={14}/> Service Duration</h3>
                    <p className="text-lg font-bold text-white italic">Approx. {service.duration || '2-3 Hours'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 mb-3 flex items-center gap-2"><CheckCircle size={14}/> What's Included</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {inclusions.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 group">
                        <div className="w-5 h-5 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform"><Check size={10} strokeWidth={4} /></div>
                        <span className="text-sm text-white/70 font-bold tracking-tight">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-[#0A0A0A]">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-10">
                <div className="flex items-center justify-between md:justify-start gap-8 bg-white/5 px-8 md:px-10 py-5 rounded-[2rem] border border-white/5">
                  <button onClick={() => onRemove(service.id!)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-black transition-all active:scale-90"><Minus size={20} strokeWidth={3} /></button>
                  <span className="text-2xl font-black min-w-[40px] text-center italic">{quantity}</span>
                  <button onClick={() => onAdd(service.id!)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-black transition-all active:scale-90"><Plus size={20} strokeWidth={3} /></button>
                </div>
                <button onClick={onClose} className="flex-grow bg-brand-orange text-black font-black uppercase italic tracking-[0.2em] text-xs md:text-sm h-20 rounded-[2rem] shadow-[0_15px_40px_rgba(246,150,33,0.3)] hover:scale-[1.02] active:scale-95 transition-all px-8">
                  {quantity > 0 ? `Update Booking Selection` : `Add Package for AED ${service.price}`}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export function BookingPageInner() {
  const { user, loading: authLoading, profile } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [currentSelectionId, setCurrentSelectionId] = useState<string | null>(null);
  const [activeSelections, setActiveSelections] = useState<Record<string, number>>({});
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [maxBookings, setMaxBookings] = useState(3);
  const [availablePromoCodes, setAvailablePromoCodes] = useState<any[]>([]);



  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "promocodes"));
        const promos: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.active && (!data.usedBy || !user || !data.usedBy.includes(user.uid))) {
            promos.push({ id: doc.id, ...data });
          }
        });
        setAvailablePromoCodes(promos);
      } catch (err) {
        console.error("Error fetching promos:", err);
      }
    };
    fetchPromos();
  }, [user]);

  useEffect(() => {
    // Real-time listener: auto-update schedule when admin changes it
    const scheduleRef = doc(db, "schedule", "main");
    const unsubscribe = onSnapshot(scheduleRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ScheduleSettings;
        setScheduleSettings(data);
        setMaxBookings(data.maxBookingsPerSlot || 3);
      }
    }, (error) => {
      console.error("Error listening to schedule:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const bookingsCol = collection(db, "bookings");
      const q = query(bookingsCol, where("date", "==", selectedDate));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          const b = doc.data();
          if (b.status !== "Cancelled" && b.status !== "Cancelled (System)") {
            counts[b.time] = (counts[b.time] || 0) + 1;
          }
        });
        setSlotCounts(counts);
      }, (error) => {
        console.error("Error listening to bookings:", error);
      });
      return () => unsubscribe();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      const q = query(collection(db, "active_selections"), where("date", "==", selectedDate));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          counts[data.time] = (counts[data.time] || 0) + 1;
        });
        setActiveSelections(counts);
      }, (error) => {
        console.error("Error listening to active selections:", error);
      });
      return () => unsubscribe();
    }
  }, [selectedDate]);

  useEffect(() => {
    const cleanup = async () => {
      if (currentSelectionId) {
        try {
          await deleteDoc(doc(db, "active_selections", currentSelectionId));
        } catch (e) {
          console.error("Failed to cleanup selection:", e);
        }
      }
    };
    
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [currentSelectionId]);

  const processingSuccessRef = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const failed = urlParams.get('failed');

    if (success === 'true' && !processingSuccessRef.current) {
      processingSuccessRef.current = true;
      const pendingBookingStr = localStorage.getItem("mudwash_pendingBooking");
      if (pendingBookingStr) {
        localStorage.removeItem("mudwash_pendingBooking"); // Remove immediately to prevent duplicate calls
        const pendingBooking = JSON.parse(pendingBookingStr);
        
        const saveBooking = async () => {
          try {
            const bookingId = await createBooking(pendingBooking);
            console.log("Booking created successfully after payment:", bookingId);
            
            // Save address to profile if logged in
            if (user && pendingBooking.location) {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                savedAddress: pendingBooking.location
              });
            }
            
            // Update promo code usage
            const promoCodeUsed = localStorage.getItem("mudwash_appliedPromoCode");
            if (promoCodeUsed) {
              try {
                const promoRef = doc(db, "promocodes", promoCodeUsed);
                await updateDoc(promoRef, {
                  usedCount: increment(1),
                  usedBy: arrayUnion(user?.uid || "guest")
                });
              } catch (err) {
                console.error("Failed to update promo usage:", err);
              }
              localStorage.removeItem("mudwash_appliedPromoCode");
            }
            
            setIsSuccess(true);
            localStorage.removeItem("mudwash_pendingBooking");
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {
            console.error("Failed to create booking after payment:", e);
            alert("Failed to save your booking. Please contact support with your payment confirmation.");
          }
        };
        
        saveBooking();
      }
    } else if (failed === 'true') {
      alert("Payment failed or was cancelled. Your slot has not been booked.");
      localStorage.removeItem("mudwash_pendingBooking");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.savedAddress) {
            setFormData(prev => ({ ...prev, address: data.savedAddress }));
          }
          const savedLocation = localStorage.getItem("userLocation");
          if (savedLocation) {
            setFormData(prev => ({ ...prev, address: savedLocation }));
          }

          // Load address details from localStorage (set from home screen)
          const savedAddrDetails = localStorage.getItem("mudwash_addressDetails");
          if (savedAddrDetails) {
            try {
              const d = JSON.parse(savedAddrDetails);
              setAddressDetails(prev => ({
                ...prev,
                type: d.type || prev.type,
                buildingName: d.buildingName || prev.buildingName,
                flatNo: d.flatNo || prev.flatNo,
                directions: d.directions || prev.directions,
              }));
            } catch (e) {}
          } else {
            // Fallback to Firestore profile
            if (data.addressType) setAddressDetails(prev => ({ ...prev, type: data.addressType }));
            if (data.flatNo) setAddressDetails(prev => ({ ...prev, flatNo: data.flatNo }));
            if (data.buildingName) setAddressDetails(prev => ({ ...prev, buildingName: data.buildingName }));
            if (data.directions) setAddressDetails(prev => ({ ...prev, directions: data.directions }));
          }
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      setFormData(prev => ({ ...prev, address: savedLocation }));
    }
    const savedPhone = localStorage.getItem("userPhone");
    if (savedPhone) {
      setFormData(prev => ({ ...prev, phone: savedPhone }));
    }
  }, []);

  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });
  const [carDetails, setCarDetails] = useState({ make: "", model: "", type: "" });

  useEffect(() => {
    if (formData.phone) {
      localStorage.setItem("userPhone", formData.phone);
    }
  }, [formData.phone]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    
    const savedCar = localStorage.getItem("mudwash_carDetails");
    let hasCar = false;
    if (savedCar) {
      try {
        const parsed = JSON.parse(savedCar);
        setCarDetails(prev => ({ ...prev, ...parsed }));
        if (parsed.type) hasCar = true;
      } catch (e) {}
    }

    if (stepParam) {
      setCurrentStep(parseInt(stepParam));
    } else if (hasCar) {
      setCurrentStep(2);
    }
  }, []);


  useEffect(() => {
    if (carDetails.type || carDetails.model) {
      localStorage.setItem("mudwash_carDetails", JSON.stringify(carDetails));
      window.dispatchEvent(new Event("carChanged"));

      // Save to history (keep only 3)
      if (carDetails.model && carDetails.type) {
        const history = localStorage.getItem("mudwash_carHistory");
        let parsedHistory: any[] = [];
        if (history) {
          try {
            parsedHistory = JSON.parse(history);
          } catch (e) {}
        }
        
        // Remove duplicates
        const filtered = parsedHistory.filter(item => item.model !== carDetails.model);
        
        // Add to front and limit to 3
        const newHistory = [carDetails, ...filtered].slice(0, 3);
        
        localStorage.setItem("mudwash_carHistory", JSON.stringify(newHistory));
      }
    }
  }, [carDetails]);
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(17);
  const [mapCoords, setMapCoords] = useState<{lat: number, lng: number}>({ lat: 25.2048, lng: 55.2708 });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapType, setMapType] = useState<'hybrid' | 'streets'>('hybrid');
  const [isAddressDetailsOpen, setIsAddressDetailsOpen] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    type: "Home" as "Home" | "Work" | "Other",
    flatNo: "",
    buildingName: "",
    directions: ""
  });
  const searchParams = useSearchParams();
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Car Suggestions API State
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const suggestionCache = React.useRef<Record<string, string[]>>({});
  
  const POPULAR_CARS = [
    // Dubai Favorites (First)
    "Nissan Patrol", "Toyota Land Cruiser", "Toyota Prado", "Lexus LX600",
    "Mercedes G63 AMG", "Range Rover", "Land Rover Defender",
    "Tesla Model Y", "Tesla Model 3", "Porsche Cayenne", "Rolls Royce Cullinan",
    "Lamborghini Urus", "Bentley Bentayga", "BMW X7", "Audi Q8",
    // Worldwide Popular (Sedans & Hatchbacks)
    "Toyota Camry", "Toyota Corolla", "Honda Civic", "Honda Accord",
    "Nissan Altima", "Nissan Maxima", "Hyundai Elantra", "Hyundai Sonata",
    "Kia K5", "Volkswagen Golf", "Volkswagen Passat", "Ford Mustang",
    "Chevrolet Camaro", "Dodge Challenger", "Dodge Charger",
    // Worldwide Popular (SUVs & Trucks)
    "Toyota RAV4", "Honda CR-V", "Ford F-150", "Chevrolet Silverado",
    "Ram 1500", "Jeep Wrangler", "Jeep Grand Cherokee", "Subaru Outback",
    "Mazda CX-5", "Hyundai Tucson", "Kia Sportage", "Nissan Rogue",
    // Worldwide Luxury
    "Mercedes C-Class", "Mercedes E-Class", "Mercedes S-Class",
    "BMW 3 Series", "BMW 5 Series", "BMW 7 Series", "BMW X5", "BMW X6",
    "Audi A4", "Audi A6", "Audi Q5", "Audi Q7", "Lexus RX", "Lexus ES",
    "Porsche 911", "Porsche Panamera", "Porsche Macan"
  ];
  
  useEffect(() => {
    const term = carDetails.model.trim();
    
    if (term.length < 1) {
      setApiSuggestions(POPULAR_CARS);
      return;
    }
    
    if (term.length < 2) {
      const matches = POPULAR_CARS.filter(c => 
        c.toLowerCase().includes(term.toLowerCase())
      );
      setApiSuggestions(matches);
      return;
    }

    // Check cache first for instant results
    const cacheKey = `${term}-${carDetails.type}`;
    if (suggestionCache.current[cacheKey]) {
      setApiSuggestions(suggestionCache.current[cacheKey]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsApiLoading(true);
      try {
        const res = await fetch('/api/car-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ term, category: carDetails.type })
        });
        
        const data = await res.json();
        if (Array.isArray(data)) {
          setApiSuggestions(data);
          suggestionCache.current[cacheKey] = data; // Save to cache
        }
      } catch (e) {
        console.error("Car API Error:", e);
      } finally {
        setIsApiLoading(false);
      }
    }, 200); // Reduced from 400ms to 200ms for faster response

    return () => clearTimeout(timer);
  }, [carDetails.model]);

  useEffect(() => {
    const initData = async () => {
      try {
        const [srvData, catData, vData, gData, addonData, scheduleData] = await Promise.all([
          getServices(true), 
          getCategories(),
          getVehicleTypes(),
          getGarages(),
          getAddons(true),
          getSchedule()
        ]);
        setServices(srvData);
        setAddons(addonData);
        setScheduleSettings(scheduleData);
        setCategories(catData);
        setVehicleTypes(vData);
        setGarages(gData);
        if (gData.length > 0) setSelectedGarageId(gData[0].id!);
        if (vData.length > 0) {
          setCarDetails(prev => prev.type ? prev : { ...prev, type: vData[0].name });
        }
        if (catData.length > 0) setSelectedCategory(catData[0].name);

        const preselectedId = searchParams.get('service');
        if (preselectedId && srvData.length > 0) {
          const matched = srvData.find(s => s.id === preselectedId);
          if (matched) {
            setSelectedServices([{ id: preselectedId, quantity: 1 }]);
            const matchedCat = catData.find(c =>
              (matched.category || '').toLowerCase().includes(c.name.toLowerCase()) ||
              c.name.toLowerCase().includes((matched.category || '').toLowerCase())
            );
            if (matchedCat) setSelectedCategory(matchedCat.name);
          }
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    initData();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({ ...prev, name: profile.name || "", email: profile.email || "", phone: profile.phone || "" }));
    }
  }, [profile]);

  const addService = (id: string) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === id);
      if (exists) return prev.map(s => s.id === id ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { id, quantity: 1 }];
    });
  };

  const removeService = (id: string) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === id);
      if (exists && exists.quantity > 1) return prev.map(s => s.id === id ? { ...s, quantity: s.quantity - 1 } : s);
      return prev.filter(s => s.id !== id);
    });
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Dynamic Vehicle Surcharge based on Location (Garage)
    const vType = vehicleTypes.find(v => v.name === carDetails.type);
    if (vType) {
      const overrides = (vType as any).locationOverrides || {};
      if (selectedGarageId && overrides[selectedGarageId] !== undefined) {
        total += overrides[selectedGarageId];
      } else {
        total += vType.surcharge;
      }
    }

    selectedServices.forEach(sel => {
      const service = services.find(s => s.id === sel.id);
      if (service) {
        const priceForVehicle = service.vehiclePricing?.[carDetails.type] || service.price;
        total += parseInt(priceForVehicle.replace(/[^\d]/g, '')) * sel.quantity;
      }
    });

    selectedAddOns.forEach(id => {
      const addon = addons.find(a => a.id === id);
      if (addon) total += parseInt(addon.price.replace(/[^\d]/g, ''));
    });
    return Math.max(0, total - promoDiscount);
  };

  useEffect(() => {
    if (promoCode) {
      applyPromoCode();
    } else {
      setPromoDiscount(0);
      setPromoError("");
    }
  }, [promoCode]);

  const applyPromoCode = async () => {
    setPromoError("");
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }
    
    try {
      const promoRef = doc(db, "promocodes", promoCode.toUpperCase());
      const promoSnap = await getDoc(promoRef);
      
      if (!promoSnap.exists()) {
        setPromoError("Invalid promo code");
        setPromoDiscount(0);
        return;
      }
      
      const data = promoSnap.data();
      if (!data.active) {
        setPromoError("This promo code is no longer active");
        setPromoDiscount(0);
        return;
      }

      if (data.usedBy && user && data.usedBy.includes(user.uid)) {
        setPromoError("You have already used this promo code");
        setPromoDiscount(0);
        return;
      }
      
      if (data.usedCount && data.usedCount >= data.usageLimit) {
        setPromoError("This promo code has reached its usage limit");
        setPromoDiscount(0);
        return;
      }
      
      let discount = 0;
      let baseTotal = 0;
      const vType = vehicleTypes.find(v => v.name === carDetails.type);
      if (vType) {
        const overrides = (vType as any).locationOverrides || {};
        if (selectedGarageId && overrides[selectedGarageId] !== undefined) {
          baseTotal += overrides[selectedGarageId];
        } else {
          baseTotal += vType.surcharge;
        }
      }
      selectedServices.forEach(sel => {
        const service = services.find(s => s.id === sel.id);
        if (service) {
          const priceForVehicle = service.vehiclePricing?.[carDetails.type] || service.price;
          baseTotal += parseInt(priceForVehicle.replace(/[^\d]/g, '')) * sel.quantity;
        }
      });

      selectedAddOns.forEach(id => {
        const addon = addons.find(a => a.id === id);
        if (addon) baseTotal += parseInt(addon.price.replace(/[^\d]/g, ''));
      });

      if (data.type === "percentage") {
        discount = (baseTotal * data.value) / 100;
      } else if (data.type === "fixed") {
        discount = data.value;
      }
      
      setPromoDiscount(discount);
      setPromoError("");
      
    } catch (e) {
      console.error("Promo Error:", e);
      setPromoError("Failed to validate promo code");
    }
  };

  const handleTimeSelect = async (slot: string) => {
    if (selectedTime === slot) return;
    
    if (currentSelectionId) {
      try {
        await deleteDoc(doc(db, "active_selections", currentSelectionId));
      } catch (e) {
        console.error("Failed to delete old selection:", e);
      }
    }
    
    setSelectedTime(slot);
    
    const selectionId = `${selectedDate}_${slot}_${user?.uid || 'guest_' + Math.random().toString(36).substr(2, 9)}`;
    try {
      await setDoc(doc(db, "active_selections", selectionId), {
        date: selectedDate,
        time: slot,
        createdAt: new Date().toISOString()
      });
      setCurrentSelectionId(selectionId);
    } catch (e) {
      console.error("Failed to create selection:", e);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && (!carDetails.type || !carDetails.model || !selectedGarageId)) return;
    if (currentStep === 2 && selectedServices.length === 0) return;
    if (currentStep === 4 && (!selectedDate || !selectedTime)) return;
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentStep === 1) window.history.back();
    else setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const serviceSummary = selectedServices.map(sel => {
        const s = services.find(x => x.id === sel.id);
        return s ? `${sel.quantity}x ${s.name}` : `${sel.quantity}x Service`;
      }).join(", ");

      const addonSummary = selectedAddOns.map(id => {
        const a = addons.find(x => x.id === id);
        return a ? a.name : null;
      }).filter(Boolean).join(", ");

      // Build full location string
      const locationParts = [
        `[${addressDetails.type}]`,
        addressDetails.buildingName && `Building: ${addressDetails.buildingName}`,
        addressDetails.flatNo && `Flat/Villa: ${addressDetails.flatNo}`,
        formData.address,
        addressDetails.directions && `(${addressDetails.directions})`
      ].filter(Boolean).join(" — ");

      const pendingBooking = { 
        customerName: formData.name || "Guest", 
        email: formData.email || "guest@mudwash.com", 
        phone: formData.phone || "N/A", 
        service: serviceSummary || "General Service",
        addons: addonSummary || "",
        date: selectedDate || new Date().toISOString().split('T')[0], 
        time: selectedTime || "10:00 AM", 
        location: locationParts || "Location not specified",
        addressType: addressDetails.type,
        amount: `AED ${calculateTotal()}`, 
        paidAmount: paymentOption === 'partial' ? calculateTotal() / 2 : calculateTotal(),
        paymentStatus: paymentOption === 'partial' ? 'Partial' : 'Full',
        status: "Pending",
        carDetails: `${carDetails.type || 'Standard'} - ${carDetails.model || 'Unknown'}`
      };

      // Save to localStorage
      localStorage.setItem("mudwash_pendingBooking", JSON.stringify(pendingBooking));
      
      if (promoCode) {
        localStorage.setItem("mudwash_appliedPromoCode", promoCode.toUpperCase());
      }
      
      const tempBookingId = `PENDING-${Date.now()}`;

      // Trigger Nomod Payment
      const paymentResponse = await fetch('/api/nomod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentOption === 'partial' ? calculateTotal() / 2 : calculateTotal(),
          currency: "AED",
          name: serviceSummary || "Mudwash Service",
          description: `${paymentOption === 'partial' ? 'Partial Payment ' : ''}Booking #${tempBookingId}${promoDiscount > 0 ? ` (Discount applied: AED ${promoDiscount})` : ''}`,

          email: formData.email || "guest@mudwash.com",
          phone: formData.phone || "",
          success_url: `${window.location.origin}/bookings?success=true`,
          failure_url: `${window.location.origin}/bookings?failed=true`
        })
      });

      const paymentData = await paymentResponse.json();
      const paymentUrl = paymentData.url || paymentData.link || paymentData.checkoutUrl;

      if (paymentUrl) {
        // Redirect to payment link
        window.location.href = paymentUrl;
      } else {
        console.error("Nomod payment failed to return URL:", paymentData);
        alert("Failed to create payment link. Please try again or contact support.");
        // Fallback: show success page anyway since booking is created
        setIsSuccess(true);
      }

    } catch (err: any) { 
      console.error("Booking Submission Error:", err);
      alert("Booking failed: " + (err.message || "Please check your internet connection and try again.")); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const filteredServices = services.filter(s => {
    const sCat = (s.category || "").toLowerCase().trim();
    const activeCat = (selectedCategory || "").toLowerCase().trim();
    return sCat === activeCat;
  });

  const timeSlots = scheduleSettings?.timeSlots || [
    "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM",
    "10:00 PM"
  ];

  const workingDays = scheduleSettings?.workingDays ?? [0,1,2,3,4,5,6];
  const blockedDates = scheduleSettings?.blockedDates ?? [];

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const full = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const isBlocked = blockedDates.includes(full);
    const isWorkingDay = workingDays.includes(dayOfWeek);
    return { 
      full, 
      day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
      date: d.getDate(), 
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      disabled: isBlocked || !isWorkingDay
    };
  }).filter(d => !d.disabled || d.full === selectedDate);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Removed restriction to allow guest view

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-white/10 rounded-[3rem] p-16 text-center max-w-md w-full shadow-2xl">
          <div className="w-24 h-24 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-10 text-brand-orange border border-brand-orange/20"><Check size={48} strokeWidth={3} /></div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Confirmed!</h2>
          <p className="text-white/40 font-medium mb-10 leading-relaxed">Your detailing session is booked. We'll see you at the center.</p>
          <Link href="/profile" className="block w-full bg-brand-orange text-black font-black uppercase italic tracking-widest py-5 rounded-full transition-all active:scale-95 shadow-lg">Manage Booking</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-brand-orange/30 font-sans overflow-x-hidden">
      <ProgressBar progress={(currentStep / 5) * 100} />

      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-5xl z-50 bg-black/40 backdrop-blur-2xl border border-white/10 h-20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:bg-brand-orange hover:text-black transition-all active:scale-90">
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <motion.span 
              key={currentStep}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black text-brand-orange uppercase tracking-[0.5em] mb-1"
            >
              Phase 0{currentStep}
            </motion.span>
            <motion.h1 
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-black text-white uppercase italic tracking-[0.2em]"
            >
              {currentStep === 1 && "Location & Vehicle"}
              {currentStep === 2 && "Choose Treatment"}
              {currentStep === 3 && "Enhancements"}
              {currentStep === 4 && "Schedule"}
              {currentStep === 5 && "Review"}
            </motion.h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20 leading-none">Vehicle</span>
              <span className="text-[10px] font-bold text-white italic truncate max-w-[100px]">{carDetails.model || "Not Set"}</span>
            </div>
            <Link href="/" className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:bg-brand-orange hover:text-black transition-all active:scale-90">
              <Home size={18} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-40">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: LOCATION & VEHICLE SELECTION */}
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              
              {/* Vehicle Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                      <CarIcon size={20} />
                   </div>
                   <div className="space-y-0.5">
                      <span className="text-[10px] text-brand-orange font-black uppercase tracking-[0.3em]">Step 01</span>
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter">Your Vehicle</h2>
                   </div>
                </div>

                <div className="flex lg:grid lg:grid-cols-4 overflow-x-auto lg:overflow-visible gap-4 sm:gap-6 pb-2 lg:pb-0 snap-x snap-mandatory">
                  {vehicleTypes.map(v => {
                    const isVSelected = carDetails.type === v.name;
                    const overrides = (v as any).locationOverrides || {};
                    const price = selectedGarageId && overrides[selectedGarageId] !== undefined ? overrides[selectedGarageId] : v.surcharge;
                    const imgSrc = v.image || VEHICLE_IMAGES[v.name] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800";

                    return (
                      <button 
                        key={v.id}
                        onClick={() => setCarDetails(prev => ({ ...prev, type: v.name }))}
                        className={`flex-shrink-0 lg:flex-shrink w-48 sm:w-56 lg:w-full h-28 sm:h-32 rounded-2xl border transition-all duration-500 group relative overflow-hidden snap-center ${isVSelected ? 'border-brand-orange shadow-[0_20px_50px_rgba(246,150,33,0.3)] ring-2 ring-brand-orange/20' : 'border-white/5 hover:border-white/20'}`}
                      >
                        <img 
                          src={imgSrc} 
                          alt={v.name}
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${isVSelected ? 'scale-110 opacity-100' : 'opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-60'}`} 
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${isVSelected ? 'from-brand-orange via-brand-orange/20' : 'from-black via-black/60'} to-transparent transition-colors duration-500`} />
                        
                        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                          <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 transition-colors ${isVSelected ? 'text-black' : 'text-white/60'}`}>Category</p>
                          <h4 className={`text-xl sm:text-2xl font-black italic uppercase tracking-tighter transition-colors ${isVSelected ? 'text-black' : 'text-white'}`}>{v.name}</h4>

                        </div>
                        
                        {isVSelected && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute top-6 right-6 w-10 h-10 bg-black text-brand-orange rounded-2xl flex items-center justify-center shadow-xl border border-white/10"
                          >
                            <Check size={20} strokeWidth={4} />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="max-w-2xl relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3 px-4">Car Model Name</p>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="e.g. Tesla Model 3 or Audi A4" 
                      value={carDetails.model}
                      onChange={e => setCarDetails(prev => ({ ...prev, model: e.target.value }))}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm sm:text-lg font-bold italic focus:outline-none focus:border-brand-orange/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange/40 group-focus-within:text-brand-orange transition-colors">
                      <CarIcon size={20} />
                    </div>
                  </div>

                  {/* Suggestions via OpenDataSoft API */}
                  <AnimatePresence>
                    {isFocused && (apiSuggestions.length > 0 || isApiLoading) && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: -10, scale: 0.95 }} 
                        className="absolute left-0 right-0 bottom-full mb-4 bg-[#111111] border border-white/10 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[10001] overflow-hidden backdrop-blur-xl"
                      >
                        <div className="max-h-72 overflow-y-auto custom-scrollbar py-4">
                          {isApiLoading && (
                            <div className="px-10 py-6 flex items-center gap-3 text-brand-orange/50 italic text-xs">
                              <Loader2 className="animate-spin" size={14}/>
                              <span className="font-black uppercase tracking-widest">Searching Catalog...</span>
                            </div>
                          )}
                          {apiSuggestions.map((car, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => {
                                setCarDetails(prev => ({ ...prev, model: car }));
                                setApiSuggestions([]);
                              }} 
                              className="w-full px-10 py-5 text-left hover:bg-brand-orange text-white hover:text-black transition-all font-bold italic flex items-center justify-between group/item border-b border-white/[0.03] last:border-none"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm uppercase tracking-tight">{car}</span>
                                <span className="text-[9px] opacity-40 uppercase tracking-widest group-hover/item:opacity-70 transition-opacity">
                                  {carDetails.type ? `${carDetails.type} CLASS` : 'WORLDWIDE DATABASE'}
                                </span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/item:bg-black/20 transition-colors">
                                <Plus size={14} className="opacity-40 group-hover/item:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TREATMENT SELECTION */}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange border border-brand-orange/20">
                      <Zap size={20} />
                    </div>
                    <span className="text-[11px] text-brand-orange font-black uppercase tracking-[0.4em]">Select Service</span>
                  </div>
                  <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Choose Treatment</h2>
                </div>
                
                <div className="bg-white/[0.03] border border-white/10 p-0 rounded-3xl backdrop-blur-xl w-full">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar w-full px-4 py-3 snap-x snap-mandatory">
                    {categories.slice(0, 8).map(catObj => {
                      const catName = catObj.name;
                      const isActive = selectedCategory === catName;
                      const IC = ICON_MAP[catObj.icon] || Package;
                      const serviceCount = services.filter(s => s.category === catName).length;
                      
                      if (serviceCount === 0) return null;
                      
                      return (
                        <button 
                          key={catObj.id || catName} 
                          onClick={() => setSelectedCategory(catName)} 
                          className={`flex-shrink-0 min-w-[120px] h-20 text-[10px] font-black uppercase tracking-widest transition-all duration-500 relative flex flex-col items-center justify-center gap-1.5 snap-center ${isActive ? 'bg-brand-orange text-black shadow-[0_10px_25px_rgba(246,150,33,0.4)] rounded-2xl' : 'bg-[#141414] text-white/40 hover:text-white/70 hover:bg-white/5 border border-white/5 rounded-2xl'}`}
                        >
                          <IC size={24} strokeWidth={2} className={isActive ? 'text-black' : 'text-brand-orange/60'} />
                          <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-black' : 'text-white/60'}`}>{catName}</span>
                          {/* Badge with service count */}
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${isActive ? 'bg-black text-brand-orange border border-brand-orange/20' : 'bg-[#1A1A1A] text-white/40 border border-white/10'}`}>
                            {serviceCount}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {filteredServices.map((service, index) => {
                    const IconComp = (service.icon && ICON_MAP[service.icon]) || Zap;
                    const isSelected = selectedServices.some(s => s.id === service.id);
                    const facilities = service.includedItems || [];
                    return (
                      <motion.div 
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative group rounded-[2rem] border transition-all duration-700 overflow-hidden min-h-[240px] flex flex-col justify-between ${isSelected ? 'border-brand-orange/40 shadow-[0_20px_40px_rgba(246,150,33,0.1)]' : 'border-white/5 hover:border-white/20'}`}
                      >
                        {/* Background Image */}
                        {service.image ? (
                          <div className="absolute inset-0 z-0">
                            <img src={service.image} alt={service.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 z-0 bg-[#0F0F0F]/80 backdrop-blur-md">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                          </div>
                        )}
                        
                        <div className="p-5 relative z-10 flex flex-col justify-between h-full flex-grow">
                          {/* Top Part: Badges and Action */}
                          <div className="flex justify-between items-start mb-auto">
                            <div className="flex gap-2">
                              {index === 0 && (
                                <div className="bg-brand-orange/20 backdrop-blur-md border border-brand-orange/30 text-brand-orange text-[8px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-[0_5px_15px_rgba(246,150,33,0.2)]">
                                  <Star size={8} fill="currentColor" />
                                  <span>Recommended</span>
                                </div>
                              )}
                              {index === 1 && (
                                <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 text-[8px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-[0_5px_15px_rgba(239,68,68,0.2)]">
                                  <Flame size={8} fill="currentColor" />
                                  <span>30% OFF</span>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => isSelected ? removeService(service.id!) : addService(service.id!)} 
                              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all duration-500 overflow-hidden ${isSelected ? 'bg-brand-orange text-black' : 'bg-white/10 text-white/70 hover:bg-brand-orange hover:text-black'}`}
                            >
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={isSelected ? 'check' : 'plus'}
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 90 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {isSelected ? <Check size={16} strokeWidth={4} /> : <Plus size={16} strokeWidth={3} />}
                                </motion.div>
                              </AnimatePresence>
                            </button>
                          </div>
                          
                          {/* Middle/Bottom Part: Content */}
                          <div className="mt-4 space-y-3 cursor-pointer" onClick={() => { setDetailService(service); setIsDrawerOpen(true); }}>
                            <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-white group-hover:text-brand-orange transition-colors duration-500 leading-none">{service.name}</h3>
                               </div>
                               <p className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-none italic">Professional Grade</p>
                            </div>
                            
                            <p className="text-[10px] text-white/70 leading-relaxed font-medium line-clamp-2 min-h-[28px]">{service.description || "Premium detailing treatment restored to showroom condition."}</p>
                            
                            <div className="flex items-end justify-between pt-3 border-t border-white/10">
                               <div className="flex flex-col">
                                  <span className="text-[7px] font-black uppercase tracking-widest text-white/40 mb-0.5">Price</span>
                                  <div className="flex items-baseline gap-2">
                                    {(() => {
                                      const priceForVehicle = service.vehiclePricing?.[carDetails.type] || service.price;
                                      return (
                                        <>
                                          <span className="text-xl font-black text-brand-orange italic tracking-tighter leading-none">AED {priceForVehicle}</span>
                                          <span className="text-xs font-bold text-white/30 line-through italic">AED {Math.round(parseInt(priceForVehicle.replace(/[^\d]/g, '')) * 1.4)}</span>
                                        </>
                                      );
                                    })()}
                                  </div>
                               </div>

                               {service.duration && (
                                 <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 flex items-center gap-1.5 flex-shrink-0">
                                    <Clock size={10} className="text-brand-orange" />
                                    <span className="text-[8px] text-white/80 font-black uppercase tracking-widest whitespace-nowrap">{service.duration}</span>
                                 </div>
                               )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: ENHANCEMENTS */}
          {currentStep === 3 && (() => {
            const recommended = addons.filter(a => {
              if (a.active === false) return false;
              if (a.applicableCategories && a.applicableCategories.length > 0) {
                const selectedServiceObjs = services.filter(s => selectedServices.some(sel => sel.id === s.id));
                const selectedCats = selectedServiceObjs.map(s => s.category);
                return a.applicableCategories.some(cat => selectedCats.includes(cat));
              }
              return true;
            });
            return (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="space-y-2">
                  <span className="text-[11px] text-brand-orange font-black uppercase tracking-[0.4em]">Recommended</span>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">AI Recommended Items</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {recommended.map((addon, idx) => {
                    const IconComp = ICON_MAP[addon.icon as any] || Zap;
                    const isSelected = selectedAddOns.includes(addon.id!);
                    return (
                      <motion.div
                        key={addon.id}
                        onClick={() => toggleAddOn(addon.id!)}
                        className={`relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden p-6 ${isSelected ? 'bg-brand-orange/10 border-brand-orange/40' : 'bg-[#0F0F0F] border-white/5'}`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-orange text-black' : 'bg-white/5 text-white/30'}`}>
                            <IconComp size={20}/>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-black uppercase italic tracking-tight">{addon.name}</h3>
                            <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{addon.description || "Premium add-on service."}</p>
                            {addon.duration && <p className="text-[9px] text-white/30 mt-0.5 font-bold"><Clock size={10} className="inline mr-1" />{addon.duration}</p>}
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-brand-orange font-bold text-sm">AED {addon.price}</span>
                              <span className="text-xs font-bold text-white/30 line-through italic">AED {Math.round(parseInt(addon.price.replace(/[^\d]/g, '')) * 1.4)}</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleAddOn(addon.id!); }} 
                          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all duration-500 overflow-hidden z-10 ${isSelected ? 'bg-brand-orange text-black' : 'bg-white/5 text-white/30 hover:bg-brand-orange hover:text-black'}`}
                        >
                          {isSelected ? <Check size={14} strokeWidth={4} /> : <Plus size={14} strokeWidth={3} />}
                        </button>

                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}

          {/* STEP 4: SCHEDULE */}
          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-3xl mx-auto space-y-16 text-center">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
                {days.map(d => (
                  <button key={d.full} onClick={() => setSelectedDate(d.full)} className={`flex flex-col items-center justify-center min-w-[90px] h-28 rounded-[2rem] border transition-all ${selectedDate === d.full ? 'bg-brand-orange border-brand-orange text-black' : 'bg-white/5 border-white/5 text-white/30'}`}>
                    <span className="text-3xl font-black italic">{d.date}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{d.day}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {timeSlots.map(slot => {
                  const count = slotCounts[slot] || 0;
                  const clicks = activeSelections[slot] || 0;
                  const totalCount = count + clicks;
                  const isSelected = selectedTime === slot;
                  // If this user has selected the slot, subtract 1 from clicks for the fullness check
                  const otherClicks = isSelected ? Math.max(0, clicks - 1) : clicks;
                  const isFull = (count + otherClicks) >= maxBookings;
                  
                  return (
                    <button 
                      key={slot} 
                      onClick={() => !isFull && handleTimeSelect(slot)} 
                      disabled={isFull}
                      className={`py-6 rounded-3xl text-xs font-black uppercase italic tracking-widest border transition-all ${isSelected ? 'bg-brand-orange border-brand-orange text-black' : isFull ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
                    >
                      {slot}
                      {isFull ? (
                        <span className="block text-[8px] mt-1 text-white/20 font-black">FULL</span>
                      ) : (
                        <span className="block text-[8px] mt-1 text-white/30 font-bold">{totalCount} / {maxBookings}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 5: REVIEW */}
          {currentStep === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 space-y-4 shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Vehicle Info</h3>
                <div className="flex items-center gap-4 bg-black/40 border border-white/[0.05] rounded-2xl px-6 py-4 text-white">
                  <CarIcon size={24} className="text-brand-orange" />
                  <div className="flex-grow relative">
                    <input 
                      type="text" 
                      className="w-full bg-transparent border-none text-sm font-bold focus:outline-none text-white placeholder:text-white/20"
                      value={carDetails.model} 
                      onChange={e => setCarDetails({...carDetails, model: e.target.value})}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                      placeholder="Enter car model"
                    />
                    
                    {/* Suggestions in Review Step */}
                    <AnimatePresence>
                      {isFocused && (apiSuggestions.length > 0 || isApiLoading) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                          animate={{ opacity: 1, y: 0, scale: 1 }} 
                          exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                          className="absolute left-0 right-0 top-full mt-2 bg-[#111111] border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[10001] overflow-hidden backdrop-blur-xl"
                        >
                          <div className="max-h-48 overflow-y-auto custom-scrollbar py-2">
                            {isApiLoading && (
                              <div className="px-6 py-3 flex items-center gap-3 text-brand-orange/50 italic text-xs">
                                <div className="w-3 h-3 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin"/>
                                <span className="font-black uppercase tracking-widest">Searching...</span>
                              </div>
                            )}
                            {apiSuggestions.map((car, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => {
                                  setCarDetails(prev => ({ ...prev, model: car }));
                                  setApiSuggestions([]);
                                }} 
                                className="w-full px-6 py-3 text-left hover:bg-brand-orange text-white hover:text-black transition-all font-bold italic flex items-center justify-between group/item border-b border-white/[0.03] last:border-none"
                              >
                                <span className="text-xs uppercase tracking-tight">{car}</span>
                                <Plus size={12} className="opacity-40 group-hover/item:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative inline-block">
                      <select
                        className="bg-transparent border-none text-[10px] font-black text-brand-orange uppercase tracking-widest focus:outline-none cursor-pointer pr-4 appearance-none"
                        value={carDetails.type || 'Sedan'}
                        onChange={e => setCarDetails({...carDetails, type: e.target.value})}
                      >
                        {Object.keys(VEHICLE_IMAGES).map(type => (
                          <option key={type} value={type} className="bg-[#0A0A0A] text-white text-xs">
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-brand-orange/50">
                        <ChevronDown size={10} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Contact Info</h3>
                <input type="text" placeholder="Full Name" className="w-full bg-black/40 border border-white/[0.05] rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand-orange/50 focus:bg-black/60 outline-none transition-all placeholder:text-white/10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      className="w-full bg-black/40 border border-white/[0.05] rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand-orange/50 focus:bg-black/60 outline-none transition-all placeholder:text-white/10" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <span className="text-[10px] font-black text-brand-orange/60">UAE</span>
                      <div className="w-px h-3 bg-white/10" />
                    </div>
                    <input 
                      type="tel" 
                      placeholder="Phone Number" 
                      autoComplete="off"
                      className="w-full bg-black/40 border border-white/[0.05] rounded-2xl pl-20 pr-6 py-4 text-sm font-bold focus:border-brand-orange/50 focus:bg-black/60 outline-none transition-all placeholder:text-white/10" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                    />
                  </div>
                </div>
                {!isPhoneVerified && (
                  <button 
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={async () => {
                      if (!formData.phone) {
                        alert("Please enter a phone number first!");
                        return;
                      }
                      try {
                        const res = await fetch('/api/send-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone: formData.phone })
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert("OTP sent successfully!");
                        } else {
                          alert("MSG91 API response: " + (data.error || "Unknown error") + ". Showing OTP field for testing.");
                        }
                      } catch (e) {
                        alert("Error calling API. Showing OTP field for testing anyway.");
                      }
                      
                      setIsOtpSent(true); // Always show for testing
                      
                      // Set timer based on attempts
                      if (otpAttempts === 0) {
                        setResendTimer(60); // 1 minute for first resend
                      } else if (otpAttempts === 1) {
                        setResendTimer(180); // 3 minutes for second resend (available for 3rd time)
                      } else {
                        setResendTimer(180); // Keep it at 3 mins for subsequent attempts
                      }
                      setOtpAttempts(prev => prev + 1);
                    }}
                    className={`w-full text-[10px] font-black uppercase tracking-widest py-4 rounded-xl border mt-2 transition-all flex items-center justify-center gap-2 ${
                      resendTimer > 0 
                        ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed' 
                        : 'bg-brand-orange/5 hover:bg-brand-orange/10 text-brand-orange border-brand-orange/10 hover:border-brand-orange/20'
                    }`}
                  >
                    {resendTimer > 0 
                      ? `Resend in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}` 
                      : (otpAttempts > 0 ? 'RESEND OTP' : 'VERIFY')}
                  </button>
                )}

                {isOtpSent && !isPhoneVerified && (
                  <div className="space-y-4 mt-4">
                    <input 
                      type="text" 
                      placeholder="Enter OTP" 
                      className="w-full bg-black/40 border border-white/[0.05] rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand-orange/50 focus:bg-black/60 outline-none transition-all placeholder:text-white/10" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)} 
                    />
                    <button 
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/verify-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone: formData.phone, otp })
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert("Phone verified successfully!");
                            setIsPhoneVerified(true);
                          } else {
                            alert("Verification failed: " + (data.error || "Unknown error"));
                          }
                        } catch (e) {
                          alert("Error verifying OTP");
                        }
                      }}
                      className="w-full bg-brand-orange text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Verify OTP
                    </button>
                  </div>
                )}

                {isPhoneVerified && (
                  <div className="mt-4 flex items-center gap-2 text-emerald-500 text-sm font-bold">
                    <Check size={16} />
                    <span>Phone number verified</span>
                  </div>
                )}
              </div>

              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Service Location</h3>
                    <p className="text-[10px] text-white/30 font-medium italic">Pin your exact spot for onsite detailing</p>
                  </div>
                  <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                    <button onClick={() => setShowMap(false)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!showMap ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black shadow-lg' : 'text-white/30 hover:text-white'}`}>Text</button>
                    <button onClick={() => setShowMap(true)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${showMap ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black shadow-lg' : 'text-white/30 hover:text-white'}`}>Map</button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!showMap ? (
                    <motion.div key="textInput" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                        {["Home", "Work", "Other"].map(type => (
                          <button 
                            key={type} 
                            type="button"
                            onClick={() => setAddressDetails({...addressDetails, type: type as any})} 
                            className={`flex-1 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${addressDetails.type === type ? 'bg-brand-orange text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <div className="relative group">
                        <input 
                          type="text" 
                          placeholder="Enter Building, Street, or Area Name" 
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 pr-16 text-sm font-bold focus:border-brand-orange outline-none transition-all group-hover:bg-white/[0.07]" 
                          value={formData.address} 
                          onChange={e => {
                            const newAddr = e.target.value;
                            setFormData({...formData, address: newAddr});
                            localStorage.setItem("userLocation", newAddr);
                            window.dispatchEvent(new Event("locationChanged"));
                            
                            if (addressSearchTimeout) clearTimeout(addressSearchTimeout);
                            if (newAddr.length > 3) {
                              setAddressSearchTimeout(setTimeout(async () => {
                                try {
                                  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newAddr)}&format=json&addressdetails=1&limit=5`);
                                  const data = await res.json();
                                  setAddressSuggestions(data);
                                } catch (err) {}
                              }, 500));
                            } else {
                              setAddressSuggestions([]);
                            }
                          }} 
                        />
                        {addressSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            {addressSuggestions.map((s, i) => (
                              <button key={i} type="button" onClick={() => {
                                setFormData({...formData, address: s.display_name});
                                setAddressSuggestions([]);
                              }} className="w-full text-left px-6 py-4 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 border-b border-white/5 last:border-0 truncate">
                                {s.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                        <button 
                          onClick={() => setIsMapModalOpen(true)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-brand-orange text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-90 transition-all z-10"
                        >
                          <MapPin size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="mapInput" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
                      <div className="w-full h-64 rounded-[2rem] overflow-hidden border border-white/10 relative bg-white/5">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          style={{ filter: 'brightness(0.8) contrast(1.2)' }}
                          src={`https://maps.google.com/maps?q=${formData.address || 'Dubai'}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                           <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="relative flex flex-col items-center">
                              <svg width="40" height="50" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_10px_15px_rgba(246,150,33,0.4)]">
                                <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="#F69621"/>
                                <circle cx="12" cy="12" r="4" fill="black"/>
                              </svg>
                           </motion.div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                           <span className="text-[9px] font-black uppercase text-white/60 truncate pr-4">{formData.address || 'Search or Pin Location'}</span>
                           <button onClick={() => setIsMapModalOpen(true)} className="text-[9px] font-black uppercase text-brand-orange whitespace-nowrap">Open Full Map</button>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsMapModalOpen(true)}
                        className="w-max mx-auto bg-white/5 hover:bg-white/10 border border-white/5 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center justify-center gap-3 transition-all"
                      >
                        <Search size={14} /> Full Map Selection
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Promo Code Card */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 space-y-4 mt-6 shadow-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Promo Code</h3>
                  <div>
                    <select 
                      className="w-full bg-black/40 border border-white/[0.05] rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange/50 outline-none transition-all text-white" 
                      value={promoCode} 
                      onChange={e => setPromoCode(e.target.value)} 
                    >
                      <option value="" className="bg-[#0A0A0A]">Select Promo Code</option>
                      {availablePromoCodes.map(promo => (
                        <option key={promo.id} value={promo.code} className="bg-[#0A0A0A]">
                          {promo.code} ({promo.type === 'percentage' ? `${promo.value}%` : `AED ${promo.value}`})
                        </option>
                      ))}
                    </select>
                  </div>
                  {promoError && <p className="text-xs text-red-500 font-medium mt-1">{promoError}</p>}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Discount Applied</span>
                      <span>-AED {promoDiscount}</span>
                    </div>
                  )}
                </div>

                {/* Payment Option Card */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 space-y-4 mt-6 shadow-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Payment Option</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setPaymentOption('full')}
                      className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${paymentOption === 'full' ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black font-black shadow-lg shadow-[#F59E0B]/20' : 'bg-white/[0.03] border-white/[0.05] text-white/30 hover:bg-white/[0.05]'}`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Full Payment</span>
                      <span className="text-[10px] font-bold">AED {calculateTotal()}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentOption('partial')}
                      className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${paymentOption === 'partial' ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black font-black shadow-lg shadow-[#F59E0B]/20' : 'bg-white/[0.03] border-white/[0.05] text-white/30 hover:bg-white/[0.05]'}`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Partial Payment</span>
                      <span className="text-[10px] font-bold">AED {(calculateTotal() / 2).toFixed(2)}</span>
                      <span className="text-[8px] opacity-60">Pay 50% now</span>
                    </button>
                  </div>
                </div>
                



                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-5 h-5 accent-brand-orange rounded"
                    />
                    <label htmlFor="terms" className="text-sm text-white/60 font-medium">
                      I agree to the <Link href="/terms" className="text-brand-orange hover:underline">Terms and Conditions</Link>
                    </label>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ServiceDetailDrawer service={detailService} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onAdd={addService} onRemove={removeService} quantity={selectedServices.find(s => s.id === detailService?.id)?.quantity || 0} />

      <AuthPopup isOpen={showAuthPopup} onClose={() => setShowAuthPopup(false)} onSuccess={() => {}} />

      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-4xl z-[9999] bg-black/60 backdrop-blur-2xl border border-white/10 h-20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="h-full px-6 sm:px-10 flex items-center justify-between gap-4">
          <button onClick={() => setSummaryExpanded(!summaryExpanded)} className="flex flex-col items-start group min-w-0">
            <span className="text-[8px] sm:text-[10px] font-black text-brand-orange uppercase tracking-[0.4em] group-hover:text-white transition-colors leading-none">Booking Total</span>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-black text-white italic leading-none">AED {calculateTotal()}</span>
              <motion.div animate={{ rotate: summaryExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
                <ChevronUp size={16} className="text-brand-orange group-hover:text-white transition-colors"/>
              </motion.div>
            </div>
          </button>
          
          <button 
            onClick={currentStep === 5 ? (user ? handleSubmit : () => setShowAuthPopup(true)) : handleNext} 
            disabled={isSubmitting || (currentStep === 1 && (!carDetails.type || !carDetails.model || !selectedGarageId)) || (currentStep === 2 && selectedServices.length === 0) || (currentStep === 4 && (!selectedDate || !selectedTime)) || (currentStep === 5 && (!formData.name || !formData.email || !formData.phone || !agreedToTerms || !isPhoneVerified))} 
            className="shrink-0 bg-brand-orange hover:bg-white text-black font-black uppercase italic tracking-[0.1em] sm:tracking-[0.2em] text-[10px] sm:text-xs h-10 sm:h-12 px-4 sm:px-6 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-20 shadow-xl shadow-brand-orange/20"
          >
            {isSubmitting
              ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"/>
              : <>{currentStep === 5 ? "Confirm" : "Next Phase"}<ChevronRight size={14} strokeWidth={3}/></>
            }
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {summaryExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSummaryExpanded(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001]"
            />
            {/* Sheet — slides up from bottom, covers footer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[1002] bg-[#0D0D0D] border-t border-white/10 rounded-t-3xl shadow-[0_-30px_80px_rgba(0,0,0,0.7)] overflow-hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/10"/>
              </div>

              <div className="px-6 pt-3 pb-4 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-orange flex items-center gap-2">
                  <Sparkles size={12}/> Booking Summary
                </h3>
                <div className="flex items-center gap-2">
                  {(selectedServices.length > 0 || selectedAddOns.length > 0) && (
                    <button
                      onClick={() => {
                        setSelectedServices([]);
                        setSelectedAddOns([]);
                      }}
                      className="text-[9px] font-black uppercase text-white/40 hover:text-white transition-colors border border-white/10 px-3 py-1 rounded-full"
                    >
                      Clear Cart
                    </button>
                  )}
                  <button
                    onClick={() => setSummaryExpanded(false)}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <X size={14}/>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5 mx-6"/>

              {/* Items list */}
              <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto pb-40 no-scrollbar">
                {(() => {
                  const vType = vehicleTypes.find(v => v.name === carDetails.type);
                  const overrides = (vType as any)?.locationOverrides || {};
                  const surcharge = vType ? (selectedGarageId && overrides[selectedGarageId] !== undefined ? overrides[selectedGarageId] : vType.surcharge) : 0;
                  
                  const hasSelection = selectedServices.length > 0 || selectedAddOns.length > 0 || surcharge !== 0;

                  if (!hasSelection) return (
                    <div className="text-center py-8">
                      <p className="text-xs text-white/20 italic">No treatments selected yet</p>
                    </div>
                  );

                  return (
                    <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] space-y-6">
                      {/* Surcharge section removed as requested */}

                      {selectedServices.map(sel => {
                      const s = services.find(x => x.id === sel.id);
                      if (!s) return null;
                      const IconComp = (s.icon && ICON_MAP[s.icon]) || CarIcon;
                      return (
                        <div key={sel.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange shrink-0">
                              <IconComp size={16}/>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black italic uppercase tracking-tight text-white leading-none truncate">{s.name}</p>
                              {sel.quantity > 1 && <p className="text-[10px] text-white/30 mt-0.5">{sel.quantity}× quantity</p>}
                            </div>
                          </div>
                          {(() => {
                            const priceForVehicle = s.vehiclePricing?.[carDetails.type] || s.price;
                            return (
                              <span className="text-sm font-black text-white italic shrink-0">AED {parseInt(priceForVehicle.replace(/[^\d]/g,'') || '0') * sel.quantity}</span>
                            );
                          })()}

                        </div>
                      );
                    })}
                    {selectedGarageId && (
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 shrink-0">
                            <MapPin size={16}/>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase text-white/20 leading-none">Location</p>
                            <p className="text-xs font-bold text-white leading-tight mt-1">{garages.find(g => g.id === selectedGarageId)?.name || "Default Center"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {carDetails.model && (
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 shrink-0">
                            <CarIcon size={16}/>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase text-white/20 leading-none">Vehicle</p>
                            <p className="text-xs font-bold text-white leading-tight mt-1">{carDetails.type} • {carDetails.model}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedAddOns.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="h-px flex-grow bg-white/5"/>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Add-ons</span>
                          <div className="h-px flex-grow bg-white/5"/>
                        </div>
                        {selectedAddOns.map(id => {
                          const addon = addons.find(a => a.id === id);
                          if (!addon) return null;
                          return (
                            <div key={id} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-1.5 h-1.5 bg-brand-orange/50 rounded-full shrink-0 ml-4"/>
                                <span className="text-xs font-bold text-white/50 italic uppercase tracking-tight truncate">{addon.name}</span>
                              </div>
                              <span className="text-xs font-black text-white/40 italic shrink-0">AED {addon.price}</span>
                            </div>
                          );
                        })}
                      </>
                    )}
                    </div>
                  );
                })()}
              </div>

              {promoDiscount > 0 && (
                <div className="mx-6 mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-between">
                  <span className="text-sm font-black uppercase italic tracking-widest text-green-500">Discount Applied</span>
                  <span className="text-lg font-black text-green-500 italic">-AED {promoDiscount}</span>
                </div>
              )}              {/* Grand total */}
              <div className="mx-6 mb-6 mt-2 p-4 bg-brand-orange/8 border border-brand-orange/15 rounded-2xl flex items-center justify-between">
                <span className="text-sm font-black uppercase italic tracking-widest text-brand-orange">Grand Total</span>
                <span className="text-2xl font-black text-brand-orange italic">AED {calculateTotal()}.00</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMapModalOpen && (
          <InteractiveMapModal 
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            onConfirm={(addr) => {
              setFormData(prev => ({ ...prev, address: addr }));
              localStorage.setItem("userLocation", addr);
              window.dispatchEvent(new Event("locationChanged"));
              setShowMap(true);

              setIsMapModalOpen(false);
              setIsAddressDetailsOpen(true);
            }}
            initialCoords={mapCoords}
          />
        )}
      </AnimatePresence>

      {/* Address Details Modal */}
      <AnimatePresence>
        {isAddressDetailsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddressDetailsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10002]"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-4 bottom-4 top-20 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:h-auto bg-[#0D0D0D] border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] z-[10003] overflow-hidden flex flex-col"
            >
              <div className="p-8 space-y-6 flex-grow overflow-y-auto no-scrollbar">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Address Details</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">Complete your location info</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                  {["Home", "Work", "Other"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAddressDetails(prev => ({ ...prev, type: t as any }))}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${addressDetails.type === t ? 'bg-brand-orange text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 block">Address / Area</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Street, Area, or Neighbourhood"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none transition-all text-white placeholder:text-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 block">Building / Villa Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Al Barsha Heights Tower B"
                      value={addressDetails.buildingName}
                      onChange={(e) => setAddressDetails(prev => ({ ...prev, buildingName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none transition-all text-white placeholder:text-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 block">Flat / Villa No.</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Flat 402 or Villa 12"
                      value={addressDetails.flatNo}
                      onChange={(e) => setAddressDetails(prev => ({ ...prev, flatNo: e.target.value }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none transition-all text-white placeholder:text-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 block">Landmark / Directions (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Near the supermarket, opposite park"
                      value={addressDetails.directions}
                      onChange={(e) => setAddressDetails(prev => ({ ...prev, directions: e.target.value }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-orange outline-none transition-all text-white placeholder:text-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-8 pt-0 mt-auto">
                <button
                  onClick={async () => {
                    if (user) {
                      try {
                        const userRef = doc(db, "users", user.uid);
                        await updateDoc(userRef, {
                          savedAddress: formData.address,
                          addressType: addressDetails.type,
                          buildingName: addressDetails.buildingName,
                          flatNo: addressDetails.flatNo,
                          directions: addressDetails.directions
                        });
                      } catch (e) {
                        console.error("Error saving address to profile:", e);
                      }
                    }
                    setIsAddressDetailsOpen(false);
                  }}
                  className="w-full bg-brand-orange hover:bg-white text-black font-black uppercase italic tracking-[0.1em] text-xs h-14 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-orange/20"
                >
                  Save Address <ChevronRight size={14} strokeWidth={3}/>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Interactive Marker Component
function LocationMarker({ onPositionChange }: { onPositionChange: (pos: string) => void }) {
  const [position, setPosition] = React.useState<[number, number] | null>(null);
  const MapEventsHook = (window as any).ReactLeaflet?.useMapEvents || (() => ({}));
  
  // Note: In a real Next.js app with dynamic imports, we need to ensure the hook is available.
  // Since we are using dynamic imports, we'll implement it inside the MapContainer's child.
  return null; 
}

export default function BookingPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
      </div>
    }>
      <BookingPageInner />
    </React.Suspense>
  );
}
