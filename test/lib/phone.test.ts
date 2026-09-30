import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatPhone, telHref } from '../../src/lib/phone';

describe('formatPhone', () => {
  it('adds the 604 prefix to 7-digit landlines', () => {
    assert.equal(formatPhone('5117505'), '604 511 7505');
  });

  it('upgrades the pre-2021 "+57 4" format', () => {
    assert.equal(formatPhone('+57 4 4065478'), '604 406 5478');
  });

  it('keeps extensions and drops the country code', () => {
    assert.equal(formatPhone('6045117505 ext 1501'), '604 511 7505 ext. 1501');
    assert.equal(formatPhone('+57 604 5768400'), '604 576 8400');
  });

  it('formats mobiles and leaves unknown text untouched', () => {
    assert.equal(formatPhone('3042380460'), '304 238 0460');
    assert.equal(formatPhone('ver página web'), 'ver página web');
  });
});

describe('telHref', () => {
  it('dials only the first number, never the extension', () => {
    assert.equal(telHref('5117505 ext 6114'), 'tel:+576045117505');
    assert.equal(telHref('4125594 - 3498920'), 'tel:+576044125594');
  });

  it('keeps short emergency numbers as-is', () => {
    assert.equal(telHref('123'), 'tel:123');
  });
});
