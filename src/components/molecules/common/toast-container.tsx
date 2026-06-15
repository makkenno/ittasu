import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import { type Toast, useToastStore } from "../../../stores/toast-store";

const TOAST_DURATION = 5000;
const SWIPE_DISMISS_DISTANCE = 72;

const toastAppearance = {
  success: {
    icon: CheckCircle2,
    iconClassName:
      "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300",
    accentClassName: "bg-green-500",
  },
  error: {
    icon: AlertCircle,
    iconClassName:
      "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    accentClassName: "bg-red-500",
  },
  info: {
    icon: Info,
    iconClassName:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    accentClassName: "bg-blue-500",
  },
} as const;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const timerRef = useRef<number | null>(null);
  const remainingRef = useRef(TOAST_DURATION);
  const timerStartedAtRef = useRef(0);
  const appearance = toastAppearance[toast.type];
  const StatusIcon = appearance.icon;

  const pauseTimer = useCallback(() => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (performance.now() - timerStartedAtRef.current),
    );
  }, []);

  const resumeTimer = useCallback(() => {
    if (timerRef.current !== null || remainingRef.current <= 0) return;
    timerStartedAtRef.current = performance.now();
    timerRef.current = window.setTimeout(onDismiss, remainingRef.current);
  }, [onDismiss]);

  useEffect(() => {
    resumeTimer();
    return pauseTimer;
  }, [pauseTimer, resumeTimer]);

  const finishSwipe = () => {
    if (Math.abs(offsetX) >= SWIPE_DISMISS_DISTANCE) {
      onDismiss();
      return;
    }
    setDragging(false);
    setOffsetX(0);
    resumeTimer();
  };

  return (
    <fieldset
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocusCapture={pauseTimer}
      onBlurCapture={resumeTimer}
      onPointerDown={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("button, a")
        ) {
          return;
        }
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        pauseTimer();
      }}
      onPointerMove={(event) => {
        const start = pointerStartRef.current;
        if (!start) return;
        const deltaX = event.clientX - start.x;
        const deltaY = event.clientY - start.y;
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;
        setOffsetX(deltaX);
      }}
      onPointerUp={(event) => {
        if (!pointerStartRef.current) return;
        pointerStartRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        finishSwipe();
      }}
      onPointerCancel={() => {
        pointerStartRef.current = null;
        setDragging(false);
        setOffsetX(0);
        resumeTimer();
      }}
      style={{
        transform: `translateX(${offsetX}px)`,
        opacity: Math.max(0.35, 1 - Math.abs(offsetX) / 240),
      }}
      className={cn(
        "pointer-events-auto relative flex min-h-16 touch-pan-y items-center gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-2.5 pl-3 shadow-md backdrop-blur",
        "animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
        dragging
          ? "transition-none"
          : "transition-[transform,opacity] duration-200 motion-reduce:transition-none",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-r-full",
          appearance.accentClassName,
        )}
      />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1.5 h-1 w-7 -translate-x-1/2 rounded-full bg-gray-200 md:hidden"
      />
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          appearance.iconClassName,
        )}
        aria-hidden="true"
      >
        <StatusIcon className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span
        role={toast.type === "error" ? "alert" : "status"}
        className="min-w-0 flex-1 text-sm font-medium leading-5 text-gray-900"
      >
        {toast.message}
      </span>
      {toast.action && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="min-h-11 shrink-0 rounded-xl bg-blue-50 px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onDismiss}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="通知を閉じる"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>
    </fieldset>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <section
      className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-3 md:bottom-4 md:top-auto md:px-4"
      aria-label="通知"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </section>
  );
}
