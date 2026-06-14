import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "../../../lib/utils";

interface CopyMemoButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export function CopyMemoButton({
  onClick,
  disabled = false,
}: CopyMemoButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (onClick) {
      await onClick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-center rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 md:min-h-9 md:min-w-9",
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : copied
            ? "text-green-600 bg-green-50"
            : "text-gray-700 hover:bg-gray-100",
      )}
      title="メモをコピー"
      aria-label="メモをコピー"
    >
      {copied ? (
        <Check className="w-5 h-5 animate-in zoom-in duration-200" />
      ) : (
        <Copy className="w-5 h-5" />
      )}
    </button>
  );
}
