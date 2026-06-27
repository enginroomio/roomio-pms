/** Tarayıcı — AES-256-GCM (Web Crypto). KVKK: PII yerel diskte şifreli tutulur. */

const KEY_STORAGE = 'roomio_device_key_v1';
const KEY_ID = 'device-v1';

function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s);
}

function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const raw = localStorage.getItem(KEY_STORAGE);
  if (raw) {
    const jwk = JSON.parse(raw) as JsonWebKey;
    return crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(KEY_STORAGE, JSON.stringify(jwk));
  return key;
}

export async function encryptPayload(value: unknown): Promise<{ iv: string; tag: string; data: string; alg: 'AES-256-GCM'; keyId: string }> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const all = new Uint8Array(cipher);
  const tag = all.slice(all.length - 16);
  const data = all.slice(0, all.length - 16);
  return { iv: bytesToBase64(iv), tag: bytesToBase64(tag), data: bytesToBase64(data), alg: 'AES-256-GCM', keyId: KEY_ID };
}

export async function decryptPayload<T>(blob: { iv: string; tag: string; data: string }): Promise<T> {
  const key = await getOrCreateKey();
  const iv = base64ToBytes(blob.iv);
  const tag = base64ToBytes(blob.tag);
  const data = base64ToBytes(blob.data);
  const combined = new Uint8Array(data.length + tag.length);
  combined.set(data);
  combined.set(tag, data.length);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    combined as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

export async function checksum(value: unknown): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  return bytesToBase64(new Uint8Array(buf)).slice(0, 16);
}
