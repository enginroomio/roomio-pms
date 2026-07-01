import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFolioChargeAmounts, foreignToTryReservation, reservationExchangeRate } from '@/lib/folio/charge-amounts';
import type { Reservation } from '@/lib/types/reservation';

const base = {
  id: 'r-1',
  refNo: 'REF-1',
  guestName: 'Test Guest',
  checkIn: '2026-06-20',
  checkOut: '2026-06-22',
  roomType: 'DBL',
  adults: 2,
  children: 0,
  mealPlan: 'BB',
  agency: 'Direct',
  market: 'BAR',
  status: 'CHECKED_IN',
  createdAt: '2026-06-01',
} as Reservation;

describe('folio charge amounts', () => {
  it('TRY konaklama — tek tutar', () => {
    const r = { ...base, rate: 5200, currency: 'TRY' };
    assert.deepEqual(buildFolioChargeAmounts(5200, r), {
      amount: 5200,
      currency: 'TRY',
    });
  });

  it('EUR konaklama — giriş kuru ile TL karşılığı', () => {
    const r = {
      ...base,
      rate: 120,
      currency: 'EUR',
      extraData: { exchangeRate: '46.05' },
    };
    assert.equal(reservationExchangeRate(r), 46.05);
    assert.equal(foreignToTryReservation(120, r), 5526);
    assert.deepEqual(buildFolioChargeAmounts(120, r), {
      amount: 5526,
      currency: 'EUR',
      foreignAmount: 120,
      exchangeRate: 46.05,
    });
  });
});
