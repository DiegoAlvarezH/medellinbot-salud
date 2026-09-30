import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapSedesSalud } from '../../src/lib/sources/geomedellin';
import { matchOtc, medicineStem } from '../../src/lib/sources/medicines';
import { buildNetwork } from '../../src/lib/sources/network';
import { levelStatus, localToIso, mapLevels, mapRain, summarizeHydrology } from '../../src/lib/sources/siata-hydrology';

describe('medicineStem', () => {
  it('keeps only letters, so user input can never break out of the SoQL string', () => {
    const stem = medicineStem("losartan' OR 1=1 --");
    assert.equal(stem, 'LOSART');
    assert.match(stem!, /^[A-Z]+$/);
    assert.equal(medicineStem('x'), null);
  });

  it('drops accents and trims long words to survive "ACETAMINOFÉN" in the registry', () => {
    assert.equal(medicineStem('Acetaminofén'), 'ACETAMINOF');
    assert.equal(medicineStem('¿el ibuprofeno necesita fórmula?'), 'IBUPROFE');
  });
});

describe('matchOtc', () => {
  it('matches the over-the-counter list ignoring accents', () => {
    const list = [{ ingredient: 'Acetaminofén', form: 'Jarabe' }, { ingredient: 'Loratadina' }];
    assert.deepEqual(matchOtc('ACETAMINOF', list).map((e) => e.ingredient), ['Acetaminofén']);
    assert.equal(matchOtc('LOSARTAN', list).length, 0);
  });
});

describe('mapSedesSalud', () => {
  it('reads the vaccination flag, drops "Ninguna" placeholders and features outside the valley', () => {
    const sedes = mapSedesSalud([
      {
        geometry: { coordinates: [-75.583, 6.2975] },
        properties: { nombre_centro_salud: 'CENTRO DE SALUD PICACHO', codigo_sede: '050010217836', naturaleza: 'Pública', reportavac: 'Si', telefono: '4720334', correo: 'Ninguna' },
      },
      { geometry: { coordinates: [-74.07, 4.71] }, properties: { nombre_centro_salud: 'BOGOTÁ', reportavac: 'Si' } },
      { geometry: null, properties: { nombre_centro_salud: 'SIN GEOMETRÍA' } },
    ]);
    assert.equal(sedes.length, 1);
    assert.deepEqual(
      { name: sedes[0].name, vaccination: sedes[0].vaccination, isPublic: sedes[0].isPublic, repsCode: sedes[0].repsCode },
      { name: 'Centro de Salud Picacho', vaccination: true, isPublic: true, repsCode: '050010217836' },
    );
  });
});

describe('buildNetwork with GeoMedellín sites', () => {
  it('flags vaccination on matching sites and adds unmatched official sites', () => {
    const network = buildNetwork({
      metrosalud: [{ id: 'm1', name: 'Centro de Salud Picacho', type: 'health-center', latitude: 6.2975, longitude: -75.583, source: 'metrosalud', isPublic: true }],
      osm: [],
      reps: [],
      stations: [],
      sedes: [
        { repsCode: '1', name: 'Centro de Salud Picacho', isPublic: true, vaccination: true, latitude: 6.2976, longitude: -75.5831 },
        { repsCode: '2', name: 'Hospital Nuevo', isPublic: false, vaccination: false, latitude: 6.25, longitude: -75.57 },
      ],
    });
    assert.equal(network.length, 2);
    assert.equal(network[0].vaccination, true);
    assert.deepEqual([network[1].source, network[1].type], ['geomedellin', 'hospital']);
  });
});

describe('SIATA hydrology', () => {
  it('converts local timestamps and status colours', () => {
    assert.equal(localToIso('2026-09-30 00:58:02'), '2026-09-30T00:58:00-05:00');
    assert.equal(localToIso('No hay datos'), null);
    assert.equal(levelStatus('#79c454'), 'normal');
    assert.equal(levelStatus('#F9DA41'), 'precaucion');
    assert.equal(levelStatus('#FC3A3A'), 'alerta');
    assert.equal(levelStatus('#0e0e0e'), 'sin-dato');
  });

  it('summarises rain and stream alerts', () => {
    const rain = mapRain([
      { geometry: { coordinates: [-75.6, 6.2] }, properties: { codigo: 1, nombre: 'A', ubicacion: 'Medellin', acumulado_15min: 2.4, flag_precipitacion: 'si', fecha_ultima_actualizacion: '2026-09-30 01:00:00' } },
      { geometry: { coordinates: [-75.6, 6.2] }, properties: { codigo: 2, nombre: 'B', ubicacion: 'Bello', acumulado_15min: 0, flag_precipitacion: 'no' } },
      { geometry: { coordinates: [-75.6, 6.2] }, properties: { codigo: 3, nombre: 'C', ubicacion: 'Itagui', acumulado_15min: 0.6, flag_precipitacion: 'si' } },
    ]);
    const levels = mapLevels([
      { geometry: { coordinates: [-75.6, 6.2] }, properties: { codigo: 9, nombreEstacion: 'Q. X', municipio: 'Medellin', color: '#FC3A3A', fechaUltimoDato: '2026-09-30T01:10:00' } },
      { geometry: { coordinates: [-75.6, 6.2] }, properties: { codigo: 8, nombreEstacion: 'Q. Y', municipio: 'Medellin', color: '#79c454' } },
    ]);
    const summary = summarizeHydrology(rain, levels);
    assert.equal(summary.rain.raining.length, 2);
    assert.deepEqual(summary.rain.heaviest.map((g) => g.name), ['A', 'C']);
    assert.equal(summary.rain.raining[0].municipality, 'Medellín');
    assert.equal(summary.levels.alert.length, 1);
    assert.equal(summary.levels.updatedAt, '2026-09-30T01:10:00-05:00');
  });
});
