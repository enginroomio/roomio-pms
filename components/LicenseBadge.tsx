'use client';

import { useEffect, useState } from 'react';
import { getStoredLicense, validateLicenseRemote } from '@/lib/license/client';
import type { LicensePayload } from '@/lib/license/types';

export function LicenseBadge() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredLicense();
    if (!token) {
      setLabel('Demo');
      return;
    }
    void validateLicenseRemote(token).then((r) => {
      if (r.valid && r.payload) {
        setLabel(`${r.payload.propertyCode} · ${r.daysRemaining}g`);
      } else {
        setLabel('Lisans?');
      }
    });
  }, []);

  if (!label) return null;
  return (
    <span className="roomio-license-badge" title="Lisans durumu">
      {label}
    </span>
  );
}

export function useLicense(): { payload: LicensePayload | null; valid: boolean } {
  const [state, setState] = useState<{ payload: LicensePayload | null; valid: boolean }>({ payload: null, valid: false });
  useEffect(() => {
    const token = getStoredLicense();
    if (!token) return;
    void validateLicenseRemote(token).then((r) => setState({ payload: r.payload ?? null, valid: r.valid }));
  }, []);
  return state;
}
