import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { tinykeys } from "tinykeys";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "キャンセル",
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const confirm = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      onConfirm();
    };
    const cancel = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      onCancel();
    };
    return tinykeys(
      window,
      {
        "[Shift]+y": confirm,
        Enter: confirm,
        "[Shift]+n": cancel,
        Escape: cancel,
        "Control+[": cancel,
      },
      {
        capture: true,
        ignore: (event) => event.repeat || event.isComposing,
      },
    );
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-2 rounded-full ${
                isDestructive
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <span className="mr-1.5 inline-flex items-center justify-center min-w-[1.25rem] px-1 text-[10px] font-mono font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
                N
              </span>
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg shadow-sm transition-colors font-medium ${
                isDestructive
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              <span
                className={`mr-1.5 inline-flex items-center justify-center min-w-[1.25rem] px-1 text-[10px] font-mono font-semibold border rounded ${
                  isDestructive
                    ? "text-red-100 border-red-300 bg-red-600/40"
                    : "text-blue-100 border-blue-300 bg-blue-600/40"
                }`}
              >
                Y
              </span>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
