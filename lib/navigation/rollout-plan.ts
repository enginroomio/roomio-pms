import { ROLLOUT_PHASES } from './rollout-phases';

export type NextPhasePlan = {
  currentPhaseId: string;
  nextPhaseId: string;
  nextTitle: string;
  nextDescription: string;
  designNotes: string[];
  targetFiles: Array<{ path: string; task: string }>;
  acceptanceCriteria: string[];
};

const PLANS: Record<string, Omit<NextPhasePlan, 'currentPhaseId' | 'nextPhaseId' | 'nextTitle' | 'nextDescription'>> = {
  shell: {
    designNotes: [
      'İkon rayı 6 modül — aktif durum teal vurgusu',
      'Üst menü 8 grup — hover flyout cascade',
      'Alt F2–F12 çubuğu — düzenlenebilir kısayollar',
    ],
    targetFiles: [
      { path: 'components/IconRail.tsx', task: 'Aktif state doğrula' },
      { path: 'components/TopMenuNav.tsx', task: 'Flyout alt ağaç' },
      { path: 'components/ShortcutBar.tsx', task: 'F-key etiketleri' },
    ],
    acceptanceCriteria: [
      'Rollout faz 0 — 3 adım işaretlenebilir',
      'Tüm menü grupları açılıyor',
    ],
  },
  home: {
    designNotes: [
      'Karşılama şeridi + günlük KPI',
      'Oda rack önizleme + Tam rack (F12) linki',
      'Bugün varış/ayrılış listesi',
    ],
    targetFiles: [
      { path: 'app/page.tsx', task: 'Dashboard layout' },
      { path: 'app/rooms/page.tsx', task: 'Tam rack grid' },
    ],
    acceptanceCriteria: ['Ana sayfa 2 sn altında yüklenir', 'F12 /rooms açılır'],
  },
  sistem: {
    designNotes: [
      'Kuruluş yan menü SC-003 yapısı',
      'Rapor Tasarım + Raporla sekmeleri',
      'Servis Programları → entegrasyon hub',
      'Dil Tanımları tablosu',
    ],
    targetFiles: [
      { path: 'components/kurulus/KurulusScreen.tsx', task: 'Tüm section ekranları' },
      { path: 'app/reports/ReportsPageClient.tsx', task: 'Rapor hub' },
      { path: 'app/settings/integrations/page.tsx', task: 'Servis listesi' },
    ],
    acceptanceCriteria: [
      'Rollout faz 2 — 5 adım açılır',
      '/reports?tab=design çalışır',
      '/settings?section=language tablo gösterir',
    ],
  },
  rezervasyon: {
    designNotes: [
      'Rezervasyon listesi: filtre şeridi + durum rozetleri',
      'Yeni kayıt: iki sütun form + fiyat özeti',
      'Hızlı blokaj: oda grid / mini takvim',
    ],
    targetFiles: [
      { path: 'app/reservations/page.tsx', task: 'Liste + filtre' },
      { path: 'app/reservations/new/page.tsx', task: 'Form layout' },
      { path: 'app/rooms/page.tsx', task: 'blocking sekmesi' },
    ],
    acceptanceCriteria: [
      '5 rollout adımı tamamlanabilir',
      'Yeni rezervasyon demo veriye eklenir',
    ],
  },
  resepsiyon: {
    designNotes: ['Info rack kart görünümü', 'Arıza/şikayet ticket listesi'],
    targetFiles: [
      { path: 'app/guest-relations/info-rack/page.tsx', task: 'Kart grid' },
      { path: 'app/guest-relations/complaints/page.tsx', task: 'Ticket tablo' },
    ],
    acceptanceCriteria: ['Check-in/out otomasyonu çalışır', 'Info rack dolu demo'],
  },
};

export function getNextPhasePlan(currentPhaseId: string): NextPhasePlan | null {
  const idx = ROLLOUT_PHASES.findIndex((p) => p.id === currentPhaseId);
  if (idx < 0 || idx >= ROLLOUT_PHASES.length - 1) return null;

  const current = ROLLOUT_PHASES[idx];
  const next = ROLLOUT_PHASES[idx + 1];
  const plan = PLANS[current.id] ?? PLANS[next.id];

  if (!plan) {
    return {
      currentPhaseId: current.id,
      nextPhaseId: next.id,
      nextTitle: next.title,
      nextDescription: next.description,
      designNotes: next.steps.map((s) => s.label),
      targetFiles: [],
      acceptanceCriteria: [`${next.steps.length} rollout adımı tamamlanır`],
    };
  }

  return {
    currentPhaseId: current.id,
    nextPhaseId: next.id,
    nextTitle: next.title,
    nextDescription: next.description,
    ...plan,
  };
}
