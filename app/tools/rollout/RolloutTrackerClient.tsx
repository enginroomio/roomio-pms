'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, ExternalLink, PlayCircle } from 'lucide-react';
import {
  allRolloutSteps,
  ROLLOUT_PHASES,
  ROLLOUT_STORAGE_KEY,
  type RolloutStepStatus,
} from '@/lib/navigation/rollout-phases';
import { getNextPhasePlan } from '@/lib/navigation/rollout-plan';
import { ModuleLayout } from '@/components/ModuleLayout';

type StatusMap = Record<string, RolloutStepStatus>;

function loadStatus(): StatusMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(ROLLOUT_STORAGE_KEY) ?? '{}') as StatusMap;
  } catch {
    return {};
  }
}

function saveStatus(map: StatusMap) {
  localStorage.setItem(ROLLOUT_STORAGE_KEY, JSON.stringify(map));
}

export function RolloutTrackerClient({ phase }: { phase: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusMap>({});

  const activePhaseId = ROLLOUT_PHASES.some((p) => p.id === phase)
    ? (phase as string)
    : ROLLOUT_PHASES[0].id;

  const menuSearch = `?phase=${activePhaseId}`;

  useEffect(() => {
    setStatus(loadStatus());
  }, []);

  const activePhase = ROLLOUT_PHASES.find((p) => p.id === activePhaseId) ?? ROLLOUT_PHASES[0];
  const nextPlan = getNextPhasePlan(activePhaseId);

  const stats = useMemo(() => {
    const all = ROLLOUT_PHASES.flatMap((p) => p.steps);
    const done = all.filter((s) => status[s.id] === 'done').length;
    return { total: all.length, done, pct: Math.round((done / all.length) * 100) };
  }, [status]);

  function setStepStatus(stepId: string, next: RolloutStepStatus) {
    setStatus((prev) => {
      const map = { ...prev, [stepId]: next };
      saveStatus(map);
      return map;
    });
  }

  function markPhaseDone(phaseId: string) {
    const target = ROLLOUT_PHASES.find((p) => p.id === phaseId);
    if (!target) return;
    setStatus((prev) => {
      const map = { ...prev };
      for (const step of target.steps) map[step.id] = 'done';
      saveStatus(map);
      return map;
    });
  }

  function markAllSmokePassed() {
    setStatus((prev) => {
      const map = { ...prev };
      for (const step of allRolloutSteps()) map[step.id] = 'done';
      saveStatus(map);
      return map;
    });
  }

  function selectPhase(phaseId: string) {
    router.push(`/tools/rollout?phase=${phaseId}`);
  }

  return (
    <ModuleLayout
      breadcrumb="Araçlar › Rollout Test"
      title="Roomio Ekran Rollout"
      description="Mockup sırasına göre adım adım menü ve ekran testi. Her adımı canlı ekranda doğrulayıp işaretleyin."
      sideTitle="Fazlar"
      menuSearch={menuSearch}
      actions={
        <Link href="/" className="roomio-btn roomio-btn--secondary roomio-btn--sm">
          Ana Sayfa
        </Link>
      }
    >
      <div className="roomio-rollout">
        <div className="roomio-rollout__summary">
          <div className="roomio-rollout__stat">
            <span className="roomio-rollout__stat-label">İlerleme</span>
            <strong>{stats.done} / {stats.total}</strong>
            <span className="roomio-rollout__stat-hint">%{stats.pct} tamamlandı</span>
          </div>
          <p className="roomio-rollout__hint">
            Sıra: kabuk → ana sayfa → sistem → rezervasyon → resepsiyon → kasa → kat HK → misafir → raporlar → gün sonu.
          </p>
          {stats.done < stats.total ? (
            <div className="roomio-form-actions" style={{ marginTop: 12 }}>
              <button type="button" className="roomio-btn roomio-btn--primary roomio-btn--sm" onClick={markAllSmokePassed}>
                Smoke test geçti — {stats.total} adımı işaretle
              </button>
            </div>
          ) : (
            <p className="roomio-rollout__hint" style={{ marginTop: 8 }}>
              Tüm rollout adımları tamamlandı ({stats.total}/{stats.total}).
            </p>
          )}
        </div>

        <div className="roomio-rollout__phases">
          {ROLLOUT_PHASES.map((item) => {
            const doneCount = item.steps.filter((s) => status[s.id] === 'done').length;
            const isActive = item.id === activePhaseId;
            return (
              <button
                key={item.id}
                type="button"
                className={`roomio-rollout__phase-btn${isActive ? ' is-active' : ''}`}
                onClick={() => selectPhase(item.id)}
              >
                <span className="roomio-rollout__phase-order">{item.order}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{doneCount}/{item.steps.length}</small>
                </span>
              </button>
            );
          })}
        </div>

        <section className="roomio-card roomio-rollout__panel">
          <div className="roomio-rollout__panel-head">
            <div>
              <h2>{activePhase.title}</h2>
              <p>{activePhase.description}</p>
            </div>
            <button type="button" className="roomio-btn roomio-btn--secondary roomio-btn--sm" onClick={() => markPhaseDone(activePhase.id)}>
              Fazı tamamla
            </button>
          </div>

          <ol className="roomio-rollout__steps">
            {activePhase.steps.map((step, index) => {
              const stepStatus = status[step.id] ?? 'pending';
              return (
                <li key={step.id} className={`roomio-rollout__step is-${stepStatus}`}>
                  <div className="roomio-rollout__step-main">
                    <span className="roomio-rollout__step-no">{index + 1}</span>
                    <div>
                      <strong>{step.label}</strong>
                      {step.screenRef ? <span className="roomio-rollout__ref">Ref: {step.screenRef}</span> : null}
                      {step.notes ? <p>{step.notes}</p> : null}
                      <p className="roomio-page-desc">
                        <Link href={step.href}>Canlı ekran →</Link>
                      </p>
                    </div>
                  </div>
                  <div className="roomio-rollout__step-actions">
                    <Link href={step.href} className="roomio-btn roomio-btn--primary roomio-btn--sm" target="_blank">
                      <ExternalLink size={14} /> Aç
                    </Link>
                    <button
                      type="button"
                      className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                      onClick={() => setStepStatus(step.id, stepStatus === 'in_progress' ? 'pending' : 'in_progress')}
                    >
                      <PlayCircle size={14} /> Test
                    </button>
                    <button
                      type="button"
                      className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                      onClick={() => setStepStatus(step.id, stepStatus === 'done' ? 'pending' : 'done')}
                    >
                      {stepStatus === 'done' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      {stepStatus === 'done' ? 'Tamam' : 'İşaretle'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {nextPlan ? (
          <section className="roomio-card roomio-rollout__next">
            <h2 className="roomio-card-title">Sonraki faz: {nextPlan.nextTitle}</h2>
            <p className="roomio-page-desc">{nextPlan.nextDescription}</p>
            <h3 className="roomio-card-title" style={{ fontSize: '0.95rem', marginTop: 16 }}>Tasarım notları</h3>
            <ul className="roomio-compliance-list">
              {nextPlan.designNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            {nextPlan.targetFiles.length ? (
              <>
                <h3 className="roomio-card-title" style={{ fontSize: '0.95rem', marginTop: 16 }}>Hedef dosyalar</h3>
                <ul className="roomio-compliance-list">
                  {nextPlan.targetFiles.map((f) => (
                    <li key={f.path}><code>{f.path}</code> — {f.task}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <div className="roomio-form-actions" style={{ marginTop: 16 }}>
              <button type="button" className="roomio-btn roomio-btn--secondary" onClick={() => selectPhase(nextPlan.nextPhaseId)}>
                Sonraki faza geç
              </button>
              <span className="roomio-page-desc">Detay: <code>references/NEXT-PHASE.md</code></span>
            </div>
          </section>
        ) : null}
      </div>
    </ModuleLayout>
  );
}
