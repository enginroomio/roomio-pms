/** 5651 sayılı kanun & BTK — otel hotspot trafik loglama */

export const LAW_5651_RETENTION_DAYS_DEFAULT = 730; // 2 yıl (otel uygulaması)

export type Hotspot5651Config = {
  enabled: boolean;
  /** İşletme / tesis unvanı (BTK bildiriminde) */
  facilityName: string;
  /** BTK kayıt / bildirim referansı */
  btkRegistrationNo: string;
  /** Hotspot sağlayıcı veya captive portal */
  provider: 'mikrotik' | 'unifi' | 'fortigate' | 'custom' | 'manual';
  radiusHost: string;
  radiusPort: number;
  syslogHost: string;
  syslogPort: number;
  /** Log saklama süresi (gün) — min 365 */
  retentionDays: number;
  /** Misafir kimlik doğrulama zorunlu */
  requireGuestAuth: boolean;
  /** Oda no ile eşleştirme */
  linkToPmsGuest: boolean;
  /** Otomatik arşivleme */
  autoArchive: boolean;
  notifyEmail: string;
  lastBtkExportAt: string | null;
  /** HTTP köprü — MikroTik/UniFi syslog veya RADIUS accounting webhook */
  bridgeEnabled: boolean;
  bridgeSecret: string;
  /** Check-in sırasında WiFi oturumu provizyonu */
  autoOpenOnCheckIn: boolean;
  /** Check-out sırasında oturumu kapat */
  autoCloseOnCheckOut: boolean;
  /** Misafir captive portal (5651 kimlik doğrulama) */
  captivePortalEnabled: boolean;
  captivePortalUrl: string;
  /** Tek misafir bilgisiyle eşzamanlı bağlanabilecek maksimum cihaz sayısı */
  maxDevicesPerUser: number;
  /** RADIUS accounting webhook — FreeRADIUS / MikroTik */
  radiusWebhookEnabled: boolean;
  /** Arka plan otomasyonu */
  automationEnabled: boolean;
  automationIntervalMinutes: number;
  autoSyncDevices: boolean;
  autoProvisionInHouse: boolean;
  autoTesaOnCheckIn: boolean;
  lastAutomationRun: string | null;
  mikrotik: MikrotikDeviceConfig;
  /** Ubiquiti UniFi — Access Point / Controller */
  unifi: UnifiDeviceConfig;
};

export type MikrotikDeviceConfig = {
  enabled: boolean;
  label: string;
  /** Cihaz modeli — örn. RB5009UG+S+IN */
  model: string;
  host: string;
  restPort: number;
  useHttps: boolean;
  username: string;
  password: string;
  hotspotServer: string;
  hotspotProfile: string;
  /** WAN arayüzü (RB5009: genelde ether1) */
  wanInterface: string;
  /** LAN/UniFi trunk bridge */
  lanBridge: string;
  /** Misafir VLAN arayüzü */
  guestInterface: string;
  role: 'switch' | 'router' | 'gateway';
  syslogToRoomio: boolean;
  simulateWhenOffline: boolean;
};

export const MIKROTIK_MODELS = [
  { id: 'RB5009UG+S+IN', label: 'RB5009UG+S+IN — 8×1G + 2.5G SFP+ Router' },
  { id: 'CCR2004-1G-12S+2XS', label: 'CCR2004 — Core Router' },
  { id: 'CRS328-24P-4S+', label: 'CRS328 — PoE Switch' },
  { id: 'hAP-ac3', label: 'hAP ac³ — Access Point' },
  { id: 'custom', label: 'Özel / Diğer' },
] as const;

export type UnifiDeviceConfig = {
  enabled: boolean;
  label: string;
  controllerUrl: string;
  username: string;
  password: string;
  siteId: string;
  guestWlan: string;
  guestVlan: number;
  /** Kayıtlı AP sayısı (bilgi) */
  apCount: number;
  simulateWhenOffline: boolean;
};

export type DeviceTestResult = {
  ok: boolean;
  device: 'mikrotik' | 'unifi';
  message: string;
  simulated?: boolean;
  details?: Record<string, unknown>;
};

