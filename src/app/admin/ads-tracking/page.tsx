'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, MousePointer, ShoppingCart, DollarSign, Percent,
  Download, RefreshCw, Filter, ChevronDown, ChevronUp, ExternalLink,
  Clock, CheckCircle2, XCircle, AlertCircle, Target, Zap,
  BarChart3, Search, Eye, X, Calendar, Activity
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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, delay = 0
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black italic tracking-tighter text-white">{value}</p>
        {sub && <p className="text-[10px] text-white/30 mt-0.5 font-medium">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Funnel Bar ───────────────────────────────────────────────────────────────

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

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange">
          <BarChart3 size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Booking Funnel</h3>
          <p className="text-[10px] text-white/30 font-medium">How far visitors progress through your booking flow</p>
        </div>
      </div>
      <div className="space-y-3">
        {stepCounts.map((step, i) => {
          const pct = total > 0 ? (step.count / total) * 100 : 0;
          const prevPct = i > 0 ? (stepCounts[i - 1].count / total) * 100 : 100;
          const dropOff = i > 0 ? stepCounts[i - 1].count - step.count : 0;
          return (
            <div key={step.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-white/20 w-4">{i + 1}</span>
                  <span className="text-xs font-bold text-white/70">{step.label}</span>
                  {dropOff > 0 && (
                    <span className="text-[9px] text-red-400 font-bold">-{dropOff} dropped</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{step.count}</span>
                  <span className="text-[10px] text-white/30 w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: step.order >= 5
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : step.order >= 3
                        ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                        : step.order >= 1
                          ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          : 'rgba(255,255,255,0.1)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${session.isGoogleAdTraffic ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                {session.isGoogleAdTraffic ? '📊 Google Ad Traffic' : '🔗 Organic / Direct'}
              </div>
              {session.bookingId && (
                <div className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  ✓ Converted
                </div>
              )}
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Session Timeline</h2>
            <p className="text-[10px] text-white/30 font-mono mt-1">{session.sessionId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">GCLID</p>
              <p className="font-mono text-xs text-brand-orange break-all">{session.gclid || 'None (organic)'}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Landing Page</p>
              <p className="text-xs text-white font-bold break-all">{session.landingPage}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">First Seen</p>
              <p className="text-xs text-white font-bold">{formatDate(session.landingTime)}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Browser</p>
              <p className="text-xs text-white font-bold">{getBrowserFromUA(session.userAgent)}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Referrer</p>
              <p className="text-xs text-white font-bold truncate">{session.referrer || 'Direct'}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Furthest Step</p>
              <p className={`text-xs font-black px-2 py-1 rounded-full border inline-block ${getFunnelColor(furthest.order)}`}>{furthest.label}</p>
            </div>
          </div>

          {/* Booking linkage */}
          {session.bookingId && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">✓ Booking Linked</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] text-white/30 font-bold uppercase">Booking ID</p>
                  <p className="text-xs font-mono text-white">#{session.bookingId.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 font-bold uppercase">Service</p>
                  <p className="text-xs font-bold text-white">{session.bookingService}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 font-bold uppercase">Amount</p>
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
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Event Log ({session.events?.length || 0} events)</p>
            {!session.events?.length ? (
              <p className="text-sm text-white/20 italic">No events recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2.5 top-0 bottom-0 w-px bg-white/10" />
                {[...session.events].sort((a, b) =>
                  new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime()
                ).map((event, i) => {
                  const step = FUNNEL_STEPS.find(s => s.key === event.name);
                  return (
                    <div key={i} className="relative">
                      <div className="absolute -left-[1.1rem] w-2 h-2 rounded-full bg-brand-orange border-2 border-[#0A0A0A] mt-1" />
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-wider">{event.name.replace(/_/g, ' ')}</p>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {Object.entries(event.metadata).map(([k, v]) => (
                                  <span key={k} className="text-[8px] font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                                    {k}: {String(v).slice(0, 30)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-white/20 shrink-0 font-mono">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdsTrackingPage() {
  const [sessions, setSessions] = useState<AdSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'ads' | 'converted'>('all');
  const [selectedSession, setSelectedSession] = useState<AdSession | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '1d'>('30d');

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

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Filtering ──
  const now = Date.now();
  const dateMs = dateFilter === '1d' ? 86400000 : dateFilter === '7d' ? 604800000 : dateFilter === '30d' ? 2592000000 : Infinity;

  const filtered = sessions.filter(s => {
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
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange">
              <Target size={20} />
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Ads Tracking</h1>
          </div>
          <p className="text-white/40 text-sm font-medium ml-11">
            Google Ads visitor tracking · GCLID capture · Conversion pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            className="p-2.5 bg-[#0A0A0A] border border-white/5 rounded-xl text-white/40 hover:text-white hover:border-white/20 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0A0A0A] border border-white/5 rounded-xl text-white/60 hover:text-white hover:border-white/20 transition-all text-sm font-bold"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Google Ads CSV</span>
          </button>
          <button
            onClick={exportAllCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-black rounded-xl font-bold text-sm hover:bg-white transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Full Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Sessions" value={filtered.length.toString()} sub="All visitors tracked" icon={Activity} color="bg-white/5 text-white/40" delay={0} />
        <StatCard label="Google Ad Sessions" value={adSessions.length.toString()} sub={`${filtered.length > 0 ? ((adSessions.length / filtered.length) * 100).toFixed(0) : 0}% of total`} icon={Target} color="bg-blue-500/10 text-blue-400" delay={0.05} />
        <StatCard label="Conversions" value={adConverted.length.toString()} sub="Bookings from ads" icon={ShoppingCart} color="bg-emerald-500/10 text-emerald-400" delay={0.1} />
        <StatCard label="Conversion Rate" value={`${convRate}%`} sub="Ad traffic → booking" icon={Percent} color="bg-brand-orange/10 text-brand-orange" delay={0.15} />
        <StatCard label="Ad Revenue" value={`AED ${adRevenue.toLocaleString()}`} sub={`Avg AED ${avgRevenue} / conv.`} icon={DollarSign} color="bg-purple-500/10 text-purple-400" delay={0.2} />
      </div>

      {/* Funnel + Filters row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelChart sessions={filtered} />
        </div>

        {/* Filter Panel */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Filters</h3>

          {/* Date range */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Date Range</p>
            <div className="grid grid-cols-2 gap-2">
              {(['1d', '7d', '30d', 'all'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                    dateFilter === d
                      ? 'bg-brand-orange border-brand-orange text-black'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                  }`}
                >
                  {d === '1d' ? 'Today' : d === '7d' ? '7 Days' : d === '30d' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic type */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Traffic Type</p>
            <div className="space-y-1.5">
              {(['all', 'ads', 'converted'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-left flex items-center justify-between ${
                    filterMode === mode
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/60'
                  }`}
                >
                  <span>{mode === 'all' ? 'All Visitors' : mode === 'ads' ? 'Google Ad Traffic Only' : 'Converted (Booked)'}</span>
                  {filterMode === mode && <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 space-y-2">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Showing</p>
            <p className="text-2xl font-black italic text-white">{filtered.length}</p>
            <p className="text-[10px] text-white/30">of {sessions.length} total sessions</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search by GCLID, landing page, service, booking ID…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-all"
        />
      </div>

      {/* Sessions table */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-black text-white italic uppercase tracking-tight">Session Log</h3>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{filtered.length} sessions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-white/20 text-xs font-black uppercase tracking-widest">No sessions found</p>
            <p className="text-white/10 text-[10px]">Sessions appear here when visitors arrive from Google Ads</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((session, idx) => {
              const furthest = getFurthestStep(session.events || []);
              const isExpanded = expandedRows.has(session.sessionId);
              const landingDate = session.landingTime?.toDate ? session.landingTime.toDate() : new Date(session.landingTime || 0);

              return (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                    {/* Ad indicator */}
                    <div className="shrink-0">
                      {session.isGoogleAdTraffic ? (
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Target size={14} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                          <MousePointer size={14} />
                        </div>
                      )}
                    </div>

                    {/* GCLID */}
                    <div className="flex-1 min-w-[120px]">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">GCLID</p>
                      <p className="font-mono text-[10px] text-brand-orange font-bold">{maskGclid(session.gclid)}</p>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:block">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Arrived</p>
                      <p className="text-[10px] text-white/60 font-bold">{formatDate(session.landingTime)}</p>
                    </div>

                    {/* Funnel step */}
                    <div>
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Funnel Step</p>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${getFunnelColor(furthest.order)}`}>
                        {furthest.label}
                      </span>
                    </div>

                    {/* Booking */}
                    <div className="hidden md:block">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Booking</p>
                      {session.bookingId ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400">{session.bookingService?.slice(0, 18) || 'Booked'}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/20 font-bold">—</span>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="hidden md:block">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Amount</p>
                      <p className="text-[10px] font-black italic text-brand-orange">
                        {session.bookingAmount ? `AED ${session.bookingAmount}` : '—'}
                      </p>
                    </div>

                    {/* Events count */}
                    <div className="hidden lg:block">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Events</p>
                      <p className="text-[10px] font-bold text-white/50">{(session.events || []).length}</p>
                    </div>

                    {/* Conv sent */}
                    <div className="hidden lg:block">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">G-Ads Conv</p>
                      {session.conversionSentToGads ? (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] text-emerald-400 font-bold">Sent</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-white/20 font-bold">—</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
                        title="View full timeline"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setExpandedRows(prev => {
                          const next = new Set(prev);
                          if (next.has(session.sessionId)) next.delete(session.sessionId);
                          else next.add(session.sessionId);
                          return next;
                        })}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
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
                        className="overflow-hidden border-t border-white/5"
                      >
                        <div className="px-5 py-4 bg-white/[0.01] space-y-2">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Event Trail</p>
                          {(session.events || []).length === 0 ? (
                            <p className="text-xs text-white/20 italic">No events recorded.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {[...session.events]
                                .sort((a, b) => new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime())
                                .map((evt, i) => (
                                  <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                                    <div className="w-1 h-1 rounded-full bg-brand-orange shrink-0" />
                                    <span className="text-[9px] font-bold text-white/60">{evt.name.replace(/_/g, ' ')}</span>
                                    <span className="text-[8px] text-white/20 font-mono">{formatDate(evt.timestamp)}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                          {session.gclid && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Full GCLID</p>
                              <p className="font-mono text-[10px] text-brand-orange break-all">{session.gclid}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSV info banner */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
          <Download size={18} />
        </div>
        <div>
          <p className="text-sm font-black text-white uppercase italic tracking-tight">Uploading to Google Ads</p>
          <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
            Click <strong className="text-white">"Google Ads CSV"</strong> to download a file formatted for Google Ads offline conversions.
            Upload it in <strong className="text-white">Google Ads → Tools → Conversions → Upload → select your conversion action</strong>.
            Only rows with a GCLID + Booking ID will be included. Do this weekly for best attribution.
          </p>
        </div>
      </div>

      {/* Session Timeline Modal */}
      <AnimatePresence>
        {selectedSession && (
          <SessionTimeline
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
