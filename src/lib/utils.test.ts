import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("mescla classes e remove falsy", () => {
    expect(cn("a", "b")).toBe("a b");
    expect(cn("a", false && "b", null, undefined, 0, "c")).toBe("a c");
  });

  it("resolve conflitos via tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("mantém classes distintas (ordem de entrada)", () => {
    expect(cn("p-4", "m-2")).toBe("p-4 m-2");
  });

  it("aceita objeto de condições", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });
});
