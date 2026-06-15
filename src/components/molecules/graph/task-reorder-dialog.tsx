import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS as TransformCSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getLinearTaskOrder } from "../../../lib/graph-utils";
import { cn } from "../../../lib/utils";
import type { TaskEdge } from "../../../types/edge";
import type { TaskNode } from "../../../types/task";

interface SortableTaskRowProps {
  task: TaskNode | undefined;
  index: number;
}

function SortableTaskRow({ task, index }: SortableTaskRowProps) {
  const taskId = task?.id ?? "";
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: taskId });
  const title = task?.title.trim() || "無題のタスク";

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: TransformCSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 transition-shadow",
        isDragging &&
          "relative z-10 border-blue-400 shadow-lg ring-2 ring-blue-500/30",
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600"
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
        {title}
      </span>
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`${title}をドラッグして並び替え`}
        className="flex h-11 w-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-gray-500 active:cursor-grabbing active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </li>
  );
}

interface TaskReorderDialogProps {
  nodes: TaskNode[];
  edges: TaskEdge[];
  parentId: string | null;
  onClose: () => void;
  onSave: (taskIds: string[]) => void;
}

export function TaskReorderDialog({
  nodes,
  edges,
  parentId,
  onClose,
  onSave,
}: TaskReorderDialogProps) {
  const linearOrder = useMemo(
    () => getLinearTaskOrder(nodes, edges, parentId),
    [edges, nodes, parentId],
  );
  const [draftIds, setDraftIds] = useState(
    () => linearOrder?.map((task) => task.id) ?? [],
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const taskById = new Map(nodes.map((task) => [task.id, task]));
  const getTaskLabel = (taskId: string | number) =>
    taskById.get(String(taskId))?.title.trim() || "無題のタスク";
  const getPositionLabel = (taskId: string | number) => {
    const index = draftIds.indexOf(String(taskId));
    return index >= 0 ? `${index + 1}番目` : "";
  };
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setDraftIds((current) => {
      const oldIndex = current.indexOf(String(active.id));
      const newIndex = current.indexOf(String(over.id));
      return oldIndex >= 0 && newIndex >= 0
        ? arrayMove(current, oldIndex, newIndex)
        : current;
    });
  };
  const canReorder = linearOrder !== null && draftIds.length > 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="並び替えを閉じる"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-reorder-title"
        aria-describedby="task-reorder-description"
        className="relative flex max-h-[min(80dvh,42rem)] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4">
          <div>
            <h2 id="task-reorder-title" className="text-base font-semibold">
              タスクを並び替え
            </h2>
            <p
              id="task-reorder-description"
              className="mt-1 text-sm text-gray-600"
            >
              右端のハンドルをつかんで移動すると、接続も並び順に更新されます。
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-600 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-4 py-3">
          {linearOrder === null ? (
            <div className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
              分岐・合流・未接続があるグラフは並び替えできません。直列に接続されたタスクのみ対応しています。
            </div>
          ) : draftIds.length < 2 ? (
            <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-700">
              並び替えるにはタスクが2件以上必要です。
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              accessibility={{
                screenReaderInstructions: {
                  draggable:
                    "Spaceキーで持ち上げ、上下の矢印キーで移動し、もう一度Spaceキーで確定します。",
                },
                announcements: {
                  onDragStart: ({ active }) =>
                    `${getTaskLabel(active.id)}を持ち上げました。`,
                  onDragOver: ({ active, over }) =>
                    over
                      ? `${getTaskLabel(active.id)}を${getPositionLabel(over.id)}へ移動しました。`
                      : undefined,
                  onDragEnd: ({ active, over }) =>
                    over
                      ? `${getTaskLabel(active.id)}を${getPositionLabel(over.id)}に配置しました。`
                      : `${getTaskLabel(active.id)}を元の位置に戻しました。`,
                  onDragCancel: ({ active }) =>
                    `${getTaskLabel(active.id)}の移動をキャンセルしました。`,
                },
              }}
            >
              <SortableContext
                items={draftIds}
                strategy={verticalListSortingStrategy}
              >
                <ol className="space-y-2">
                  {draftIds.map((taskId, index) => (
                    <SortableTaskRow
                      key={taskId}
                      task={taskById.get(taskId)}
                      index={index}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <footer className="flex gap-3 border-t border-gray-200 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={!canReorder}
            onClick={() => onSave(draftIds)}
            className="min-h-12 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white active:bg-blue-700 disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            反映
          </button>
        </footer>
      </section>
    </div>
  );
}
