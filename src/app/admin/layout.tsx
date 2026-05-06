"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Wrench,
  User,
  Package,
  MapPin,
  Car
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { name: "Services", href: "/admin/services", icon: Wrench },
  { name: "Vehicles", href: "/admin/vehicles", icon: Car },
  { name: "Parts", href: "/admin/parts", icon: Package },
  { name: "Garages", href: "/admin/garages", icon: MapPin },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

import { AdminGuard } from "@/components/RoleGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Booking", message: "Ahmed Khan booked Ceramic Coating", time: "2 mins ago", read: false },
    { id: 2, title: "Stock Alert", message: "Microfiber Towels are running low", time: "1 hour ago", read: false },
    { id: 3, title: "Payment Received", message: "Booking #3490 settled (AED 1,200)", time: "3 hours ago", read: true },
  ]);
  const pathname = usePathname();
  const router = useRouter();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("admin_token");
      router.push("/sign-in");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-black text-xl">M</span>
          </div>
          {(isSidebarOpen || isMobileMenuOpen) && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl tracking-tight"
            >
              MUDWASH
            </motion.span>
          )}
        </Link>
        <button
          onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsSidebarOpen(false)}
          className="p-1 hover:bg-white/5 rounded-md transition-colors lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                  ? "bg-brand-orange text-black"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon size={20} className={isActive ? "text-black" : "group-hover:text-brand-orange"} />
              {(isSidebarOpen || isMobileMenuOpen) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  {link.name}
                </motion.span>
              )}
              {isActive && (isSidebarOpen || isMobileMenuOpen) && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-black"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 w-full text-white/50 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
        >
          <LogOut size={20} />
          {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <AdminGuard>
      <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <motion.aside
          initial={{ x: "-100%" }}
          animate={{ x: isMobileMenuOpen ? 0 : "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 left-0 w-72 bg-[#0A0A0A] border-r border-white/5 flex flex-col z-[60] lg:hidden shadow-2xl"
        >
          <SidebarContent />
        </motion.aside>

        {/* Desktop Sidebar */}
        <aside
          className={`${isSidebarOpen ? "w-64" : "w-20"
            } transition-all duration-300 bg-[#0A0A0A] border-r border-white/5 hidden lg:flex flex-col z-50`}
        >
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-y-auto">
          {/* Topbar */}
          <header className="h-20 bg-[#0A0A0A]/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors lg:hidden"
              >
                <Menu size={20} className="text-white/50" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors hidden lg:block"
              >
                <Menu size={20} className="text-white/50" />
              </button>
              <div className="relative group hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-[#111111] border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm w-40 md:w-64 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 text-white/50 hover:text-white transition-colors"
                >
                  <Bell size={20} />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full border-2 border-[#0A0A0A]" />
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="fixed inset-0 z-40"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <h3 className="text-sm font-black uppercase tracking-widest italic text-white/80">Activity</h3>
                          <button
                            onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                            className="text-[9px] font-black uppercase tracking-widest text-brand-orange hover:text-white transition-colors"
                          >
                            Mark all read
                          </button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
                          {notifications.map((n) => (
                            <div key={n.id} className={`p-4 hover:bg-white/[0.03] transition-colors relative group cursor-pointer ${!n.read ? "bg-white/[0.01]" : ""}`}>
                              {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange" />}
                              <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-xs font-black uppercase tracking-tight ${!n.read ? "text-white" : "text-white/60"}`}>{n.title}</h4>
                                <span className="text-[9px] font-bold text-white/20">{n.time}</span>
                              </div>
                              <p className="text-[10px] text-white/40 font-medium leading-relaxed">{n.message}</p>
                            </div>
                          ))}
                        </div>
                        <button className="w-full p-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white hover:bg-white/5 transition-all border-t border-white/5">
                          See all activity
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-3 sm:pl-6 sm:border-l sm:border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold">Wazeer</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Admin</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center border-2 border-white/10">
                  <User size={20} className="text-black" />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 sm:p-8 flex-1">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
