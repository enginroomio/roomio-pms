'use client';

import { PageHeader } from '@/components/PageHeader';
import { HousekeepingTabs } from '@/components/HousekeepingTabs';
import { Button } from '@/components/ui';
import { DEMO_HK_TASKS, HK_TASK_LABELS } from '@/lib/data/housekeeping';
import { enqueueSync } from '@/lib/sync/engine';
import { useState } from 'react';

export default function HousekeepingTasksPage() {
  const [tasks, setTasks] = useState(DEMO_HK_TASKS);

  async function markDone(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'done' as const } : t)));
    const task = tasks.find((t) => t.id === id);
    if (task) {
      await enqueueSync({
        entity: 'housekeeping',
        operation: 'update',
        entityId: id,
        payload: { ...task, status: 'done' },
      });
    }
  }

  return (
    <PageHeader
      breadcrumb="Kat Hizmetleri > Görevler"
      title="Temizlik Görevleri"
      description="Görev tamamlandığında yerel kuyruğa yazılır; bağlantı gelince sunucuya şifreli senkron."
      actions={<Button variant="secondary">Excel</Button>}
    >
      <HousekeepingTabs />

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Oda</th>
              <th>Görev</th>
              <th>Öncelik</th>
              <th>Personel</th>
              <th>Saat</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className={t.status === 'done' ? 'roomio-row-done' : ''}>
                <td><strong>{t.roomNo}</strong></td>
                <td>{HK_TASK_LABELS[t.taskType]}</td>
                <td>{t.priority === 'urgent' ? <span className="roomio-text-warn">Acil</span> : 'Normal'}</td>
                <td>{t.assignee}</td>
                <td>{t.dueBy}</td>
                <td>{t.status === 'done' ? 'Tamam' : t.status === 'in_progress' ? 'Devam' : 'Bekliyor'}</td>
                <td>
                  {t.status !== 'done' ? (
                    <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => void markDone(t.id)}>
                      Tamamla
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageHeader>
  );
}
