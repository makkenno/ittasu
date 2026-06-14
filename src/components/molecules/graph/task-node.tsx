import { Check } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import { cn } from "../../../lib/utils";
import type { TaskNode as TaskNodeType } from "../../../types/task";

export interface TaskNodeData {
  task: TaskNodeType;
  onToggleComplete?: (taskId: string) => void;
  isEdgeSource?: boolean;
}

export function TaskNode({ data, selected }: NodeProps<TaskNodeData>) {
  const { task, onToggleComplete, isEdgeSource } = data;

  return (
    <div
      className={cn(
        "group px-4 py-3 rounded-lg border-2 min-w-[180px] shadow-md transition-colors",
        task.completed
          ? "bg-green-50 border-green-400"
          : "bg-white border-gray-300 hover:border-blue-400",
        selected && "ring-4 ring-blue-500/30 border-blue-600",
        isEdgeSource && "ring-4 ring-orange-500/40 border-orange-500",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-6 !h-6 md:!w-3 md:!h-3 !bg-transparent !border-none flex items-center justify-center -ml-1.5 md:ml-0"
      >
        <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white pointer-events-none" />
      </Handle>

      <div className="font-medium text-sm mb-2 break-words cursor-default">
        {task.title}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.(task.id);
          }}
          aria-label={task.completed ? "未完了に戻す" : "完了にする"}
          aria-pressed={task.completed}
          className={cn(
            "-m-2 flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            task.completed ? "text-white" : "text-gray-700",
          )}
          title="完了/未完了を切り替え"
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded",
              task.completed
                ? "bg-green-500"
                : "bg-gray-100 group-hover:bg-gray-200",
            )}
          >
            <Check className="h-4 w-4" />
          </span>
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-6 !h-6 md:!w-3 md:!h-3 !bg-transparent !border-none flex items-center justify-center -mr-1.5 md:mr-0"
      >
        <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white pointer-events-none" />
      </Handle>
    </div>
  );
}
