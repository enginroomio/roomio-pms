export type ChannelType = 'ota' | 'meta' | 'offline' | 'direct';

export type ChannelConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export type ChannelCatalogEntry = {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
};

/** Elektraweb kanal yöneticisi sayfasındaki entegre kanallar (özet liste). */
export const CHANNEL_CATALOG: ChannelCatalogEntry[] = [
  { id: 'google', name: 'Google Hotel', type: 'meta' },
  { id: 'booking', name: 'Booking.com', type: 'ota' },
  { id: 'expedia', name: 'Expedia', type: 'ota' },
  { id: 'airbnb', name: 'Airbnb', type: 'ota' },
  { id: 'agoda', name: 'Agoda', type: 'ota' },
  { id: 'hotels-com', name: 'Hotels.com', type: 'ota' },
  { id: 'hotelbeds', name: 'Hotelbeds', type: 'ota' },
  { id: 'odamax', name: 'Odamax', type: 'ota' },
  { id: 'jolly', name: 'Jolly', type: 'ota' },
  { id: 'tatilsepeti', name: 'Tatilsepeti.com', type: 'ota' },
  { id: 'setur', name: 'Setur', type: 'ota' },
  { id: 'etstur', name: 'Etstur', type: 'ota' },
  { id: 'otelz', name: 'Otelz.com', type: 'ota' },
  { id: 'trivago', name: 'trivago', type: 'meta' },
  { id: 'tui', name: 'TUI (Tur Operatörü)', type: 'offline' },
  { id: 'anex', name: 'Anex Tour', type: 'offline' },
  { id: 'paximum', name: 'Paximum', type: 'offline' },
  { id: 'ets', name: 'ETS', type: 'offline' },
  { id: 'roomio-direct', name: 'Roomio Direkt (komisyonsuz)', type: 'direct' },
];

export type ChannelLinkConfig = {
  channelId: string;
  enabled: boolean;
  propertyId: string;
  apiKey: string;
  pushRates: boolean;
  pushAvailability: boolean;
  pullReservations: boolean;
  virtualRoomTypeId?: string;
  lastSyncAt?: string;
  lastSyncStatus?: ChannelConnectionStatus;
  lastSyncMessage?: string;
};

export type VirtualRoomMapping = {
  pmsRoomTypeId: string;
  pmsRoomTypeName: string;
  channelRoomTypeId: string;
  channelRoomTypeName: string;
  allotmentFormula?: string;
};

export type ChannelManagerConfig = {
  enabled: boolean;
  simulateWhenOffline: boolean;
  autoConfirmReservations: boolean;
  compareOfflineRates: boolean;
  syncIntervalMinutes: number;
  channels: ChannelLinkConfig[];
  virtualRoomMappings: VirtualRoomMapping[];
};

export const DEFAULT_CHANNEL_MANAGER_CONFIG: ChannelManagerConfig = {
  enabled: false,
  simulateWhenOffline: true,
  autoConfirmReservations: true,
  compareOfflineRates: true,
  syncIntervalMinutes: 15,
  channels: CHANNEL_CATALOG.map((c) => ({
    channelId: c.id,
    enabled: c.id === 'booking' || c.id === 'expedia' || c.id === 'roomio-direct',
    propertyId: '',
    apiKey: '',
    pushRates: true,
    pushAvailability: true,
    pullReservations: true,
  })),
  virtualRoomMappings: [
    { pmsRoomTypeId: 'STD', pmsRoomTypeName: 'Standart', channelRoomTypeId: 'STD-V', channelRoomTypeName: 'Standart (Sanal)' },
    { pmsRoomTypeId: 'DLX', pmsRoomTypeName: 'Deluxe', channelRoomTypeId: 'DLX-V', channelRoomTypeName: 'Deluxe (Sanal)' },
  ],
};

export type ChannelSyncResult = {
  ok: boolean;
  simulated?: boolean;
  liveMode?: boolean;
  message: string;
  pushedRates: number;
  pushedAvailability: number;
  pulledReservations: number;
  importedReservations?: number;
  channels: Array<{ channelId: string; status: ChannelConnectionStatus; message: string }>;
  logId?: string;
};

/** OTA'dan çekilen rezervasyon — PMS'e aktarım öncesi */
export type ChannelPulledReservation = {
  channelId: string;
  externalRef: string;
  guestName: string;
  email?: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  adults: number;
  children?: number;
  rate: number;
  currency: string;
  mealPlan?: string;
  status: 'new' | 'modified' | 'cancelled';
};

export type ChannelSyncLogEntry = {
  id: string;
  at: string;
  ok: boolean;
  simulated: boolean;
  liveMode: boolean;
  testOnly: boolean;
  pushedRates: number;
  pushedAvailability: number;
  pulledReservations: number;
  importedReservations: number;
  message: string;
  channels: Array<{ channelId: string; status: string; message: string }>;
};
