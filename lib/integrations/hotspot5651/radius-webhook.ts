import type { ParsedBridgeEvent } from '@/lib/integrations/hotspot5651/parsers';
import { parseRadiusAccounting } from '@/lib/integrations/hotspot5651/parsers';

/** FreeRADIUS, MikroTik, CoovaChilli accounting alanlarını normalize eder */
export function normalizeRadiusAccountingPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = { ...raw };

  for (const [key, value] of Object.entries(raw)) {
    if (key.includes('-') || key.includes(':')) {
      const camel = key.replace(/[-:](.)/g, (_, c: string) => c.toUpperCase());
      flat[camel] = value;
    }
  }

  const statusType = flat.Acct_Status_Type ?? flat.acctStatusType ?? flat.acct_status_type;
  if (statusType !== undefined && flat.status === undefined) {
    flat.status = statusType;
  }

  return flat;
}

export function parseRadiusWebhookBody(
  contentType: string | null,
  bodyText: string,
): Record<string, unknown> | null {
  const ct = contentType?.toLowerCase() ?? '';

  if (ct.includes('application/json')) {
    try {
      const json = JSON.parse(bodyText) as Record<string, unknown> | Record<string, unknown>[];
      if (Array.isArray(json)) return json[0] ?? null;
      return json;
    } catch {
      return null;
    }
  }

  if (ct.includes('application/x-www-form-urlencoded') || bodyText.includes('=')) {
    const params = new URLSearchParams(bodyText);
    const obj: Record<string, unknown> = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    return Object.keys(obj).length ? obj : null;
  }

  try {
    return JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function radiusEventSummary(event: ParsedBridgeEvent | null): string {
  if (!event) return 'parse edilemedi';
  return `${event.action} user=${event.authUser ?? '?'} ip=${event.internalIp ?? '?'}`;
}

export const SAMPLE_RADIUS_ACCOUNTING = {
  start: {
    Acct_Status_Type: 'Start',
    User_Name: 'room412',
    Calling_Station_Id: 'AA-BB-CC-11-22-33',
    Framed_IP_Address: '10.10.50.118',
    NAS_IP_Address: '192.168.88.1',
    NAS_Identifier: 'RB5009UG+S+IN',
    NAS_Port: '2152411137',
    Acct_Session_Id: '81a00001',
  },
  stop: {
    Acct_Status_Type: 'Stop',
    User_Name: 'room412',
    Calling_Station_Id: 'AA-BB-CC-11-22-33',
    Framed_IP_Address: '10.10.50.118',
    Acct_Input_Octets: '45200000',
    Acct_Output_Octets: '8100000',
    Acct_Session_Time: '3600',
  },
  interim: {
    Acct_Status_Type: 'Interim-Update',
    User_Name: 'room305',
    Acct_Input_Octets: '120000000',
    Acct_Output_Octets: '22000000',
  },
} as const;

export function parseRadiusWebhook(raw: Record<string, unknown>): ParsedBridgeEvent | null {
  return parseRadiusAccounting(normalizeRadiusAccountingPayload(raw));
}

export function freeradiusRestNotes(): string {
  return `# FreeRADIUS rest modülü — sites-available/default içinde:
accounting {
  rest
}

# mods-available/rest:
connect_uri = "http://ROOMIO_HOST:3100"
radius_auth = "X-Roomio-Bridge-Secret"
radius_acct = "X-Roomio-Bridge-Secret"

# accounting POST → /api/compliance/5651/radius/accounting`;
}
