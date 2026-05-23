'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, MousePointer, ShoppingCart, DollarSign, Percent,
  Download, RefreshCw, Filter, ChevronDown, ChevronUp, ExternalLink,
  Clock, CheckCircle2, XCircle, AlertCircle, Target, Zap,
  BarChart3, Search, Eye, X, Calendar, Activity, ArrowUpRight,
  ArrowDownRight, Globe, Smartphone, Monitor, Layers, Radio,
  Sparkles, TrendingDown, ArrowRight
} from 'lucide-react';
import {
  collection, getDocs, query, orderBy, limit, where, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AD_TRACKING_COLLECTION, FUNNEL_STEPS, getFurthestStep, TrackingEvent } from '@/lib/adTracking';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdSession {
  sessionId: string;
  gclid: string | null;
  isGoogleAdTraffic: boolean;
  landingPage: string;
  landingTime: any;
  userAgent: string;
  referrer: string;
  events: TrackingEvent[];
  bookingId?: string;
  bookingAmount?: number;
  bookingService?: string;
  bookingStatus?: string;
  conversionSentToGads: boolean;
  conversionValue?: number;
  lastUpdated: any;
  lastEventName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(val: any): string {
  if (!val) return '—';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-AE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDateShort(val: any): string {
  if (!val) return '—';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-AE', {
    day: '2-digit', month: 'short'
  });
}

