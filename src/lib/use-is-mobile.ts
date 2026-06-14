import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const COMPACT_GRAPH_QUERY = "(max-width: 1023px)";

const subscribeToQuery = (query: string, onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const subscribeMobile = (onStoreChange: () => void) =>
  subscribeToQuery(MOBILE_QUERY, onStoreChange);
const subscribeCompactGraph = (onStoreChange: () => void) =>
  subscribeToQuery(COMPACT_GRAPH_QUERY, onStoreChange);
const getSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const getCompactGraphSnapshot = () =>
  window.matchMedia(COMPACT_GRAPH_QUERY).matches;
const getServerSnapshot = () => false;

export function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getSnapshot, getServerSnapshot);
}

export function useIsCompactGraph() {
  return useSyncExternalStore(
    subscribeCompactGraph,
    getCompactGraphSnapshot,
    getServerSnapshot,
  );
}
