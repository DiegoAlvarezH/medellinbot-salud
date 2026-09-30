import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseMetrosalud } from '../../src/lib/sources/metrosalud';
import { buildNetwork } from '../../src/lib/sources/network';
import { mapOverpass } from '../../src/lib/sources/osm';
import type { RepsSede } from '../../src/lib/sources/reps';
import { mapSeries, mapStations } from '../../src/lib/sources/siata';

describe('parseMetrosalud', () => {
  const csv = '﻿centro atención,direccion,comuna,barrio,Longitud,Latitud\n' +
    'UH SANTA CRUZ,Carrera 51A # 100 - 80,SANTA CRUZ,Santa Cruz,-75.56057776,6.29348089\n' +
    'CS TRINIDAD,"Calle 27  #  65D - 49",GUAYABAL,Trinidad,-75.58650566,6.228777905\n' +
    'SIN COORDENADAS,Calle 1,X,Y,,\n';

  it('expands abbreviations, cleans spaces and skips rows without coordinates', () => {
    const rows = parseMetrosalud(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, 'Unidad Hospitalaria Santa Cruz');
    assert.equal(rows[1].name, 'Centro de Salud Trinidad');
    assert.equal(rows[1].address, 'Calle 27 # 65D - 49');
    assert.equal(rows[0].isPublic, true);
  });
});

describe('mapOverpass', () => {
  it('reclassifies mis-tagged drugstores and labs and keeps only explicit emergency tags', () => {
    const services = mapOverpass([
      { type: 'node', id: 1, lat: 6.25, lon: -75.57, tags: { amenity: 'clinic', name: 'Droguería Santa Gema' } },
      { type: 'node', id: 2, lat: 6.25, lon: -75.571, tags: { amenity: 'hospital', name: 'Laboratorio Clínico Belén' } },
      { type: 'way', id: 3, center: { lat: 6.26, lon: -75.56 }, tags: { amenity: 'hospital', name: 'Hospital X', emergency: 'yes' } },
      { type: 'node', id: 4, lat: 6.26, lon: -75.56, tags: { amenity: 'hospital', name: 'Hospital X' } },
      { type: 'node', id: 5, lat: 6.155, lon: -75.374, tags: { amenity: 'hospital', name: 'Hospital de Rionegro' } },
      { type: 'node', id: 6, lat: 6.2, lon: -75.6, tags: { amenity: 'clinic' } },
    ]);
    assert.deepEqual(
      services.map((s) => [s.name, s.type, Boolean(s.emergency)]),
      [
        ['Droguería Santa Gema', 'pharmacy', false],
        ['Laboratorio Clínico Belén', 'laboratory', false],
        ['Hospital X', 'hospital', true],
      ],
    );
  });
});

describe('buildNetwork', () => {
  const reps: RepsSede[] = [
    {
      code: '050010217802',
      providerCode: '0500102178',
      provider: 'Empresa Social del Estado Metrosalud',
      name: 'Unidad Hospitalaria de Santa Cruz Pedro Nel Cardona',
      municipality: 'Medellín',
      address: 'CL 100',
      phone: '5117505 ext 3100',
      nature: 'Pública',
      ese: true,
    },
    {
      code: '053600000101',
      providerCode: '0536000001',
      provider: 'ESE Hospital San Rafael',
      name: 'ESE Hospital San Rafael',
      municipality: 'Itagüí',
      address: 'CL 45',
      phone: '4480566',
      nature: 'Pública',
      ese: true,
    },
  ];

  it('enriches Metrosalud and OSM sites from REPS and removes OSM duplicates of official centres', () => {
    const network = buildNetwork({
      metrosalud: [{ id: 'm1', name: 'Unidad Hospitalaria Santa Cruz', type: 'health-center', latitude: 6.2935, longitude: -75.5606, source: 'metrosalud', isPublic: true }],
      osm: [
        { id: 'o1', name: 'UH Santa Cruz', type: 'health-center', latitude: 6.2936, longitude: -75.5607, source: 'osm' },
        { id: 'o2', name: 'Hospital San Rafael', type: 'hospital', latitude: 6.17, longitude: -75.61, source: 'osm' },
      ],
      reps,
      stations: [{ id: 's1', name: 'Tricentenario', latitude: 6.2905, longitude: -75.5645 }],
    });
    assert.deepEqual(network.map((s) => s.id), ['m1', 'o2']);
    assert.equal(network[0].phone, '5117505 ext 3100');
    assert.equal(network[0].transit?.name, 'Tricentenario');
    assert.equal(network[1].isPublic, true);
    assert.equal(network[1].municipality, 'Itagüí');
  });
});

describe('SIATA mappers', () => {
  it('normalises municipality names and discards negative readings', () => {
    const [station] = mapStations([
      {
        geometry: { coordinates: [-75.56958, 6.252561] },
        properties: { nombreEstacion: 'Estación Tráfico Centro', estacion: 'CEN-TRAF', Municipio: 'Medellin ', codigo: 12, PM25_24H_prom: -9999, ICA_24H_prom: 73.4, fechaFin: '2026-09-28 17:00' },
      },
    ]);
    assert.equal(station.name, 'Tráfico Centro');
    assert.equal(station.municipality, 'Medellín');
    assert.equal(station.pm25, null);
    assert.equal(station.ica, 73);
    assert.equal(station.updatedAt, '2026-09-28T17:00:00-05:00');
  });

  it('turns the 72 h series into hourly timestamps ending at Hora_fin', () => {
    const series = mapSeries({ info: { NombreEstacion: 'Estación X', Codigo: 1, Hora_fin: '2026-09-28 17:00:00', Horas: [15, 16, 17], PM25_72H: [10, null, 12] } });
    assert.equal(series.points.length, 3);
    assert.equal(series.points[2].time, new Date('2026-09-28T17:00:00-05:00').toISOString());
    assert.equal(series.points[1].pm25, null);
  });
});