function formatDateForGads(val: any): string {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  // Google Ads format: YYYY-MM-DD HH:MM:SS+TZ
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+05:30`;
}

function maskGclid(gclid: string | null): string {
  if (!gclid) return '—';
  if (gclid.length <= 12) return gclid;
  return `${gclid.slice(0, 8)}…${gclid.slice(-4)}`;
}

function getFunnelColor(order: number): string {
  if (order >= 5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (order >= 3) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  if (order >= 1) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-white/30 bg-white/[0.03] border-white/10';
}

function getBrowserFromUA(ua: string): string {
  if (!ua) return 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return '🌐 Chrome';
  if (ua.includes('Firefox')) return '🦊 Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return '🧭 Safari';
  if (ua.includes('Edg')) return '🌀 Edge';
  if (ua.includes('Mobile')) return '📱 Mobile';
  return '🖥️ Browser';
}

function getTimeAgo(val: any): string {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateShort(val);
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const startVal = displayVal;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.round(startVal + (value - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{prefix}{displayVal.toLocaleString()}{suffix}</>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, gradient, delay = 0, trend
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; gradient: string; delay?: number;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A0A0A] hover:border-white/[0.12] transition-all duration-500"
    >
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${gradient} blur-3xl`} style={{ transform: 'scale(1.5)' }} />
      
      {/* Glass overlay */}
      <div className="relative p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={`p-2.5 rounded-xl ${gradient} backdrop-blur-sm`}>
            <Icon size={18} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
              trend.positive 
                ? 'text-emerald-400 bg-emerald-500/10' 
                : 'text-red-400 bg-red-500/10'
            }`}>
              {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5">{label}</p>
          <p className="text-[1.65rem] font-black italic tracking-tighter text-white leading-none">{value}</p>
          {sub && <p className="text-[10px] text-white/25 mt-1.5 font-medium">{sub}</p>}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`h-[2px] w-full ${gradient} opacity-20 group-hover:opacity-60 transition-opacity duration-500`} />
    </motion.div>
  );
}

// ─── Traffic Source Breakdown ──────────────────────────────────────────────────

function TrafficBreakdown({ sessions }: { sessions: AdSession[] }) {
  const total = sessions.length;
  if (total === 0) return null;

  const adCount = sessions.filter(s => s.isGoogleAdTraffic).length;
  const organicCount = total - adCount;
  const convertedCount = sessions.filter(s => !!s.bookingId).length;

  const sources = [
    { label: 'Google Ads', count: adCount, pct: (adCount / total * 100), color: 'from-blue-500 to-blue-400', dotColor: 'bg-blue-400' },
    { label: 'Organic / Direct', count: organicCount, pct: (organicCount / total * 100), color: 'from-white/20 to-white/10', dotColor: 'bg-white/40' },
    { label: 'Converted', count: convertedCount, pct: (convertedCount / total * 100), color: 'from-emerald-500 to-emerald-400', dotColor: 'bg-emerald-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
          <Layers size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Traffic Sources</h3>
          <p className="text-[10px] text-white/25 font-medium">Breakdown by origin</p>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="h-3 rounded-full bg-white/[0.03] overflow-hidden flex">
        {sources.map((src, i) => (
          <motion.div
            key={src.label}
            initial={{ width: 0 }}
            animate={{ width: `${src.pct}%` }}
            transition={{ duration: 1, delay: 0.4 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full bg-gradient-to-r ${src.color} ${i > 0 ? 'border-l border-[#0A0A0A]' : ''}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {sources.map(src => (
          <div key={src.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${src.dotColor}`} />
              <span className="text-xs font-bold text-white/50">{src.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-white tabular-nums">{src.count}</span>
              <span className="text-[10px] text-white/20 font-bold w-10 text-right tabular-nums">{src.pct.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Funnel Chart (Redesigned) ────────────────────────────────────────────────

function FunnelChart({ sessions }: { sessions: AdSession[] }) {
  const total = sessions.length;
  if (total === 0) return null;

  const stepCounts = FUNNEL_STEPS.map(step => ({
    ...step,
    count: sessions.filter(s => {
      const furthest = getFurthestStep(s.events || []);
      return furthest.order >= step.order;
    }).length,
  }));

  const funnelGradients = [
    'from-white/20 to-white/10',
    'from-amber-500/80 to-amber-400/60',
    'from-amber-500/80 to-amber-400/60',
    'from-blue-500/80 to-blue-400/60',
    'from-blue-500/80 to-blue-400/60',
    'from-emerald-500/80 to-emerald-400/60',
  ];

  const funnelTextColors = [
    'text-white/40',
    'text-amber-400',
    'text-amber-400',
    'text-blue-400',
    'text-blue-400',
    'text-emerald-400',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange">
          <BarChart3 size={18} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Booking Funnel</h3>
          <p className="text-[10px] text-white/25 font-medium">How far visitors progress through your booking flow</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
          <Activity size={12} className="text-brand-orange" />
          <span className="text-[10px] font-bold text-white/40">{total} visitors</span>
        </div>
      </div>
      <div className="space-y-3">
        {stepCounts.map((step, i) => {
          const pct = total > 0 ? (step.count / total) * 100 : 0;
          const dropOff = i > 0 ? stepCounts[i - 1].count - step.count : 0;
          const dropPct = i > 0 && stepCounts[i - 1].count > 0
            ? ((dropOff / stepCounts[i - 1].count) * 100).toFixed(0)
            : '0';

          const gradientIdx = Math.min(i, funnelGradients.length - 1);

          return (
            <div key={step.key} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-md ${
                    i === stepCounts.length - 1
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/[0.04] text-white/20 border border-white/[0.06]'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">{step.label}</span>
                  {dropOff > 0 && (
                    <span className="text-[9px] text-red-400/70 font-bold flex items-center gap-0.5">
                      <TrendingDown size={10} />
                      -{dropOff} ({dropPct}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-black tabular-nums ${funnelTextColors[gradientIdx]}`}>{step.count}</span>
                  <span className="text-[10px] text-white/20 w-11 text-right tabular-nums font-bold">{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-2.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.03]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full bg-gradient-to-r ${funnelGradients[gradientIdx]} relative overflow-hidden`}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent animate-[shimmer_3s_ease-in-out_infinite]" style={{ animationDelay: `${i * 200}ms` }} />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Session Timeline Modal ───────────────────────────────────────────────────

function SessionTimeline({
  session,
  onClose,
}: {
  session: AdSession;
  onClose: () => void;
}) {
  const furthest = getFurthestStep(session.events || []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] max-h-[90vh] flex flex-col"
      >
        {/* Header with gradient accent */}
        <div className="relative p-6 border-b border-white/[0.06] flex items-start justify-between">
          {/* Top accent gradient */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${session.isGoogleAdTraffic ? 'from-blue-500 via-blue-400 to-cyan-400' : 'from-white/20 via-white/10 to-transparent'}`} />
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-sm ${session.isGoogleAdTraffic ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-white/30 border-white/[0.08]'}`}>
                {session.isGoogleAdTraffic ? '📊 Google Ad Traffic' : '🔗 Organic / Direct'}
              </div>
              {session.bookingId && (
                <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  ✓ Converted
                </div>
              )}
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Session Timeline</h2>
            <p className="text-[10px] text-white/20 font-mono mt-1.5 select-all">{session.sessionId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">
          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'GCLID', value: session.gclid || 'None (organic)', mono: true, highlight: true },
              { label: 'Landing Page', value: session.landingPage, mono: false },
              { label: 'First Seen', value: formatDate(session.landingTime), mono: false },
              { label: 'Browser', value: getBrowserFromUA(session.userAgent), mono: false },
              { label: 'Referrer', value: session.referrer || 'Direct', mono: false, truncate: true },
              { label: 'Furthest Step', value: furthest.label, mono: false, badge: true, badgeOrder: furthest.order },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-2 hover:border-white/[0.08] transition-colors">
                <p className="text-[9px] font-black text-white/15 uppercase tracking-widest">{item.label}</p>
                {item.badge ? (
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border inline-block ${getFunnelColor(item.badgeOrder!)}`}>{item.value}</span>
                ) : (
                  <p className={`text-xs font-bold ${item.truncate ? 'truncate' : 'break-all'} ${item.mono ? 'font-mono' : ''} ${item.highlight ? 'text-brand-orange' : 'text-white/80'}`}>{item.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Booking linkage */}
          {session.bookingId && (
            <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Booking Linked</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] text-white/20 font-bold uppercase mb-1">Booking ID</p>
                  <p className="text-xs font-mono text-white font-bold">#{session.bookingId.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/20 font-bold uppercase mb-1">Service</p>
                  <p className="text-xs font-bold text-white">{session.bookingService}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/20 font-bold uppercase mb-1">Amount</p>
                  <p className="text-xs font-black text-brand-orange">AED {session.bookingAmount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  session.bookingStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  session.bookingStatus === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-white/5 text-white/30 border-white/10'
                }`}>
                  {session.bookingStatus}
                </div>
                {session.conversionSentToGads && (
                  <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/20">
                    📡 Sent to Google Ads
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Event Timeline */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Event Log</p>
              <span className="text-[10px] font-bold text-white/15 bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-lg">
                {session.events?.length || 0} events
              </span>
            </div>
            {!session.events?.length ? (
              <div className="text-center py-8 border border-dashed border-white/[0.06] rounded-xl">
                <Clock size={20} className="text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/15 italic font-medium">No events recorded yet.</p>
              </div>
            ) : (
              <div className="relative pl-7 space-y-3">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-brand-orange/40 via-white/10 to-transparent" />
                {[...session.events].sort((a, b) =>
                  new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime()
                ).map((event, i) => {
                  const step = FUNNEL_STEPS.find(s => s.key === event.name);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative"
                    >
                      <div className="absolute -left-[1.15rem] w-2.5 h-2.5 rounded-full bg-brand-orange border-[2.5px] border-[#0A0A0A] mt-3 shadow-[0_0_8px_rgba(246,150,33,0.3)]" />
                      <div className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-black text-white/80 uppercase tracking-wider">{event.name.replace(/_/g, ' ')}</p>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {Object.entries(event.metadata).map(([k, v]) => (
                                  <span key={k} className="text-[8px] font-bold text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.04]">
                                    {k}: {String(v).slice(0, 30)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-white/15 shrink-0 font-mono">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Session Row Component ────────────────────────────────────────────────────

function SessionRow({
  session,
  idx,
  isExpanded,
  onToggleExpand,
  onViewTimeline,
}: {
  session: AdSession;
  idx: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewTimeline: () => void;
}) {
  const furthest = getFurthestStep(session.events || []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(idx * 0.015, 0.3) }}
      className="group hover:bg-white/[0.015] transition-all duration-300"
    >
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
        {/* Ad indicator with pulse */}
        <div className="shrink-0">
          {session.isGoogleAdTraffic ? (
            <div className="relative w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
              <Target size={15} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/20">
              <MousePointer size={15} />
            </div>
          )}
        </div>

        {/* GCLID */}
        <div className="flex-1 min-w-[120px]">
          <p className="text-[8px] font-black text-white/15 uppercase tracking-widest mb-0.5">GCLID</p>
          <p className="font-mono text-[11px] text-brand-orange font-bold">{maskGclid(session.gclid)}</p>
        </div>

        {/* Date */}
        <div className="hidden sm:block min-w-[100px]">
          <p className="text-[8px] font-black text-white/15 uppercase tracking-widest mb-0.5">Arrived</p>
          <p className="text-[11px] text-white/50 font-bold">{getTimeAgo(session.landingTime)}</p>
        </div>

        {/* Funnel step */}
        <div className="min-w-[100px]">
          <p className="text-[8px] font-black text-white/15 uppercase tracking-widest mb-1">Funnel Step</p>
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${getFunnelColor(furthest.order)}`}>
            {furthest.order >= 5 && <CheckCircle2 size={9} />}
            {furthest.label}
          </span>
        </div>

        {/* Booking */}
        <div className="hidden md:block min-w-[120px]">
          <p className="text-[8px] font-black text-white/15 uppercase tracking-widest mb-0.5">Booking</p>
          {session.bookingId ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-400">{session.bookingService?.slice(0, 18) || 'Booked'}</span>
            </div>
          ) : (
            <span className="text-[11px] text-white/15 font-bold">—</span>
          )}
        </div>

        {/* Amount */}
        <div className="hidden md:block min-w-[80px]">
          <p className="text-[8px] font-black text-white/15 uppercase tracking-widest mb-0.5">Amount</p>
          <p className={`text-[11px] font-black italic ${session.bookingAmount ? 'text-brand-orange' : 'text-white/15'}`}>
            {session.bookingAmount ? `AED ${session.bookingAmount}` : '—'}
          </p>
        </div>

        {/* Events count */}
        <div className="hidden lg:block">
          <p className="text-[8px] font-black text-white/15 uppercase tracking-widest mb-0.5">Events</p>
          <p className="text-[11px] font-bold text-white/40 tabular-nums">{(session.events || []).length}</p>
        </div>

        {/* Conv sent */}
        <div className="hidden lg:block min-w-[70px]">
          <p className="text-[8px] font-black text-white/15 uppercase tracking-widest mb-0.5">G-Ads</p>
          {session.conversionSentToGads ? (
            <div className="flex items-center gap-1.5">
              <Radio size={10} className="text-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-bold">Sent</span>
            </div>
          ) : (
            <span className="text-[9px] text-white/15 font-bold">—</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={onViewTimeline}
            className="p-2 hover:bg-white/[0.06] rounded-xl text-white/15 hover:text-white transition-all border border-transparent hover:border-white/[0.06]"
            title="View full timeline"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={onToggleExpand}
            className={`p-2 rounded-xl text-white/15 hover:text-white transition-all border border-transparent hover:border-white/[0.06] ${isExpanded ? 'bg-white/[0.06] text-white/40' : 'hover:bg-white/[0.06]'}`}
            title="Expand events"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Inline event preview */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            <div className="px-5 py-5 bg-white/[0.01] space-y-3">
              <p className="text-[9px] font-black text-white/15 uppercase tracking-widest mb-3">Event Trail</p>
              {(session.events || []).length === 0 ? (
                <p className="text-xs text-white/15 italic">No events recorded.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[...session.events]
                    .sort((a, b) => new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime())
                    .map((evt, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 hover:border-white/[0.12] transition-colors"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0 shadow-[0_0_6px_rgba(246,150,33,0.4)]" />
                        <span className="text-[9px] font-bold text-white/50">{evt.name.replace(/_/g, ' ')}</span>
                        {i < session.events.length - 1 && (
                          <ArrowRight size={8} className="text-white/10" />
                        )}
                      </motion.div>
                    ))}
                </div>
              )}
              {session.gclid && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <p className="text-[9px] font-black text-white/15 uppercase tracking-widest mb-1.5">Full GCLID</p>
                  <p className="font-mono text-[10px] text-brand-orange break-all select-all bg-brand-orange/[0.04] border border-brand-orange/10 rounded-lg px-3 py-2">{session.gclid}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdsTrackingPage() {
  const [sessions, setSessions] = useState<AdSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'ads' | 'converted'>('all');
  const [selectedSession, setSelectedSession] = useState<AdSession | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '1d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const col = collection(db, AD_TRACKING_COLLECTION);
      const q = query(col, orderBy('landingTime', 'desc'), limit(500));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ sessionId: d.id, ...d.data() })) as AdSession[];
      setSessions(data);
    } catch (err) {
      console.error('Error fetching ad sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSessions();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Filtering ──
  const now = Date.now();
  const dateMs = dateFilter === '1d' ? 86400000 : dateFilter === '7d' ? 604800000 : dateFilter === '30d' ? 2592000000 : Infinity;

  const filtered = useMemo(() => sessions.filter(s => {
    const landingMs = s.landingTime?.toDate ? s.landingTime.toDate().getTime() : new Date(s.landingTime || 0).getTime();
    if (now - landingMs > dateMs) return false;
    if (filterMode === 'ads' && !s.isGoogleAdTraffic) return false;
    if (filterMode === 'converted' && !s.bookingId) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const gc = (s.gclid || '').toLowerCase();
      const lp = (s.landingPage || '').toLowerCase();
      const svc = (s.bookingService || '').toLowerCase();
      const bid = (s.bookingId || '').toLowerCase();
      if (!gc.includes(term) && !lp.includes(term) && !svc.includes(term) && !bid.includes(term)) return false;
    }
    return true;
  }), [sessions, now, dateMs, filterMode, searchTerm]);

  // ── Stats ──
  const adSessions = filtered.filter(s => s.isGoogleAdTraffic);
  const converted = filtered.filter(s => !!s.bookingId);
  const adConverted = filtered.filter(s => s.isGoogleAdTraffic && !!s.bookingId);
  const totalRevenue = converted.reduce((sum, s) => sum + (s.bookingAmount || 0), 0);
  const adRevenue = adConverted.reduce((sum, s) => sum + (s.bookingAmount || 0), 0);
  const convRate = adSessions.length > 0 ? ((adConverted.length / adSessions.length) * 100).toFixed(1) : '0.0';
  const avgRevenue = adConverted.length > 0 ? (adRevenue / adConverted.length).toFixed(0) : '0';

  // ── CSV Export (Google Ads Offline Conversions format) ──
  const exportCSV = () => {
    const rows = [
      ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency', 'Order ID', 'Service', 'Status'],
      ...adConverted
        .filter(s => s.gclid && s.bookingId)
        .map(s => [
          s.gclid || '',
          'Mudwash Booking',
          formatDateForGads(s.landingTime),
          String(s.bookingAmount || s.conversionValue || 300),
          'AED',
          `#${(s.bookingId || '').slice(-8).toUpperCase()}`,
          s.bookingService || '',
          s.bookingStatus || 'Pending',
        ])
    ];

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mudwash-gads-conversions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Full export (all sessions) ──
  const exportAllCSV = () => {
    const rows = [
      ['Session ID', 'GCLID', 'Is Google Ad', 'Landing Page', 'Landing Time', 'Referrer', 'Furthest Step', 'Events Count', 'Booking ID', 'Service', 'Amount (AED)', 'Booking Status', 'Conversion Sent', 'Last Updated'],
      ...filtered.map(s => {
        const furthest = getFurthestStep(s.events || []);
        return [
          s.sessionId,
          s.gclid || '',
          s.isGoogleAdTraffic ? 'Yes' : 'No',
          s.landingPage,
          formatDateForGads(s.landingTime),
          s.referrer || 'direct',
          furthest.label,
          String((s.events || []).length),
          s.bookingId || '',
          s.bookingService || '',
          String(s.bookingAmount || ''),
          s.bookingStatus || '',
          s.conversionSentToGads ? 'Yes' : 'No',
          formatDateForGads(s.lastUpdated),
        ];
      })
    ];

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mudwash-all-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ──────────── Hero Header ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-6 sm:p-8"
      >
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 text-brand-orange border border-brand-orange/10">
                <Target size={22} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">Traffic Map</h1>
                <p className="text-white/25 text-xs font-medium mt-0.5">
                  Google Ads visitor tracking · GCLID capture · Conversion pipeline
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRefresh}
              className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white/30 hover:text-white hover:border-white/[0.15] transition-all"
              title="Refresh"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white/50 hover:text-white hover:border-white/[0.15] transition-all text-sm font-bold"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Google Ads CSV</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={exportAllCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-orange to-orange-500 text-black rounded-xl font-bold text-sm hover:shadow-[0_4px_24px_rgba(246,150,33,0.25)] transition-all"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Full Export</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ──────────── Stats Grid ──────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Sessions" value={filtered.length.toString()} sub="All visitors tracked" icon={Activity} gradient="bg-white/[0.05] text-white/50" delay={0} />
        <StatCard label="Google Ad Sessions" value={adSessions.length.toString()} sub={`${filtered.length > 0 ? ((adSessions.length / filtered.length) * 100).toFixed(0) : 0}% of total`} icon={Target} gradient="bg-blue-500/10 text-blue-400" delay={0.05} />
        <StatCard label="Conversions" value={adConverted.length.toString()} sub="Bookings from ads" icon={ShoppingCart} gradient="bg-emerald-500/10 text-emerald-400" delay={0.1} />
        <StatCard label="Conversion Rate" value={`${convRate}%`} sub="Ad traffic → booking" icon={Percent} gradient="bg-brand-orange/10 text-brand-orange" delay={0.15} />
        <StatCard label="Ad Revenue" value={`AED ${Number(adRevenue).toLocaleString()}`} sub={`Avg AED ${avgRevenue} / conv.`} icon={DollarSign} gradient="bg-purple-500/10 text-purple-400" delay={0.2} />
      </div>

      {/* ──────────── Funnel + Source Breakdown + Filters ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <FunnelChart sessions={filtered} />
          <TrafficBreakdown sessions={filtered} />
        </div>

        {/* Filter Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.05] text-white/30">
              <Filter size={16} />
            </div>
            <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Filters</h3>
          </div>

          {/* Date range */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Date Range</p>
            <div className="grid grid-cols-2 gap-2">
              {(['1d', '7d', '30d', 'all'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    dateFilter === d
                      ? 'bg-brand-orange border-brand-orange text-black shadow-[0_2px_16px_rgba(246,150,33,0.2)]'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white hover:border-white/[0.12]'
                  }`}
                >
                  {d === '1d' ? 'Today' : d === '7d' ? '7 Days' : d === '30d' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic type */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Traffic Type</p>
            <div className="space-y-1.5">
              {(['all', 'ads', 'converted'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-left flex items-center justify-between ${
                    filterMode === mode
                      ? 'bg-white/[0.06] border-white/[0.12] text-white'
                      : 'bg-white/[0.01] border-white/[0.04] text-white/25 hover:text-white/50 hover:border-white/[0.08]'
                  }`}
                >
                  <span>{mode === 'all' ? 'All Visitors' : mode === 'ads' ? 'Google Ad Traffic Only' : 'Converted (Booked)'}</span>
                  {filterMode === mode && (
                    <motion.div layoutId="filter-dot" className="w-2 h-2 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(246,150,33,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/[0.02] rounded-xl p-5 border border-white/[0.04] space-y-2">
            <p className="text-[9px] font-black text-white/15 uppercase tracking-widest">Showing</p>
            <p className="text-3xl font-black italic text-white tracking-tight">{filtered.length}</p>
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full bg-brand-orange/60 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: sessions.length > 0 ? `${(filtered.length / sessions.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <p className="text-[10px] text-white/20 font-bold shrink-0">of {sessions.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ──────────── Search bar ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative group"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15 group-focus-within:text-brand-orange transition-colors duration-300" size={18} />
        <input
          type="text"
          placeholder="Search by GCLID, landing page, service, booking ID…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/[0.06] rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10 transition-all duration-300"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </motion.div>

      {/* ──────────── Sessions table ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/[0.03] text-white/30">
              <Layers size={16} />
            </div>
            <h3 className="font-black text-white italic uppercase tracking-tight">Session Log</h3>
          </div>
          <span className="text-[10px] font-bold text-white/20 bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-lg tracking-widest uppercase">{filtered.length} sessions</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-brand-orange/20 rounded-full" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Loading sessions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
              <Search size={24} className="text-white/10" />
            </div>
            <div>
              <p className="text-white/20 text-xs font-black uppercase tracking-widest">No sessions found</p>
              <p className="text-white/10 text-[10px] mt-1">Sessions appear here when visitors arrive from Google Ads</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filtered.map((session, idx) => (
              <SessionRow
                key={session.sessionId}
                session={session}
                idx={idx}
                isExpanded={expandedRows.has(session.sessionId)}
                onToggleExpand={() => setExpandedRows(prev => {
                  const next = new Set(prev);
                  if (next.has(session.sessionId)) next.delete(session.sessionId);
                  else next.add(session.sessionId);
                  return next;
                })}
                onViewTimeline={() => setSelectedSession(session)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* ──────────── CSV info banner ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-6 flex items-start gap-4"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/[0.03] rounded-full blur-[80px] pointer-events-none" />
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
          <Download size={18} />
        </div>
        <div className="relative">
          <p className="text-sm font-black text-white uppercase italic tracking-tight">Uploading to Google Ads</p>
          <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed">
            Click <strong className="text-white/70">{"\"Google Ads CSV\""}</strong> to download a file formatted for Google Ads offline conversions.
            Upload it in <strong className="text-white/70">Google Ads → Tools → Conversions → Upload → select your conversion action</strong>.
            Only rows with a GCLID + Booking ID will be included. Do this weekly for best attribution.
          </p>
        </div>
      </motion.div>

      {/* ──────────── Session Timeline Modal ──────────── */}
      <AnimatePresence>
        {selectedSession && (
          <SessionTimeline
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        )}
      </AnimatePresence>

      {/* ──────────── Shimmer keyframe (inline style) ──────────── */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
