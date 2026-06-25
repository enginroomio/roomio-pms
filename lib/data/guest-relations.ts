import { PROPERTY } from '@/lib/navigation';

export type GuestReview = {
  id: string;
  date: string;
  guestName: string;
  roomNo: string;
  stayRange: string;
  source: string;
  rating: number;
  title: string;
  comment: string;
  response?: string;
  status: 'answered' | 'pending';
  lang: 'TR' | 'EN';
};

export type DailyActivity = {
  id: string;
  date: string;
  time: string;
  type: string;
  description: string;
  guest: string;
  roomNo: string;
  staff: string;
  department: string;
};

export type GuestActivity = {
  id: string;
  datetime: string;
  guestName: string;
  roomNo: string;
  nationality: string;
  activity: string;
  description: string;
  staff: string;
};

export type VipGuest = {
  id: string;
  level: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  guestName: string;
  country: string;
  arrival: string;
  departure: string;
  nights: number;
  room: string;
  status: 'Konaklıyor' | 'Giriş Yapacak' | 'Konaklayacak' | 'İptal';
};

export type TraceItem = {
  id: string;
  date: string;
  guest: string;
  roomNo: string;
  subject: string;
  due: string;
  status: 'Açık' | 'Tamamlandı';
  assignee: string;
};

export type FacilityBooking = {
  id: string;
  date: string;
  time: string;
  guest: string;
  roomNo: string;
  party: number;
  status: 'Onaylı' | 'Bekliyor' | 'İptal';
  notes?: string;
};

export type ComplaintItem = {
  id: string;
  date: string;
  roomNo: string;
  guest: string;
  category: string;
  description: string;
  priority: 'Normal' | 'Acil';
  status: 'Açık' | 'Çözüldü';
};

export type LostFoundItem = {
  id: string;
  date: string;
  type: 'Kayıp' | 'Buluntu';
  item: string;
  location: string;
  guest?: string;
  roomNo?: string;
  status: 'Açık' | 'Teslim';
};

export type ReclamationCase = {
  id: string;
  refNo: string;
  date: string;
  guest: string;
  roomNo: string;
  subject: string;
  compensation: string;
  status: 'İncelemede' | 'Onaylandı' | 'Reddedildi' | 'Kapandı';
};

export type RepeatGuest = {
  id: string;
  guestName: string;
  visits: number;
  lastStay: string;
  totalNights: number;
  segment: string;
  email?: string;
};

export type InHouseGuestRow = {
  id: string;
  roomNo: string;
  guestName: string;
  nationality: string;
  arrival: string;
  departure: string;
  vip?: boolean;
};

export type InfoRackRow = {
  id: string;
  roomNo: string;
  guestName: string;
  title: string;
  language: string;
  notes: string;
};

export const DEMO_REVIEWS: GuestReview[] = [
  { id: '1', date: '2026-05-20 14:32', guestName: 'John Smith', roomNo: '312', stayRange: '18.05–22.05', source: 'Booking.com', rating: 5, title: 'Harika konaklama', comment: 'Oda çok temizdi, personel son derece yardımseverdi.', response: 'Teşekkür ederiz, sizi tekrar ağırlamaktan mutluluk duyarız.', status: 'answered', lang: 'EN' },
  { id: '2', date: '2026-05-19 09:15', guestName: 'Maria Garcia', roomNo: '205', stayRange: '17.05–20.05', source: 'Google', rating: 4, title: 'Güzel otel', comment: 'Konum mükemmel, kahvaltı çeşitliliği artırılabilir.', response: 'Geri bildiriminiz için teşekkürler.', status: 'answered', lang: 'EN' },
  { id: '3', date: '2026-05-18 22:40', guestName: 'Ahmet Yılmaz', roomNo: '401', stayRange: '15.05–19.05', source: 'Tripadvisor', rating: 3, title: 'Ortalama', comment: 'Oda gürültülüydü, gece uykusu zor oldu.', status: 'pending', lang: 'TR' },
  { id: '4', date: '2026-05-17 11:05', guestName: 'Sophie Martin', roomNo: '108', stayRange: '16.05–18.05', source: 'Otel Web', rating: 5, title: 'Mükemmel hizmet', comment: 'Concierge ekibi harikaydı.', response: 'Merci beaucoup!', status: 'answered', lang: 'EN' },
  { id: '5', date: '2026-05-15 16:20', guestName: 'James Miller', roomNo: '205', stayRange: '14.05–16.05', source: 'Booking.com', rating: 4, title: 'İş seyahati için ideal', comment: 'Wi-Fi hızlı, check-in sorunsuz.', status: 'pending', lang: 'EN' },
];

