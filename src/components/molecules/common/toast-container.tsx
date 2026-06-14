import { X } from "lucide-react";
import { useToastStore } from "../../../stores/toast-store";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed top-4 md:top-auto md:bottom-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center justify-between gap-2 p-4 rounded-lg shadow-lg transition-all animate-in slide-in-from-bottom-2 fade-in
            ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                  ? "bg-red-500 text-white"
                  : "bg-gray-800 text-white"
            }
          `}
        >
          <span className="text-sm font-medium flex-1 min-w-0">
            {toast.message}
          </span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                removeToast(toast.id);
              }}
              className="text-sm font-semibold underline underline-offset-2 px-2 py-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
