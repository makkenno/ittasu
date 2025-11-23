import { FileText } from "lucide-react";
import { cn } from "../../../lib/utils";

interface PreviewButtonProps {
  onClick?: () => void;
}

export function PreviewButton({ onClick }: PreviewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center p-2 rounded transition-colors",
        "text-gray-600 hover:bg-gray-100",
      )}
      title="プレビューを表示"
      aria-label="プレビューを表示"
    >
      <FileText className="w-5 h-5" />
    </button>
  );
}
