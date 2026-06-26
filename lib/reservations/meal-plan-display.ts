/** Elektra / Konaklama PMS pansiyon kodları ve Türkçe karşılıkları */
export const MEAL_PLAN_LABELS: Record<string, string> = {
  RO: 'Oda',
  OB: 'Oda',
  BB: 'Kahvaltı',
  HB: 'Yarım Pansiyon',
  FB: 'Tam Pansiyon',
  AI: 'Her Şey Dahil',
  UAI: 'Her Şey Dahil',
};

/** Listede gösterilecek kısa kod (RO → OB). */
export const MEAL_PLAN_LIST_CODES: Record<string, string> = {
  RO: 'OB',
  OB: 'OB',
  BB: 'BB',
  HB: 'HB',
  FB: 'FB',
  AI: 'AI',
  UAI: 'AI',
};

export function formatMealPlanList(mealPlan: string): { code: string; label: string } {
  const key = mealPlan.trim().toUpperCase();
  const label = MEAL_PLAN_LABELS[key] ?? mealPlan;
  const code = MEAL_PLAN_LIST_CODES[key] ?? key;
  return { code, label };
}

/** Depolama / API için normalize kod (OB → RO). */
export function normalizeMealPlanCode(mealPlan: string): string {
  const key = mealPlan.trim().toUpperCase();
  if (key === 'OB') return 'RO';
  return key;
}
