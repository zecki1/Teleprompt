#!/usr/bin/env node
/**
 * Validate/normaliza a estrutura de dados consumida pelos 3 frontends
 * (Next.js, Angular 22, Angular 17) a partir da API .NET.
 *
 * Objetivo: garantir que os dados de «projetos → pastas → subpastas →
 * roteiros» fiquem padronizados e que os 3 frontends recebam a MESMA
 * comunicação da API/banco de forma correta.
 *
 * O contrato validado é o `ScriptDto`/`ProjectDto`/`PresenterDto` do backend
 * (folder/subfolder/lesson/isPlaceholder/projectId/presenterIds), que é o
 * formato único que os 3 consomem.
 *
 * USO:
 *   node scripts/validate-data.mjs
 *   node scripts/validate-data.mjs https://api.teleprompt.zecki1.com.br
 *   node scripts/validate-data.mjs http://localhost:5026
 *
 * (leitura apenas — NÃO altera nenhum dado)
 */

const API_BASE = (process.argv[2] || "https://api.teleprompt.zecki1.com.br").replace(/\/+$/, "");
const DEMO_ENDPOINT = `${API_BASE}/api/v1/demo/workspace`;

/** Caminho canônico de um script — a NORMALIZAÇÃO usada igualmente pelos 3. */
function scriptPath(script) {
  const segments = [script.folder, script.subfolder, script.lesson].filter(
    (x) => typeof x === "string" && x && x.trim().length > 0,
  );
  return segments;
}

/** Sinais de "raiz/sem pasta" usados pelo Next (script-mappers.ts). */
function isRootSentinel(v) {
  return v === "Raiz" || v === "Sem Pasta" || v === null || v === undefined;
}

const STATUS_VALID = [
  "Rascunho", "EmRevisao", "Aprovado", "Gravado", "Concluido",
];

