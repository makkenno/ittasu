import { ArrowRight } from "lucide-react";
import { cn } from "../../../lib/utils";

interface NextTaskButtonProps {
  onClick?: () => void;
}

export function NextTaskButton({ onClick }: NextTaskButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center p-2 rounded transition-colors",
        "text-blue-600 hover:bg-blue-50",
      )}
      title="次やるべきタスクに移動"
      aria-label="次やるべきタスクに移動"
    >
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}
