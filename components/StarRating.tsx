'use client';

export function StarRating({ value, max = 5, onChange }: { value: number; max?: number; onChange?: (v: number) => void }) {
  return (
    <div className="roomio-stars" role={onChange ? 'group' : 'img'} aria-label={`${value} / ${max} yıldız`}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            className={`roomio-star${filled ? ' filled' : ''}`}
            onClick={() => onChange?.(n)}
            disabled={!onChange}
            aria-label={`${n} yıldız`}
          >
            ★
          </button>
        );
      })}
      <span className="roomio-star-label">{value} / {max}</span>
    </div>
  );
}

export function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="roomio-stars-inline" aria-label={`${value} yıldız`}>
      {'★'.repeat(value)}{'☆'.repeat(max - value)} <strong>{value}</strong>
    </span>
  );
}

export function VipBadge({ level }: { level: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' }) {
  const cls = { Platinum: 'vip-platinum', Gold: 'vip-gold', Silver: 'vip-silver', Bronze: 'vip-bronze' }[level];
  return <span className={`roomio-vip-badge ${cls}`}>👑 {level}</span>;
}
