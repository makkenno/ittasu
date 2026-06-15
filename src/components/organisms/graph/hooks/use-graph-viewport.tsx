import { useEffect, useRef } from "react";
import { type ReactFlowInstance, useReactFlow } from "reactflow";

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

function getFocusedViewport(
  container: HTMLDivElement,
  node: HTMLElement,
  viewport: Viewport,
): Viewport {
  const containerRect = container.getBoundingClientRect();
  const nodeRect = node.getBoundingClientRect();
  const zoom = 1.1;
  const centerX =
    (nodeRect.left + nodeRect.width / 2 - containerRect.left - viewport.x) /
    viewport.zoom;
  const centerY =
    (nodeRect.top + nodeRect.height / 2 - containerRect.top - viewport.y) /
    viewport.zoom;

  return {
    x: containerRect.width / 2 - centerX * zoom,
    y: containerRect.height / 2 - centerY * zoom,
    zoom,
  };
}

export function animateViewport({
  start,
  target,
  duration,
  onUpdate,
  onFinish,
}: {
  start: Viewport;
  target: Viewport;
  duration: number;
  onUpdate: (viewport: Viewport) => void;
  onFinish: () => void;
}) {
  if (duration === 0) {
    onUpdate(target);
    onFinish();
    return () => {};
  }

  let frame: number;
  let cancelled = false;
  const startedAt = performance.now();
  const tick = (now: number) => {
    if (cancelled) return;
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    onUpdate({
      x: start.x + (target.x - start.x) * eased,
      y: start.y + (target.y - start.y) * eased,
      zoom: start.zoom + (target.zoom - start.zoom) * eased,
    });
    if (progress < 1) {
      frame = window.requestAnimationFrame(tick);
    } else {
      onFinish();
    }
  };
  frame = window.requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame);
  };
}

export function FocusTaskViewport({
  taskId,
  onHandled,
  onPrepare,
  containerRef,
}: {
  taskId: string | null | undefined;
  onHandled?: (taskId: string) => void;
  onPrepare: (taskId: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const reactFlow = useReactFlow();
  const prepareRef = useRef(onPrepare);
  const reactFlowRef = useRef(reactFlow);
  prepareRef.current = onPrepare;
  reactFlowRef.current = reactFlow;

  useEffect(() => {
    if (!taskId) return;

    let attempts = 0;
    let retryTimer: number;
    let focusTimer: number;
    let cancelViewportAnimation: (() => void) | undefined;
    const focusTask = () => {
      const container = containerRef.current;
      const node = container?.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${CSS.escape(taskId)}"]`,
      );
      if (!container || !node) return;

      const currentViewport = reactFlowRef.current.getViewport();
      const viewport = getFocusedViewport(container, node, currentViewport);
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      cancelViewportAnimation = animateViewport({
        start: currentViewport,
        target: viewport,
        duration: reduceMotion ? 0 : 350,
        onUpdate: (nextViewport) => {
          void reactFlowRef.current.setViewport(nextViewport);
        },
        onFinish: () => {
          onHandled?.(taskId);
        },
      });
    };
    const prepareFocus = () => {
      const node = containerRef.current?.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${CSS.escape(taskId)}"]`,
      );
      const rect = node?.getBoundingClientRect();
      if ((!rect?.width || !rect.height) && attempts < 100) {
        attempts += 1;
        retryTimer = window.setTimeout(prepareFocus, 50);
        return;
      }
      if (!node) return;

      prepareRef.current(taskId);
      focusTimer = window.setTimeout(focusTask, 50);
    };
    prepareFocus();

    return () => {
      window.clearTimeout(retryTimer);
      window.clearTimeout(focusTimer);
      cancelViewportAnimation?.();
    };
  }, [containerRef, onHandled, taskId]);

  return null;
}

export function useGraphLayoutLifecycle({
  rfInstance,
  scopeKey,
  taskCount,
  skipNextTaskCountLayoutRef,
  formatGraph,
  formatAndFitGraph,
}: {
  rfInstance: ReactFlowInstance | null;
  scopeKey: string;
  taskCount: number;
  skipNextTaskCountLayoutRef: React.RefObject<boolean>;
  formatGraph: () => void;
  formatAndFitGraph: () => void;
}) {
  const layoutStateRef = useRef<{
    scopeKey: string;
    taskCount: number;
  } | null>(null);
  const formatGraphRef = useRef(formatGraph);
  const formatAndFitGraphRef = useRef(formatAndFitGraph);
  formatGraphRef.current = formatGraph;
  formatAndFitGraphRef.current = formatAndFitGraph;

  useEffect(() => {
    if (!rfInstance) return undefined;

    const previous = layoutStateRef.current;
    layoutStateRef.current = { scopeKey, taskCount };

    if (!previous || previous.scopeKey !== scopeKey) {
      const timer = window.setTimeout(() => formatAndFitGraphRef.current(), 50);
      return () => window.clearTimeout(timer);
    }

    if (previous.taskCount === taskCount) return undefined;
    if (skipNextTaskCountLayoutRef.current) {
      skipNextTaskCountLayoutRef.current = false;
      return undefined;
    }

    const timer = window.setTimeout(() => formatGraphRef.current(), 50);
    return () => window.clearTimeout(timer);
  }, [rfInstance, scopeKey, taskCount, skipNextTaskCountLayoutRef]);
}
