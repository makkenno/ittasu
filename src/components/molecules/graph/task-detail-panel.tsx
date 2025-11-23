import { ChevronRight, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Panel } from "reactflow";
import type { TaskNode } from "../../../types/task";

interface TaskDetailPanelProps {
  selectedTask: TaskNode;
  onTitleChange?: (taskId: string, newTitle: string) => void;
  onDetailClick?: (taskId: string) => void;
  onDeleteClick?: (taskId: string) => void;
}

export function TaskDetailPanel({
  selectedTask,
  onTitleChange,
  onDetailClick,
  onDeleteClick,
}: TaskDetailPanelProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedTask?.id && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [selectedTask?.id]);

  return (
    <Panel
      position="top-right"
      className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-80 m-4"
    >
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="title"
            className="block text-xs font-bold text-gray-500 uppercase mb-1"
          >
            タイトル
          </label>
          <input
            id="title"
            type="text"
            ref={titleInputRef}
            value={selectedTask.title}
            onChange={(e) => onTitleChange?.(selectedTask.id, e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={() => onDetailClick?.(selectedTask.id)}
            className="flex-1 flex items-center justify-center gap-2 p-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            title="詳細を見る"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="text-sm font-medium">詳細へ</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteClick?.(selectedTask.id)}
            className="flex items-center justify-center gap-2 p-2 sm:px-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors w-auto"
            title="このタスクを削除"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">削除</span>
          </button>
        </div>
      </div>
    </Panel>
  );
}
