export const HK_PUSH_ALERT_EVENT = 'roomio-hk-push-alert';

export type HkPushAlertDetail = { title: string; body: string };

export function emitHkPushAlert(detail: HkPushAlertDetail) {
  window.dispatchEvent(new CustomEvent<HkPushAlertDetail>(HK_PUSH_ALERT_EVENT, { detail }));
}