export const DEMO_DAILY_ACTIVITIES: DailyActivity[] = [
  { id: '1', date: '2026-06-18', time: '08:45', type: 'Karşılama', description: 'VIP misafir otele giriş yaptı', guest: 'Mr. John Smith', roomNo: '312', staff: 'Ayşe Yılmaz', department: 'Ön Büro' },
  { id: '2', date: '2026-06-18', time: '09:30', type: 'Bilgilendirme', description: 'Spa randevusu hakkında bilgi verildi', guest: 'Ms. Maria Garcia', roomNo: '205', staff: 'Mehmet Can', department: 'Misafir İlişkileri' },
  { id: '3', date: '2026-06-18', time: '10:15', type: 'Özel İstek', description: 'Ek yastık talebi karşılandı', guest: 'Mr. David Johnson', roomNo: '401', staff: 'Elif Kaya', department: 'Kat Hizmetleri' },
  { id: '4', date: '2026-06-18', time: '11:00', type: 'Şikayet', description: 'Klima arızası şikayeti alındı', guest: 'Mr. Ahmet Demir', roomNo: '108', staff: 'Murat S.', department: 'Teknik Servis' },
  { id: '5', date: '2026-06-18', time: '12:30', type: 'Teşekkür', description: 'Misafir personeli teşekkür etti', guest: 'Ms. Sophie Martin', roomNo: '502', staff: 'Zeynep A.', department: 'Misafir İlişkileri' },
  { id: '6', date: '2026-06-18', time: '14:00', type: 'Rezervasyon', description: 'Restoran akşam rezervasyonu yapıldı', guest: 'Mr. James Miller', roomNo: '205', staff: 'Ayşe Yılmaz', department: 'F&B' },
  { id: '7', date: '2026-06-18', time: '15:20', type: 'Doğum Günü', description: 'Pastalı sürpriz odaya gönderildi', guest: 'Ms. Elena Rossi', roomNo: '305', staff: 'Elif Kaya', department: 'Misafir İlişkileri' },
  { id: '8', date: '2026-06-18', time: '16:45', type: 'Ulaşım', description: 'Havalimanı transferi ayarlandı', guest: 'Mr. John Smith', roomNo: '312', staff: 'Mehmet Can', department: 'Ön Büro' },
];

export const DEMO_GUEST_ACTIVITIES: GuestActivity[] = [
  { id: '1', datetime: '2026-06-18 09:15', guestName: 'John SMITH', roomNo: '312', nationality: 'United Kingdom', activity: 'Doğum Günü', description: 'Misafire doğum günü sürprizi yapıldı.', staff: 'SELİN' },
  { id: '2', datetime: '2026-06-18 10:30', guestName: 'Maria GARCIA', roomNo: '205', nationality: 'Spain', activity: 'Evlilik Yıldönümü', description: 'Odaya şarap ve meyve sepeti ikram edildi.', staff: 'AYŞE' },
  { id: '3', datetime: '2026-06-18 11:45', guestName: 'Ahmet YILMAZ', roomNo: '401', nationality: 'Türkiye', activity: 'Özel Misafir', description: 'Late check-out onaylandı.', staff: 'MEHMET' },
  { id: '4', datetime: '2026-06-18 14:10', guestName: 'David JOHNSON', roomNo: '502', nationality: 'United States', activity: 'VIP', description: 'VIP karşılama ve oda upgrade yapıldı.', staff: 'MEHMET' },
];

export const DEMO_VIP_GUESTS: VipGuest[] = [
  { id: '1', level: 'Platinum', guestName: 'Mr. John Smith', country: 'United Kingdom', arrival: '18.06.2026', departure: '22.06.2026', nights: 4, room: '312 (SUI)', status: 'Konaklıyor' },
  { id: '2', level: 'Gold', guestName: 'Ms. Maria Garcia', country: 'Spain', arrival: '20.06.2026', departure: '25.06.2026', nights: 5, room: '401 (DLX)', status: 'Giriş Yapacak' },
  { id: '3', level: 'Silver', guestName: 'Mr. James Miller', country: 'United States', arrival: '18.06.2026', departure: '20.06.2026', nights: 2, room: '205 (SUP)', status: 'Konaklıyor' },
  { id: '4', level: 'Bronze', guestName: 'Ms. Elena Rossi', country: 'Italy', arrival: '19.06.2026', departure: '21.06.2026', nights: 2, room: '108 (DLX)', status: 'Konaklayacak' },
];

export const DEMO_TRACES: TraceItem[] = [
  { id: '1', date: '2026-06-18', guest: 'John Smith', roomNo: '312', subject: 'Havalimanı transfer 06:00', due: '19.06 06:00', status: 'Açık', assignee: 'Ön Büro' },
  { id: '2', date: '2026-06-18', guest: 'James Miller', roomNo: '205', subject: 'Ek havlu seti', due: '18.06 18:00', status: 'Tamamlandı', assignee: 'Kat HK' },
];

export const DEMO_RESTAURANT: FacilityBooking[] = [
  { id: '1', date: '2026-06-18', time: '20:00', guest: 'John Smith', roomNo: '312', party: 2, status: 'Onaylı', notes: 'Pencere kenarı' },
  { id: '2', date: '2026-06-19', time: '19:30', guest: 'Maria Garcia', roomNo: '205', party: 4, status: 'Bekliyor' },
];

