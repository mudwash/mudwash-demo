'use client';

/**
 * TrackingContext.tsx
 *
 * Provides a React context that:
 * - Captures GCLID + session ID on mount (localStorage only, zero Firestore cost)
 * - Fires a `page_landed` event 500ms after mount — this creates the Firestore
 *   adTracking document for every real visitor, including those who bounce.
 * - Exposes `useTracking()` hook to any component that needs to call trackEvent()
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import {
  captureGclid,
  trackEvent as _trackEvent,
  getOrCreateSessionId,
} from './adTracking';

// ─── Context ─────────────────────────────────────────────────────────────────

interface TrackingContextValue {
  trackEvent: (eventName: string, metadata?: Record<string, any>) => void;
  sessionId: string;
  gclid: string | null;
}

const TrackingContext = createContext<TrackingContextValue>({
  trackEvent: () => {},
  sessionId: '',
  gclid: null,
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const gclidRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    // Run only client-side, once on mount
    const gclid = captureGclid();
    gclidRef.current = gclid;

    // getOrCreateSessionId is synchronous — reads from localStorage or generates a new UUID
    sessionIdRef.current = getOrCreateSessionId();

    // Fire page_landed after a short delay so it doesn't block rendering.
    // This is what actually creates the Firestore document — without it, documents
    // only appear when the user clicks something (bounced visitors stay invisible).
    const timer = setTimeout(() => {
      _trackEvent('page_landed', {
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
        referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
        gclid: gclid || 'none',
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const trackEvent = useCallback(
    (eventName: string, metadata?: Record<string, any>) => {
      _trackEvent(eventName, metadata);
    },
    []
  );

  const value: TrackingContextValue = {
    trackEvent,
    get sessionId() {
      return sessionIdRef.current || getOrCreateSessionId();
    },
    get gclid() {
      return gclidRef.current;
    },
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTracking(): TrackingContextValue {
  return useContext(TrackingContext);
}
