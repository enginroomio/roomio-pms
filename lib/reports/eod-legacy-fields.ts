/** Gün sonu GR raporları — rapor sihirbazı alan anahtarları */

export const EOD_LEGACY_FIELD_KEYS = [
  'roomNo',
  'roomType',
  'agency',
  'vip',
  'rpt',
  'guestName',
  'checkIn',
  'checkInTime',
  'checkOut',
  'adults',
  'child1',
  'child2',
  'totalGuests',
  'baby',
  'board',
  'note',
  'status',
  'folioNo',
  'transactionType',
  'description',
  'amount',
  'debit',
  'credit',
  'account',
  'invoiceNo',
  'department',
  'balance',
  'currency',
  'user',
  'occupancy',
  'revenue',
  'adr',
  'revpar',
  'businessDate',
  'closedBy',
  'voucherNo',
  'paymentType',
  'roomPrice',
  'collectedAmount',
  'reservationNo',
  'rn',
  'folioType',
  'totalAmount',
  'basePrice',
  'exchangeRate',
  'billNo',
  'originalCheckOut',
  'penaltyTotal',
  'recordNo',
  'checkoutNote',
  'roomCount',
  'bookingType',
  'confirmationNo',
  'reservationType',
  'bpt',
  'hsekli',
  'roomNote',
  'stayForm',
  'xbr',
  'priceDescription',
  'takenDate',
  'folioAmount',
  'rowNo',
  'deptNo',
  'deptName',
  'revenueGroup',
  'documentNo',
  'payer',
  'authorizedBy',
  'idNo',
  'firstName',
  'lastName',
  'birthPlace',
  'birthDate',
  'fatherName',
  'motherName',
  'idType',
  'idSerial',
  'nationality',
  'openingBalance',
  'roomRevenue',
  'fbRevenue',
  'otherRevenue',
  'closingBalance',
  'fxReceived',
  'fxGiven',
  'fxReceivedAmt',
  'fxGivenAmt',
  'masterFolioNo',
  'accountNo',
  'foreignAmount',
  'paymentMethod',
  'entryNo',
  'transactionKind',
  'fxCode',
  'tlAmount',
  'productName',
  'time',
] as const;

export type EodLegacyFieldKey = (typeof EOD_LEGACY_FIELD_KEYS)[number];