export const DEMO_TENNIS: FacilityBooking[] = [
  { id: '1', date: '2026-06-18', time: '17:00', guest: 'David Johnson', roomNo: '502', party: 2, status: 'Onaylı' },
];

export const DEMO_SPA: FacilityBooking[] = [
  { id: '1', date: '2026-06-19', time: '14:00', guest: 'Sophie Martin', roomNo: '415', party: 1, status: 'Onaylı', notes: 'Klasik Masaj (60 dk)' },
  { id: '2', date: '2026-06-19', time: '16:30', guest: 'John Smith', roomNo: '312', party: 2, status: 'Bekliyor', notes: 'Çift Masajı' },
];

export const DEMO_GYM: FacilityBooking[] = [
  { id: '1', date: '2026-06-19', time: '07:00', guest: 'Maria Garcia', roomNo: '205', party: 1, status: 'Onaylı', notes: 'Sabah Yoga' },
  { id: '2', date: '2026-06-19', time: '18:00', guest: 'David Johnson', roomNo: '502', party: 1, status: 'Bekliyor', notes: 'Spinning' },
];

export const DEMO_COMPLAINTS: ComplaintItem[] = [
  { id: '1', date: '2026-06-18', roomNo: '108', guest: 'Ahmet Demir', category: 'Klima', description: 'Oda soğutmuyor', priority: 'Acil', status: 'Açık' },
  { id: '2', date: '2026-06-17', roomNo: '415', guest: 'Sophie Martin', category: 'Gürültü', description: 'Koridor gürültüsü', priority: 'Normal', status: 'Çözüldü' },
];

export const DEMO_LOST_FOUND: LostFoundItem[] = [
  { id: '1', date: '2026-06-18', type: 'Buluntu', item: 'Siyah cüzdan', location: 'Lobby', status: 'Açık' },
  { id: '2', date: '2026-06-17', type: 'Kayıp', item: 'AirPods', location: 'Oda 205', guest: 'James Miller', roomNo: '205', status: 'Teslim' },
];

export const DEMO_RECLAMATIONS: ReclamationCase[] = [
  { id: '1', refNo: 'RKL-2026-004', date: '2026-06-15', guest: 'Ahmet Yılmaz', roomNo: '401', subject: 'Gürültü nedeniyle indirim talebi', compensation: '%15 indirim', status: 'Onaylandı' },
  { id: '2', refNo: 'RKL-2026-005', date: '2026-06-18', guest: 'Maria Garcia', roomNo: '205', subject: 'Kahvaltı kalitesi', compensation: 'Ücretsiz akşam yemeği', status: 'İncelemede' },
];

export const DEMO_REPEAT_GUESTS: RepeatGuest[] = [
  { id: '1', guestName: 'John Smith', visits: 8, lastStay: '2026-06-18', totalNights: 42, segment: 'Platinum', email: 'john@corp.com' },
  { id: '2', guestName: 'James Miller', visits: 5, lastStay: '2026-06-18', totalNights: 18, segment: 'Gold' },
  { id: '3', guestName: 'Ayşe Yılmaz', visits: 3, lastStay: '2026-05-10', totalNights: 9, segment: 'Silver' },
];

export const DEMO_GR_INHOUSE: InHouseGuestRow[] = [
  { id: '1', roomNo: '312', guestName: 'Ayşe Yılmaz', nationality: 'Türkiye', arrival: '18.06', departure: '22.06', vip: true },
  { id: '2', roomNo: '205', guestName: 'James Miller', nationality: 'ABD', arrival: '18.06', departure: '20.06' },
];

export const DEMO_INFO_RACK: InfoRackRow[] = [
  { id: '1', roomNo: '312', guestName: 'Ayşe Yılmaz', title: 'Mrs', language: 'TR', notes: 'VIP — doğum günü 20.06' },
  { id: '2', roomNo: '205', guestName: 'James Miller', title: 'Mr', language: 'EN', notes: 'Erken çıkış olası' },
];

export const WEATHER_TODAY = { date: PROPERTY.businessDate, city: 'İstanbul', temp: '24°C', condition: 'Parçalı bulutlu', humidity: '%58', wind: '12 km/s' };

export const WEATHER_FORECAST = [
  { day: '19.06', high: 26, low: 18, condition: 'Güneşli' },
  { day: '20.06', high: 28, low: 19, condition: 'Açık' },
  { day: '21.06', high: 27, low: 20, condition: 'Parçalı bulutlu' },
  { day: '22.06', high: 25, low: 17, condition: 'Yağmurlu' },
  { day: '23.06', high: 24, low: 16, condition: 'Bulutlu' },
];

export const REVIEW_SOURCES = ['Tümü', 'Booking.com', 'Google', 'Tripadvisor', 'Otel Web'];
export const REVIEW_CATEGORIES = ['Hizmet - Oda', 'Hizmet - Resepsiyon', 'Yiyecek & İçecek', 'Temizlik', 'Genel'];
