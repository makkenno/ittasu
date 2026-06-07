import { useEffect } from "react";
import { tinykeys } from "tinykeys";
import { findEndNode, findStartNode } from "../../../../lib/graph-utils";
import type { TaskEdge } from "../../../../types/edge";
import type { TaskNode } from "../../../../types/task";

interface UseKeyboardShortcutsProps {
  enabled?: boolean;
  selectedNodeIds: Set<string>;
  selectedTaskId: string | null;
  selectedEdgeId?: string | null;
  nodes: TaskNode[];
  edges: TaskEdge[];
  onDelete?: () => void;
  onAddTask?: () => void;
  onInsertBefore?: () => void;
  onInsertAfter?: () => void;
  onInsertAtStart?: () => void;
  onInsertAtEnd?: () => void;
  onAddSiblingOfEnd?: () => void;
  onEscape?: () => void;
  onToggleSelectionMode?: () => void;
  onFormat?: () => void;
  onConnectIsolated?: () => void;
  onSelectTask?: (taskId: string | null) => void;
  onSelectEdge?: (edgeId: string | null) => void;
  onOpenDetail?: (taskId: string) => void;
  onEditTitle?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onCopyNode?: () => void;
  onPaste?: () => void;
  onFocusMemo?: () => void;
  onToggleMemo?: () => void;
  onEditCurrentTitle?: () => void;
  selectionMode?: boolean;
  onExtendSelection?: (taskId: string) => void;
  onConnectFromSelected?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onOpenSearch?: () => void;
  onOpenPreview?: () => void;
}

type Movable =
  | { type: "node"; id: string; position: { x: number; y: number } }
  | { type: "edge"; id: string; position: { x: number; y: number } };

function buildMovables(nodes: TaskNode[], edges: TaskEdge[]): Movable[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const result: Movable[] = nodes.map((n) => ({
    type: "node",
    id: n.id,
    position: n.position,
  }));
  for (const edge of edges) {
    const s = nodeMap.get(edge.source);
    const t = nodeMap.get(edge.target);
    if (!s || !t) continue;
    result.push({
      type: "edge",
      id: edge.id,
      position: {
        x: (s.position.x + t.position.x) / 2,
        y: (s.position.y + t.position.y) / 2,
      },
    });
  }
  return result;
}

function scoreDirection(
  dx: number,
  dy: number,
  direction: "h" | "j" | "k" | "l",
): number | null {
  switch (direction) {
    case "l":
      if (dx > 0 && Math.abs(dx) >= Math.abs(dy)) return dx + Math.abs(dy) * 2;
      return null;
    case "h":
      if (dx < 0 && Math.abs(dx) >= Math.abs(dy)) return -dx + Math.abs(dy) * 2;
      return null;
    case "j":
      if (dy > 0 && Math.abs(dy) >= Math.abs(dx)) return dy + Math.abs(dx) * 2;
      return null;
    case "k":
      if (dy < 0 && Math.abs(dy) >= Math.abs(dx)) return -dy + Math.abs(dx) * 2;
      return null;
  }
}

function findNearestMovable(
  current: Movable,
  candidates: Movable[],
  direction: "h" | "j" | "k" | "l",
): Movable | null {
  let best: { item: Movable; score: number } | null = null;
  for (const m of candidates) {
    if (m.type === current.type && m.id === current.id) continue;
    const dx = m.position.x - current.position.x;
    const dy = m.position.y - current.position.y;
    const score = scoreDirection(dx, dy, direction);
    if (score === null) continue;
    if (!best || score < best.score) best = { item: m, score };
  }
  return best?.item ?? null;
}

