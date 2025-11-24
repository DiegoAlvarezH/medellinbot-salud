import { HealthService, AirQualityData, Message, RouteInfo, Conversation } from '@/types';

// Mock Health Services in Medellín
export const mockHealthServices: HealthService[] = [
  {
    id: '1',
    name: 'Hospital San Vicente Fundación',
    type: 'hospital',
    address: 'Calle 64 #51D-154, Medellín',
    latitude: 6.2647,
    longitude: -75.5693,
    phone: '+57 4 444 1333',
    hours: 'Urgencias 24 horas',
    isOpenNow: true,
    distance: 800,
    specialties: ['Urgencias', 'Cardiología', 'Pediatría', 'Neurología'],
  },
  {
    id: '2',
    name: 'Hospital Pablo Tobón Uribe',
    type: 'hospital',
    address: 'Calle 78B #69-240, Medellín',
    latitude: 6.2444,
    longitude: -75.5915,
    phone: '+57 4 445 9000',
    hours: 'Urgencias 24 horas',
    isOpenNow: true,
    distance: 1200,
    specialties: ['Urgencias', 'Cirugía', 'Oncología', 'Ginecología'],
  },
  {
    id: '3',
    name: 'Clínica Las Américas',
    type: 'clinic',
    address: 'Diagonal 75B #2A-80/140, Medellín',
    latitude: 6.1989,
    longitude: -75.5783,
    phone: '+57 4 342 1010',
    hours: 'Lun-Vie: 7:00 AM - 7:00 PM',
    isOpenNow: true,
    distance: 2100,
    specialties: ['Consulta Externa', 'Laboratorio', 'Imágenes Diagnósticas'],
  },
  {
    id: '4',
    name: 'Centro de Vacunación Belén',
    type: 'vaccination-center',
    address: 'Carrera 76 #30-32, Medellín',
    latitude: 6.2156,
    longitude: -75.5933,
    phone: '+57 4 385 5555',
    hours: 'Lun-Sab: 8:00 AM - 5:00 PM',
    isOpenNow: true,
    distance: 1500,
    specialties: ['Vacunación COVID-19', 'Vacunación Infantil', 'Vacunación Adultos'],
  },
  {
    id: '5',
    name: 'Hospital General de Medellín',
    type: 'hospital',
    address: 'Carrera 48 #32-102, Medellín',
    latitude: 6.2401,
    longitude: -75.5735,
    phone: '+57 4 383 0000',
    hours: 'Urgencias 24 horas',
    isOpenNow: true,
    distance: 950,
    specialties: ['Urgencias', 'Medicina General', 'Cirugía'],
  },
  {
    id: '6',
    name: 'Farmacia Cruz Verde',
    type: 'pharmacy',
    address: 'Carrera 43A #1-50, Medellín',
    latitude: 6.2086,
    longitude: -75.5694,
    phone: '+57 4 266 0000',
    hours: '24 horas',
    isOpenNow: true,
    distance: 300,
  },
  {
    id: '7',
    name: 'Centro de Salud La Floresta',
    type: 'clinic',
    address: 'Carrera 65 #48-33, Medellín',
    latitude: 6.2515,
    longitude: -75.5899,
    phone: '+57 4 234 5678',
    hours: 'Lun-Vie: 7:00 AM - 4:00 PM',
    isOpenNow: false,
    distance: 1800,
    specialties: ['Medicina General', 'Odontología', 'Psicología'],
  },
  {
    id: '8',
    name: 'Hospital Infantil Concejo de Medellín',
    type: 'hospital',
    address: 'Carrera 66 #58A-34, Medellín',
    latitude: 6.2589,
    longitude: -75.5845,
    phone: '+57 4 445 3800',
    hours: 'Urgencias 24 horas',
    isOpenNow: true,
    distance: 2300,
    specialties: ['Pediatría', 'Urgencias Pediátricas', 'Neonatología'],
  },
];

// Mock Air Quality Data
export const mockAirQualityData: AirQualityData = {
  ica: 45,
  status: 'good',
  statusText: 'Buena',
  recommendations: [
    'La calidad del aire es satisfactoria y no representa riesgo para la salud',
    'Es un buen día para realizar actividades al aire libre',
    'Puedes realizar ejercicio sin restricciones',
  ],
  lastUpdate: new Date(),
  station: 'Estación Centro',
  pollutants: {
    pm25: 12,
    pm10: 25,
    o3: 30,
  },
};