async function main() {
  console.log(`\n▸ Validando estrutura de dados via ${DEMO_ENDPOINT}\n`);

  let bundle;
  try {
    const res = await fetch(DEMO_ENDPOINT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bundle = await res.json();
  } catch (e) {
    console.error(`✖ Falha ao buscar o bundle demo em ${DEMO_ENDPOINT}: ${e.message}`);
    console.error("  Verifique a URL da API / se o backend está no ar.");
    process.exit(1);
  }

  const { workspace, projects = [], scripts = [], presenters = [], activities = [] } = bundle;
  const errors = [];
  const warnings = [];
  const byProject = new Map(projects.map((p) => [p.id, p]));
  const byPresenter = new Map(presenters.map((p) => [p.id, p]));

  /* 1 ─ Referências entre entidades --------------------------------- */
  console.log("── 1) Integridade de referências ────────────────────────");
  for (const s of scripts) {
    if (!byProject.has(s.projectId)) {
      errors.push(`script "${s.title}" aponta para projeto inexistente: ${s.projectId}`);
    }
  }
  for (const s of scripts) {
    if (s.workspaceId !== workspace.id) {
      warnings.push(`script "${s.title}" workspaceId ${s.workspaceId} != workspace ${workspace.id}`);
    }
  }
  for (const p of projects) {
    if (p.workspaceId !== workspace.id) {
      warnings.push(`projeto "${p.name}" workspaceId ${p.workspaceId} != workspace ${workspace.id}`);
    }
  }
  for (const s of scripts) {
    for (const pid of s.presenterIds ?? []) {
      if (!byPresenter.has(pid)) {
        warnings.push(`script "${s.title}" referencia apresentador inexistente: ${pid}`);
      }
    }
  }
  console.log(errors.filter((e) => e.startsWith("script")).length
    ? `  ✖ ${errors.filter((e) => e.startsWith("script")).length} referência(s) de projeto quebrada(s)`
    : "  ✓ todos os roteiros apontam para projetos existentes");
  console.log(warnings.length
    ? `  ⚠ ${warnings.length} aviso(s) de workspace/presenter`
    : "  ✓ workspaces e apresentadores consistentes");

  /* 2 ─ Caminho de pastas padronizado (folder→subfolder→lesson) ------ */
  console.log("\n── 2) Caminho de pastas (folder→subfolder→lesson) ─────────");
  const noPath = scripts.filter((s) => scriptPath(s).length === 0);
  const withRootSentinel = scripts.filter(
    (s) => s.folder && isRootSentinel(s.folder) && scriptPath(s).length === 0,
  );
  const singleFolder = scripts.filter((s) => s.folder && !s.subfolder && !s.lesson);
  const folderNoLesson = scripts.filter((s) => s.folder && s.subfolder && !s.lesson);

  console.log(`  ✓ total de roteiros: ${scripts.length}`);
  console.log(`  ✓ com caminho de pasta (folder/subfolder/lesson): ${scripts.length - noPath.length}`);
  console.log(`  ✓ na raiz (sem pasta): ${noPath.length}`);
  if (withRootSentinel.length)
    console.log(`  ⚠ ${withRootSentinel.length} roteiro(s) com sentinela de "Raiz" (normalizado p/ raiz)`);
  if (singleFolder.length)
    console.log(`  ⚠ ${singleFolder.length} roteiro(s) só com folder (sem subpasta/lição)`);
  if (folderNoLesson.length)
    console.log(`  ⚠ ${folderNoLesson.length} roteiro(s) com subpasta mas sem lição`);

  for (const s of scripts) {
    const p = scriptPath(s);
    if (p.length > 0 && p[p.length - 1] === undefined) {
      errors.push(`script "${s.title}" tem caminho quebrado`);
    }
  }

  /* 3 ─ Status válidos ------------------------------------------------ */
  console.log("\n── 3) Status dos roteiros ─────────────────────────────────");
  const badStatus = scripts.filter((s) => !STATUS_VALID.includes(s.status));
  console.log(badStatus.length
    ? `  ✖ ${badStatus.length} roteiro(s) com status desconhecido: ${[...new Set(badStatus.map(s => s.status))].join(", ")}`
    : "  ✓ todos os status são válidos");

  /* 4 ─ Árvore padronizada (idêntica nos 3 frontends) ----------------- */
  console.log("\n── 4) Árvore padronizada: projeto → pasta → subpasta → roteiro ──");
  const tree = [];
  for (const proj of projects) {
    const scriptsOf = scripts
      .filter((s) => s.projectId === proj.id)
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    if (scriptsOf.length === 0) {
      tree.push({ project: proj.name, children: [{ folder: "(sem roteiros)", scripts: [] }] });
      continue;
    }
    const folderMap = new Map();
    for (const s of scriptsOf) {
      const path = scriptPath(s);
      const key = path.join("\u0000");
      if (!folderMap.has(key)) folderMap.set(key, { path, scripts: [] });
      folderMap.get(key).scripts.push(s.title);
    }
    const folders = [...folderMap.values()].sort(
      (a, b) => a.path.length - b.path.length || a.path.join("/").localeCompare(b.path.join("/"), "pt-BR"),
    );
    tree.push({ project: proj.name, children: folders });
  }
  for (const node of tree) {
    console.log(`\n  □ ${node.project}`);
    for (const f of node.children) {
      const label = f.path.length ? f.path.join(" › ") : "(raiz)";
      console.log(`    ├─ ${label}  [${f.scripts.length}]`);
      for (const t of f.scripts) console.log(`    │    · ${t}`);
    }
  }

  /* 5 ─ Resumo de prontidão para os 3 frontends ----------------------- */
  console.log("\n── 5) Resumo ───────────────────────────────────────────────");
  const ready =
    errors.length === 0 &&
    projects.length > 0 &&
    scripts.length > 0;
  console.log(`  workspace: ${workspace.name} (${workspace.id})`);
  console.log(`  projetos: ${projects.length} · roteiros: ${scripts.length} · apresentadores: ${presenters.length}`);
  console.log(`  erros: ${errors.length} · avisos: ${warnings.length}`);
  console.log(ready
    ? "\n  ✓ DADOS PADRONIZADOS — há uma única fonte (API .NET) que os 3 frontends consomem igualmente."
    : "\n  ✖ DADOS COM PROBLEMAS — corrija antes de considerar os frontends alinhados.");

  if (errors.length) {
    console.log("\nERROS DETALHADOS:");
    errors.forEach((e) => console.log("  ✖ " + e));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
