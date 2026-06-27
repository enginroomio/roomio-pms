/** Aktif otel / şube bağlamı */

export const DEFAULT_PROPERTY_ID = 'prop-sapphire-ist';

/**
 * Demo/seed verisindeki ikinci şube (Antalya). `seed.ts` ve
 * `user-properties.ts` arasında dairesel import oluşturmamak için bu sabit
 * ve demo kullanıcı→şube haritası bağımlılığı olmayan bu dosyada tutulur.
 */
export const DEMO_SECONDARY_PROPERTY_ID = 'prop-sapphire-ant';

/**
 * Demo kullanıcıların varsayılan şube ataması. `seed.ts` ilk kurulumda,
 * `user-properties.ts` ise eski/mevcut veritabanlarında eksik atamaları
 * tamamlarken (`ensureDefaultPropertyAccess`) bu haritayı kullanır.
 * `user-admin` kasıtlı olarak yok — admin rolü tüm şubelere otomatik erişir.
 */
export const DEMO_USER_PROPERTY_IDS: Record<string, string[]> = {
  'user-arda': [DEFAULT_PROPERTY_ID, DEMO_SECONDARY_PROPERTY_ID],
  'user-hk': [DEFAULT_PROPERTY_ID],
  'user-acc': [DEFAULT_PROPERTY_ID],
  'user-viewer': [DEFAULT_PROPERTY_ID],
  'user-reception': [DEFAULT_PROPERTY_ID],
};

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
