export type IcalChannel = 'booking' | 'expedia' | 'other';

export type IcalFeedConfig = {
  id: string;
  label: string;
  channel: IcalChannel;
  roomType: string;
  url: string;
  createdAt: string;
  lastPulledAt?: string;
};

export type IcalImportStore = {
  feeds: IcalFeedConfig[];
};

export const DEFAULT_ICAL_IMPORT_STORE: IcalImportStore = { feeds: [] };

/** Tek bir VEVENT'ten çıkarılan ham satır — guestNameRaw genelde sadece misafirin adıdır (Booking.com SUMMARY alanı). */
export type IcalPulledRow = {
  uid: string;
  checkIn: string;
  checkOut: string;
  guestNameRaw: string;
  roomType: string;
  channel: IcalChannel;
  isBlock: boolean;
};
