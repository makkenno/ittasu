import { Check, ChevronRight, Copy, Square, Trash2, X } from "lucide-react";
import { useImperativeHandle, useRef } from "react";
import { isEscapeKey } from "../../../lib/keyboard";
import { useEditSession } from "../../../stores/use-edit-session";
import type { TaskNode } from "../../../types/task";

export interface TaskBottomSheetHandle {
  focusTitle: () => void;
}

interface TaskBottomSheetProps {
  selectedTask: TaskNode;
  onTitleChange?: (taskId: string, newTitle: string) => void;
  onDetailClick?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onDeleteClick?: (taskId: string) => void;
  onExportClick?: (taskId: string) => void;
  onClose?: () => void;
  ref?: React.Ref<TaskBottomSheetHandle>;
}

export function TaskBottomSheet({
  selectedTask,
  onTitleChange,
  onDetailClick,
  onToggleComplete,
  onDeleteClick,
  onExportClick,
  onClose,
  ref,
}: TaskBottomSheetProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { handleFocus, handleBlur } = useEditSession();

  useImperativeHandle(ref, () => ({
    focusTitle: () => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    },
  }));

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 rounded-t-2xl shadow-2xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
      </div>
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-xs font-bold text-gray-500 uppercase">
          タスク
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3">
        <input
          type="text"
          ref={titleInputRef}
          value={selectedTask.title}
          onChange={(e) => onTitleChange?.(selectedTask.id, e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (isEscapeKey(e) || e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          placeholder="タイトル"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onDetailClick?.(selectedTask.id)}
            className="flex items-center justify-center gap-2 px-3 py-3 border border-blue-500 text-blue-600 rounded-lg active:bg-blue-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="text-sm font-medium">詳細へ</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleComplete?.(selectedTask.id)}
            className={`flex items-center justify-center gap-2 px-3 py-3 border rounded-lg transition-colors ${
              selectedTask.completed
                ? "border-green-500 text-green-600 active:bg-green-50"
                : "border-gray-300 text-gray-700 active:bg-gray-50"
            }`}
          >
            {selectedTask.completed ? (
              <Check className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {selectedTask.completed ? "完了済み" : "完了にする"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onExportClick?.(selectedTask.id)}
            className="flex items-center justify-center gap-2 px-3 py-3 border border-gray-300 text-gray-700 rounded-lg active:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span className="text-sm font-medium">コピー</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteClick?.(selectedTask.id)}
            className="flex items-center justify-center gap-2 px-3 py-3 border border-red-300 text-red-600 rounded-lg active:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">削除</span>
          </button>
        </div>
      </div>
    </div>
  );
}