export const EOD_LEGACY_FIELD_DEFS: {
  key: EodLegacyFieldKey;
  label: string;
  sample: string;
  group: string;
}[] = [
  { key: 'roomNo', label: 'Oda', sample: '208', group: 'Oda' },
  { key: 'roomType', label: 'Tipi', sample: 'DBL', group: 'Oda' },
  { key: 'agency', label: 'Acenta', sample: 'BOOKING-NB', group: 'Satış' },
  { key: 'vip', label: 'Vip', sample: '', group: 'Misafir' },
  { key: 'rpt', label: 'Rpt', sample: '', group: 'Misafir' },
  { key: 'guestName', label: '1.Misafir', sample: 'ABDULLA ALAMERI', group: 'Misafir' },
  { key: 'checkIn', label: 'C/In', sample: '27.06', group: 'Tarih' },
  { key: 'checkInTime', label: 'Saati', sample: '12:00', group: 'Tarih' },
  { key: 'checkOut', label: 'C/Out', sample: '05.07', group: 'Tarih' },
  { key: 'adults', label: 'Ytak', sample: '2', group: 'Pax' },
  { key: 'child1', label: 'Çck1', sample: '0', group: 'Pax' },
  { key: 'child2', label: 'Çck2', sample: '0', group: 'Pax' },
  { key: 'totalGuests', label: 'Toplam', sample: '2', group: 'Pax' },
  { key: 'baby', label: 'Bbk', sample: '0', group: 'Pax' },
  { key: 'board', label: 'Psn', sample: 'BB', group: 'Oda' },
  { key: 'note', label: 'Not', sample: 'D.O NRE ONLY', group: 'Operasyon' },
  { key: 'status', label: 'Durum', sample: 'Konaklıyor', group: 'Operasyon' },
  { key: 'folioNo', label: 'Folyo no', sample: 'F-20801', group: 'Folyo' },
  { key: 'transactionType', label: 'İşlem tipi', sample: 'Tahsilat', group: 'Folyo' },
  { key: 'description', label: 'Açıklama', sample: 'Konaklama', group: 'Folyo' },
  { key: 'amount', label: 'Tutar', sample: '₺1.250', group: 'Finans' },
  { key: 'debit', label: 'Borç', sample: '₺850', group: 'Finans' },
  { key: 'credit', label: 'Alacak', sample: '₺0', group: 'Finans' },
  { key: 'account', label: 'Hesap', sample: '120.01', group: 'Muhasebe' },
  { key: 'invoiceNo', label: 'Fatura no', sample: 'FTR-0892', group: 'Fatura' },
  { key: 'department', label: 'Departman', sample: 'Konaklama', group: 'Gelir' },
  { key: 'balance', label: 'Bakiye', sample: '₺320', group: 'Finans' },
  { key: 'currency', label: 'DOVIZ', sample: 'EURO', group: 'Finans' },
  { key: 'user', label: 'Kullanıcı', sample: 'OGUZHAN', group: 'Operasyon' },
  { key: 'occupancy', label: 'Doluluk %', sample: '78', group: 'KPI' },
  { key: 'revenue', label: 'Gelir', sample: '₺284.500', group: 'KPI' },
  { key: 'adr', label: 'ADR', sample: '₺4.850', group: 'KPI' },
  { key: 'revpar', label: 'RevPAR', sample: '₺3.492', group: 'KPI' },
  { key: 'businessDate', label: 'İş günü', sample: '27.06.2026', group: 'Kapanış' },
  { key: 'closedBy', label: 'Kapatan', sample: 'OGUZHAN', group: 'Kapanış' },
  { key: 'voucherNo', label: 'VNO', sample: 'V-0892', group: 'Rezervasyon' },
  { key: 'paymentType', label: 'EŞekli', sample: 'SOLD', group: 'Finans' },
  { key: 'roomPrice', label: 'D.FİYAT', sample: '70,00', group: 'Finans' },
  { key: 'collectedAmount', label: 'TAHSİLAT', sample: '195,00', group: 'Finans' },
  { key: 'reservationNo', label: 'REZNO', sample: 'R2401', group: 'Rezervasyon' },
  { key: 'rn', label: 'RN#', sample: '', group: 'Rezervasyon' },
  { key: 'folioType', label: 'F.Sekli', sample: 'SOLD', group: 'Folyo' },
  { key: 'totalAmount', label: 'TOPLAM', sample: '1.250,00', group: 'Finans' },
  { key: 'basePrice', label: 'G.FIYAT', sample: '185,00', group: 'Finans' },
  { key: 'exchangeRate', label: 'KUR', sample: '1,0000', group: 'Finans' },
  { key: 'billNo', label: 'BNo', sample: 'B-4412', group: 'Folyo' },
  { key: 'originalCheckOut', label: 'EskiCOut', sample: '05.07', group: 'Tarih' },
  { key: 'penaltyTotal', label: 'Toplam Pen', sample: '350,00', group: 'Finans' },
  { key: 'recordNo', label: 'KNo', sample: 'K-1042', group: 'Operasyon' },
  { key: 'checkoutNote', label: 'Cout Notu', sample: 'ERKEN CIKIS', group: 'Operasyon' },
  { key: 'roomCount', label: 'Oda adet', sample: '1', group: 'Oda' },
  { key: 'bookingType', label: 'KŞekli', sample: 'SOLD', group: 'Satış' },
  { key: 'confirmationNo', label: 'KNo', sample: '174.381', group: 'Rezervasyon' },
  { key: 'reservationType', label: 'RŞekli', sample: 'SOLD', group: 'Satış' },
  { key: 'bpt', label: 'Bpt', sample: '', group: 'Misafir' },
  { key: 'hsekli', label: 'Hşekli', sample: 'SOLD', group: 'Satış' },
  { key: 'roomNote', label: 'Oda Notu', sample: 'TWIN', group: 'Oda' },
  { key: 'stayForm', label: 'Kşekli', sample: 'COMP', group: 'Satış' },
  { key: 'xbr', label: 'XBr', sample: '', group: 'Rezervasyon' },
  { key: 'priceDescription', label: 'Fiyat Açıklama', sample: '8*61.94EURO', group: 'Finans' },
  { key: 'takenDate', label: 'Alındığı T.', sample: '28.06.2026', group: 'Kapanış' },
  { key: 'folioAmount', label: 'Folyo', sample: '4.750,00', group: 'Folyo' },
  { key: 'rowNo', label: 'NO', sample: '1', group: 'Operasyon' },
  { key: 'deptNo', label: 'Dep No', sample: '01', group: 'Gelir' },
  { key: 'deptName', label: 'Departman Adı', sample: 'ROOM', group: 'Gelir' },
  { key: 'revenueGroup', label: 'Gelir Grubu', sample: 'ODA', group: 'Gelir' },
  { key: 'documentNo', label: 'Evrak No', sample: 'OF-32346', group: 'Folyo' },
  { key: 'payer', label: 'Ödeyen', sample: 'MISAFIR', group: 'Finans' },
  { key: 'authorizedBy', label: 'Yetkili', sample: 'OĞUZHAN', group: 'Operasyon' },
  { key: 'idNo', label: 'TC Kimlik No', sample: '12345678901', group: 'Misafir' },
  { key: 'firstName', label: 'Ad', sample: 'AHMET', group: 'Misafir' },
  { key: 'lastName', label: 'Soyad', sample: 'YILMAZ', group: 'Misafir' },
  { key: 'birthPlace', label: 'Doğum Yeri', sample: 'İSTANBUL', group: 'Misafir' },
  { key: 'birthDate', label: 'Doğum Tarihi', sample: '01.01.1980', group: 'Misafir' },
  { key: 'fatherName', label: 'Baba Adı', sample: 'MEHMET', group: 'Misafir' },
  { key: 'motherName', label: 'Anne Adı', sample: 'AYŞE', group: 'Misafir' },
  { key: 'idType', label: 'Kimlik Türü', sample: 'PASAPORT', group: 'Misafir' },
  { key: 'idSerial', label: 'K. Seri No', sample: 'U1234567', group: 'Misafir' },
  { key: 'nationality', label: 'Uyruk', sample: 'DEU', group: 'Misafir' },
  { key: 'openingBalance', label: 'DDevir', sample: '-16.685,32', group: 'Finans' },
  { key: 'roomRevenue', label: 'OdaGelir', sample: '0,00', group: 'Gelir' },
  { key: 'fbRevenue', label: 'FBGelir', sample: '0,00', group: 'Gelir' },
  { key: 'otherRevenue', label: 'DGelir', sample: '0,00', group: 'Gelir' },
  { key: 'closingBalance', label: 'YDevir', sample: '-16.685,32', group: 'Finans' },
  { key: 'fxReceived', label: 'Alınan', sample: 'EURO', group: 'Finans' },
  { key: 'fxGiven', label: 'Verilen', sample: 'TL', group: 'Finans' },
  { key: 'fxReceivedAmt', label: 'Alınan Tutar', sample: '100,00', group: 'Finans' },
  { key: 'fxGivenAmt', label: 'Verilen Tutar', sample: '5.293,00', group: 'Finans' },
  { key: 'masterFolioNo', label: 'Master FolyoNo', sample: '6923372004', group: 'Folyo' },
  { key: 'accountNo', label: 'HNO', sample: 'H-20801', group: 'Folyo' },
  { key: 'foreignAmount', label: 'DTutar', sample: '101,36', group: 'Finans' },
  { key: 'paymentMethod', label: 'ÖŞekli', sample: 'CASH', group: 'Finans' },
  { key: 'entryNo', label: 'ENo', sample: 'E-4412', group: 'Folyo' },
  { key: 'transactionKind', label: 'İşlem', sample: 'TAHSİLAT', group: 'Folyo' },
  { key: 'fxCode', label: 'DövizKodu', sample: 'EURO', group: 'Finans' },
  { key: 'tlAmount', label: 'TLTutar', sample: '5.343,47', group: 'Finans' },
  { key: 'productName', label: 'Mamul', sample: 'MUSTAFA BAYBAĞAN', group: 'Misafir' },
  { key: 'time', label: 'Saat', sample: '10:14', group: 'Tarih' },
];

