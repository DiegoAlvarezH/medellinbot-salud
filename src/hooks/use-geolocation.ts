'use client';

import { useCallback, useState } from 'react';
import type { LatLng } from '@/lib/geo';

type Status = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable';

/** On-demand browser geolocation. Nothing is requested until `locate()` is called. */
export function useGeolocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus('granted');
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const clear = useCallback(() => {
    setPosition(null);
    setStatus('idle');
  }, []);

  return { position, status, locate, clear };
}
