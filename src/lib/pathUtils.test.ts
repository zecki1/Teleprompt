import { describe, it, expect } from "vitest";

import { getScriptPath, buildTree, isValidPath } from "./pathUtils";
import type { ScriptDoc } from "@/types/script";

function makeScript(overrides: Partial<ScriptDoc> & { id: string; title: string }): ScriptDoc {
  return {
    status: "rascunho",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getScriptPath", () => {
  it("usa path[] quando presente", () => {
    const script = makeScript({ id: "s1", title: "T", path: ["Módulo 1", "Aula 2"] });
    expect(getScriptPath(script)).toEqual(["Módulo 1", "Aula 2"]);
  });

  it("cai para campos legados", () => {
    const script = makeScript({
      id: "s1",
      title: "T",
      folder: "Módulo 1",
      subfolder: "Aula 2",
      lesson: "UC 1",
    });
    expect(getScriptPath(script)).toEqual(["Módulo 1", "Aula 2", "UC 1"]);
  });

  it("ignora 'Raiz' e 'Sem Pasta' como folder raiz", () => {
    expect(getScriptPath(makeScript({ id: "s1", title: "T", folder: "Raiz" }))).toEqual([]);
    expect(getScriptPath(makeScript({ id: "s2", title: "T", folder: "Sem Pasta" }))).toEqual([]);
  });

  it("retorna vazio quando não há path nem campos legados", () => {
    expect(getScriptPath(makeScript({ id: "s1", title: "T" }))).toEqual([]);
  });
});

describe("isValidPath", () => {
  it("aceita path válido com segmentos não vazios", () => {
    expect(isValidPath(["A", "B"])).toBe(true);
    expect(isValidPath(["Único"])).toBe(true);
  });

  it("rejeita segmentos vazios ou só espaços", () => {
    expect(isValidPath(["A", ""])).toBe(false);
    expect(isValidPath(["  "])).toBe(false);
  });

  it("rejeita profundidade acima do máximo (MAX_PATH_DEPTH = 5)", () => {
    expect(isValidPath(["1", "2", "3", "4", "5"])).toBe(true);
    expect(isValidPath(["1", "2", "3", "4", "5", "6"])).toBe(false);
  });
});

describe("buildTree", () => {
  it("agrupa roteiros sem path em raiz ('')", () => {
    const tree = buildTree([
      makeScript({ id: "s1", title: "A" }),
      makeScript({ id: "s2", title: "B" }),
    ]);
    expect(tree[""]).toBeTruthy();
    expect(tree[""].scripts.map(s => s.id)).toEqual(["s1", "s2"]);
    expect(tree[""].totalScripts).toBe(2);
  });

  it("aninha pastas e subpastas", () => {
    const tree = buildTree([
      makeScript({ id: "s1", title: "A", path: ["Módulo 1", "Aula 2"] }),
      makeScript({ id: "s2", title: "B", path: ["Módulo 1", "Aula 3"] }),
    ]);
    const modulo = tree["Módulo 1"];
    expect(modulo).toBeTruthy();
    expect(Object.keys(modulo.children)).toEqual(["Aula 2", "Aula 3"]);
    expect(modulo.children["Aula 2"].scripts[0].id).toBe("s1");
    expect(modulo.children["Aula 3"].scripts[0].id).toBe("s2");
  });

  it("acumula totalScripts e allScriptsRecursive nos nós pai", () => {
    const tree = buildTree([
      makeScript({ id: "s1", title: "A", path: ["M1", "A1"] }),
      makeScript({ id: "s2", title: "B", path: ["M1", "A2"] }),
      makeScript({ id: "s3", title: "C", path: ["M1"] }),
    ]);
    expect(tree["M1"].totalScripts).toBe(3);
    expect(tree["M1"].allScriptsRecursive.map(s => s.id).sort()).toEqual(["s1", "s2", "s3"]);
    expect(tree["M1"].children["A1"].totalScripts).toBe(1);
  });

  it("não conta placeholders no totalScripts", () => {
    const tree = buildTree([
      makeScript({ id: "s1", title: "A", path: ["M1"], isPlaceholder: true }),
      makeScript({ id: "s2", title: "B", path: ["M1"] }),
    ]);
    expect(tree["M1"].totalScripts).toBe(1);
    expect(tree["M1"].allScriptsRecursive).toHaveLength(2);
  });
});
