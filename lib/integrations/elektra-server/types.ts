/** SNI Elektra v5 sunucu — servis programları köprüsü (TGA, TIH/EGM, TESA, Grandstream) */

export const ELEKTRA_SERVER_DEFAULTS = {
  port: 8843,
  apiPath: '/elektra/v5/services',
  timeoutMs: 20000,
};

export type ElektraRelayServices = {
  /** TGA segment & kanal rapor gönderimi */
  tga: boolean;
  /** TIH — check-in sonrası otomatik EGM/KBS kimlik bildirimi */
  tih: boolean;
  /** TIS — Turizm İstatistik bildirimi */
  tis: boolean;
  /** TESA HT24 kapı kartı */
  tesa: boolean;
  /** Grandstream / Gulf Stream santral PMS API */
  pbx: boolean;
};

export type ElektraServerConfig = {
  enabled: boolean;
  /** Elektra v5 sunucu IP veya hostname */
  host: string;
  port: number;
  /** Otel / tesis kodu (Elektra kuruluş kodu) */
  hotelCode: string;
  username: string;
  password: string;
  useHttps: boolean;
  simulateWhenOffline: boolean;
  /** Servis programları bu sunucu üzerinden yönlendirilsin */
  relayServices: ElektraRelayServices;
};

export type ElektraActionResult = {
  ok: boolean;
  simulated?: boolean;
  message: string;
  rawRequest?: string;
  rawResponse?: string;
};

export const DEFAULT_ELEKTRA_SERVER_CONFIG: ElektraServerConfig = {
  enabled: false,
  host: '192.168.1.10',
  port: ELEKTRA_SERVER_DEFAULTS.port,
  hotelCode: 'HOTEL01',
  username: 'roomio',
  password: '',
  useHttps: false,
  simulateWhenOffline: true,
  relayServices: {
    tga: true,
    tih: true,
    tis: true,
    tesa: true,
    pbx: true,
  },
};
