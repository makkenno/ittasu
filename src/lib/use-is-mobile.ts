import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

const subscribe = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const getSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const getServerSnapshot = () => false;

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
