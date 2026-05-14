"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      router.push("/admin");
    }
  }, [router]);

  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch profile to check role
      const { getUserProfile } = await import("@/lib/users");
      const profile = await getUserProfile(user.uid);
      
      const isAdmin = profile?.role === 'admin';
      
      if (isAdmin) {
        localStorage.setItem("admin_token", "mudwash_session_active");
        router.push(returnTo || "/admin");
      } else {
        router.push(returnTo || "/");
      }
    } catch (err: any) {
      if (err.code === "auth/user-disabled") {
        setError("This account has been disabled by the administrator.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        console.error(err);
        setError(`An error occurred: ${err.message || "Please try again."}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user) {
        // Fetch profile to check role or create if doesn't exist
        const { getUserProfile, saveUserToFirestore } = await import("@/lib/users");
        let profile = await getUserProfile(user.uid);
        
        if (!profile) {
          // Create profile for new Google user
          await saveUserToFirestore({
            uid: user.uid,
            name: user.displayName || "Google User",
            email: user.email || "",
            role: 'user', // Default to user role
            createdAt: new Date().toISOString(),
          });
          profile = { role: 'user' } as any;
        }
        
        const isAdmin = profile?.role === 'admin';
        
        if (isAdmin) {
          localStorage.setItem("admin_token", "mudwash_session_active");
          router.push(returnTo || "/admin");
        } else {
          router.push(returnTo || "/");
        }
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(`Failed to sign in with Google: ${err.message || "Please try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="h-screen w-full bg-[#050505] text-white flex overflow-hidden">
      
      {/* LEFT PANEL - FORM */}
      <div className="w-full lg:w-[45%] h-full z-10 flex flex-col justify-start lg:justify-center py-10 px-6 sm:px-12 md:px-16 xl:px-24 bg-[#0A0A0A] relative border-r border-white/5 overflow-y-auto lg:overflow-hidden">
        
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-1 leading-tight">
              Welcome <br /> Back<span className="text-brand-orange">.</span>
            </h1>
            <p className="text-white/40 text-[11px] sm:text-sm mt-2">Sign in securely to manage your bookings and access detailing packages.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <form className="space-y-4 lg:space-y-6" onSubmit={handleSignIn}>
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="w-3 h-3 rounded-sm border border-white/20 bg-transparent peer-checked:bg-brand-orange peer-checked:border-brand-orange transition-all flex items-center justify-center shadow-inner">
                       <svg className="w-2.5 h-2.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 group-hover:text-white transition-colors">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-[10px] uppercase tracking-wider text-brand-orange hover:text-white transition-colors font-bold">
                  Forgot?
                </Link>
              </div>

              <div className="pt-2">
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
                  ) : "Sign In"}
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-white/5 text-white font-extrabold uppercase tracking-widest text-[10px] py-4 rounded-none hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 border border-white/10"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-white/40 text-xs">
                New to Mudwash?{" "}
                <Link href="/sign-up" className="text-white hover:text-brand-orange font-bold transition-colors">
                  Sign Up
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
          src="https://i.pinimg.com/736x/68/21/09/68210976b8b17b47c6df837ef176aed7.jpg"
          alt="Luxury Car Detail"
          className="w-full h-full object-cover filter brightness-[0.8]"
        />
        {/* Inner shadow overlay matching left panel background perfectly */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent opacity-50" />
      </div>

    </main>
  );
}
