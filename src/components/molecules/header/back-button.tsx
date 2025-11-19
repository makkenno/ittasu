import { ArrowLeft } from "lucide-react";
import { cn } from "../../../lib/utils";

interface BackButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export function BackButton({ onClick, disabled }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center p-2 rounded transition-colors",
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 hover:bg-gray-100",
      )}
      title="親タスクに戻る"
      aria-label="親タスクに戻る"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
