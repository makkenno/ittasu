import { describe, expect, it } from "vitest";
import {
  getNextThemePreference,
  isThemePreference,
  resolveTheme,
} from "./theme";

describe("theme helpers", () => {
  it("resolves the system preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("keeps an explicit preference", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("toggles from the currently resolved theme", () => {
    expect(getNextThemePreference("light")).toBe("dark");
    expect(getNextThemePreference("dark")).toBe("light");
  });

  it("validates stored preferences", () => {
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("invalid")).toBe(false);
  });
});
