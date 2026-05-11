import dynamic from "next/dynamic";

import Hero from "@/components/Hero";
import ServicesGrid from "@/components/ServicesGrid";

// Lazy load components below the fold
const BeforeAfterSlider = dynamic(() => import("@/components/BeforeAfterSlider"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const Locations = dynamic(() => import("@/components/Locations"));
const GoogleReviews = dynamic(() => import("@/components/GoogleReviews"));
const PremiumDetailing = dynamic(() => import("@/components/PremiumDetailing"));
const BookingContactForm = dynamic(() => import("@/components/BookingContactForm"));
const Footer = dynamic(() => import("@/components/Footer"));

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">

      <Hero />
      <ServicesGrid />
      <BeforeAfterSlider />
      <Locations />
      <Testimonials />
      <PremiumDetailing />
      <BookingContactForm />
      <GoogleReviews />
      <Footer />
    </main>
  );
}
