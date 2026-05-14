"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Download, Share } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function PWAInstall() {
    return null; // Disabled popup as requested by user
    
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;

        // Don't show if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Don't show if user dismissed before
        const dismissed = sessionStorage.getItem('mudwash_pwa_dismissed');
        if (dismissed) return;

        // Only show on home page
        if (!isHomePage) return;

        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIos(isIosDevice);

        // Listen for Android/Chrome install prompt
        const handler = (e: any) => {
            e.preventDefault();
            if (isMounted.current) {
                setDeferredPrompt(e);
                (window as any).deferredPrompt = e;
            }
        };

        const onCaptured = () => {
            if ((window as any).deferredPrompt && isMounted.current) {
                setDeferredPrompt((window as any).deferredPrompt);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('beforeinstallprompt-captured', onCaptured);

        if ((window as any).deferredPrompt) {
            onCaptured();
        }

        // Show popup after 2 seconds on page open
        const timer = setTimeout(() => {
            if (isMounted.current) setShowPrompt(true);
        }, 2000);

        return () => {
            isMounted.current = false;
            clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('beforeinstallprompt-captured', onCaptured);
        };
    }, [isHomePage]);

    const handleInstall = async () => {
        const promptToUse = deferredPrompt || (window as any).deferredPrompt;
        if (promptToUse) {
            promptToUse.prompt();
            const { outcome } = await promptToUse.userChoice;
            if (outcome === 'accepted') {
                if (isMounted.current) setShowPrompt(false);
                (window as any).deferredPrompt = null;
            }
            if (isMounted.current) setDeferredPrompt(null);
        }
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        sessionStorage.setItem('mudwash_pwa_dismissed', 'true');
        setShowPrompt(false);
    };

    if (isInstalled) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    {/* Backdrop (Mobile Only) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm md:hidden"
                    />

                    {/* Popup Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, x: 10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-32 left-4 right-4 z-[2001] md:bottom-12 md:right-12 md:left-auto md:w-80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl md:rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">

                            {/* Orange accent top bar */}
                            <div className="h-1 bg-gradient-to-r from-[#f69621] via-[#ffb347] to-[#f69621]" />

                            <div className="p-5 md:p-4 pb-6">
                                {/* Close button */}
                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center bg-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-all"
                                >
                                    <X size={12} />
                                </button>

                                {/* App icon + name */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 md:w-12 md:h-12 rounded-xl bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center shadow-lg shrink-0">
                                        <Image
                                            src="/mudwash-logo-final.png"
                                            alt="MUDWASH"
                                            width={48}
                                            height={48}
                                            priority
                                            className="object-contain p-1.5"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <img src="/mudwash-logo-final.png" alt="MUDWASH" className="h-4 w-auto object-contain" />
                                            <Sparkles size={12} className="text-brand-orange animate-pulse" />
                                        </div>
                                        <p className="text-white/40 text-[10px] font-medium">Premium Auto Detailing</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-white/60 text-[11px] leading-relaxed font-medium mb-4 pr-4">
                                    Install MUDWASH for the fastest booking experience directly from your home screen.
                                </p>

                                {/* Feature pills */}
                                <div className="flex items-center gap-1.5 flex-wrap mb-5 md:mb-4">
                                    {['Instant', 'Offline', 'Fast'].map(f => (
                                        <span key={f} className="bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            {f}
                                        </span>
                                    ))}
                                </div>

                                {/* CTA Buttons */}
                                {isIos ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase italic tracking-widest">
                                            <Share size={14} />
                                            Tap Share → Add to Home
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleInstall}
                                            className="flex-1 flex items-center justify-center gap-2 bg-brand-orange text-black py-4 rounded-2xl font-black uppercase italic text-[11px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_25px_rgba(246,150,33,0.4)]"
                                        >
                                            <Download size={14} />
                                            Install Now — It's Free
                                        </button>
                                        <button
                                            onClick={handleDismiss}
                                            className="px-4 py-4 rounded-2xl text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                        >
                                            Later
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
