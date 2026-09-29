// ─── Health services ────────────────────────────────────────────────────────

export type ServiceType =
  | 'hospital'
  | 'clinic'
  | 'health-center'
  | 'pharmacy'
  | 'dentist'
  | 'laboratory'
  | 'doctor'
  | 'other';

export type DataSourceId = 'osm' | 'metrosalud' | 'reps';

export interface HealthService {
  id: string;
  name: string;
  type: ServiceType;
  latitude: number;
  longitude: number;
  address?: string;
  neighborhood?: string;
  municipality?: string;
  phone?: string;
  website?: string;
  /** Raw opening hours string (OSM `opening_hours` syntax or free text). */
  hours?: string;
  emergency?: boolean;
  /** `true` public network (ESE / Metrosalud), `false` private, `undefined` unknown. */
  isPublic?: boolean;
  source: DataSourceId;
  /** REPS habilitation code when the facility was matched against the national registry. */
  repsCode?: string;
  /** Closest Metro / Metrocable / Tranvía station, for "how to get there" hints. */
  transit?: { name: string; distance: number };
  /** Metres from the user, filled in on the client once the location is known. */
  distance?: number;
}

/** Barrio / comuna / municipality centroid used to resolve "near <place>" questions. */
export interface Place {
  name: string;
  kind: string;
  latitude: number;
  longitude: number;
}

export interface TransitStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// ─── Environment ────────────────────────────────────────────────────────────

export type AqiLevel = 'good' | 'acceptable' | 'sensitive' | 'unhealthy' | 'very-unhealthy';

export interface AirStation {
  id: string;
  name: string;
  municipality?: string;
  latitude: number;
  longitude: number;
  pm25: number | null;
  ica: number | null;
  updatedAt: string | null;
}

export interface AirQualitySnapshot {
  ica: number;
  level: AqiLevel;
  label: string;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  updatedAt: string;
  source: string;
  stations: AirStation[];
  /** Next 24 h PM2.5 forecast (µg/m³) for the city centre. */
  forecast: Array<{ time: string; pm25: number; ica: number }>;
}

export interface WeatherSnapshot {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  description: string;
  isDay: boolean;
  uvIndex: number;
  uvMax: number;
  tempMax: number;
  tempMin: number;
  rainProbability: number;
  hourlyUv: Array<{ time: string; uv: number }>;
  updatedAt: string;
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  cards?: ChatCards;
  source?: 'openai' | 'fallback';
}

export interface ChatCards {
  services?: HealthService[];
  air?: Pick<AirQualitySnapshot, 'ica' | 'label' | 'level' | 'pm25' | 'updatedAt'>;
  emergency?: boolean;
  /** Suggested next questions shown as chips under the answer. */
  followUps?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

/** Line-delimited events streamed by POST /api/chat. */
export type ChatStreamEvent =
  | { type: 'meta'; cards: ChatCards; source: ChatMessage['source'] }
  | { type: 'delta'; text: string }
  | { type: 'error'; message: string }
  | { type: 'done' };
