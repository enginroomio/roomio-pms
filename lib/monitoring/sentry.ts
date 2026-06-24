import 'server-only';

type SentryModule = typeof import('@sentry/node');

let initialized = false;
let sentryMod: SentryModule | null = null;

function sentry(): SentryModule {
  if (!sentryMod) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sentryMod = require('@sentry/node') as SentryModule;
  }
  return sentryMod;
}

export function sentryConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

export function initSentry(): boolean {
  if (initialized) return sentryConfigured();
  initialized = true;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;

  sentry().init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    release: process.env.ROOMIO_RELEASE ?? undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
  return true;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initSentry()) return;
  sentry().withScope((scope) => {
    if (context) scope.setContext('roomio', context);
    sentry().captureException(error);
  });
}

export function captureMessage(message: string, level: import('@sentry/node').SeverityLevel = 'info'): void {
  if (!initSentry()) return;
  sentry().captureMessage(message, level);
}

export function flushSentry(timeoutMs = 2000): Promise<boolean> {
  if (!sentryConfigured()) return Promise.resolve(true);
  initSentry();
  return sentry().flush(timeoutMs);
}
