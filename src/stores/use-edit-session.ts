import { useCallback, useRef } from "react";
import { useTaskStore } from "./task-store";

type Snapshot = ReturnType<typeof captureSnapshot>;

function captureSnapshot() {
  const s = useTaskStore.getState();
  return {
    nodes: s.nodes,
    edges: s.edges,
    projects: s.projects,
    templates: s.templates,
    currentTaskId: s.currentTaskId,
    currentProjectId: s.currentProjectId,
  };
}

function shallowDiffers(a: Snapshot, b: Snapshot): boolean {
  return (
    a.nodes !== b.nodes ||
    a.edges !== b.edges ||
    a.projects !== b.projects ||
    a.templates !== b.templates
  );
}

/**
 * テキスト入力フォーカス中は zundo の履歴追跡を停止し、blur 時に
 * セッション全体の変更を 1 エントリの履歴として確定する。
 */
export function useEditSession() {
  const snapshotRef = useRef<Snapshot | null>(null);

  const handleFocus = useCallback(() => {
    if (snapshotRef.current !== null) return;
    snapshotRef.current = captureSnapshot();
    useTaskStore.temporal.getState().pause();
  }, []);

  const handleBlur = useCallback(() => {
    const snapshot = snapshotRef.current;
    snapshotRef.current = null;
    const temporal = useTaskStore.temporal.getState();
    temporal.resume();
    if (!snapshot) return;
    const current = captureSnapshot();
    if (!shallowDiffers(snapshot, current)) return;
    useTaskStore.temporal.setState((s) => ({
      pastStates: [...s.pastStates, snapshot],
      futureStates: [],
    }));
  }, []);

  return { handleFocus, handleBlur };
}
