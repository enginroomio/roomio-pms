export type AuditAction =
  | 'view_pii'
  | 'export_data'
  | 'delete_request'
  | 'consent_update'
  | 'sync_push'
  | 'sync_pull'
  | 'login';

export type AuditEntry = {
  id: string;
  at: string;
  user: string;
  action: AuditAction;
  resource: string;
  ipMasked: string;
  success: boolean;
  detail?: string;
};

const AUDIT_KEY = 'roomio_audit_log';

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `*** *** ${digits.slice(-4)}`;
}

export function maskTcKimlik(tc: string): string {
  if (tc.length < 11) return '***********';
  return `${tc.slice(0, 3)}****${tc.slice(-2)}`;
}

export function readAuditLog(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) ?? '[]') as AuditEntry[];
  } catch {
    return [];
  }
}

export function appendAudit(entry: Omit<AuditEntry, 'id' | 'at' | 'ipMasked'>): AuditEntry {
  const full: AuditEntry = {
    ...entry,
    id: `aud-${crypto.randomUUID().slice(0, 10)}`,
    at: new Date().toISOString(),
    ipMasked: '***.***.***.***',
  };
  const log = readAuditLog();
  log.unshift(full);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 200)));
  return full;
}

export const KVKK_POLICIES = [
  { id: 'p1', title: 'Veri minimizasyonu', text: 'Yalnızca konaklama operasyonu için gerekli kişisel veriler işlenir.' },
  { id: 'p2', title: 'Şifreleme', text: 'PII alanları cihazda AES-256-GCM ile şifrelenir; sunucuya şifreli aktarılır.' },
  { id: 'p3', title: 'Saklama süresi', text: 'Misafir verileri çıkış + 2 yıl; ardından anonimleştirme veya silme.' },
  { id: 'p4', title: 'Erişim kaydı', text: 'Tüm PII erişimleri denetim günlüğüne yazılır (KVKK md. 12).' },
  { id: 'p5', title: 'Çevrimdışı çalışma', text: 'Bağlantı kesildiğinde veriler yerel cihazda kalır; bağlantı gelince güvenli senkron.' },
];

export type ConsentRecord = {
  guestRef: string;
  purpose: string;
  granted: boolean;
  at: string;
};

const CONSENT_KEY = 'roomio_consents';

export function readConsents(): ConsentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY) ?? '[]') as ConsentRecord[];
  } catch {
    return [];
  }
}

export function saveConsent(record: ConsentRecord): void {
  const list = readConsents().filter((c) => c.guestRef !== record.guestRef || c.purpose !== record.purpose);
  list.unshift(record);
  localStorage.setItem(CONSENT_KEY, JSON.stringify(list.slice(0, 100)));
  appendAudit({
    user: 'Yakup K.',
    action: 'consent_update',
    resource: record.guestRef,
    success: true,
    detail: `${record.purpose}: ${record.granted ? 'onay' : 'red'}`,
  });
}
