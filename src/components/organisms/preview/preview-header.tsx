import { ArrowLeft, Check, Copy, Eye, Pencil } from "lucide-react";
import { cn } from "../../../lib/utils";

interface PreviewHeaderProps {
  onBack: () => void;
  mode: "preview" | "edit";
  onModeChange: (mode: "preview" | "edit") => void;
  onCopy: () => void;
  copied: boolean;
}

export function PreviewHeader({
  onBack,
  mode,
  onModeChange,
  onCopy,
  copied,
}: PreviewHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 px-3 py-3 md:px-6 md:py-4 border-b bg-white shadow-sm flex-shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded transition-colors text-gray-600 hover:bg-gray-100"
          title="戻る"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onModeChange("preview")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === "preview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Eye className="w-4 h-4" />
            プレビュー
          </button>
          <button
            type="button"
            onClick={() => onModeChange("edit")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === "edit"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Pencil className="w-4 h-4" />
            編集
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className={cn(
          "flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors border",
          copied
            ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100"
            : "border-blue-500 text-blue-600 hover:bg-blue-50",
        )}
        title="マークダウンをコピー"
      >
        {copied ? (
          <Check className="w-4 h-4 animate-in zoom-in duration-200" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
        <span className="text-sm font-medium hidden sm:inline">
          {copied ? "コピーしました" : "コピー"}
        </span>
      </button>
    </header>
  );
}
