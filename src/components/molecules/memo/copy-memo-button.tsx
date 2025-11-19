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
        "flex items-center justify-center p-2 rounded transition-all duration-200",
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
