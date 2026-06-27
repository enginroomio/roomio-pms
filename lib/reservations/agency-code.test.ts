import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAgencyCodeLookup,
  resolveAgencyCode,
  resolveAgencyDisplayName,
  resolveReservationRoomNo,
} from './agency-code';

describe('resolveAgencyCode', () => {
  it('uses extraData agencyCode first', () => {
    const code = resolveAgencyCode({ agency: 'X', extraData: { agencyCode: 'bkg' } });
    assert.equal(code, 'BKG');
  });

  it('maps booking.com alias to BKG', () => {
    assert.equal(resolveAgencyCode({ agency: 'booking.com' }), 'BKG');
  });

  it('extracts suffix from market code', () => {
    assert.equal(resolveAgencyCode({ agency: '', market: 'FIT-BKG' }), 'BKG');
  });

  it('returns dash when empty', () => {
    assert.equal(resolveAgencyCode({ agency: '' }), '—');
  });
});

describe('resolveAgencyDisplayName', () => {
  const contracts = [{ code: 'BKG', name: 'Booking.com' }];

  it('returns contract name for known code', () => {
    const name = resolveAgencyDisplayName({ agency: 'booking.com' }, contracts);
    assert.equal(name, 'Booking.com');
  });
});

describe('buildAgencyCodeLookup', () => {
  it('indexes codes and names', () => {
    const lookup = buildAgencyCodeLookup([{ code: 'EXP', name: 'Expedia' }]);
    assert.equal(lookup.get('exp'), 'EXP');
    assert.equal(lookup.get('expedia'), 'EXP');
  });
});

describe('resolveReservationRoomNo', () => {
  it('returns trimmed room number', () => {
    assert.equal(resolveReservationRoomNo({ agency: '', market: '', roomNo: ' 412 ' }), '412');
  });

  it('returns undefined when missing', () => {
    assert.equal(resolveReservationRoomNo({ agency: '', market: '' }), undefined);
  });
});
