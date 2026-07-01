export type RoomServiceOrderStatus = 'received' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';

export const ROOM_SERVICE_ORDER_STATUSES: { id: RoomServiceOrderStatus; label: string }[] = [
  { id: 'received', label: 'Alındı' },
  { id: 'preparing', label: 'Hazırlanıyor' },
  { id: 'on_the_way', label: 'Yolda' },
  { id: 'delivered', label: 'Teslim edildi' },
  { id: 'cancelled', label: 'İptal' },
];

export type RoomServiceOrderItem = {
  menuItemId: string;
  name: string;
  price: number;
  currency: string;
  qty: number;
};

export type RoomServiceOrder = {
  id: string;
  roomNo: string;
  guestName: string;
  reservationId?: string;
  items: RoomServiceOrderItem[];
  totalAmount: number;
  currency: string;
  status: RoomServiceOrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type RoomServiceConfig = {
  enabled: boolean;
  serviceHoursStart: string;
  serviceHoursEnd: string;
  estimatedMinutes: number;
  autoConfirm: boolean;
};

export const DEFAULT_ROOM_SERVICE_CONFIG: RoomServiceConfig = {
  enabled: true,
  serviceHoursStart: '00:00',
  serviceHoursEnd: '23:59',
  estimatedMinutes: 30,
  autoConfirm: true,
};

export type RoomServiceStore = {
  config: RoomServiceConfig;
  orders: RoomServiceOrder[];
};

export const DEFAULT_ROOM_SERVICE_STORE: RoomServiceStore = {
  config: DEFAULT_ROOM_SERVICE_CONFIG,
  orders: [],
};
