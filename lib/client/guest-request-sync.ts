export const HK_GUEST_REQUEST_EVENT = 'roomio-hk-guest-request';

export type HkGuestRequestUpdateDetail = {
  action: 'created' | 'completed' | 'sync';
  roomNo?: string;
  requestId?: string;
};

const BC_NAME = 'roomio-hk-guest-request';

let channel: BroadcastChannel | null = null;

function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(BC_NAME);
  return channel;
}

export function emitHkGuestRequestUpdate(detail: HkGuestRequestUpdateDetail) {
  window.dispatchEvent(new CustomEvent<HkGuestRequestUpdateDetail>(HK_GUEST_REQUEST_EVENT, { detail }));
  getChannel()?.postMessage(detail);
}
