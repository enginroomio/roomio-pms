'use client';

import type { ReactNode } from 'react';
import { Check, CircleCheck, CircleDashed } from 'lucide-react';

export function QuickChipGroup({
  options,
  value,
  onChange,
  labels,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="roomio-rez-quick__chips" role="group">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`roomio-rez-quick__chip${value === opt ? ' is-selected' : ''}`}
          onClick={() => onChange(opt)}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}

export function QuickStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="roomio-rez-quick__stepper">
      <button type="button" aria-label="Azalt" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span>{value}</span>
      <button type="button" aria-label="Artır" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

export function QuickSectionHead({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="roomio-rez-quick__sechead">
      <span className="roomio-rez-quick__secicon" aria-hidden>{icon}</span>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}

const KBS_FIELDS: { key: string; label: string }[] = [
  { key: 'firstName', label: 'Ad' },
  { key: 'lastName', label: 'Soyad' },
  { key: 'idNo', label: 'Kimlik no' },
  { key: 'birthDate', label: 'Doğum tarihi' },
  { key: 'birthPlace', label: 'Doğum yeri' },
  { key: 'gender', label: 'Cinsiyet' },
  { key: 'fatherName', label: 'Baba adı' },
  { key: 'motherName', label: 'Anne adı' },
];

export function QuickKbsChecklist({ values }: { values: Record<string, string | number> }) {
  let done = 0;
  const items = KBS_FIELDS.map(({ key, label }) => {
    const filled = Boolean(String(values[key] ?? '').trim());
    if (filled) done += 1;
    return { key, label, filled };
  });
  const complete = done === KBS_FIELDS.length;

  return (
    <div className="roomio-card roomio-rez-quick__kbs">
      <div className="roomio-rez-quick__kbs-head">
        <h2>KBS / EGM bildirimi</h2>
        <span className={`roomio-rez-quick__kbs-badge${complete ? ' is-ok' : ' is-warn'}`}>
          {complete ? 'Hazır' : 'Eksik alan var'}
        </span>
      </div>
      <ul className="roomio-rez-quick__kbs-list">
        {items.map((item) => (
          <li key={item.key} className={item.filled ? 'is-done' : 'is-pending'}>
            {item.filled ? <Check size={15} aria-hidden /> : <CircleDashed size={15} aria-hidden />}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <p className="roomio-rez-quick__kbs-count">{done} / {KBS_FIELDS.length} alan tamamlandı</p>
    </div>
  );
}

export function QuickJumpNav() {
  const links = [
    { href: '#rez-sec-misafir', label: 'Misafir' },
    { href: '#rez-sec-konaklama', label: 'Konaklama' },
    { href: '#rez-sec-fiyat', label: 'Fiyat' },
    { href: '#rez-sec-ek', label: 'Ek bilgiler' },
  ];
  return (
    <nav className="roomio-rez-quick__jump" aria-label="Bölümlere git">
      {links.map((l) => (
        <a key={l.href} href={l.href}>{l.label}</a>
      ))}
    </nav>
  );
}

export function QuickToast({ message, kind }: { message: string | null; kind?: 'ok' | 'err' }) {
  if (!message) return null;
  return (
    <div className={`roomio-rez-quick__toast${kind === 'err' ? ' is-error' : ''}`} role="status">
      <CircleCheck size={14} aria-hidden />
      {message}
    </div>
  );
}
