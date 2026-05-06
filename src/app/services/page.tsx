"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServicesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirecting to the booking flow to avoid UI redundancy
    router.replace("/bookings");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-[#F59E0B]/20 border-t-[#F59E0B] rounded-full animate-spin" />
        <p className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px]">Loading Booking Engine...</p>
      </div>
    </div>
  );
}
