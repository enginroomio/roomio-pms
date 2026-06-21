/** VAPID public key (URL-safe base64) → Uint8Array for PushManager. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function toUint8Array(value: BufferSource): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

export function subscriptionMatchesVapid(sub: PushSubscription, serverPublicKey: string): boolean {
  const key = sub.options?.applicationServerKey;
  if (!key) return false;
  const expected = urlBase64ToUint8Array(serverPublicKey);
  const existing = toUint8Array(key);
  if (existing.length !== expected.length) return false;
  return expected.every((byte, i) => existing[i] === byte);
}
