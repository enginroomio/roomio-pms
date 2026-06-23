'use client';

import { useState } from 'react';
import { HkMobileFrame } from '@/components/housekeeping/HkMobileFrame';
import { DEMO_HK_TASKS, HK_TASK_LABELS } from '@/lib/data/housekeeping';
import { enqueueSync } from '@/lib/sync/engine';

export function HkMobileTasksClient() {
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
    <HkMobileFrame title="Görevler">
      <div className="roomio-card roomio-hk-mobile-tasks">
        <ul className="roomio-hk-mobile-task-list">
          {tasks.map((t) => (
            <li key={t.id} className={t.status === 'done' ? 'is-done' : ''}>
              <div className="roomio-hk-mobile-task-list__main">
                <strong>Oda {t.roomNo}</strong>
                <span>{HK_TASK_LABELS[t.taskType]}</span>
                <span className="roomio-hk-mobile-task-list__meta">
                  {t.assignee} · {t.dueBy}
                  {t.priority === 'urgent' ? ' · Acil' : ''}
                </span>
              </div>
              {t.status !== 'done' ? (
                <button
                  type="button"
                  className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                  onClick={() => void markDone(t.id)}
                >
                  Tamamla
                </button>
              ) : (
                <span className="roomio-hk-mobile-task-list__done">Tamam</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </HkMobileFrame>
  );
}
