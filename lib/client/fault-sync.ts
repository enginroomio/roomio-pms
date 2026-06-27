export const HK_FAULT_UPDATE_EVENT = 'roomio-hk-fault-update';

export type HkFaultUpdateDetail = {
  action: 'created' | 'assigned' | 'completed' | 'sync';
  roomNo?: string;
  faultId?: string;
};

const BC_NAME = 'roomio-hk-fault';

let channel: BroadcastChannel | null = null;

function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(BC_NAME);
  return channel;
}

export function emitHkFaultUpdate(detail: HkFaultUpdateDetail) {
  window.dispatchEvent(new CustomEvent<HkFaultUpdateDetail>(HK_FAULT_UPDATE_EVENT, { detail }));
  getChannel()?.postMessage(detail);
}
