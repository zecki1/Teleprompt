import { describe, it, expect, beforeAll } from "vitest";
import Typo from "typo-js";
import { checkText, checkTextWith } from "./index";

// Dicionário sintético mínimo: unit tests determinísticos e rápidos.
// O dicionário real (pt_BR.dic ~milhares de entradas) é exercitado no app/browser.
function loadTypo() {
  const aff = "SET UTF-8\n";
  const dic = [
    "5", // contagem de palavras
    "casa",
    "bonita",
    "azul",
    "bem",
    "vindo",
  ].join("\n") + "\n";
  const supplemental = new Set(["teleprompter", "cebola"]);
  const typo = new Typo("pt_BR", aff, dic);
  return { typo, supplemental };
}

describe("spellcheck (checkTextWith)", () => {
  let typo: Typo;
  let supplemental: Set<string>;

  beforeAll(() => {
    ({ typo, supplemental } = loadTypo());
  });

  it("retorna vazio para texto vazio", () => {
    expect(checkTextWith(typo, supplemental, "")).toEqual([]);
    expect(checkTextWith(typo, supplemental, "   ")).toEqual([]);
  });

  it("não acusa palavras corretas", () => {
    const errors = checkTextWith(typo, supplemental, "casa bonita azul");
    expect(errors).toEqual([]);
  });

  it("acusa palavra com erro e retorna posições", () => {
    const errors = checkTextWith(typo, supplemental, "esta frase tem um abacaxiii aqui");
    const err = errors.find(e => e.word === "abacaxiii");
    expect(err).toBeTruthy();
    expect(Array.isArray(err!.suggestions)).toBe(true);
    expect(err!.start).toBeLessThan(err!.end);
  });

  it("ignora palavras de 1 letra", () => {
    const errors = checkTextWith(typo, supplemental, "a é o bem");
    expect(errors).toEqual([]);
  });

  it("aceita palavras compostas com hífen cujas partes são válidas", () => {
    const errors = checkTextWith(typo, supplemental, "bem-vindo a casa");
    const hyphenErr = errors.find(e => e.word.includes("-"));
    expect(hyphenErr).toBeUndefined();
  });

  it("aceita palavras do dicionário suplementar", () => {
    const errors = checkTextWith(typo, supplemental, "o teleprompter e a cebola");
    expect(errors).toEqual([]);
  });

  it("respeita limites start/end de múltiplos erros", () => {
    const errors = checkTextWith(typo, supplemental, "abacaxiii casazzz");
    expect(errors.map(e => e.word)).toEqual(["abacaxiii", "casazzz"]);
    expect(errors[0].end).toBeLessThanOrEqual(errors[1].start);
  });
});

describe("checkText", () => {
  it("retorna vazio quando os dicionários ainda não carregaram", () => {
    expect(checkText("qualquer coisa")).toEqual([]);
  });
});
