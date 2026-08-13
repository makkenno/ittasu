import { X } from "lucide-react";
import { useState } from "react";
import {
  type ExportedData,
  parseImportText,
} from "../../../lib/export-import-utils";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ExportedData) => void;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    const result = parseImportText(text);
    if (!result.success) {
      setError(result.error);
      return;
    }

    onImport(result.data);
    onClose();
    setText("");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">タスクをインポート</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-2">
            エクスポートされたJSON、またはMarkdownの箇条書きを貼り付けてください。
          </p>
          <textarea
            className="w-full h-64 p-2 border rounded-md font-mono text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={"- タスク1\n  - 子タスク1\n  - 子タスク2\n- タスク2"}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!text}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            インポート
          </button>
        </div>
      </div>
    </div>
  );
}
