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
import { useI18n } from '@/components/i18n/I18nProvider';

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
  const { t } = useI18n();
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
      breadcrumb={t('tools.rollout.breadcrumb')}
      title={t('tools.rollout.title')}
      description={t('tools.rollout.desc')}
      sideTitle={t('tools.rollout.sideTitle')}
      menuSearch={menuSearch}
      actions={
        <Link href="/" className="roomio-btn roomio-btn--secondary roomio-btn--sm">
          {t('tools.rollout.home')}
        </Link>
      }
    >
      <div className="roomio-rollout">
        <div className="roomio-rollout__summary">
          <div className="roomio-rollout__stat">
            <span className="roomio-rollout__stat-label">{t('tools.rollout.progress')}</span>
            <strong>{stats.done} / {stats.total}</strong>
            <span className="roomio-rollout__stat-hint">{t('tools.rollout.completed').replace('{pct}', String(stats.pct))}</span>
          </div>
          <p className="roomio-rollout__hint">
            {t('tools.rollout.hint')}
            {' '}
            <Link href="/tools/theme">{t('tools.rollout.themeLink')}</Link>
          </p>
          {stats.done < stats.total ? (
            <div className="roomio-form-actions" style={{ marginTop: 12 }}>
              <button type="button" className="roomio-btn roomio-btn--primary roomio-btn--sm" onClick={markAllSmokePassed}>
                {t('tools.rollout.smokePass').replace('{total}', String(stats.total))}
              </button>
            </div>
          ) : (
            <p className="roomio-rollout__hint" style={{ marginTop: 8 }}>
              {t('tools.rollout.allDone').replace('{done}', String(stats.done)).replace('{total}', String(stats.total))}
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
              {t('tools.rollout.completePhase')}
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
                        <Link href={step.href}>{t('tools.rollout.liveScreen')}</Link>
                      </p>
                    </div>
                  </div>
                  <div className="roomio-rollout__step-actions">
                    <Link href={step.href} className="roomio-btn roomio-btn--primary roomio-btn--sm" target="_blank">
                      <ExternalLink size={14} /> {t('tools.rollout.open')}
                    </Link>
                    <button
                      type="button"
                      className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                      onClick={() => setStepStatus(step.id, stepStatus === 'in_progress' ? 'pending' : 'in_progress')}
                    >
                      <PlayCircle size={14} /> {t('tools.rollout.test')}
                    </button>
                    <button
                      type="button"
                      className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                      onClick={() => setStepStatus(step.id, stepStatus === 'done' ? 'pending' : 'done')}
                    >
                      {stepStatus === 'done' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      {stepStatus === 'done' ? t('tools.rollout.done') : t('tools.rollout.mark')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {nextPlan ? (
          <section className="roomio-card roomio-rollout__next">
            <h2 className="roomio-card-title">{t('tools.rollout.nextPhase').replace('{title}', nextPlan.nextTitle)}</h2>
            <p className="roomio-page-desc">{nextPlan.nextDescription}</p>
            <h3 className="roomio-card-title" style={{ fontSize: '0.95rem', marginTop: 16 }}>{t('tools.rollout.designNotes')}</h3>
            <ul className="roomio-compliance-list">
              {nextPlan.designNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            {nextPlan.targetFiles.length ? (
              <>
                <h3 className="roomio-card-title" style={{ fontSize: '0.95rem', marginTop: 16 }}>{t('tools.rollout.targetFiles')}</h3>
                <ul className="roomio-compliance-list">
                  {nextPlan.targetFiles.map((f) => (
                    <li key={f.path}><code>{f.path}</code> — {f.task}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <div className="roomio-form-actions" style={{ marginTop: 16 }}>
              <button type="button" className="roomio-btn roomio-btn--secondary" onClick={() => selectPhase(nextPlan.nextPhaseId)}>
                {t('tools.rollout.goNextPhase')}
              </button>
              <span className="roomio-page-desc">Detay: <code>references/NEXT-PHASE.md</code></span>
            </div>
          </section>
        ) : null}
      </div>
    </ModuleLayout>
  );
}
