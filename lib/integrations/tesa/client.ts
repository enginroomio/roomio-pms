import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildCheckInMessage,
  buildCheckOutMessage,
  buildCopyKeyMessage,
  buildLinkStatusMessage,
  mapRoom,
  parseHt24Response,
} from '@/lib/integrations/tesa/ht24-protocol';
import {
  DEFAULT_TESA_CONFIG,
  TESA_DEFAULTS,
  type TesaConfig,
  type TesaEncodeRequest,
  type TesaEncodeResult,
} from '@/lib/integrations/tesa/types';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';
import {
  callElektraService,
  isElektraRelayEnabled,
  loadElektraServerConfig,
} from '@/lib/integrations/elektra-server/client';

const CONFIG_FILE = process.env.ROOMIO_TESA_CONFIG
  ?? path.join(process.cwd(), '.roomio-data', 'tesa-config.json');

export async function loadTesaConfig(): Promise<TesaConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_TESA_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TESA_CONFIG;
  }
}

export async function saveTesaConfig(config: TesaConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

function sendTcp(host: string, port: number, message: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = '';
    let done = false;

    const finish = (err?: Error) => {
      if (done) return;
      done = true;
      socket.destroy();
      if (err) reject(err);
      else resolve(data);
    };

    socket.setTimeout(timeoutMs);
    socket.on('timeout', () => finish(new Error('TESA PMS Service zaman aşımı')));
    socket.on('error', (e) => finish(e));
    socket.on('data', (chunk) => {
      data += chunk.toString('latin1');
      if (data.includes('\x03')) finish();
    });
    socket.connect(port, host, () => {
      socket.write(message, 'latin1');
    });
  });
}

export async function testTesaConnection(config = DEFAULT_TESA_CONFIG): Promise<TesaEncodeResult> {
  const msg = buildLinkStatusMessage(config.encoderNumber);
  try {
    const raw = await sendTcp(config.host, config.port, msg, TESA_DEFAULTS.timeoutMs);
    const parsed = parseHt24Response(raw);
    return {
      ok: parsed.ok,
      message: parsed.ok ? 'TESA PMS Service bağlantısı OK' : `TESA yanıt: ${parsed.detail || parsed.code}`,
      rawRequest: msg.replace(/\x02/g, '<STX>').replace(/\x03/g, '<ETX>'),
      rawResponse: raw.replace(/\x02/g, '<STX>').replace(/\x03/g, '<ETX>'),
    };
  } catch (e) {
    if (effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
      return { ok: true, simulated: true, message: 'Simülasyon modu — TESA sunucusuna ulaşılamadı' };
    }
    return { ok: false, message: e instanceof Error ? e.message : 'Bağlantı hatası' };
  }
}

async function relayTesaThroughElektra(
  action: 'encode' | 'checkout' | 'copy',
  payload: Record<string, unknown>,
): Promise<TesaEncodeResult | null> {
  const elektra = await loadElektraServerConfig();
  if (!isElektraRelayEnabled(elektra, 'tesa')) return null;
  const result = await callElektraService('tesa', action, payload, elektra);
  return {
    ok: result.ok,
    simulated: result.simulated,
    message: result.message,
    rawRequest: result.rawRequest,
    rawResponse: result.rawResponse,
    encodedAt: result.ok ? new Date().toISOString() : undefined,
  };
}

export async function encodeGuestKey(req: TesaEncodeRequest, config?: TesaConfig): Promise<TesaEncodeResult> {
  const cfg = config ?? (await loadTesaConfig());
  if (!cfg.enabled) return { ok: false, message: 'TESA entegrasyonu kapalı' };

  const relay = await relayTesaThroughElektra('encode', { ...req, encoderNumber: cfg.encoderNumber });
  if (relay) return relay;

  const lockRoom = mapRoom(req.roomNo, cfg.roomMappings);
  const msg = buildCheckInMessage(cfg.encoderNumber, lockRoom, req);
  const displayMsg = msg.replace(/\x02/g, '<STX>').replace(/\x03/g, '<ETX>');

  try {
    const raw = await sendTcp(cfg.host, cfg.port, msg, TESA_DEFAULTS.timeoutMs);
    const parsed = parseHt24Response(raw);
    return {
      ok: parsed.ok,
      message: parsed.ok ? `Oda kartı encode edildi — Oda ${req.roomNo}` : `TESA hata: ${parsed.detail || parsed.code}`,
      rawRequest: displayMsg,
      rawResponse: raw.replace(/\x02/g, '<STX>').replace(/\x03/g, '<ETX>'),
      encodedAt: new Date().toISOString(),
    };
  } catch (e) {
    if (effectiveSimulateWhenOffline(cfg.simulateWhenOffline)) {
      return {
        ok: true,
        simulated: true,
        message: `[Simülasyon] Kart encode — Oda ${req.roomNo} (${lockRoom})`,
        rawRequest: displayMsg,
        encodedAt: new Date().toISOString(),
      };
    }
    return { ok: false, message: e instanceof Error ? e.message : 'Encode hatası', rawRequest: displayMsg };
  }
}

export async function checkoutGuest(roomNo: string, config?: TesaConfig): Promise<TesaEncodeResult> {
  const cfg = config ?? (await loadTesaConfig());
  const relay = await relayTesaThroughElektra('checkout', { roomNo, encoderNumber: cfg.encoderNumber });
  if (relay) return relay;

  const lockRoom = mapRoom(roomNo, cfg.roomMappings);
  const msg = buildCheckOutMessage(cfg.encoderNumber, lockRoom);
  try {
    const raw = await sendTcp(cfg.host, cfg.port, msg, TESA_DEFAULTS.timeoutMs);
    const parsed = parseHt24Response(raw);
    return { ok: parsed.ok, message: parsed.ok ? 'Check-out TESA\'ya iletildi' : parsed.detail };
  } catch (e) {
    if (effectiveSimulateWhenOffline(cfg.simulateWhenOffline)) return { ok: true, simulated: true, message: `[Simülasyon] Check-out — Oda ${roomNo}` };
    return { ok: false, message: e instanceof Error ? e.message : 'Check-out hatası' };
  }
}

export async function copyGuestKey(roomNo: string, keyCount = 1, config?: TesaConfig): Promise<TesaEncodeResult> {
  const cfg = config ?? (await loadTesaConfig());
  const relay = await relayTesaThroughElektra('copy', { roomNo, keyCount, encoderNumber: cfg.encoderNumber });
  if (relay) return relay;

  const lockRoom = mapRoom(roomNo, cfg.roomMappings);
  const msg = buildCopyKeyMessage(cfg.encoderNumber, lockRoom, keyCount);
  try {
    const raw = await sendTcp(cfg.host, cfg.port, msg, TESA_DEFAULTS.timeoutMs);
    const parsed = parseHt24Response(raw);
    return { ok: parsed.ok, message: parsed.ok ? 'Ek kart encode edildi' : parsed.detail };
  } catch (e) {
    if (effectiveSimulateWhenOffline(cfg.simulateWhenOffline)) return { ok: true, simulated: true, message: `[Simülasyon] Ek kart — Oda ${roomNo}` };
    return { ok: false, message: e instanceof Error ? e.message : 'Kopya kart hatası' };
  }
}
