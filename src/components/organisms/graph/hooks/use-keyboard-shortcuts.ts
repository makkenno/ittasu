import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  selectedNodeIds: Set<string>;
  onRemoveTask?: (taskId: string) => void;
  setSelectedNodeIds: (ids: Set<string>) => void;
  onAddTask?: () => void;
}

export function useKeyboardShortcuts({
  selectedNodeIds,
  onRemoveTask,
  setSelectedNodeIds,
  onAddTask,
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
        for (const nodeId of selectedNodeIds) {
          onRemoveTask?.(nodeId);
        }
        setSelectedNodeIds(new Set());
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreEvent()) return;
      if (tryHandleDelete(event)) return;
      tryHandleAddTask(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNodeIds, onRemoveTask, setSelectedNodeIds, onAddTask]);
}
