export type FairEvent = {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  capacity: number;
  registered: number;
  open: boolean;
};

export type FairEventsConfig = {
  enabled: boolean;
  organizerName: string;
  allowOnlineRegistration: boolean;
  qrCheckIn: boolean;
  events: FairEvent[];
};

export const DEFAULT_FAIR_EVENTS_CONFIG: FairEventsConfig = {
  enabled: true,
  organizerName: 'Roomio Events',
  allowOnlineRegistration: true,
  qrCheckIn: true,
  events: [
    { id: 'f1', name: 'Turizm Teknolojileri Fuarı', venue: 'Salon A', startDate: '2026-09-15', endDate: '2026-09-17', capacity: 500, registered: 120, open: true },
    { id: 'f2', name: 'Otel Yöneticileri Sempozyumu', venue: 'Konferans', startDate: '2026-10-05', endDate: '2026-10-05', capacity: 200, registered: 85, open: true },
  ],
};

export type FairRegistration = {
  id: string;
  eventId: string;
  name: string;
  company: string;
  email: string;
  createdAt: string;
};
