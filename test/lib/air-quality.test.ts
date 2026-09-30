import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aqiCategory, icaFromPm10, icaFromPm25, uvCategory } from '../../src/lib/air-quality';

describe('icaFromPm25 (Resolución 2254 de 2017)', () => {
  it('maps breakpoint edges to the published index values', () => {
    assert.equal(icaFromPm25(0), 0);
    assert.equal(icaFromPm25(12), 50);
    assert.equal(icaFromPm25(13), 51);
    assert.equal(icaFromPm25(37), 100);
    assert.equal(icaFromPm25(55), 150);
    assert.equal(icaFromPm25(150), 200);
  });

  it('keeps decimals between two integer breakpoints in the lower band', () => {
    assert.equal(icaFromPm25(12.5), 50);
  });

  it('clamps negative and extreme values', () => {
    assert.equal(icaFromPm25(-3), 0);
    assert.equal(icaFromPm25(900), 500);
  });
});

describe('icaFromPm10', () => {
  it('uses the PM10 table', () => {
    assert.equal(icaFromPm10(54), 50);
    assert.equal(icaFromPm10(154), 100);
  });
});

describe('aqiCategory', () => {
  it('returns the Spanish label and tone for each band', () => {
    assert.deepEqual([aqiCategory(40).label, aqiCategory(40).tone], ['Buena', 'green']);
    assert.equal(aqiCategory(75).level, 'acceptable');
    assert.equal(aqiCategory(120).level, 'sensitive');
    assert.equal(aqiCategory(180).level, 'unhealthy');
    assert.equal(aqiCategory(350).level, 'very-unhealthy');
  });
});

describe('uvCategory', () => {
  it('follows the WHO scale', () => {
    assert.equal(uvCategory(2).label, 'Bajo');
    assert.equal(uvCategory(5).label, 'Moderado');
    assert.equal(uvCategory(7).label, 'Alto');
    assert.equal(uvCategory(9).label, 'Muy alto');
    assert.equal(uvCategory(11).label, 'Extremo');
  });
});
