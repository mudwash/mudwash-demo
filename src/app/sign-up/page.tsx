"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { saveUserToFirestore } from "@/lib/users";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const isAdminEmail = email === "wazeert13@gmail.com";
        
        // Update profile and save to Firestore in parallel for performance
        await Promise.all([
          updateProfile(user, { displayName: name }),
          saveUserToFirestore({
            uid: user.uid,
            name: name,
            email: email,
            role: isAdminEmail ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
          })
        ]);

        const isAdmin = user.email === "wazeert13@gmail.com";
        if (isAdmin) {
          localStorage.setItem("admin_token", "mudwash_session_active");
          router.push(returnTo || "/admin");
        } else {
          router.push(returnTo || "/");
        }
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in.");
      } else {
        console.error("Sign up error:", err);
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <main className="h-screen w-full bg-[#050505] text-white flex overflow-hidden">
      
      {/* LEFT PANEL - FORM */}
      <div className="w-full lg:w-[45%] h-full z-10 flex flex-col justify-start lg:justify-center py-10 px-6 sm:px-12 md:px-16 xl:px-24 bg-[#0A0A0A] relative border-r border-white/5 overflow-y-auto overflow-x-hidden lg:overflow-hidden">

        
        {/* Subtle elegant ambient glow */}
        <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-brand-orange/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-orange/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="w-full max-w-md mx-auto relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6 lg:mb-10"
          >
            <div className="text-xl font-black tracking-tighter flex items-baseline mb-2 lg:mb-4">
              <span className="text-brand-orange italic">MUD</span>
              <span className="text-white italic">WASH</span>
              <div className="w-1 h-1 bg-brand-orange ml-1 rounded-full" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-1 leading-tight break-words">

              Create an <br /> Account<span className="text-brand-orange">.</span>
            </h1>
            <p className="text-white/40 text-[11px] sm:text-sm mt-2">Unlock exclusive privileges and premium automotive detailing offers.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <form className="space-y-4 lg:space-y-5" onSubmit={handleSignUp}>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] py-2 px-3 rounded-lg font-bold"
                >
                  {error}
                </motion.div>
              )}
              
              <div className="space-y-4">
                {/* Name Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-white/20 group-focus-within:text-brand-orange transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 py-2 pl-9 pr-4 text-white text-sm sm:text-base focus:outline-none focus:border-brand-orange transition-all placeholder:text-white/20"
                    placeholder="Full Name"
                    required
                  />
                </div>

                {/* Email Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-white/20 group-focus-within:text-brand-orange transition-colors">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 py-2 pl-9 pr-4 text-white text-sm sm:text-base focus:outline-none focus:border-brand-orange transition-all placeholder:text-white/20"
                    placeholder="Email Address"
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-white/20 group-focus-within:text-brand-orange transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 py-2 pl-9 pr-12 text-white text-sm sm:text-base focus:outline-none focus:border-brand-orange transition-all placeholder:text-white/20"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-white/20 hover:text-brand-orange transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-extrabold uppercase tracking-widest text-[10px] py-4 rounded-none hover:bg-brand-orange transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Wait...
                    </>
                  ) : "Create Account"}
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-5">
              <p className="text-white/40 text-xs">
                Already registered?{" "}
                <Link href="/sign-in" className="text-white hover:text-brand-orange font-bold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* RIGHT PANEL - IMAGE */}
      <div className="hidden lg:block lg:w-[55%] h-full relative group">
        <motion.img
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=2000&auto=format&fit=crop"
          alt="Luxury Car Detail"
          className="w-full h-full object-cover filter brightness-[0.8]"
        />
        {/* Inner shadow overlay matching left panel background perfectly */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent opacity-50" />
      </div>

    </main>
  );
}
