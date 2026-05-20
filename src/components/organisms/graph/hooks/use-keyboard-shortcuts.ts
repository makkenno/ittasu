import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  selectedNodeIds: Set<string>;
  onDelete?: () => void;
  onAddTask?: () => void;
  onEscape?: () => void;
  onToggleSelectionMode?: () => void;
  onFormat?: () => void;
  onConnectIsolated?: () => void;
}

export function useKeyboardShortcuts({
  selectedNodeIds,
  onDelete,
  onAddTask,
  onEscape,
  onToggleSelectionMode,
  onFormat,
  onConnectIsolated,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const shouldIgnoreEvent = () => {
      const activeElement = document.activeElement;
      return (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA"
      );
    };

    const tryHandleDelete = (event: KeyboardEvent) => {
      const isDeleteKey = event.key === "Delete" || event.key === "Backspace";
      if (isDeleteKey && selectedNodeIds.size > 0) {
        onDelete?.();
        return true;
      }
      return false;
    };

    const tryHandleAddTask = (event: KeyboardEvent) => {
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        onAddTask?.();
        return true;
      }
      return false;
    };

    const tryHandleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape?.();
        return true;
      }
      return false;
    };

    const tryHandleToggleSelectionMode = (event: KeyboardEvent) => {
      if (event.key === "s" || event.key === "S") {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          onToggleSelectionMode?.();
          return true;
        }
      }
      return false;
    };

    const tryHandleFormat = (event: KeyboardEvent) => {
      if (event.key === "f" || event.key === "F") {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          onFormat?.();
          return true;
        }
      }
      return false;
    };

    const tryHandleConnectIsolated = (event: KeyboardEvent) => {
      if (event.key === "c" || event.key === "C") {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          onConnectIsolated?.();
          return true;
        }
      }
      return false;
    };

    const handlers = [
      tryHandleDelete,
      tryHandleAddTask,
      tryHandleEscape,
      tryHandleToggleSelectionMode,
      tryHandleFormat,
      tryHandleConnectIsolated,
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreEvent()) return;
      for (const handler of handlers) {
        if (handler(event)) return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedNodeIds,
    onDelete,
    onAddTask,
    onEscape,
    onToggleSelectionMode,
    onFormat,
    onConnectIsolated,
  ]);
}
