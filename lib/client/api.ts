import { CLIENT_PROPERTY_KEY, DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export function getActivePropertyId(): string {
  if (typeof window === 'undefined') return DEFAULT_PROPERTY_ID;
  return localStorage.getItem(CLIENT_PROPERTY_KEY) ?? DEFAULT_PROPERTY_ID;
}

export function setActivePropertyId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLIENT_PROPERTY_KEY, id);
}

export async function roomioFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('x-roomio-property')) {
    headers.set('x-roomio-property', getActivePropertyId());
  }
  return fetch(input, { ...init, headers });
}
