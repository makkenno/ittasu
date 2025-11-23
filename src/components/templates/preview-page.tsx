import { ArrowLeft, Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { MarkdownPreview } from "../molecules/memo/markdown-preview";

interface PreviewPageProps {
  markdown: string;
  onBack: () => void;
}

export function PreviewPage({ markdown, onBack }: PreviewPageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy markdown:", error);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      <header className="flex items-center justify-between gap-2 px-3 py-3 md:px-6 md:py-4 border-b bg-white shadow-sm flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded transition-colors text-gray-600 hover:bg-gray-100"
          title="戻る"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-bold text-gray-800">プレビュー</h1>

        <button
          type="button"
          onClick={handleCopy}
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

      <div className="flex-1 overflow-hidden">
        <MarkdownPreview value={markdown} />
      </div>
    </div>
  );
}
