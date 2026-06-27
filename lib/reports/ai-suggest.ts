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
