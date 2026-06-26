'use client';

import { useSearchParams } from 'next/navigation';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GuestTracesPanel } from '@/components/guest-relations/GuestTracesPanel';
import { PageHeader } from '@/components/PageHeader';
import type { TraceKind } from '@/lib/guest-relations/trace-meta';

export default function TracesPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const type = searchParams.get('type');
  const view = searchParams.get('view');
  const action = searchParams.get('action');
  const toggle = searchParams.get('toggle');

  const filterKind: TraceKind | 'all' =
    type === 'wakeup' ? 'wakeup' : type === 'yellow' ? 'yellow' : type === 'note' ? 'note' : 'all';

  const panelView = tab === 'agenda' ? 'agenda' : view === 'notes' ? 'notes' : 'list';
  const showNotes = view === 'notes' || toggle === 'notes';
  const autoOpenForm = action === 'new-note';

  const title =
    tab === 'agenda' ? 'Ajanda'
      : type === 'wakeup' ? 'Uyandırma Listesi'
        : type === 'yellow' ? 'Sarı Notlar'
          : view === 'notes' ? 'Not Gör'
            : 'Takip Listesi (Traces)';

  return (
    <PageHeader breadcrumb={`Misafir İlişkileri > ${title}`} title={title} description="Misafir talepleri ve departman takipleri — kısayol: Alt+P">
      <GuestRelationsTabs />
      <GuestTracesPanel
        filterKind={filterKind}
        view={panelView}
        autoOpenForm={autoOpenForm}
        defaultTraceKind={type === 'wakeup' ? 'wakeup' : type === 'yellow' ? 'yellow' : action === 'new-note' ? 'note' : 'general'}
        showNotes={showNotes}
      />
    </PageHeader>
  );
}
