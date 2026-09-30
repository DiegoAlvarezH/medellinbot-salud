import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { distanceMeters, formatDistance, isInAburra } from '../../src/lib/geo';

describe('distanceMeters', () => {
  it('matches a known distance within 1 %', () => {
    // Parque Berrío → Parque Lleras is ~4.6 km as the crow flies.
    const meters = distanceMeters({ latitude: 6.2502, longitude: -75.5686 }, { latitude: 6.2089, longitude: -75.5672 });
    assert.ok(Math.abs(meters - 4595) < 50, `got ${meters}`);
  });
});

describe('formatDistance', () => {
  it('uses metres below 1 km and a Spanish decimal comma above', () => {
    assert.equal(formatDistance(347), '350 m');
    assert.equal(formatDistance(1234), '1,2 km');
    assert.equal(formatDistance(15400), '15 km');
  });
});

describe('isInAburra', () => {
  it('includes the ten valley municipalities', () => {
    assert.equal(isInAburra({ latitude: 6.2442, longitude: -75.5812 }), true); // Medellín
    assert.equal(isInAburra({ latitude: 6.0916, longitude: -75.6358 }), true); // Caldas
    assert.equal(isInAburra({ latitude: 6.437, longitude: -75.3304 }), true); // Barbosa
    assert.equal(isInAburra({ latitude: 6.3461, longitude: -75.6917 }), true); // Palmitas (rural Medellín)
    assert.equal(isInAburra({ latitude: 6.1861, longitude: -75.6565 }), true); // San Antonio de Prado
  });

  it('excludes the Oriente antioqueño', () => {
    assert.equal(isInAburra({ latitude: 6.1551, longitude: -75.3737 }), false); // Rionegro
    assert.equal(isInAburra({ latitude: 6.4436, longitude: -75.7236 }), false); // San Jerónimo
  });
});
