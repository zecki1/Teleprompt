import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({
  firebaseConfig: { apiKey: "test", projectId: "test" },
  db: {},
  auth: {},
  app: {},
  googleProvider: {},
}));

import { parseScript } from "@/lib/parser";
import { DEMO_RAW_CONTENT, DEMO_EMAIL, DEMO_PASSWORD, DEMO_PROJECT_NAME, DEMO_SCRIPT_TITLE, DEMO_WORKSPACE_NAME } from "@/services/demo";

describe("demo", () => {
  it("define credenciais e nomes constantes", () => {
    expect(DEMO_EMAIL).toContain("@");
    expect(DEMO_PASSWORD.length).toBeGreaterThanOrEqual(6);
    expect(DEMO_WORKSPACE_NAME.length).toBeGreaterThan(0);
    expect(DEMO_PROJECT_NAME.length).toBeGreaterThan(0);
    expect(DEMO_SCRIPT_TITLE.length).toBeGreaterThan(0);
  });

  it("conteúdo de exemplo gera pelo menos uma cena com locução", () => {
    const scenes = parseScript(DEMO_RAW_CONTENT);
    expect(scenes.length).toBeGreaterThanOrEqual(1);
    expect(scenes[0].sceneNumber).toBe("1");
    expect(scenes[0].spokenText).toContain("demonstração");
  });

  it("conteúdo de exemplo extrai metadados (Tempo, Abertura, Encerramento, Lettering, Fonte)", () => {
    const scenes = parseScript(DEMO_RAW_CONTENT);
    const first = scenes[0];
    expect(first.time).toContain("45");
    expect(first.opening).toContain("Abertura");
    expect(first.closing).toContain("Encerramento");
    expect(first.lettering).toContain("Bem-vindo");
    expect(first.pronunciation).toContain("Bem-vin-du");
    expect(first.sourceUrl).toContain("http");
  });
});
