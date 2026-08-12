import { describe, expect, it } from "vitest";
import { getDataTableRowClassName } from "./getDataTableRowClassName";

describe("getDataTableRowClassName", () => {
  it("adds neutral hover when the row is not selected and row hover is on", () => {
    const className = getDataTableRowClassName({ isSelected: false, rowHover: true });
    expect(className).toContain("hover:bg-surface-variant");
    expect(className).toContain("transition-colors");
    expect(className).not.toContain("bg-primary-container/40");
  });

  it("adds selected background and selected hover when selected and row hover is on", () => {
    const className = getDataTableRowClassName({ isSelected: true, rowHover: true });
    expect(className).toContain("bg-primary-container/40");
    expect(className).toContain("hover:bg-primary-container/60");
    expect(className).not.toContain("hover:bg-surface-variant");
  });

  it("omits hover utilities when row hover is off", () => {
    const className = getDataTableRowClassName({ isSelected: false, rowHover: false });
    expect(className).not.toContain("hover:bg-surface-variant");
    expect(className).not.toContain("hover:bg-primary-container/60");
  });

  it("keeps selected background when row hover is off", () => {
    const className = getDataTableRowClassName({ isSelected: true, rowHover: false });
    expect(className).toContain("bg-primary-container/40");
    expect(className).not.toContain("hover:bg-primary-container/60");
    expect(className).not.toContain("hover:bg-surface-variant");
  });

  it("merges rowClassName with built-in row state classes", () => {
    const className = getDataTableRowClassName({
      isSelected: false,
      rowHover: true,
      rowClassName: "custom-row",
    });
    expect(className).toContain("custom-row");
    expect(className).toContain("hover:bg-surface-variant");
  });
});