export const EOD_ARRIVAL_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'agency', 'vip', 'rpt', 'guestName',
  'checkIn', 'checkInTime', 'checkOut', 'adults', 'child1', 'child2', 'totalGuests', 'baby', 'board', 'note',
];

/** GR102 — Günlük Çıkış Listesi (Elektra sütun düzeni) */
export const EOD_DEPARTURE_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'voucherNo', 'agency', 'rpt', 'guestName',
  'checkIn', 'checkOut', 'checkInTime', 'adults', 'child1', 'child2', 'totalGuests',
  'paymentType', 'roomPrice', 'collectedAmount', 'reservationNo', 'rn',
];

/** GR1021 — Günlük Çıkış Listesi BUGÜN (acenta gruplu, geniş sütunlar) */
export const EOD_DEPARTURE_TODAY_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'voucherNo', 'agency', 'rpt', 'guestName',
  'checkIn', 'checkOut', 'checkInTime', 'adults', 'child1', 'child2', 'totalGuests', 'baby', 'board',
  'folioType', 'totalAmount', 'collectedAmount', 'basePrice', 'exchangeRate', 'currency', 'reservationNo', 'billNo',
];

/** GR103 — Günlük Erken Çıkış Listesi */
export const EOD_EARLY_DEPARTURE_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'agency', 'vip', 'rpt', 'guestName',
  'checkIn', 'checkOut', 'checkInTime', 'originalCheckOut', 'penaltyTotal', 'totalGuests', 'recordNo', 'checkoutNote',
];

