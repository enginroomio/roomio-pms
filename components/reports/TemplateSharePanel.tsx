'use client';

import { useMemo, useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useProperty } from '@/components/property/PropertyProvider';
import { roomioFetch } from '@/lib/client/api';

type Props = {
  templateId: string;
  templateName: string;
  onDone: (message: string) => void;
};

export function TemplateSharePanel({ templateId, templateName, onDone }: Props) {
  const { properties, propertyId } = useProperty();
  const targets = useMemo(
    () => properties.filter((p) => p.id !== propertyId),
    [properties, propertyId],
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (targets.length === 0) return null;

  async function handleShare() {
    if (selected.length === 0) {
      onDone('En az bir hedef otel seçin.');
      return;
    }
    setBusy(true);
    const r = await roomioFetch('/api/reports/templates/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, targetPropertyIds: selected }),
    });
    const j = (await r.json()) as { ok?: boolean; count?: number; error?: string };
    setBusy(false);
    if (r.ok && j.ok) {
      onDone(`"${templateName}" ${j.count ?? selected.length} şubeye kopyalandı.`);
      setOpen(false);
      setSelected([]);
    } else {
      onDone(j.error ?? 'Paylaşım başarısız');
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} title="Diğer otellere kopyala">
        <Share2 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        Paylaş
      </Button>
    );
  }

  return (
    <div className="roomio-inline-panel" style={{ marginTop: 8, padding: 12, border: '1px solid var(--roomio-border)', borderRadius: 8 }}>
      <strong style={{ fontSize: '0.85rem' }}>Şubelere kopyala</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {targets.map((p) => {
          const checked = selected.includes(p.id);
          return (
            <label key={p.id} className="roomio-badge roomio-badge--muted" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  setSelected((prev) => (checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]));
                }}
                style={{ marginRight: 6 }}
              />
              {p.name}
            </label>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Button variant="primary" onClick={() => void handleShare()} disabled={busy}>
          {busy ? 'Kopyalanıyor…' : 'Kopyala'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          İptal
        </Button>
      </div>
    </div>
  );
}
