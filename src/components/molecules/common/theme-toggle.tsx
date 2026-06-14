import { Moon, Sun } from "lucide-react";
import { getNextThemePreference } from "../../../lib/theme";
import { cn } from "../../../lib/utils";
import { useTheme } from "../../theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setPreference } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "ライトモードに切り替え" : "ダークモードに切り替え";

  return (
    <button
      type="button"
      onClick={() => setPreference(getNextThemePreference(resolvedTheme))}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:h-9 md:w-9",
        className,
      )}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5" aria-hidden="true" />
      ) : (
        <Moon className="h-4.5 w-4.5" aria-hidden="true" />
      )}
    </button>
  );
}
