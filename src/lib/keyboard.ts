export const isEscapeKey = (
  e: KeyboardEvent | React.KeyboardEvent,
): boolean => {
  return e.key === "Escape" || (e.ctrlKey && e.key === "[");
};

export const wrapSelectionIndex = (
  currentIndex: number,
  itemCount: number,
  direction: -1 | 1,
): number => {
  if (itemCount === 0) return 0;
  return (currentIndex + direction + itemCount) % itemCount;
};
