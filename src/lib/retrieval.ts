import fs from 'node:fs';
import path from 'node:path';
import { mockAirQualityData, mockHealthServices, mockRoute } from '@/lib/mock-data';

type KnowledgeDoc = {
  id: string;
  content: string;
  tags: string[];
};

const typeLabel: Record<string, string> = {
  hospital: 'hospital',
  clinic: 'clinica',
  'vaccination-center': 'centro de vacunacion',
  pharmacy: 'farmacia',
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 2);
}

function buildKnowledgeBase(): KnowledgeDoc[] {
  const serviceDocs: KnowledgeDoc[] = mockHealthServices.map((service) => {
    const specialties = service.specialties?.join(', ') || 'No especificadas';
    return {
      id: `service-${service.id}`,
      content: [
        `Nombre: ${service.name}`,
        `Tipo: ${typeLabel[service.type] || service.type}`,
        `Direccion: ${service.address}`,
        `Horario: ${service.hours}`,
        `Telefono: ${service.phone || 'No disponible'}`,
        `Especialidades: ${specialties}`,
        `Estado actual: ${service.isOpenNow ? 'Abierto' : 'Cerrado'}`,
      ].join(' | '),
      tags: [service.type, 'salud', 'servicio', 'medellin'],
    };
  });

  const airDoc: KnowledgeDoc = {
    id: 'air-quality',
    content: [
      `Calidad del aire en ${mockAirQualityData.station}`,
      `ICA: ${mockAirQualityData.ica}`,
      `Estado: ${mockAirQualityData.statusText}`,
      `PM2.5: ${mockAirQualityData.pollutants.pm25}`,
      `PM10: ${mockAirQualityData.pollutants.pm10}`,
      `O3: ${mockAirQualityData.pollutants.o3}`,
      `Recomendaciones: ${mockAirQualityData.recommendations.join('; ')}`,
    ].join(' | '),
    tags: ['aire', 'siata', 'contaminacion', 'ica'],
  };

  const routeDoc: KnowledgeDoc = {
    id: 'route-base',
    content: [
      `Ruta de referencia desde ${mockRoute.origin} hasta ${mockRoute.destination}`,
      `Tiempo total: ${mockRoute.totalTime} minutos`,
      `Costo total: ${mockRoute.totalCost} COP`,
      `Distancia: ${mockRoute.distance} metros`,
      `Pasos: ${mockRoute.steps.map((step) => step.instruction).join(' -> ')}`,
    ].join(' | '),
    tags: ['ruta', 'transporte', 'metro', 'bus', 'movilidad'],
  };

  const policyDoc: KnowledgeDoc = {
    id: 'policy',
    content:
      'En emergencias medicas se debe indicar llamar al 123. El asistente entrega informacion general y no reemplaza diagnosticos profesionales.',
    tags: ['emergencia', '123', 'urgencias'],
  };

  return [...serviceDocs, airDoc, routeDoc, policyDoc, ...loadExternalKnowledgeDocs()];
}

function loadExternalKnowledgeDocs(): KnowledgeDoc[] {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'medellin-public-health.json');

    if (!fs.existsSync(dataPath)) {
      return [];
    }

    const raw = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(raw) as { docs?: Array<{ id?: string; content?: string; tags?: string[] }> };

    if (!Array.isArray(parsed.docs)) {
      return [];
    }

    return parsed.docs
      .map((doc, index) => {
        const content = typeof doc.content === 'string' ? doc.content.trim() : '';
        if (!content) {
          return null;
        }

        return {
          id: doc.id || `external-${index + 1}`,
          content,
          tags: Array.isArray(doc.tags) ? doc.tags : ['externo', 'salud', 'medellin'],
        } satisfies KnowledgeDoc;
      })
      .filter((doc): doc is KnowledgeDoc => doc !== null);
  } catch (error) {
    console.error('Error loading external knowledge docs:', error);
    return [];
  }
}

const KNOWLEDGE_BASE = buildKnowledgeBase();

function scoreDocument(doc: KnowledgeDoc, queryTokens: string[]): number {
  const normalizedDoc = normalizeText(`${doc.content} ${doc.tags.join(' ')}`);
  let score = 0;

  for (const token of queryTokens) {
    if (normalizedDoc.includes(token)) {
      score += 2;
    }

    if (doc.tags.some((tag) => normalizeText(tag).includes(token))) {
      score += 1;
    }
  }

  return score;
}

export function buildPublicHealthContext(query: string): string {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return KNOWLEDGE_BASE.slice(0, 6)
      .map((doc) => `- ${doc.content}`)
      .join('\n');
  }

  const topDocs = KNOWLEDGE_BASE.map((doc) => ({
    doc,
    score: scoreDocument(doc, queryTokens),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ doc }) => doc);

  return topDocs.map((doc) => `- ${doc.content}`).join('\n');
}
