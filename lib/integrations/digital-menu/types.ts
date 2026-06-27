export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  allergens?: string;
  available: boolean;
};

export type DigitalMenuConfig = {
  enabled: boolean;
  hotelName: string;
  qrTableOrdering: boolean;
  sendToKitchen: boolean;
  items: MenuItem[];
};

export const DEFAULT_DIGITAL_MENU_CONFIG: DigitalMenuConfig = {
  enabled: true,
  hotelName: 'Roomio Hotel',
  qrTableOrdering: true,
  sendToKitchen: true,
  items: [
    { id: '1', category: 'Başlangıç', name: 'Çoban Salata', price: 180, currency: 'TRY', available: true },
    { id: '2', category: 'Ana Yemek', name: 'Izgara Somon', description: 'Sebze garnitürü', price: 520, currency: 'TRY', available: true },
    { id: '3', category: 'Ana Yemek', name: 'Kuzu İncik', price: 640, currency: 'TRY', available: true },
    { id: '4', category: 'İçecek', name: 'Taze Sıkılmış Portakal', price: 120, currency: 'TRY', available: true },
    { id: '5', category: 'Tatlı', name: 'Künefe', price: 220, currency: 'TRY', available: true },
  ],
};