/** GR104 — Bugün girilen rezervasyonlar */
export const EOD_TODAY_RESERVATION_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'agency', 'vip', 'rpt', 'guestName',
  'checkIn', 'checkOut', 'adults', 'child1', 'child2', 'totalGuests', 'roomCount',
  'board', 'bookingType', 'confirmationNo', 'note',
];

/** GR105 — Bugün iptal edilen rezervasyonlar */
export const EOD_TODAY_CANCELLED_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'agency', 'vip', 'rpt', 'guestName',
  'checkIn', 'checkOut', 'adults', 'child1', 'child2', 'totalGuests', 'baby',
  'board', 'reservationType', 'confirmationNo', 'note',
];

/** GR201 — Günlük misafir listesi (konaklayanlar) */
export const EOD_DAILY_GUEST_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'agency', 'vip', 'bpt', 'guestName',
  'checkIn', 'checkOut', 'adults', 'child1', 'child2', 'totalGuests', 'baby',
  'board', 'hsekli', 'confirmationNo', 'roomNote',
];

/** GR202 — Huse / Comp / Fcomp oda listesi */
export const EOD_HUSE_COMP_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'agency', 'stayForm', 'vip', 'rpt', 'guestName',
  'checkIn', 'checkOut', 'adults', 'child1', 'child2', 'totalGuests', 'baby',
  'board', 'xbr', 'note',
];

/** GR205 — Oda fiyat kontrol listesi */
export const EOD_ROOM_PRICE_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'agency', 'guestName', 'checkIn', 'checkOut', 'roomType',
  'adults', 'child1', 'child2', 'priceDescription', 'currency', 'exchangeRate', 'amount',
];

/** GR206 — Manuel oda fiyat kontrol listesi */
export const EOD_MANUAL_ROOM_PRICE_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'agency', 'guestName', 'checkIn', 'checkOut', 'roomType',
  'adults', 'child1', 'child2', 'priceDescription', 'currency', 'exchangeRate', 'amount', 'folioAmount',
];

export const EOD_GUEST_LIST_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'guestName', 'checkIn', 'checkOut', 'agency', 'status', 'board',
];

export const EOD_FOLIO_COLUMNS: EodLegacyFieldKey[] = [
  'folioNo', 'roomNo', 'guestName', 'transactionType', 'description', 'amount', 'balance', 'user',
];

export const EOD_DEPT_COLUMNS: EodLegacyFieldKey[] = [
  'department', 'revenue', 'debit', 'credit', 'amount', 'businessDate',
];

export const EOD_KASA_COLUMNS: EodLegacyFieldKey[] = [
  'description', 'amount', 'currency', 'debit', 'credit', 'user', 'businessDate',
];

export const EOD_INVOICE_COLUMNS: EodLegacyFieldKey[] = [
  'invoiceNo', 'guestName', 'amount', 'debit', 'account', 'status', 'businessDate',
];

export const EOD_MGMT_COLUMNS: EodLegacyFieldKey[] = [
  'businessDate', 'occupancy', 'revenue', 'adr', 'revpar', 'closedBy',
];

/** GR222 — Günlük polis listesi */
export const EOD_POLICE_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'idNo', 'firstName', 'lastName', 'birthPlace', 'birthDate',
  'fatherName', 'motherName', 'idType', 'idSerial', 'nationality',
];

/** GR303 — Folyo düzeltme listesi */
export const EOD_FOLIO_CORRECTION_COLUMNS: EodLegacyFieldKey[] = [
  'deptNo', 'deptName', 'time', 'roomNo', 'guestName', 'folioNo', 'payer', 'totalAmount', 'authorizedBy', 'description',
];

/** GR310 — Günlük departman işlem listesi */
export const EOD_DEPT_TRANSACTION_COLUMNS: EodLegacyFieldKey[] = [
  'deptNo', 'deptName', 'revenueGroup', 'agency', 'roomNo', 'totalGuests', 'folioNo', 'time', 'documentNo', 'user', 'totalAmount',
];

