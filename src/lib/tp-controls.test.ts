import { describe, it, expect } from "vitest";
import {
  DEFAULT_TP_BINDINGS,
  getEffectiveBindings,
  findActionForEvent,
  matchesBinding,
  formatKey,
} from "./tp-controls";

const ev = (key: string, code: string) => ({ key, code });

describe("matchesBinding", () => {
  it("casa por e.code", () => {
    expect(matchesBinding("Space", ev(" ", "Space"))).toBe(true);
    expect(matchesBinding("ArrowUp", ev("ArrowUp", "ArrowUp"))).toBe(true);
    expect(matchesBinding("F5", ev("F5", "F5"))).toBe(true);
  });

  it("casa por e.key", () => {
    expect(matchesBinding("KeyB", ev("b", "KeyB"))).toBe(true);
    expect(matchesBinding("KeyB", ev("B", "KeyB"))).toBe(true);
  });

  it("casa caracteres ignorando maiúsculas", () => {
    expect(matchesBinding("m", ev("M", "KeyM"))).toBe(true);
    expect(matchesBinding("p", ev("P", "KeyP"))).toBe(true);
  });

  it("não casa teclas diferentes", () => {
    expect(matchesBinding("ArrowUp", ev("ArrowDown", "ArrowDown"))).toBe(false);
    expect(matchesBinding("Space", ev("s", "KeyS"))).toBe(false);
  });
});

describe("getEffectiveBindings", () => {
  it("retorna defaults sem personalização", () => {
    const b = getEffectiveBindings();
    expect(b.playPause).toContain("Space");
    expect(b.playPause).toContain("F5");
  });

  it("não muta o objeto de defaults", () => {
    const before = JSON.stringify(DEFAULT_TP_BINDINGS);
    getEffectiveBindings({ playPause: "KeyX" });
    getEffectiveBindings({ playPause: "Space", nextScene: "KeyN" });
    expect(JSON.stringify(DEFAULT_TP_BINDINGS)).toBe(before);
  });

  it("override do usuário substitui a lista inteira da ação", () => {
    const b = getEffectiveBindings({ playPause: "KeyX" });
    expect(b.playPause).toEqual(["KeyX"]);
    expect(b.nextScene).toContain("ArrowDown");
  });
});

describe("findActionForEvent", () => {
  it("mapeia teclas default para ações", () => {
    const b = getEffectiveBindings();
    expect(findActionForEvent(b, ev(" ", "Space"))).toBe("playPause");
    expect(findActionForEvent(b, ev("ArrowUp", "ArrowUp"))).toBe("prevScene");
    expect(findActionForEvent(b, ev("ArrowDown", "ArrowDown"))).toBe("nextScene");
    expect(findActionForEvent(b, ev("]", "BracketRight"))).toBe("nextScene");
    expect(findActionForEvent(b, ev("Home", "Home"))).toBe("home");
    expect(findActionForEvent(b, ev("+", "Equal"))).toBe("speedUp");
    expect(findActionForEvent(b, ev("-", "Minus"))).toBe("speedDown");
  });

  it("respeita atalhos personalizados", () => {
    const b = getEffectiveBindings({ playPause: "KeyX", nextScene: "KeyN" });
    expect(findActionForEvent(b, ev("x", "KeyX"))).toBe("playPause");
    expect(findActionForEvent(b, ev("n", "KeyN"))).toBe("nextScene");
    expect(findActionForEvent(b, ev(" ", "Space"))).toBeNull();
  });

  it("retorna null para tecla sem vínculo", () => {
    expect(findActionForEvent(getEffectiveBindings(), ev("F9", "F9"))).toBeNull();
  });
});

describe("formatKey", () => {
  it("formata nomes de tecla", () => {
    expect(formatKey("Space")).toBe("Espaço");
    expect(formatKey("ArrowUp")).toBe("↑");
    expect(formatKey("ArrowDown")).toBe("↓");
    expect(formatKey("KeyB")).toBe("B");
    expect(formatKey("Equal")).toBe("+");
    expect(formatKey("BracketRight")).toBe("]");
  });
});
