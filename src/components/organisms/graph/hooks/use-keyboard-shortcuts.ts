import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  selectedNodeIds: Set<string>;
  onRemoveTask?: (taskId: string) => void;
  setSelectedNodeIds: (ids: Set<string>) => void;
}

export function useKeyboardShortcuts({
  selectedNodeIds,
  onRemoveTask,
  setSelectedNodeIds,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedNodeIds.size > 0
      ) {
        const activeElement = document.activeElement;
        if (
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }

        for (const nodeId of selectedNodeIds) {
          onRemoveTask?.(nodeId);
        }
        setSelectedNodeIds(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNodeIds, onRemoveTask, setSelectedNodeIds]);
}
