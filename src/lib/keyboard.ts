export const isEscapeKey = (
  e: KeyboardEvent | React.KeyboardEvent,
): boolean => {
  return e.key === "Escape" || (e.ctrlKey && e.key === "[");
};
