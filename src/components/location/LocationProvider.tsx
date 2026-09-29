'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { distanceMeters, type LatLng } from '@/lib/geo';

export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'paused';

interface LocationContextValue {
  position: LatLng | null;
  status: LocationStatus;
  /** Ask the browser for the position (shows the native permission prompt when needed). */
  locate: () => void;
  /** Stop using the position for this session. */
  pause: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

const PAUSED_KEY = 'medellinbot:location-paused';
/** Short delay so the native prompt does not compete with the first paint. */
const AUTO_PROMPT_DELAY_MS = 900;

function readPaused(): boolean {
  try {
    return window.sessionStorage.getItem(PAUSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writePaused(value: boolean) {
  try {
    if (value) window.sessionStorage.setItem(PAUSED_KEY, '1');
    else window.sessionStorage.removeItem(PAUSED_KEY);
  } catch {
    // Storage unavailable: the preference simply is not remembered.
  }
}

/**
 * App-wide geolocation. On the first visit it asks for permission automatically;
 * if permission was already granted it locates silently, and if it was denied it never nags.
 */
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const watchId = useRef<number | null>(null);

  const stopWatching = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  };

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    writePaused(false);
    setStatus('locating');
    stopWatching();
    // watchPosition keeps distances right while the person walks to the place.
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        // Ignore GPS jitter so lists and the map don't re-sort on every tiny update.
        setPosition((prev) => (prev && distanceMeters(prev, next) < 30 ? prev : next));
        setStatus('granted');
      },
      (error) => {
        stopWatching();
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 2 * 60 * 1000 },
    );
  }, []);

  const pause = useCallback(() => {
    stopWatching();
    writePaused(true);
    setPosition(null);
    setStatus('paused');
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- capability is only known in the browser
      setStatus('unavailable');
      return;
    }
    if (readPaused()) {
      setStatus('paused');
      return;
    }

    let cancelled = false;
    let permission: PermissionStatus | null = null;
    const onPermissionChange = () => {
      if (permission?.state === 'granted') locate();
      if (permission?.state === 'denied') setStatus('denied');
    };

    const timer = window.setTimeout(async () => {
      try {
        permission = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
        if (cancelled) return;
        if (permission?.state === 'denied') {
          setStatus('denied');
        } else {
          locate();
        }
        permission?.addEventListener('change', onPermissionChange);
      } catch {
        // Safari < 16 has no Permissions API for geolocation: just ask.
        if (!cancelled) locate();
      }
    }, AUTO_PROMPT_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      permission?.removeEventListener('change', onPermissionChange);
      stopWatching();
    };
  }, [locate]);

  const value = useMemo(() => ({ position, status, locate, pause }), [position, status, locate, pause]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used inside <LocationProvider>');
  return context;
}
