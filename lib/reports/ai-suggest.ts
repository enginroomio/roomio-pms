/**
 * Kural tabanlı rapor önerisi — harici AI yok, çevrimdışı çalışır.
 * İleride gerçek LLM bu katmanın arkasına bağlanabilir.
 */

import { REPORT_MODULES, type ReportModuleDef } from '@/lib/reports/field-catalog';

export type ReportSuggestion = {
  name: string;
  module: string;
  columns: string[];
  explanation: string;
};

const RULES: { pattern: RegExp; moduleId: string; starterId?: string; name?: string }[] = [
  { pattern: /\bGR\d{3,4}[A-Z]?\b/i, moduleId: 'eod' },
  { pattern: /polis\s*listesi|GR222/i, moduleId: 'eod', starterId: 'eod-gr222' },
  { pattern: /departman\s*işlem|GR310/i, moduleId: 'eod', starterId: 'eod-gr310' },
  { pattern: /fatura\s*kontrol|GR502/i, moduleId: 'eod', starterId: 'eod-gr502' },
  { pattern: /kasa\s*defteri|GRKASAISLEM/i, moduleId: 'eod', starterId: 'eod-grkasaislem' },
  { pattern: /net\s*kasa|GR401N/i, moduleId: 'eod', starterId: 'eod-gr401n' },
  { pattern: /folyo\s*bakiye|GRFOLYOBAKIYE/i, moduleId: 'eod', starterId: 'eod-grfolyobakiye2' },
  { pattern: /giriş\s*listesi|GR101/i, moduleId: 'eod', starterId: 'eod-gr101' },
  { pattern: /çıkış\s*listesi|GR102/i, moduleId: 'eod', starterId: 'eod-gr102' },
  { pattern: /misafir\s*listesi|GR201/i, moduleId: 'eod', starterId: 'eod-gr201' },
  { pattern: /oda\s*fiyat|GR205/i, moduleId: 'eod', starterId: 'eod-gr205' },
  { pattern: /konaklayan|inhouse|in-house|otelde/i, moduleId: 'rec', starterId: 'rec-inhouse' },
  { pattern: /giriş|varış|arrival|check.?in/i, moduleId: 'rec', starterId: 'rec-arrival' },
  { pattern: /çıkış|ayrıl|departure|check.?out/i, moduleId: 'rec', starterId: 'rec-departure' },
  { pattern: /kasa|tahsilat|ödeme|cashier/i, moduleId: 'cs', starterId: 'cs-daily' },
  { pattern: /hk|kat|temizlik|housekeeping/i, moduleId: 'hk', starterId: 'hk-room' },
  { pattern: /gün sonu|eod|kapanış/i, moduleId: 'eod', starterId: 'eod-summary' },
  { pattern: /vip|misafir ilişki|şikayet|trace/i, moduleId: 'gr', starterId: 'gr-vip' },
  { pattern: /banket|f&B|restoran|minibar/i, moduleId: 'fnb', starterId: 'fnb-banquet' },
  { pattern: /stok|envanter|depo/i, moduleId: 'stk', starterId: 'stk-level' },
  { pattern: /fatura|cari|muhasebe|ledger/i, moduleId: 'acc', starterId: 'acc-ledger' },
  { pattern: /acenta|kanal|pazar|satış/i, moduleId: 'sal', starterId: 'sal-channel' },
  { pattern: /yönetim|kpi|doluluk|gelir|adr|revpar/i, moduleId: 'mg', starterId: 'mg-daily' },
  { pattern: /rezervasyon/i, moduleId: 'rez', starterId: 'rez-daily' },
];

function pickModule(id: string): ReportModuleDef {
  return REPORT_MODULES.find((m) => m.id === id) ?? REPORT_MODULES[0];
}

export function suggestReportFromPrompt(prompt: string): ReportSuggestion {
  const text = prompt.trim();
  if (!text) {
    const m = pickModule('rez');
    const s = m.starters[0];
    return {
      name: s.name,
      module: m.label,
      columns: [...s.columns],
      explanation: 'Boş istek — varsayılan rezervasyon şablonu önerildi.',
    };
  }

  for (const rule of RULES) {
    if (!rule.pattern.test(text)) continue;
    const m = pickModule(rule.moduleId);
    const starter = rule.starterId
      ? m.starters.find((s) => s.id === rule.starterId) ?? m.starters[0]
      : m.starters[0];
    const grMatch = text.match(/\b(GR[A-Z0-9]+|GRFOLYOBAKIYE2|GRKASAISLEM|GRMAIL|RGC|GRODAFIYATKON|GUNLUKINDIRIMIADE|MASTERFOLYOKONTORL)\b/i);
    if (rule.moduleId === 'eod' && grMatch && !rule.starterId) {
      const code = grMatch[1]!.toUpperCase();
      const byCode = m.starters.find((s) => s.reportCode === code);
      if (byCode) {
        return {
          name: byCode.name,
          module: m.label,
          columns: [...byCode.columns],
          explanation: `“${code}” Elektra gün sonu raporu olarak eşleştirildi.`,
        };
      }
    }
    return {
      name: rule.name ?? starter.name,
      module: m.label,
      columns: [...starter.columns],
      explanation: `“${text}” ifadesi ${m.label} departmanıyla eşleştirildi.`,
    };
  }

  const m = pickModule('fo');
  return {
    name: text.slice(0, 48),
    module: m.label,
    columns: [...m.defaultColumns],
    explanation: 'Özel istek — Önbüro varsayılan sütunları önerildi. Düzenleyebilirsiniz.',
  };
}
