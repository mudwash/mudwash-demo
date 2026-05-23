/**
 * adTracking.ts — Mudwash Google Ads Advanced Sales Tracking Engine
 *
 * Key design principle:
 *  - GCLID + sessionId are captured on page load into localStorage (zero Firestore cost)
 *  - The Firestore adTracking document is created LAZILY on the FIRST user button click
 *  - Every subsequent click appends to the events array
 *  - This avoids Firestore read permission issues and prevents empty sessions for bounced visitors
 */

import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Constants ───────────────────────────────────────────────────────────────

export const AD_TRACKING_COLLECTION = 'adTracking';
export const GCLID_STORAGE_KEY      = 'mudwash_gclid';
export const SESSION_ID_KEY         = 'mudwash_session_id';

const GCLID_COOKIE_NAME   = 'mudwash_gclid';
const COOKIE_EXPIRY_DAYS  = 30;

const GADS_CONVERSION_ID    = process.env.NEXT_PUBLIC_GADS_CONVERSION_ID    || 'AW-17073511250';
const GADS_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GADS_CONVERSION_LABEL || 'NK8RCOP-lPIaENK2pM0_';

// ─── Module-level state (resets on every page load) ──────────────────────────



// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrackingEvent {
  name: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AdTrackingSession {
  sessionId: string;
  gclid: string | null;
  isGoogleAdTraffic: boolean;
  landingPage: string;
  landingTime: Date;
  userAgent: string;
  referrer: string;
  events: TrackingEvent[];
  bookingId?: string;
  bookingAmount?: number;
  bookingService?: string;
  bookingStatus?: string;
  conversionSentToGads: boolean;
  conversionValue?: number;
  lastUpdated: Date;
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// ─── UUID generator ───────────────────────────────────────────────────────────

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── GCLID Capture (runs on page load — no Firestore) ────────────────────────

/**
 * Reads gclid / wbraid / gbraid from URL params on landing.
 * Persists in localStorage + 30-day cookie for cross-page attribution.
 * CALL THIS ON PAGE LOAD (layout.tsx). Zero Firestore cost.
 */
export function captureGclid(): string | null {
  if (typeof window === 'undefined') return null;

  const params        = new URLSearchParams(window.location.search);
  const gclidFromUrl  = params.get('gclid') || params.get('wbraid') || params.get('gbraid');

  if (gclidFromUrl) {
    localStorage.setItem(GCLID_STORAGE_KEY, gclidFromUrl);
    setCookie(GCLID_COOKIE_NAME, gclidFromUrl, COOKIE_EXPIRY_DAYS);
    return gclidFromUrl;
  }

  const fromStorage = localStorage.getItem(GCLID_STORAGE_KEY);
  if (fromStorage) return fromStorage;

  const fromCookie = getCookie(GCLID_COOKIE_NAME);
  if (fromCookie) {
    localStorage.setItem(GCLID_STORAGE_KEY, fromCookie);
    return fromCookie;
  }

  return null;
}

// ─── Session ID Management (runs on page load — no Firestore) ────────────────

/**
 * Returns the persistent sessionId for this visitor.
 * Lives in localStorage so it survives page refreshes.
 * A NEW id is generated only when the user has never visited before.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  const stored = localStorage.getItem(SESSION_ID_KEY);
  if (stored) return stored;

  const newId = generateSessionId();
  localStorage.setItem(SESSION_ID_KEY, newId);
  return newId;
}

// ─── Core Event Tracking (self-initializing — FIRST CLICK creates Firestore doc) ──

/**
 * Records a named event into the visitor's adTracking Firestore document.
 *
 * HOW IT WORKS:
 * 1. On the VERY FIRST call (first button click by the user):
 *    - Builds the full session metadata (gclid, landingPage, userAgent, etc.)
 *    - Creates the Firestore document via setDoc + merge:true (safe for returning visitors)
 *    - Adds the event via arrayUnion
 * 2. On every subsequent call:
 *    - Just appends the new event via updateDoc + arrayUnion (cheaper write)
 *
 * Uses setDoc(merge:true) so NO READ is ever needed — eliminates the
 * Firestore permission error that prevented document creation.
 *
 * @param eventName - e.g. 'service_card_clicked', 'book_modal_opened', 'booking_submitted'
 * @param metadata  - any key/value payload (service name, vehicle, amount, bookingId…)
 */
export async function trackEvent(
  eventName: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  const event: TrackingEvent = {
    name:      eventName,
    timestamp: new Date(),
    metadata:  metadata || {},
  };

  const sessionRef = doc(db, AD_TRACKING_COLLECTION, sessionId);
  const gclid = captureGclid();

  try {
    // Always use setDoc + merge:true (upsert) for EVERY event.
    // Using updateDoc for subsequent events caused a race condition:
    // if a user clicked before the first setDoc committed to Firestore,
    // updateDoc threw "No document to update" and silently dropped the event.
    // setDoc+merge is always safe — creates the doc if missing, merges if existing.
    // arrayUnion appends the event without overwriting existing events.
    await setDoc(
      sessionRef,
      {
        sessionId,
        gclid:                gclid || null,
        isGoogleAdTraffic:    !!gclid,
        landingPage:          window.location.pathname + window.location.search,
        landingTime:          new Date(),
        userAgent:            navigator.userAgent,
        referrer:             document.referrer || 'direct',
        conversionSentToGads: false,
        events:               arrayUnion(event),
        lastUpdated:          new Date(),
        lastEventName:        eventName,
        lastEventTime:        new Date(),
      },
      { merge: true }
    );

    console.info('[AdTracking] ✅ Event tracked:', eventName, '| Session:', sessionId, '| GCLID:', gclid || 'none');
  } catch (err: any) {
    console.warn('[AdTracking] ⚠️ Failed to track event:', eventName, err?.message || err);
  }
}

// ─── Booking Linkage ─────────────────────────────────────────────────────────

/**
 * Links a completed booking to this tracking session.
 * Called after createBooking() succeeds and returns a bookingId.
 */
export async function linkBookingToSession(
  bookingId: string,
  bookingData: {
    service: string;
    amount: string;
    status?: string;
  }
): Promise<void> {
  if (typeof window === 'undefined') return;

  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  const amountNum = parseFloat(bookingData.amount.replace(/[^0-9.]/g, '')) || 0;
  const sessionRef = doc(db, AD_TRACKING_COLLECTION, sessionId);

  try {
    // Use setDoc + merge in case the session doc was somehow never written
    await setDoc(sessionRef, {
      bookingId,
      bookingAmount:  amountNum,
      bookingService: bookingData.service,
      bookingStatus:  bookingData.status || 'Pending',
      lastUpdated:    new Date(),
    }, { merge: true });

    console.info('[AdTracking] 🔗 Booking linked:', bookingId);
  } catch (err) {
    console.warn('[AdTracking] Failed to link booking to session:', err);
  }
}

// ─── Google Ads Conversion Firing ────────────────────────────────────────────

/**
 * Fires a Google Ads conversion event via the gtag pixel.
 * Called on booking submission (client) and optionally again when
 * admin marks booking Completed (server-confirmed offline conversion).
 */
export function fireGadsConversion(conversionValue: number, transactionId?: string): void {
  if (typeof window === 'undefined') return;
  const win = window as any;

  if (typeof win.gtag !== 'function') {
    console.warn('[AdTracking] gtag not available — conversion NOT fired. Is the Google Ads script loaded?');
    return;
  }

  const params: Record<string, any> = {
    send_to:  `${GADS_CONVERSION_ID}/${GADS_CONVERSION_LABEL}`,
    value:    conversionValue,
    currency: 'AED',
  };
  if (transactionId) params.transaction_id = transactionId;

  win.gtag('event', 'conversion', params);
  console.info('[AdTracking] 📡 Google Ads conversion fired:', params);
}

/**
 * Records in Firestore that the Google Ads conversion was sent.
 */
export async function markConversionSent(conversionValue: number): Promise<void> {
  if (typeof window === 'undefined') return;
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  const sessionRef = doc(db, AD_TRACKING_COLLECTION, sessionId);
  try {
    await setDoc(sessionRef, {
      conversionSentToGads: true,
      conversionValue,
      lastUpdated: new Date(),
    }, { merge: true });
  } catch (err) {
    console.warn('[AdTracking] Failed to mark conversion sent:', err);
  }
}

// ─── Admin: sync booking status back to adTracking ───────────────────────────

/**
 * Called from admin bookings panel when booking status changes.
 * Updates the linked adTracking session so the dashboard stays in sync.
 */
export async function updateSessionBookingStatus(
  sessionId: string,
  newStatus: string,
  paidAmount?: number
): Promise<void> {
  const sessionRef = doc(db, AD_TRACKING_COLLECTION, sessionId);
  try {
    const updates: Record<string, any> = {
      bookingStatus: newStatus,
      lastUpdated:   new Date(),
    };
    if (paidAmount !== undefined) updates.conversionValue = paidAmount;
    await updateDoc(sessionRef, updates);
  } catch (err) {
    console.warn('[AdTracking] Failed to update session booking status:', err);
  }
}

// ─── Funnel Step Definitions ──────────────────────────────────────────────────

export const FUNNEL_STEPS = [
  { key: 'page_landed',              label: 'Landed',            order: 0 },
  { key: 'service_card_clicked',     label: 'Browsed Service',   order: 1 },
  { key: 'hero_service_chip_clicked',label: 'Clicked Service',   order: 1 },
  { key: 'hero_book_now_clicked',    label: 'Clicked Book Now',  order: 1 },
  { key: 'book_modal_opened',        label: 'Opened Booking',    order: 2 },
  { key: 'step_1_vehicle_selected',  label: 'Step 1 — Vehicle',  order: 3 },
  { key: 'step_2_schedule_selected', label: 'Step 2 — Schedule', order: 4 },
  { key: 'booking_submitted',        label: 'Booking Placed',    order: 5 },
];

export function getFurthestStep(events: TrackingEvent[]): { label: string; order: number } {
  let furthest = { label: 'Landed', order: 0 };
  for (const event of events) {
    const step = FUNNEL_STEPS.find((s) => s.key === event.name);
    if (step && step.order > furthest.order) {
      furthest = { label: step.label, order: step.order };
    }
  }
  return furthest;
}