export const mockAirQualityModerate: AirQualityData = {
  ica: 75,
  status: 'moderate',
  statusText: 'Moderada',
  recommendations: [
    'La calidad del aire es aceptable para la mayoría de personas',
    'Personas sensibles deberían considerar limitar actividades al aire libre',
    'Puedes realizar ejercicio moderado',
  ],
  lastUpdate: new Date(),
  station: 'Estación Poblado',
  pollutants: {
    pm25: 35,
    pm10: 55,
    o3: 45,
  },
};

// Mock Route Data
export const mockRoute: RouteInfo = {
  id: '1',
  origin: 'Tu ubicación actual',
  destination: 'Hospital San Vicente Fundación',
  totalTime: 25,
  totalCost: 2950,
  distance: 3200,
  steps: [
    {
      id: '1',
      instruction: 'Camina 200m hacia el norte por Carrera 43A',
      mode: 'walk',
      duration: 3,
    },
    {
      id: '2',
      instruction: 'Toma el Metro Línea A dirección Niquía',
      mode: 'metro',
      duration: 12,
      line: 'Línea A',
    },
    {
      id: '3',
      instruction: 'Baja en estación Hospital',
      mode: 'metro',
      duration: 1,
      line: 'Línea A',
    },
    {
      id: '4',
      instruction: 'Camina 300m hacia el este',
      mode: 'walk',
      duration: 4,
    },
  ],
};

// Mock initial conversation
export const mockInitialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: '¡Hola! 👋 Soy tu asistente de salud pública para Medellín. Puedo ayudarte a encontrar servicios de salud cercanos, información sobre vacunación, consultar la calidad del aire y mostrarte rutas de transporte. ¿En qué puedo ayudarte hoy?',
    timestamp: new Date(Date.now() - 60000),
  },
];

// Mock conversation history
export const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Centros de vacunación COVID-19',
    lastMessage: 'Gracias por tu ayuda',
    timestamp: new Date(Date.now() - 3600000),
    messages: [],
  },
  {
    id: '2',
    title: 'Consulta calidad del aire',
    lastMessage: 'La calidad del aire es buena hoy',
    timestamp: new Date(Date.now() - 7200000),
    messages: [],
  },
  {
    id: '3',
    title: 'Ruta al Hospital Pablo Tobón',
    lastMessage: 'Te muestro la mejor ruta',
    timestamp: new Date(Date.now() - 86400000),
    messages: [],
  },
];

// Mock bot responses
export const getBotResponse = (userMessage: string): Message => {
  const message = userMessage.toLowerCase();
  const baseResponse: Partial<Message> = {
    id: Date.now().toString(),
    role: 'assistant',
    timestamp: new Date(),
  };

  if (message.includes('hospital') || message.includes('centro de salud') || message.includes('clínica')) {
    return {
      ...baseResponse,
      content: 'Encontré varios centros de salud cercanos a tu ubicación. Aquí están las mejores opciones:',
      metadata: {
        serviceCards: mockHealthServices.slice(0, 3),
      },
    } as Message;
  }

  if (message.includes('vacuna') || message.includes('vacunación')) {
    return {
      ...baseResponse,
      content: 'Estos son los centros de vacunación disponibles en Medellín:',
      metadata: {
        serviceCards: mockHealthServices.filter(s => s.type === 'vaccination-center'),
      },
    } as Message;
  }

  if (message.includes('aire') || message.includes('contaminación') || message.includes('ica')) {
    return {
      ...baseResponse,
      content: 'Aquí está la información actual sobre la calidad del aire en Medellín:',
      metadata: {
        airQualityData: mockAirQualityData,
      },
    } as Message;
  }

  if (message.includes('ruta') || message.includes('cómo llegar') || message.includes('transporte')) {
    return {
      ...baseResponse,
      content: 'Te muestro la mejor ruta para llegar a tu destino:',
      metadata: {
        routes: [mockRoute],
      },
    } as Message;
  }

  if (message.includes('urgencia') || message.includes('emergencia')) {
    return {
      ...baseResponse,
      content: '🚨 Estos hospitales tienen servicio de urgencias 24 horas:',
      metadata: {
        serviceCards: mockHealthServices.filter(s => s.hours.includes('24')).slice(0, 3),
      },
    } as Message;
  }

  if (message.includes('farmacia')) {
    return {
      ...baseResponse,
      content: 'Estas son las farmacias más cercanas:',
      metadata: {
        serviceCards: mockHealthServices.filter(s => s.type === 'pharmacy'),
      },
    } as Message;
  }

  // Default response
  return {
    ...baseResponse,
    content: 'Entiendo que necesitas ayuda con servicios de salud. Puedo ayudarte a:\n\n• Encontrar hospitales y clínicas cercanas\n• Información sobre vacunación\n• Consultar la calidad del aire\n• Mostrarte rutas de transporte\n\n¿Qué te gustaría saber?',
  } as Message;
};
