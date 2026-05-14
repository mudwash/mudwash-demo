'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Loader2, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { saveUserToFirestore } from "@/lib/users";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthPopup({ isOpen, onClose, onSuccess }: AuthPopupProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent scrolling when the sheet is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const isAdminEmail = email === "wazeert13@gmail.com";
        
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

        onSuccess();
        onClose();
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        console.error("Sign in error:", err);
        setError("An error occurred. Please try again.");
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
        }
        
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(`Failed to sign in with Google: ${err.message || "Please try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10000] bg-black"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[10001] bg-[#0A0A0A] border-t border-white/10 rounded-t-[2.5rem] max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors z-50"

            >
              <X size={20} />
            </button>

            <div className="px-5 py-8 sm:p-8 overflow-y-auto">

              <div className="w-full max-w-md mx-auto relative z-10">
                
                {/* Header */}
                <div className="mb-8">
                  <div className="text-xl font-black tracking-tighter flex items-baseline mb-4">
                    <span className="text-brand-orange italic">MUD</span>
                    <span className="text-white italic">WASH</span>
                    <div className="w-1 h-1 bg-brand-orange ml-1 rounded-full" />
                  </div>
                  
                  {isSignUp ? (
                    <>
                      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1 leading-tight break-words">

                        Create an <br /> Account<span className="text-brand-orange">.</span>
                      </h1>
                      <p className="text-white/40 text-[11px] sm:text-sm mt-2">Unlock exclusive privileges and premium automotive detailing offers.</p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1 leading-tight break-words">

                        Welcome <br /> Back<span className="text-brand-orange">.</span>
                      </h1>
                      <p className="text-white/40 text-[11px] sm:text-sm mt-2">Sign in securely to manage your bookings and access detailing packages.</p>
                    </>
                  )}
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
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
                    {/* Name Input (Sign Up Only) */}
                    {isSignUp && (
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
                          required={isSignUp}
                        />
                      </div>
                    )}

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
                      ) : (
                        isSignUp ? "Create Account" : "Sign In"
                      )}
                    </button>
                  </div>
                </form>

                {/* Toggle */}
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
                    {isSignUp ? "Already registered? " : "New to Mudwash? "}
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-white hover:text-brand-orange font-bold transition-colors"
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
