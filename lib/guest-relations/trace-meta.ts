export type TraceKind = 'general' | 'wakeup' | 'yellow' | 'note';

export type TraceLike = {
  subject: string;
  notes?: string;
};

export function traceKind(trace: TraceLike): TraceKind {
  const blob = `${trace.subject} ${trace.notes ?? ''}`.toLowerCase();
  if (trace.notes?.includes('type:wakeup') || /uyandır|wake\s*up|\[uyandırma\]/.test(blob)) {
    return 'wakeup';
  }
  if (trace.notes?.includes('type:yellow') || /sarı\s*not|yellow|\[sarı\]/.test(blob)) {
    return 'yellow';
  }
  if (trace.notes?.includes('type:note') || /\[not\]/.test(blob)) {
    return 'note';
  }
  return 'general';
}

export function filterTracesByKind<T extends TraceLike>(traces: T[], kind?: TraceKind | 'all'): T[] {
  if (!kind || kind === 'all') return traces;
  return traces.filter((t) => traceKind(t) === kind);
}

export function traceKindTag(kind: TraceKind): string {
  if (kind === 'wakeup') return 'type:wakeup';
  if (kind === 'yellow') return 'type:yellow';
  if (kind === 'note') return 'type:note';
  return '';
}
