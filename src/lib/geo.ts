export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function formatDistance(meters?: number): string | undefined {
  if (meters === undefined) return undefined;
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0).replace('.', ',')} km`;
}

/** Rough outline of the Valle de Aburrá (lat, lng), from Caldas to Barbosa, excluding the Oriente (Rionegro). */
const ABURRA_POLYGON: Array<[number, number]> = [
  [6.03, -75.68],
  [6.03, -75.55],
  [6.17, -75.5],
  [6.27, -75.47],
  [6.33, -75.45],
  [6.4, -75.38],
  [6.46, -75.26],
  [6.5, -75.35],
  [6.42, -75.48],
  [6.36, -75.58],
  [6.32, -75.72],
  [6.2, -75.72],
];

/** Ray-casting point-in-polygon test against the valley outline. */
export function isInAburra({ latitude, longitude }: LatLng): boolean {
  let inside = false;
  for (let i = 0, j = ABURRA_POLYGON.length - 1; i < ABURRA_POLYGON.length; j = i, i += 1) {
    const [yi, xi] = ABURRA_POLYGON[i];
    const [yj, xj] = ABURRA_POLYGON[j];
    if (yi > latitude !== yj > latitude && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function directionsUrl({ latitude, longitude }: LatLng, travelMode: 'transit' | 'walking' | 'driving' = 'transit') {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${travelMode}`;
}
