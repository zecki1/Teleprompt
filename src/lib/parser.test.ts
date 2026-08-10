import { describe, it, expect } from "vitest";
import { stripHtml, parseScript } from "./parser";

describe("stripHtml", () => {
  it("retorna string vazia para entrada vazia", () => {
    expect(stripHtml("")).toBe("");
    expect(stripHtml(null as unknown as string)).toBe("");
  });

  it("converte <br> e </p> em quebras de linha", () => {
    expect(stripHtml("Linha 1<br>Linha 2")).toBe("Linha 1\nLinha 2");
    expect(stripHtml("<p>Um</p><p>Dois</p>")).toBe("Um\nDois");
  });

  it("remove tags e decodifica entidades", () => {
    expect(stripHtml("<b>Oi</b> &amp; <i>tchau</i>")).toBe("Oi & tchau");
    expect(stripHtml("&lt;tag&gt; &quot;aspas&quot; &#39;aspas2&#39;")).toBe("<tag> \"aspas\" 'aspas2'");
  });

  it("colapsa múltiplas quebras de linha e espaços", () => {
    expect(stripHtml("a\n\n\n\nb")).toBe("a\n\nb");
    expect(stripHtml("a   b")).toBe("a b");
  });

  it("remove espaços nas bordas de cada linha", () => {
    expect(stripHtml("  olá   \n  mundo  ")).toBe("olá\nmundo");
  });
});

describe("parseScript", () => {
  it("retorna array vazio para texto vazio", () => {
    expect(parseScript("")).toEqual([]);
    expect(parseScript("   ")).toEqual([]);
  });

  it("divide por marcador Cena e extrai número", () => {
    const scenes = parseScript("Cena 01\n[Locução]: Primeira\n\nCena 02\n[Locução]: Segunda");
    expect(scenes).toHaveLength(2);
    expect(scenes[0].sceneNumber).toBe("01");
    expect(scenes[1].sceneNumber).toBe("02");
    expect(scenes[0].spokenText).toBe("Primeira");
    expect(scenes[1].spokenText).toBe("Segunda");
  });

  it("extrai abe/enc/Tempo/let/pron/img/url e remove dos spokenText", () => {
    const content = [
      "Cena 1",
      "[abe]: Abertura do programa",
      "[let1]: Texto na tela",
      "[pron1]: falar-devagar",
      "[img1]: https://exemplo.com/foto.jpg",
      "[url1]: https://fonte.com/artigo",
      "Tempo: 00:10",
      "[Locução]: Fala do apresentador",
      "[enc]: Encerramento",
    ].join("\n");

    const scenes = parseScript(content);
    expect(scenes).toHaveLength(1);
    const s = scenes[0];
    expect(s.opening).toBe("Abertura do programa");
    expect(s.closing).toBe("Encerramento");
    expect(s.time).toBe("00:10");
    expect(s.lettering).toBe("Texto na tela");
    expect(s.pronunciation).toBe("falar-devagar");
    expect(s.imageUrl).toBe("https://exemplo.com/foto.jpg");
    expect(s.sourceUrl).toBe("https://fonte.com/artigo");
    expect(s.spokenText).toBe("Fala do apresentador");
  });

  it("mantém múltiplas anotações de pronúncia por cena", () => {
    const scenes = parseScript("Cena 1\n[pron1]: wa-ter\n[pron2]: pro-nun-ci-a-tion\n[Locução]: Hello world");
    expect(scenes[0].pronunciation).toBe("wa-ter\npro-nun-ci-a-tion");
    expect(scenes[0].spokenText).toBe("Hello world");
  });

  it("remove apenas o prefixo [Locução]: mantendo o resto do texto", () => {
    const scenes = parseScript("Cena 1\n[Locução]: Olá, tudo bem? Vamos começar!");
    expect(scenes[0].spokenText).toBe("Olá, tudo bem? Vamos começar!");
  });

  it("aceita 'Cena' sem espaço e com número separado por hífen", () => {
    const scenes = parseScript("Cena1\nFala um\n\nCena2-A\nFala dois");
    expect(scenes.map(s => s.sceneNumber)).toEqual(["1", "2-A"]);
    expect(scenes[0].spokenText).toBe("Fala um");
    expect(scenes[1].spokenText).toBe("Fala dois");
  });

  it("cria cena única quando não há marcador Cena", () => {
    const scenes = parseScript("Somente um texto sem marcador");
    expect(scenes).toHaveLength(1);
    expect(scenes[0].sceneNumber).toBe("1");
    expect(scenes[0].spokenText).toBe("Somente um texto sem marcador");
  });

  it("divide em múltiplas cenas quando há 4+ parágrafos (auto)", () => {
    const text = ["p1", "p2", "p3", "p4"].join("\n\n");
    const scenes = parseScript(text);
    expect(scenes.length).toBeGreaterThanOrEqual(2);
  });

  it("respeita paragraphsPerScene", () => {
    const text = ["p1", "p2", "p3", "p4", "p5", "p6"].join("\n\n");
    const scenes = parseScript(text, { paragraphsPerScene: 3 });
    expect(scenes).toHaveLength(2);
    // extractSceneData colapsa linhas em branco internas em quebra simples
    expect(scenes[0].spokenText).toBe("p1\np2\np3");
    expect(scenes[1].spokenText).toBe("p4\np5\np6");
  });

  it("normaliza quebras do Word e non-breaking spaces", () => {
    const scenes = parseScript("Cena 1\r\n[Locução]: Olá\u00A0mundo");
    expect(scenes[0].spokenText).toBe("Olá mundo");
  });

  it("gera id único para cada cena", () => {
    const scenes = parseScript("Cena 1\nA\n\nCena 2\nB");
    expect(scenes[0].id).toBeTruthy();
    expect(scenes[1].id).toBeTruthy();
    expect(scenes[0].id).not.toBe(scenes[1].id);
  });
});
