'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, MotionValue, useMotionValue, useSpring, useTransform, type SpringOptions } from 'framer-motion';
import {
  Home,
  ShoppingBag,
  User,

  Wrench,
  CalendarPlus,
  LogIn,
} from 'lucide-react';
import { auth } from '@/lib/firebase';

/* ─────────────────────────────────────────────────────────────
   Dock Item – single icon with magnification + tooltip
───────────────────────────────────────────────────────────── */
type DockItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  isActive?: boolean;
  isAccent?: boolean;
};

function DockItem({
  icon,
  label,
  onClick,
  mouseX,
  spring,
  distance,
  baseItemSize,
  magnification,
  isActive = false,
  isAccent = false,
}: DockItemProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const widthTransform = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    const dist = val - (bounds.x + bounds.width / 2);
    if (Math.abs(dist) > distance) return baseItemSize;
    const angle = (dist / distance) * (Math.PI / 2);
    return baseItemSize + (magnification - baseItemSize) * Math.cos(angle);
  });

  const size = useSpring(widthTransform, { ...spring, stiffness: 260, damping: 28 });

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      className="relative shrink-0 flex items-center justify-center cursor-pointer"
      onClick={onClick}
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
      whileTap={{ scale: 0.88 }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap pointer-events-none z-50"
            style={{
              background: 'rgba(22, 22, 22, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e6edf3',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              letterSpacing: '0.03em',
            }}
          >
            {label}
            {/* Tooltip arrow */}
            <span
              className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 rotate-45"
              style={{
                background: 'rgba(22, 22, 22, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderTop: 'none',
                borderLeft: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon container */}
      <motion.div
        className="w-full h-full rounded-xl flex items-center justify-center relative overflow-hidden"
        animate={{
          background: isAccent
            ? 'rgba(246,150,33,1)'
            : isActive
            ? 'rgba(246,150,33,0.12)'
            : 'rgba(255,255,255,0.04)',
          boxShadow: isAccent
            ? '0 0 20px rgba(246,150,33,0.5), inset 0 1px 0 rgba(255,255,255,0.25)'
            : isActive
            ? '0 0 12px rgba(246,150,33,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
            : 'inset 0 1px 0 rgba(255,255,255,0.06)',
          border: isAccent
            ? '1px solid rgba(246,150,33,0.6)'
            : isActive
            ? '1px solid rgba(246,150,33,0.25)'
            : '1px solid rgba(255,255,255,0.07)',
        }}
        transition={{ duration: 0.25 }}
      >
        {/* Shimmer overlay for accent */}
        {isAccent && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
            }}
          />
        )}

        <motion.div
          animate={{ scale: isActive ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {React.cloneElement(icon as React.ReactElement<any>, {
            size: 19,
            strokeWidth: isActive || isAccent ? 2.5 : 1.75,
            color: isAccent ? '#0a0a0a' : isActive ? '#f69621' : '#8b949e',
          })}
        </motion.div>
      </motion.div>

      {/* Active dot indicator (GitHub style) */}
      <AnimatePresence>
        {isActive && !isAccent && (
          <motion.span
            layoutId="dock-active-dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: '#f69621', boxShadow: '0 0 6px rgba(246,150,33,0.8)' }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Divider
───────────────────────────────────────────────────────────── */
function DockDivider() {
  return (
    <div
      className="self-center shrink-0 mx-1"
      style={{
        width: '1px',
        height: '32px',
        background: 'rgba(255,255,255,0.08)',
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Navbar (GitHub Dock Style)
───────────────────────────────────────────────────────────── */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const mouseX = useMotionValue(Infinity);

  const spring: SpringOptions = { mass: 0.12, stiffness: 220, damping: 22 };
  const baseItemSize = 44;
  const magnification = 62;
  const distance = 130;

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => setIsLoggedIn(!!user));
    return () => {
      unsub();
    };
  }, []);

  if (pathname.startsWith('/admin') || pathname === '/bookings' || pathname === '/services') return null;

  interface NavItem {
    label: string;
    href?: string;
    icon: React.ReactNode;
    onClick?: () => void;
  }

  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: <Home /> },
    { label: 'Shop', href: '/spare-parts', icon: <ShoppingBag /> },
  ];

  const rightItems: NavItem[] = [
    {
      label: isLoggedIn ? 'My Profile' : 'Sign In',
      href: isLoggedIn ? '/profile' : '/sign-up',
      icon: isLoggedIn ? <User /> : <LogIn />,
    },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.15 }}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto flex items-center gap-1.5 px-3 py-2.5 relative"
        style={{
          background: 'rgba(13, 17, 23, 0.82)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow:
            '0 0 0 1px rgba(0,0,0,0.4), 0 20px 50px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Main nav items */}
        {navItems.map((item) => (
          <DockItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick ?? (() => item.href && router.push(item.href))}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            baseItemSize={baseItemSize}
            magnification={magnification}
            isActive={pathname === item.href}
          />
        ))}

        {/* Book Now — accent CTA */}
        <DockItem
          icon={<CalendarPlus />}
          label="Book Now"
          onClick={() => router.push('/bookings')}
          mouseX={mouseX}
          spring={spring}
          distance={distance}
          baseItemSize={baseItemSize}
          magnification={magnification}
          isAccent
        />

        <DockDivider />

        {/* Right group */}
        {rightItems.map((item) => (
          <DockItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick ?? (() => router.push(item.href!))}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            baseItemSize={baseItemSize}
            magnification={magnification}
            isActive={item.href ? pathname === item.href : false}
          />
        ))}
      </motion.div>
    </div>
  );
}
