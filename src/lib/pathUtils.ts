import { ScriptDoc, FolderNode, MAX_PATH_DEPTH } from "@/types/script";

/**
 * Returns the canonical path[] for a script, falling back to legacy fields.
 * Scripts that still have `folder`/`subfolder`/`lesson` will work transparently.
 */
export function getScriptPath(script: ScriptDoc): string[] {
  if (script.path && script.path.length > 0) return script.path;

  const legacy: string[] = [];
  if (script.folder && script.folder !== "Raiz" && script.folder !== "Sem Pasta")
    legacy.push(script.folder);
  if (script.subfolder) legacy.push(script.subfolder);
  if (script.lesson) legacy.push(script.lesson);

  return legacy;
}

/**
 * Builds a recursive folder tree from a flat list of scripts.
 * The root-level Record keys are the top-level folder names.
 */
export function buildTree(scripts: ScriptDoc[]): Record<string, FolderNode> {
  const root: Record<string, FolderNode> = {};

  // Scripts at the root level (no path)
  const rootScripts = scripts.filter((s) => getScriptPath(s).length === 0);
  if (rootScripts.length > 0) {
    root[""] = {
      name: "",
      fullPath: [],
      children: {},
      scripts: rootScripts,
      totalScripts: rootScripts.length,
      allScriptsRecursive: rootScripts,
    };
  }

  // Scripts with paths
  const pathedScripts = scripts.filter((s) => getScriptPath(s).length > 0);

  for (const script of pathedScripts) {
    const path = getScriptPath(script);
    insertIntoTree(root, path, script);
  }

  // Calculate totalScripts for all nodes bottom-up
  calcTotals(root);

  return root;
}

function insertIntoTree(
  tree: Record<string, FolderNode>,
  path: string[],
  script: ScriptDoc
) {
  const [head, ...tail] = path;
  if (!head) return;

  if (!tree[head]) {
    tree[head] = {
      name: head,
      fullPath: [head],
      children: {},
      scripts: [],
      totalScripts: 0,
      allScriptsRecursive: [],
    };
  }

  if (tail.length === 0) {
    tree[head].scripts.push(script);
  } else {
    insertIntoSubTree(tree[head], tail, script, [head]);
  }
}

function insertIntoSubTree(
  node: FolderNode,
  path: string[],
  script: ScriptDoc,
  ancestorPath: string[]
) {
  const [head, ...tail] = path;
  if (!head) return;

  const fullPath = [...ancestorPath, head];

  if (!node.children[head]) {
    node.children[head] = {
      name: head,
      fullPath,
      children: {},
      scripts: [],
      totalScripts: 0,
      allScriptsRecursive: [],
    };
  }

  if (tail.length === 0) {
    node.children[head].scripts.push(script);
  } else {
    insertIntoSubTree(node.children[head], tail, script, fullPath);
  }
}

function calcTotals(tree: Record<string, FolderNode>): number {
  let total = 0;
  for (const node of Object.values(tree)) {
    const childTotal = calcTotals(node.children);

    const descendantScripts = Object.values(node.children).flatMap((c) => c.allScriptsRecursive);
    node.allScriptsRecursive = [...node.scripts, ...descendantScripts];

    const scriptCount = node.scripts.filter((s) => !s.isPlaceholder).length;
    node.totalScripts = scriptCount + childTotal;

    total += node.totalScripts;
  }
  return total;
}

/** Validates that a path doesn't exceed the max depth */
export function isValidPath(path: string[]): boolean {
  return path.length <= MAX_PATH_DEPTH && path.every((p) => p.trim().length > 0);
}

/**
 * O back-end .NET não possui conceito de pastas/caminhos para roteiros.
 * Estas funções de persistência são mantidas por compatibilidade de assinatura,
 * mas não escrevem em lugar nenhum (a UI continua funcionando em modo plano).
 */

export async function moveScript(
  _scriptId: string,
  _newPath: string[],
  _targetProject?: { projectId: string; projectName: string }
): Promise<void> {
  console.warn("[pathUtils] Pastas não são persistidas no back-end .NET.");
}

export async function moveScripts(
  _scripts: ScriptDoc[],
  _newPath: string[],
  _targetProject?: { projectId: string; projectName: string }
): Promise<void> {
  console.warn("[pathUtils] Pastas não são persistidas no back-end .NET.");
}

export async function renameFolder(
  _scripts: ScriptDoc[],
  _targetPath: string[],
  _newName: string
): Promise<void> {
  console.warn("[pathUtils] Pastas não são persistidas no back-end .NET.");
}

export async function moveFolder(
  _scripts: ScriptDoc[],
  _sourcePath: string[],
  _destinationParentPath: string[],
  _targetProject?: { projectId: string; projectName: string }
): Promise<void> {
  console.warn("[pathUtils] Pastas não são persistidas no back-end .NET.");
}
