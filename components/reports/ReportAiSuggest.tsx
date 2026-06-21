'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { ReportTemplateDraft } from '@/components/reports/ReportDesignEditor';

type Suggestion = {
  name: string;
  module: string;
  columns: string[];
  explanation: string;
};

type Props = {
  onApply: (draft: Pick<ReportTemplateDraft, 'name' | 'module' | 'columns'>) => void;
};

const EXAMPLES = [
  'Bugün giriş yapacak misafirler',
  'Konaklayanlar listesi',
  'Günlük kasa hareketleri',
  'HK oda temizlik durumu',
];

export function ReportAiSuggest({ onApply }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [last, setLast] = useState<Suggestion | null>(null);

  async function suggest() {
    if (prompt.trim().length < 3) {
      setMsg('Lütfen ne tür bir rapor istediğinizi kısaca yazın.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await roomioFetch('/api/reports/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const j = (await r.json()) as { suggestion?: Suggestion; error?: string };
      if (!r.ok || !j.suggestion) {
        setMsg(j.error ?? 'Öneri alınamadı');
        return;
      }
      setLast(j.suggestion);
      setMsg(j.suggestion.explanation);
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!last) return;
    onApply({ name: last.name, module: last.module, columns: last.columns });
    setMsg('Öneri editöre aktarıldı — önizleyip kaydedin.');
  }

  return (
    <div className="roomio-report-ai">
      <div className="roomio-report-ai__head">
        <Sparkles size={18} aria-hidden />
        <div>
          <strong>AI ile öner (beta)</strong>
          <p className="roomio-page-desc">Ne istediğinizi yazın; sütunları biz dolduralım, siz onaylayın.</p>
        </div>
      </div>
      <div className="roomio-report-ai__row">
        <input
          className="roomio-input"
          placeholder="Örn: Bu hafta Booking’ten gelen konaklayanlar"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void suggest(); }}
        />
        <Button disabled={busy} onClick={() => void suggest()}>
          {busy ? 'Düşünüyor…' : 'Öner'}
        </Button>
      </div>
      <div className="roomio-report-ai__examples">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="roomio-badge roomio-badge--muted" onClick={() => setPrompt(ex)}>
            {ex}
          </button>
        ))}
      </div>
      {msg ? <p className="roomio-page-desc roomio-report-ai__msg">{msg}</p> : null}
      {last ? (
        <div className="roomio-report-ai__result">
          <span><strong>{last.name}</strong> · {last.module} · {last.columns.length} sütun</span>
          <Button variant="secondary" onClick={apply}>Editöre uygula</Button>
        </div>
      ) : null}
    </div>
  );
}
