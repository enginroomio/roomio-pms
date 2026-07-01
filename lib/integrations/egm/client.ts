import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';
import type { EgmIdentityRecord } from '@/lib/egm/types';

export type EgmSubmitResult = {
  ok: boolean;
  egmRef?: string;
  simulated?: boolean;
  message: string;
  rawResponse?: string;
};

export type EgmGatewayConfig = {
  gatewayUrl: string;
  apiKey: string;
  facilityCode: string;
  simulateWhenOffline: boolean;
};

export function loadEgmConfig(): EgmGatewayConfig {
  return {
    gatewayUrl: process.env.ROOMIO_EGM_GATEWAY_URL?.trim() ?? '',
    apiKey: process.env.ROOMIO_EGM_API_KEY?.trim() ?? '',
    facilityCode: process.env.ROOMIO_EGM_FACILITY_CODE?.trim() ?? 'SAPPHIRE',
    simulateWhenOffline: process.env.ROOMIO_EGM_SIMULATE !== '0',
  };
}

export function isEgmLiveMode(): boolean {
  return process.env.ROOMIO_EGM_LIVE === '1'
    || process.env.ROOMIO_EGM_LIVE === 'true'
    || process.env.ROOMIO_INTEGRATION_LIVE === '1'
    || process.env.ROOMIO_INTEGRATION_LIVE === 'true';
}

export type EgmNoticeType = 'arrival' | 'departure';

export async function submitEgmToGateway(
  record: Pick<
    EgmIdentityRecord,
    | 'firstName'
    | 'lastName'
    | 'roomNo'
    | 'nationality'
    | 'idNo'
    | 'idType'
    | 'birthDate'
    | 'birthPlace'
    | 'gender'
    | 'fatherName'
    | 'motherName'
    | 'checkIn'
    | 'checkOut'
  >,
  config = loadEgmConfig(),
  noticeType: EgmNoticeType = 'arrival',
): Promise<EgmSubmitResult> {
  const refPrefix = noticeType === 'departure' ? 'EGM-OUT' : 'EGM';
  if (!config.gatewayUrl) {
    if (effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
      return {
        ok: true,
        simulated: true,
        egmRef: `${refPrefix}-SIM-${Date.now().toString(36).toUpperCase()}`,
        message: noticeType === 'departure'
          ? 'Simülasyon — EGM/KBS çıkış bildirimi: gateway URL tanımlı değil'
          : 'Simülasyon — EGM/KBS gateway URL tanımlı değil',
      };
    }
    return { ok: false, message: 'ROOMIO_EGM_GATEWAY_URL tanımlı değil' };
  }

  const payload = {
    facilityCode: config.facilityCode,
    noticeType,
    guest: {
      firstName: record.firstName,
      lastName: record.lastName,
      roomNo: record.roomNo,
      nationality: record.nationality,
      idNo: record.idNo,
      idType: record.idType ?? 'TCKN',
      birthDate: record.birthDate,
      birthPlace: record.birthPlace,
      gender: record.gender,
      fatherName: record.fatherName,
      motherName: record.motherName,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
    },
  };

  try {
    const res = await fetch(config.gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const raw = await res.text();
    if (!res.ok) {
      if (effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
        return {
          ok: true,
          simulated: true,
          egmRef: `${refPrefix}-SIM-${Date.now().toString(36).toUpperCase()}`,
          message: 'Simülasyon — EGM gateway yanıt vermedi',
          rawResponse: raw.slice(0, 500),
        };
      }
      return { ok: false, message: `EGM gateway HTTP ${res.status}`, rawResponse: raw.slice(0, 500) };
    }

    let egmRef = `${refPrefix}-${Date.now().toString(36).toUpperCase()}`;
    try {
      const parsed = JSON.parse(raw) as { ref?: string; egmRef?: string };
      egmRef = parsed.egmRef ?? parsed.ref ?? egmRef;
    } catch {
      /* plain text ref */
    }
    return {
      ok: true,
      egmRef,
      message: noticeType === 'departure' ? 'EGM/KBS çıkış bildirimi gönderildi' : 'EGM/KBS bildirimi gönderildi',
    };
  } catch (e) {
    if (effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
      return {
        ok: true,
        simulated: true,
        egmRef: `${refPrefix}-SIM-${Date.now().toString(36).toUpperCase()}`,
        message: 'Simülasyon — EGM gateway erişilemedi',
      };
    }
    return { ok: false, message: e instanceof Error ? e.message : 'EGM bağlantı hatası' };
  }
}

export async function testEgmConnection(config = loadEgmConfig()): Promise<EgmSubmitResult> {
  return submitEgmToGateway({
    firstName: 'Test',
    lastName: 'Misafir',
    roomNo: '101',
    nationality: 'TR',
    idNo: '10000000146',
    idType: 'TCKN',
    birthDate: '1990-01-01',
    birthPlace: 'İstanbul',
    gender: 'E',
    fatherName: 'Test',
    motherName: 'Test',
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  }, config);
}
