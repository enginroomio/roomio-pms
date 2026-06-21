'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { QuickActionsWizard } from '@/components/quick-actions/QuickActionsWizard';
import { resolvedQuickActions, type ResolvedQuickAction } from '@/lib/shortcuts/quick-actions';
import { SHORTCUT_ICON_MAP } from '@/lib/shortcuts/user-shortcuts';

export function QuickActions() {
  const [actions, setActions] = useState<ResolvedQuickAction[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    function refresh() {
      setActions(resolvedQuickActions());
    }
    refresh();
    window.addEventListener('roomio-quick-actions-changed', refresh);
    return () => window.removeEventListener('roomio-quick-actions-changed', refresh);
  }, []);

  return (
    <>
      <section className="roomio-quick-bar" aria-label="Hızlı işlemler">
        <span className="roomio-quick-bar__label">Hızlı işlemler</span>
        <div className="roomio-quick-bar__actions">
          {actions.map((action) => {
            const Icon = SHORTCUT_ICON_MAP[action.icon] ?? SHORTCUT_ICON_MAP.search;
            return (
              <Link
                key={action.userId}
                href={action.href}
                className="roomio-quick-bar__btn"
                title={action.key ? `${action.label} (${action.key})` : action.label}
              >
                <Icon size={16} aria-hidden />
                <span>{action.label}</span>
                {action.key ? <kbd>{action.key}</kbd> : null}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          className="roomio-quick-bar__edit"
          onClick={() => setWizardOpen(true)}
          title="Hızlı işlemleri düzenle"
        >
          <Settings2 size={14} aria-hidden />
          <span>Düzenle</span>
        </button>
      </section>
      <QuickActionsWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
