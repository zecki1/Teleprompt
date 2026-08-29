import { ScriptDoc, FolderNode, MAX_PATH_DEPTH } from "@/types/script";
import { updateScript } from "@/api/scripts";

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
 * O back-end .NET persiste a estrutura de pastas nos campos
 * folder/subfolder/lesson do roteiro. Estas funções gravam o novo caminho
 * através da API — mover/renomear pastas funciona de ponta a ponta.
 */

/** Converte um path[] nos campos de pasta persistidos pelo backend. */
function toFolderFields(path: string[]): { folder: string | null; subfolder: string | null; lesson: string | null } {
  return {
    folder: path[0] ?? null,
    subfolder: path[1] ?? null,
    lesson: path[2] ?? null,
  };
}

export async function moveScript(
  scriptId: string,
  newPath: string[],
  targetProject?: { projectId: string; projectName: string }
): Promise<void> {
  await updateScript(scriptId, {
    ...toFolderFields(newPath),
    ...(targetProject ? { projectId: targetProject.projectId } : {}),
  });
}

export async function moveScripts(
  scripts: ScriptDoc[],
  newPath: string[],
  targetProject?: { projectId: string; projectName: string }
): Promise<void> {
  await Promise.all(
    scripts
      .filter((s) => s.id)
      .map((s) => moveScript(s.id, newPath, targetProject))
  );
}

export async function renameFolder(
  scripts: ScriptDoc[],
  targetPath: string[],
  newName: string
): Promise<void> {
  const promises: Promise<unknown>[] = [];
  for (const script of scripts) {
    const oldPath = getScriptPath(script);
    if (oldPath.length === 0 || targetPath.length === 0) continue;
    if (!targetPath.every((seg, i) => oldPath[i] === seg)) continue;
    const next = [...oldPath];
    next[targetPath.length - 1] = newName;
    promises.push(updateScript(script.id, toFolderFields(next)));
  }
  await Promise.all(promises);
}

export async function moveFolder(
  scripts: ScriptDoc[],
  sourcePath: string[],
  destinationParentPath: string[],
  targetProject?: { projectId: string; projectName: string }
): Promise<void> {
  if (sourcePath.length === 0) return;
  const promises: Promise<unknown>[] = [];
  for (const script of scripts) {
    const oldPath = getScriptPath(script);
    if (oldPath.length === 0) continue;
    if (!sourcePath.every((seg, i) => oldPath[i] === seg)) continue;
    // Mantém o nome da pasta (último segmento do sourcePath) e as subpastas.
    const tail = oldPath.slice(sourcePath.length - 1);
    const next = [...(destinationParentPath ?? []), ...tail];
    promises.push(
      updateScript(script.id, {
        ...toFolderFields(next),
        ...(targetProject ? { projectId: targetProject.projectId } : {}),
      })
    );
  }
  await Promise.all(promises);
}
