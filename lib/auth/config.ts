/** Oturum zorunlu mu? Production'da varsayılan true; geliştirmede false */
export function isAuthRequired(): boolean {
  if (process.env.ROOMIO_AUTH_REQUIRED === '1') return true;
  if (process.env.ROOMIO_AUTH_REQUIRED === '0') return false;
  return process.env.NODE_ENV === 'production';
}

/** Header'da demo rol seçici (yalnızca geliştirme) */
export function isDemoAuthEnabled(): boolean {
  if (process.env.ROOMIO_DEMO_AUTH === '0') return false;
  if (process.env.ROOMIO_DEMO_AUTH === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

export const AUTH_COOKIE = 'roomio-token';
export const TOKEN_MAX_AGE_SEC = 8 * 3600;

/** Demo modda API isteklerinde seçili rol (yalnızca ROOMIO_AUTH_REQUIRED=0) */
export const DEMO_ROLE_HEADER = 'x-roomio-demo-role';
