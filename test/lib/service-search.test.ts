import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isEmergencyCapable, planSearch, resolvePlace, searchServices } from '../../src/lib/service-search';
import type { HealthService, Place } from '../../src/types';

const base = { source: 'osm' as const };
const at = (latitude: number, longitude: number) => ({ latitude, longitude });

const SERVICES: HealthService[] = [
  { ...base, id: 'noel', name: 'Hospital Infantil Clínica Noel', type: 'hospital', ...at(6.2525, -75.5645), phone: '6042636046' },
  { ...base, id: 'hgm', name: 'Hospital General de Medellín', type: 'hospital', ...at(6.2322, -75.5716), phone: '6043847300', repsCode: 'x' },
  { ...base, id: 'dentix', name: 'Dentix', type: 'clinic', ...at(6.2447, -75.5905) },
  { ...base, id: 'estetica', name: 'CliniQ Dermoestetica & Laser', type: 'clinic', ...at(6.2448, -75.5907) },
  { ...base, id: 'uh-belen', name: 'Unidad Hospitalaria Belen', type: 'health-center', ...at(6.2303, -75.6015), isPublic: true, source: 'metrosalud' },
  { ...base, id: 'mental', name: 'Hospital Mental de Antioquia', type: 'hospital', ...at(6.3265, -75.5568) },
  { ...base, id: 'mfs', name: 'Hospital Marco Fidel Suarez', type: 'hospital', ...at(6.3372, -75.5591), phone: '6044804040' },
  { ...base, id: 'mfs-dup', name: 'Marco Fidel Suarez', type: 'hospital', ...at(6.3380, -75.5600) },
  { ...base, id: 'rebaja-1', name: 'Droguería La Rebaja', type: 'pharmacy', ...at(6.2450, -75.5900) },
  { ...base, id: 'rebaja-2', name: 'Droguería La Rebaja Plus', type: 'pharmacy', ...at(6.2460, -75.5910) },
  { ...base, id: 'pasteur', name: 'Farmacia Pasteur', type: 'pharmacy', ...at(6.2470, -75.5920) },
  { ...base, id: 'saludcoop', name: 'Saludcoop Laureles', type: 'clinic', ...at(6.2449, -75.5908) },
  { ...base, id: 'vision', name: 'Visión Total', type: 'clinic', ...at(6.2452, -75.5911) },
  { ...base, id: 'cs-estadio', name: 'Centro de Salud Estadio', type: 'health-center', ...at(6.2530, -75.5890), isPublic: true, source: 'metrosalud' },
];

const PLACES: Place[] = [
  { name: 'Envigado', kind: 'town', ...at(6.1719, -75.5866) },
  { name: 'Bello', kind: 'town', ...at(6.3373, -75.5579) },
  { name: 'Centro', kind: 'suburb', ...at(6.2476, -75.5658) },
];

describe('planSearch', () => {
  it('detects specialties and service types', () => {
    assert.equal(planSearch('Necesito un pediatra').specialty?.id, 'pediatrics');
    assert.deepEqual(planSearch('farmacia abierta').types, ['pharmacy']);
    assert.equal(planSearch('farmacia abierta').openNow, true);
    assert.equal(planSearch('urgencias ya').urgent, true);
  });

  it('inherits the topic in follow-up questions', () => {
    const plan = planSearch('¿y en Envigado?', ['Necesito un pediatra']);
    assert.equal(plan.specialty?.id, 'pediatrics');
    assert.equal(plan.explicit, false);
  });
});

describe('resolvePlace', () => {
  it('matches whole words, ignoring accents', () => {
    assert.equal(resolvePlace('urgencias en envigado', PLACES)?.name, 'Envigado');
    assert.equal(resolvePlace('hospitales de Bello', PLACES)?.name, 'Bello');
  });

  it('does not read "centro de salud" as the Centro barrio', () => {
    assert.equal(resolvePlace('centro de salud cercano', PLACES), undefined);
  });
});

describe('searchServices', () => {
  const laureles = at(6.2446, -75.5906);

  it('puts the specialised site first for a specialty question', () => {
    const { services } = searchServices({ services: SERVICES, places: PLACES, query: 'pediatra', location: laureles });
    assert.equal(services[0].id, 'noel');
  });

  it('never offers dental or aesthetic clinics for urgencias', () => {
    const { services } = searchServices({ services: SERVICES, places: PLACES, query: 'hospital con urgencias', location: laureles });
    const ids = services.map((s) => s.id);
    assert.ok(!ids.includes('dentix') && !ids.includes('estetica'), ids.join());
    assert.ok(ids.includes('uh-belen'));
  });

  it('keeps a single branch per pharmacy chain', () => {
    const { services } = searchServices({ services: SERVICES, places: PLACES, query: 'farmacia', location: laureles });
    assert.equal(services.filter((s) => s.name.startsWith('Droguería La Rebaja')).length, 1);
    assert.ok(services.some((s) => s.id === 'pasteur'));
  });

  it('drops the same hospital mapped twice and other specialties as filler', () => {
    const { services, ordering } = searchServices({ services: SERVICES, places: PLACES, query: 'ginecologo en Bello' });
    assert.equal(ordering, 'place');
    const ids = services.map((s) => s.id);
    assert.ok(ids.includes('mfs'));
    assert.ok(!ids.includes('mfs-dup'), 'duplicate kept');
    assert.ok(!ids.includes('mental'), 'mental hospital offered for gynaecology');
  });

  it('sends vaccination questions to the public network, never to defunct EPS or opticians', () => {
    const { services } = searchServices({ services: SERVICES, places: PLACES, query: '¿Dónde me vacuno contra la influenza cerca?', location: laureles });
    const ids = services.map((s) => s.id);
    assert.equal(ids[0], 'cs-estadio');
    assert.ok(!ids.includes('saludcoop') && !ids.includes('vision'), ids.join());
  });

  it('attaches the distance to the user when the location is known', () => {
    const { services } = searchServices({ services: SERVICES, places: PLACES, query: 'hospital', location: laureles });
    assert.ok(services.every((s) => typeof s.distance === 'number'));
  });
});

describe('isEmergencyCapable', () => {
  it('accepts hospitals and Metrosalud hospital units, not generic clinics', () => {
    assert.equal(isEmergencyCapable(SERVICES.find((s) => s.id === 'hgm')!), true);
    assert.equal(isEmergencyCapable(SERVICES.find((s) => s.id === 'uh-belen')!), true);
    assert.equal(isEmergencyCapable(SERVICES.find((s) => s.id === 'dentix')!), false);
  });
});