export function useKeyboardShortcuts({
  enabled = true,
  selectedNodeIds,
  selectedTaskId,
  selectedEdgeId = null,
  nodes,
  edges,
  onDelete,
  onAddTask,
  onInsertBefore,
  onInsertAfter,
  onInsertAtStart,
  onInsertAtEnd,
  onAddSiblingOfEnd,
  onEscape,
  onToggleSelectionMode,
  onFormat,
  onConnectIsolated,
  onSelectTask,
  onSelectEdge,
  onOpenDetail,
  onEditTitle,
  onToggleComplete,
  onDeleteTask,
  onDeleteEdge,
  onCopyNode,
  onPaste,
  onFocusMemo,
  onToggleMemo,
  onEditCurrentTitle,
  selectionMode = false,
  onExtendSelection,
  onConnectFromSelected,
  onZoomIn,
  onZoomOut,
  onFitView,
  onOpenSearch,
  onOpenPreview,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const parentId = nodes[0]?.parentId ?? null;

    const selectMovable = (m: Movable) => {
      if (m.type === "node") {
        onSelectTask?.(m.id);
        onSelectEdge?.(null);
        if (selectionMode) onExtendSelection?.(m.id);
      } else {
        onSelectEdge?.(m.id);
        onSelectTask?.(null);
      }
    };

    const findCurrent = (movables: Movable[]): Movable | null => {
      if (selectedEdgeId) {
        return (
          movables.find((m) => m.type === "edge" && m.id === selectedEdgeId) ??
          null
        );
      }
      if (selectedTaskId) {
        return (
          movables.find((m) => m.type === "node" && m.id === selectedTaskId) ??
          null
        );
      }
      return null;
    };

    const move = (direction: "h" | "j" | "k" | "l") => {
      const movables = buildMovables(nodes, edges);
      const current = findCurrent(movables);
      if (!current) {
        const start = findStartNode(nodes, edges, parentId);
        if (start)
          selectMovable({
            type: "node",
            id: start.id,
            position: start.position,
          });
        return;
      }
      const next = findNearestMovable(current, movables, direction);
      if (next) selectMovable(next);
    };

    const performDelete = () => {
      if (selectedEdgeId) {
        onDeleteEdge?.(selectedEdgeId);
        return;
      }
      if (selectedNodeIds.size > 0) onDelete?.();
      else if (selectedTaskId) onDeleteTask?.(selectedTaskId);
    };

    const handle = (fn: () => void) => (event: KeyboardEvent) => {
      event.preventDefault();
      fn();
    };

    return tinykeys(window, {
      h: handle(() => move("h")),
      j: handle(() => move("j")),
      k: handle(() => move("k")),
      l: handle(() => move("l")),
      "g g": handle(() => {
        const start = findStartNode(nodes, edges, parentId);
        if (start)
          selectMovable({
            type: "node",
            id: start.id,
            position: start.position,
          });
      }),
      "Shift+g": handle(() => {
        const end = findEndNode(nodes, edges, parentId);
        if (end)
          selectMovable({ type: "node", id: end.id, position: end.position });
      }),
      "d d": handle(performDelete),
      Delete: handle(performDelete),
      Backspace: handle(performDelete),
      Escape: handle(() => onEscape?.()),
      "Control+[": handle(() => onEscape?.()),
      o: handle(() => (onAddSiblingOfEnd ?? onAddTask)?.()),
      a: handle(() => (onInsertAfter ?? onAddTask)?.()),
      "Shift+a": handle(() => (onInsertAtEnd ?? onAddTask)?.()),
      Enter: handle(() => {
        if (selectedTaskId) onOpenDetail?.(selectedTaskId);
      }),
      i: handle(() => (onInsertBefore ?? onAddTask)?.()),
      "Shift+i": handle(() => (onInsertAtStart ?? onAddTask)?.()),
      r: handle(() => {
        if (selectedTaskId) onEditTitle?.(selectedTaskId);
        else onEditCurrentTitle?.();
      }),
      e: handle(() => onConnectFromSelected?.()),
      x: handle(() => {
        if (selectedTaskId) onToggleComplete?.(selectedTaskId);
      }),
      "[Shift]+v": handle(() => onToggleSelectionMode?.()),
      "[Shift]+f": handle(() => onFormat?.()),
      "[Shift]+c": handle(() => onConnectIsolated?.()),
      y: handle(() => onCopyNode?.()),
      p: handle(() => onPaste?.()),
      m: handle(() => onFocusMemo?.()),
      "Shift+m": handle(() => onToggleMemo?.()),
      "Shift+>": handle(() => onZoomIn?.()),
      "Shift+<": handle(() => onZoomOut?.()),
      "0": handle(() => onFitView?.()),
      "/": handle(() => onOpenSearch?.()),
      "Shift+p": handle(() => onOpenPreview?.()),
    });
  }, [
    enabled,
    selectedNodeIds,
    selectedTaskId,
    selectedEdgeId,
    nodes,
    edges,
    onDelete,
    onAddTask,
    onInsertBefore,
    onInsertAfter,
    onInsertAtStart,
    onInsertAtEnd,
    onAddSiblingOfEnd,
    onEscape,
    onToggleSelectionMode,
    onFormat,
    onConnectIsolated,
    onSelectTask,
    onSelectEdge,
    onOpenDetail,
    onEditTitle,
    onToggleComplete,
    onDeleteTask,
    onDeleteEdge,
    onCopyNode,
    onPaste,
    onFocusMemo,
    onToggleMemo,
    onEditCurrentTitle,
    selectionMode,
    onExtendSelection,
    onConnectFromSelected,
    onZoomIn,
    onZoomOut,
    onFitView,
    onOpenSearch,
    onOpenPreview,
  ]);
}