/** GR350 — Main current raporu */
export const EOD_MAIN_CURRENT_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'guestName', 'openingBalance', 'roomRevenue', 'fbRevenue', 'otherRevenue', 'totalAmount', 'collectedAmount', 'credit', 'balance', 'closingBalance',
];

/** GR401N — Net kasa işlem raporu */
export const EOD_NET_KASA_COLUMNS: EodLegacyFieldKey[] = [
  'businessDate', 'time', 'deptNo', 'description', 'authorizedBy', 'roomNo', 'entryNo', 'note', 'transactionKind', 'fxCode', 'amount', 'tlAmount', 'exchangeRate',
];

/** GR402 — Döviz bozdurma listesi */
export const EOD_FX_EXCHANGE_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'rowNo', 'businessDate', 'fxReceived', 'fxReceivedAmt', 'fxGiven', 'fxGivenAmt', 'authorizedBy', 'documentNo', 'tlAmount',
];

/** GR502 — Fatura kontrol listesi */
export const EOD_INVOICE_CONTROL_COLUMNS: EodLegacyFieldKey[] = [
  'deptNo', 'amount', 'foreignAmount', 'fxCode', 'invoiceNo', 'note', 'paymentMethod', 'guestName',
];

/** GR503 — Krediye kaldırılan hesaplar */
export const EOD_CREDIT_INVOICE_COLUMNS: EodLegacyFieldKey[] = [
  'invoiceNo', 'agency', 'roomNo', 'checkIn', 'checkOut', 'voucherNo', 'guestName', 'amount', 'folioAmount',
];

/** GR700 / GRMAIL — Misafir fiyat listesi */
export const EOD_GUEST_PRICE_COLUMNS: EodLegacyFieldKey[] = [
  'rowNo', 'roomNo', 'agency', 'guestName', 'totalGuests', 'checkIn', 'checkOut', 'roomPrice', 'folioNo',
];

/** GRKASAISLEM — Günlük kasa defteri */
export const EOD_KASA_LEDGER_COLUMNS: EodLegacyFieldKey[] = [
  'currency', 'deptNo', 'roomNo', 'productName', 'time', 'description', 'amount', 'authorizedBy',
];

/** GRFOLYOBAKIYE2 — Folyo bakiye listesi */
export const EOD_FOLIO_BALANCE_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'agency', 'guestName', 'checkIn', 'checkOut', 'balance',
];

/** MASTERFOLYOKONTORL — Master folyo kontrol */
export const EOD_MASTER_FOLIO_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'voucherNo', 'agency', 'guestName', 'checkIn', 'checkOut', 'accountNo', 'masterFolioNo',
];

/** RGC — Ayrılış odaları özeti */
export const EOD_RGC_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'totalGuests',
];

/** GR203 — VIP misafir */
export const EOD_VIP_COLUMNS: EodLegacyFieldKey[] = [
  'guestName', 'roomNo', 'vip', 'checkIn', 'checkOut', 'agency', 'note',
];

/** GR220 — House keeping */
export const EOD_HK_COLUMNS: EodLegacyFieldKey[] = [
  'roomNo', 'roomType', 'status', 'guestName', 'checkOut', 'note',
];

/** GR221 — Oda değişim */
export const EOD_ROOM_CHANGE_COLUMNS: EodLegacyFieldKey[] = [
  'guestName', 'roomNo', 'checkIn', 'note', 'user',
];

/** GR401 — Günlük bilanço */
export const EOD_BILANCO_COLUMNS: EodLegacyFieldKey[] = [
  'businessDate', 'department', 'debit', 'credit', 'amount', 'balance',
];

/** GR701 — Resmi müşteri */
export const EOD_OFFICIAL_GUEST_COLUMNS: EodLegacyFieldKey[] = [
  'guestName', 'roomNo', 'checkIn', 'checkOut', 'agency', 'status',
];

/** GRMAL — Mal raporu */
export const EOD_STOCK_COLUMNS: EodLegacyFieldKey[] = [
  'description', 'amount', 'department', 'businessDate',
];

/** GRMUSTERI — Müşteri raporu */
export const EOD_CUSTOMER_COLUMNS: EodLegacyFieldKey[] = [
  'guestName', 'agency', 'roomNo', 'checkIn', 'checkOut',
];

/** Günlük indirim iade */
export const EOD_DISCOUNT_REFUND_COLUMNS: EodLegacyFieldKey[] = [
  'guestName', 'folioNo', 'amount', 'description', 'user',
];

export function eodFieldLabel(key: string): string {
  return EOD_LEGACY_FIELD_DEFS.find((f) => f.key === key)?.label ?? key;
}
