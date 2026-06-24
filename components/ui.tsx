import Link from 'next/link';
import type { ReservationStatus } from '@/lib/types/reservation';
import { STATUS_LABELS } from '@/lib/types/reservation';

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const tone: Record<ReservationStatus, string> = {
    CONFIRMED: 'roomio-status--confirmed',
    CHECKED_IN: 'roomio-status--inhouse',
    CHECKED_OUT: 'roomio-status--out',
    OPTION: 'roomio-status--option',
    CANCELLED: 'roomio-status--cancel',
    NO_SHOW: 'roomio-status--noshow',
  };
  return <span className={`roomio-status ${tone[status]}`}>{STATUS_LABELS[status]}</span>;
}

type BtnProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
};

export function Button({
  variant = 'primary',
  href,
  target,
  rel,
  children,
  className = '',
  ...rest
}: BtnProps) {
  const cls = `roomio-btn roomio-btn--${variant} ${className}`.trim();
  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
