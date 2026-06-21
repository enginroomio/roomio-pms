export const HK_ONLINE_REFRESH_EVENT = 'roomio-hk-online-refresh';

export function notifyHkOnlineRefresh() {
  window.dispatchEvent(new Event(HK_ONLINE_REFRESH_EVENT));
}
