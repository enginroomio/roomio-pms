/** Aktif otel / şube bağlamı */

export const DEFAULT_PROPERTY_ID = 'prop-sapphire-ist';

export type PropertyInfo = {
  id: string;
  code: string;
  name: string;
  city?: string | null;
  totalRooms: number;
  isDefault: boolean;
};

export function propertyIdFromRequest(req: Request): string {
  const header =
    req.headers.get('x-roomio-property') ?? req.headers.get('x-roomio-property-id');
  if (header) return header;
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('propertyId');
    if (q) return q;
  } catch {
    // ignore
  }
  return DEFAULT_PROPERTY_ID;
}

export const CLIENT_PROPERTY_KEY = 'roomio-active-property';
