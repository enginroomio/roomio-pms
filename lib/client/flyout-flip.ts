/** Yan flyout viewport dışına taşarsa sola açılır */
export function shouldFlipFlyout(branchEl: HTMLElement, flyoutWidth = 260): boolean {
  const rect = branchEl.getBoundingClientRect();
  return rect.right + flyoutWidth > window.innerWidth - 8;
}