export type GuestWifiCredential = {
  roomNo: string;
  authUser: string;
  password: string;
  guestName: string;
  reservationId: string | null;
  expiresAt: string;
  createdAt: string;
  active: boolean;
};

export type HotspotSessionLog = {
  id: string;
  /** Oturum başlangıç (ISO) */
  startedAt: string;
  /** Oturum bitiş — açık oturumda null */
  endedAt: string | null;
  /** İç IP (DHCP) */
  internalIp: string;
  internalPort: number;
  /** NAT dış IP */
  externalIp: string;
  externalPort: number;
  /** MAC adresi */
  macAddress: string;
  /** Aktarılan veri (byte) */
  bytesIn: number;
  bytesOut: number;
  /** Kimlik — 5651 md.6 */
  guestName: string;
  guestIdType: 'tc' | 'passport' | 'foreign_id' | 'room_guest';
  guestIdMasked: string;
  roomNo: string | null;
  reservationId: string | null;
  /** Captive portal / RADIUS kullanıcı adı */
  authUser: string | null;
  /** Kaynak: syslog, radius, manual, api */
  source: 'syslog' | 'radius' | 'manual' | 'api';
  userAgent: string | null;
  hotspotZone: string | null;
  btkCompliant: boolean;
  createdAt: string;
  /** PMS check-in ile açılmış, cihaz henüz bağlanmamış */
  provisioned?: boolean;
};

export type BtkExportBundle = {
  exportedAt: string;
  facilityName: string;
  btkRegistrationNo: string;
  periodFrom: string;
  periodTo: string;
  recordCount: number;
  lawReference: '5651/2007 md.6';
  format: 'btk-csv-v1';
  rows: HotspotSessionLog[];
};

export const DEFAULT_HOTSPOT_5651_CONFIG: Hotspot5651Config = {
  enabled: true,
  facilityName: 'Hotel Sapphire İstanbul',
  btkRegistrationNo: '',
  provider: 'mikrotik',
  radiusHost: '127.0.0.1',
  radiusPort: 1812,
  syslogHost: '127.0.0.1',
  syslogPort: 514,
  retentionDays: LAW_5651_RETENTION_DAYS_DEFAULT,
  requireGuestAuth: true,
  linkToPmsGuest: true,
  autoArchive: true,
  notifyEmail: '',
  lastBtkExportAt: null,
  bridgeEnabled: true,
  bridgeSecret: 'roomio-bridge-dev',
  autoOpenOnCheckIn: true,
  autoCloseOnCheckOut: true,
  captivePortalEnabled: true,
  captivePortalUrl: '/wifi',
  maxDevicesPerUser: 5,
  radiusWebhookEnabled: true,
  automationEnabled: true,
  automationIntervalMinutes: 5,
  autoSyncDevices: true,
  autoProvisionInHouse: true,
  autoTesaOnCheckIn: true,
  lastAutomationRun: null,
  mikrotik: {
    enabled: true,
    label: 'MikroTik Gateway — Hotel Sapphire',
    model: 'RB5009UG+S+IN',
    host: '192.168.88.1',
    restPort: 443,
    useHttps: true,
    username: 'admin',
    password: '',
    hotspotServer: 'roomio-hotspot',
    hotspotProfile: 'hotel-guest',
    wanInterface: 'ether1',
    lanBridge: 'bridge-lan',
    guestInterface: 'vlan50-guest',
    role: 'gateway',
    syslogToRoomio: true,
    simulateWhenOffline: true,
  },
  unifi: {
    enabled: true,
    label: 'UniFi Access Points',
    controllerUrl: 'https://192.168.1.1:8443',
    username: 'admin',
    password: '',
    siteId: 'default',
    guestWlan: 'Hotel-Guest',
    guestVlan: 50,
    apCount: 12,
    simulateWhenOffline: true,
  },
};

export type Hotspot5651Store = {
  config: Hotspot5651Config;
  logs: HotspotSessionLog[];
  credentials: GuestWifiCredential[];
  updatedAt: string;
};
