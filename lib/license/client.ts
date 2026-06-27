import type { LicensePayload, LicenseValidation } from '@/lib/license/types';
import { LICENSE_PREFIX } from '@/lib/license/types';
import { roomioFetch } from '@/lib/client/api';

const STORAGE_KEY = 'roomio_license_key';

/** İstemci — imza doğrulama sunucu API üzerinden yapılır. */
export function getStoredLicense(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function storeLicense(token: string): void {
  localStorage.setItem(STORAGE_KEY, token.trim());
}

export function clearLicense(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function validateLicenseRemote(token: string): Promise<LicenseValidation> {
  const res = await roomioFetch('/api/license/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return { valid: false, error: 'Doğrulama servisi yanıt vermedi' };
  return (await res.json()) as LicenseValidation;
}

export function parseLicensePreview(token: string): LicensePayload | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 4 || `${parts[0]}.${parts[1]}` !== LICENSE_PREFIX) return null;
    const json = atob(parts[2].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as LicensePayload;
  } catch {
    return null;
  }
}
