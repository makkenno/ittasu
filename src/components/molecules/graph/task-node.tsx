import { Check } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import { cn } from "../../../lib/utils";
import type { TaskNode as TaskNodeType } from "../../../types/task";

export interface TaskNodeData {
  task: TaskNodeType;
  onToggleComplete?: (taskId: string) => void;
}

export function TaskNode({ data }: NodeProps<TaskNodeData>) {
  const { task, onToggleComplete } = data;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 min-w-[180px] shadow-md transition-colors",
        task.completed
          ? "bg-green-50 border-green-400"
          : "bg-white border-gray-300 hover:border-blue-400",
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
          className={cn(
            "p-1 rounded transition-colors",
            task.completed
              ? "bg-green-500 text-white"
              : "bg-gray-100 hover:bg-gray-200",
          )}
          title="完了/未完了を切り替え"
        >
          <Check className="w-4 h-4" />
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
