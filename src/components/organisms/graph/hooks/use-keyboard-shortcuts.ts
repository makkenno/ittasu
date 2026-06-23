import { useEffect } from "react";
import { tinykeys } from "tinykeys";
import {
  buildMovables,
  findNearestNode,
  type Movable,
  type NavigationDirection,
} from "../../../../lib/graph-navigation";
import { findEndNode, findStartNode } from "../../../../lib/graph-utils";
import type { TaskEdge } from "../../../../types/edge";
import type { TaskNode } from "../../../../types/task";

interface UseKeyboardShortcutsProps {
  enabled?: boolean;
  selectedNodeIds: Set<string>;
  selectedTaskId: string | null;
  selectedTaskIdRef?: { current: string | null };
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

export function useKeyboardShortcuts({
  enabled = true,
  selectedNodeIds,
  selectedTaskId,
  selectedTaskIdRef,
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
    const getSelectedTaskId = () =>
      selectedTaskIdRef?.current ?? selectedTaskId;
    const setSelectedTaskId = (taskId: string | null) => {
      if (selectedTaskIdRef) selectedTaskIdRef.current = taskId;
    };
    const selectNode = (taskId: string) => {
      setSelectedTaskId(taskId);
      onSelectTask?.(taskId);
      onSelectEdge?.(null);
      if (selectionMode) onExtendSelection?.(taskId);
    };
    const selectEdge = (edgeId: string) => {
      setSelectedTaskId(null);
      onSelectEdge?.(edgeId);
      onSelectTask?.(null);
    };
    const selectMovable = (m: Movable) => {
      if (m.type === "node") {
        selectNode(m.id);
      } else {
        selectEdge(m.id);
      }
    };

    const findCurrent = (movables: Movable[]): Movable | null => {
      if (selectedEdgeId) {
        return (
          movables.find((m) => m.type === "edge" && m.id === selectedEdgeId) ??
          null
        );
      }
      const currentSelectedTaskId = getSelectedTaskId();
      if (currentSelectedTaskId) {
        return (
          movables.find(
            (m) => m.type === "node" && m.id === currentSelectedTaskId,
          ) ?? null
        );
      }
      return null;
    };

    const move = (direction: NavigationDirection) => {
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
      const next = findNearestNode(current, movables, direction);
      if (next) selectMovable(next);
    };

    const performDelete = () => {
      if (selectedEdgeId) {
        onDeleteEdge?.(selectedEdgeId);
        return;
      }
      if (selectedNodeIds.size > 0) onDelete?.();
      else {
        const currentSelectedTaskId = getSelectedTaskId();
        if (currentSelectedTaskId) onDeleteTask?.(currentSelectedTaskId);
      }
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
        const currentSelectedTaskId = getSelectedTaskId();
        if (currentSelectedTaskId) onOpenDetail?.(currentSelectedTaskId);
      }),
      i: handle(() => (onInsertBefore ?? onAddTask)?.()),
      "Shift+i": handle(() => (onInsertAtStart ?? onAddTask)?.()),
      r: handle(() => {
        const currentSelectedTaskId = getSelectedTaskId();
        if (currentSelectedTaskId) onEditTitle?.(currentSelectedTaskId);
        else onEditCurrentTitle?.();
      }),
      e: handle(() => onConnectFromSelected?.()),
      x: handle(() => {
        const currentSelectedTaskId = getSelectedTaskId();
        if (currentSelectedTaskId) onToggleComplete?.(currentSelectedTaskId);
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
    selectedTaskIdRef,
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
