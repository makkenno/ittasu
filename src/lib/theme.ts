export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "ittasu-theme";

export const isThemePreference = (
  value: string | null,
): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

export const resolveTheme = (
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme => {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
};

export const getNextThemePreference = (
  resolvedTheme: ResolvedTheme,
): ThemePreference => (resolvedTheme === "dark" ? "light" : "dark");
