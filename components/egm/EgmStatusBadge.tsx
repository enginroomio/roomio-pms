import type { EgmGender, EgmIdType, EgmNotifyStatus } from '@/lib/egm/types';
import { EGM_STATUS_LABELS } from '@/lib/egm/types';

const STATUS_CLASS: Record<EgmNotifyStatus, string> = {
  missing: 'roomio-egm-badge--missing',
  draft: 'roomio-egm-badge--draft',
  ready: 'roomio-egm-badge--ready',
  sent: 'roomio-egm-badge--sent',
  error: 'roomio-egm-badge--error',
};

export function EgmStatusBadge({ status, compact }: { status: EgmNotifyStatus; compact?: boolean }) {
  return (
    <span className={`roomio-egm-badge ${STATUS_CLASS[status]}${compact ? ' roomio-egm-badge--compact' : ''}`}>
      {EGM_STATUS_LABELS[status]}
    </span>
  );
}

export function EgmStatusDot({ status }: { status: EgmNotifyStatus }) {
  return <span className={`roomio-egm-dot ${STATUS_CLASS[status]}`} title={EGM_STATUS_LABELS[status]} />;
}
