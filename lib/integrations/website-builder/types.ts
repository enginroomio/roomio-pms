export type WebsiteBuilderConfig = {
  enabled: boolean;
  siteName: string;
  domain: string;
  template: string;
  primaryColor: string;
  showBookingEngine: boolean;
  showGallery: boolean;
  showSpa: boolean;
  languages: string[];
};

export const DEFAULT_WEBSITE_BUILDER_CONFIG: WebsiteBuilderConfig = {
  enabled: true,
  siteName: 'Roomio Hotel',
  domain: 'www.roomio-hotel.com',
  template: 'boutique',
  primaryColor: '#1e3a5f',
  showBookingEngine: true,
  showGallery: true,
  showSpa: true,
  languages: ['tr', 'en', 'de'],
};
