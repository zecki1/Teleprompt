import { ScriptDoc, FolderNode, MAX_PATH_DEPTH } from "@/types/script";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const rootScripts = scripts.filter(s => getScriptPath(s).length === 0);
  if (rootScripts.length > 0) {
    root[""] = {
      name: "",
      fullPath: [],
      children: {},
      scripts: rootScripts,
      totalScripts: rootScripts.length,
    };
  }

  // Scripts with paths
  const pathedScripts = scripts.filter(s => getScriptPath(s).length > 0);

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
    };
  }

  if (tail.length === 0) {
    tree[head].scripts.push(script);
  } else {
    // Update fullPath as we go deeper
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
    node.totalScripts = node.scripts.length + childTotal;
    total += node.totalScripts;
  }
  return total;
}

/** Validates that a path doesn't exceed the max depth */
export function isValidPath(path: string[]): boolean {
  return path.length <= MAX_PATH_DEPTH && path.every(p => p.trim().length > 0);
}

/** Moves a script to a new path by updating Firestore */
export async function moveScript(
  scriptId: string,
  newPath: string[]
): Promise<void> {
  const ref = doc(db, "scripts", scriptId);
  await updateDoc(ref, {
    path: newPath,
    // clear legacy fields when path is set
    folder: newPath[0] ?? null,
    subfolder: newPath[1] ?? null,
    lesson: newPath[2] ?? null,
  });
}

/** Renames a folder in a script path (updates all scripts that have that segment) */
export async function renameFolder(
  scripts: ScriptDoc[],
  targetPath: string[],
  newName: string
): Promise<void> {
  const idx = targetPath.length - 1;
  const updates = scripts
    .filter(s => {
      const sp = getScriptPath(s);
      return targetPath.every((seg, i) => sp[i] === seg);
    })
    .map(s => {
      const sp = getScriptPath(s);
      const newPath = [...sp];
      newPath[idx] = newName;
      return moveScript(s.id, newPath);
    });

  await Promise.all(updates);
}
