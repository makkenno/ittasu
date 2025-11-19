import { ArrowRight } from "lucide-react";
import { cn } from "../../../lib/utils";

interface NextTaskButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export function NextTaskButton({ onClick, disabled }: NextTaskButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center p-2 rounded transition-colors",
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : "text-blue-600 hover:bg-blue-50",
      )}
      title="次やるべきタスクに移動"
      aria-label="次やるべきタスクに移動"
    >
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}
