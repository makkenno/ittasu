import { describe, expect, it } from "vitest";
import { wrapSelectionIndex } from "./keyboard";

describe("wrapSelectionIndex", () => {
  it("wraps from the last item to the first", () => {
    expect(wrapSelectionIndex(2, 3, 1)).toBe(0);
  });

  it("wraps from the first item to the last", () => {
    expect(wrapSelectionIndex(0, 3, -1)).toBe(2);
  });

  it("stays at zero when there are no items", () => {
    expect(wrapSelectionIndex(0, 0, 1)).toBe(0);
    expect(wrapSelectionIndex(0, 0, -1)).toBe(0);
  });
});
