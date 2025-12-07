import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  selectedNodeIds: Set<string>;
  onDelete?: () => void;
  onAddTask?: () => void;
  onEscape?: () => void;
  onToggleSelectionMode?: () => void;
  onFormat?: () => void;
}

export function useKeyboardShortcuts({
  selectedNodeIds,
  onDelete,
  onAddTask,
  onEscape,
  onToggleSelectionMode,
  onFormat,
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreEvent()) return;
      if (tryHandleDelete(event)) return;
      if (tryHandleAddTask(event)) return;
      if (tryHandleEscape(event)) return;
      if (tryHandleToggleSelectionMode(event)) return;
      tryHandleFormat(event);
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
  ]);
}
