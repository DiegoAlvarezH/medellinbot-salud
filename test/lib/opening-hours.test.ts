import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatHours, isAlwaysOpen, isOpenAt } from '../../src/lib/opening-hours';

/** Builds a Date for a wall-clock time in Medellín (UTC-5, no DST). */
const bogota = (iso: string) => new Date(`${iso}-05:00`);

describe('isOpenAt', () => {
  it('treats 24/7 variants as always open', () => {
    assert.equal(isAlwaysOpen('24/7'), true);
    assert.equal(isAlwaysOpen('Mo-Su 00:00-24:00'), true);
    assert.equal(isOpenAt('24/7', bogota('2026-09-28T03:00:00')), true);
  });

  it('evaluates weekday ranges in Medellín time', () => {
    const hours = 'Mo-Fr 07:00-19:00; Sa 08:00-12:00';
    assert.equal(isOpenAt(hours, bogota('2026-09-28T08:30:00')), true); // Monday
    assert.equal(isOpenAt(hours, bogota('2026-09-28T19:30:00')), false);
    assert.equal(isOpenAt(hours, bogota('2026-10-03T11:00:00')), true); // Saturday
    assert.equal(isOpenAt(hours, bogota('2026-10-04T11:00:00')), false); // Sunday
  });

  it('supports ranges that cross midnight', () => {
    assert.equal(isOpenAt('Mo-Su 18:00-02:00', bogota('2026-09-28T01:00:00')), true);
    assert.equal(isOpenAt('Mo-Su 18:00-02:00', bogota('2026-09-28T12:00:00')), false);
  });

  it('lets later rules override earlier ones', () => {
    assert.equal(isOpenAt('Mo-Su 08:00-18:00; Su off', bogota('2026-10-04T10:00:00')), false);
  });

  it('returns undefined for syntax it does not understand', () => {
    assert.equal(isOpenAt(undefined), undefined);
    assert.equal(isOpenAt('sunrise-sunset'), undefined);
  });
});

describe('formatHours', () => {
  it('renders OSM syntax in Spanish', () => {
    assert.equal(formatHours('24/7'), 'Abierto 24 horas');
    assert.equal(formatHours('Mo-Fr 07:00-19:00; Su off'), 'Lun-Vie 07:00-19:00 · Dom cerrado');
  });
});
