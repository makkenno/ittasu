import { Check } from "lucide-react";
import { cn } from "../../../lib/utils";

interface CompleteToggleProps {
  completed: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}

export function CompleteToggle({
  completed,
  onToggle,
  disabled = false,
}: CompleteToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center p-2 rounded-lg transition-colors",
        disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : completed
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300",
      )}
      title={completed ? "完了" : "未完了"}
      aria-label={completed ? "完了" : "未完了"}
    >
      <Check className="w-5 h-5" />
    </button>
  );
}
