export const INVENTORY_HYDRATED_EVENT = 'roomio:inventory-hydrated';
export const PROPERTY_CHANGED_EVENT = 'roomio:property-changed';

export function dispatchInventoryHydrated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(INVENTORY_HYDRATED_EVENT));
}

export function dispatchPropertyChanged(propertyId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROPERTY_CHANGED_EVENT, { detail: { propertyId } }));
}
