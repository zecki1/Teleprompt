/**
 * Normalização canônica do caminho de pastas de um roteiro.
 *
 * Espelha EXATAMENTE a lógica do Next (`src/lib/script-mappers.ts` /
 * `src/lib/pathUtils.ts`) para que os 3 frontends (Next, Angular 22,
 * Angular 17) montem a MESMA hierarquia `folder → subfolder → lesson`
 * a partir da mesma fonte (API .NET).
 *
 * Regra: se `folder` for uma sentinela de "raiz/sem pasta" ("Raiz",
 * "Sem Pasta", vazio), o caminho inteiro é vazio (roteiro na raiz) — assim
 * como no Next, que também ignora subfolder/lesson nesse caso.
 */
import { Script } from './script.model';

export function isRootSentinel(value: string | null | undefined): boolean {
  return value === 'Raiz' || value === 'Sem Pasta' || value === null || value === undefined;
}

export function getScriptPath(script: Pick<Script, 'folder' | 'subfolder' | 'lesson'>): string[] {
  const folder = isRootSentinel(script.folder) ? null : script.folder;
  if (!folder) return [];
  const segments = [folder];
  if (script.subfolder) segments.push(script.subfolder);
  if (script.lesson) segments.push(script.lesson);
  return segments;
}
