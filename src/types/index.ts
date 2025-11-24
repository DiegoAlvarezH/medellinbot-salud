export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  serviceCards?: HealthService[];
  airQualityData?: AirQualityData;
  routes?: RouteInfo[];
  mapLocation?: { lat: number; lng: number; zoom?: number };
}

export interface HealthService {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'vaccination-center' | 'pharmacy';
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours: string;
  isOpenNow: boolean;
  distance?: number; // in meters
  specialties?: string[];
}

export interface AirQualityData {
  ica: number; // Air Quality Index
  status: 'good' | 'moderate' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  statusText: string;
  recommendations: string[];
  lastUpdate: Date;
  station: string;
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
  };
}

export interface RouteInfo {
  id: string;
  origin: string;
  destination: string;
  steps: RouteStep[];
  totalTime: number; // in minutes
  totalCost: number; // in COP
  distance: number; // in meters
}

export interface RouteStep {
  id: string;
  instruction: string;
  mode: 'walk' | 'bus' | 'metro' | 'metrocable';
  duration: number; // in minutes
  line?: string; // for public transport
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}
