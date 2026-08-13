import { listVersions, revertVersion } from "@/api/versions";
import { toVersion } from "@/lib/script-mappers";
import { Scene } from "@/lib/parser";

export interface VersionData {
  id: string;
  content?: string;
  scenes?: Scene[];
  createdAt: { toDate: () => Date } | string;
  createdBy?: string;
  createdByName?: string;
  description?: string;
  restoredFrom?: string;
  versionNumber?: number;
}

export async function getVersions(
  scriptId: string,
  max: number = 50
): Promise<VersionData[]> {
  try {
    const dtos = await listVersions(scriptId);
    return dtos.slice(0, max).map((dto) => ({
      ...toVersion(dto),
      createdAt: dto.createdAt,
      content: dto.content,
      createdBy: dto.createdBy ?? undefined,
    }));
  } catch (error) {
    console.error("[Versions] Erro ao listar versões:", error);
    return [];
  }
}

export async function getVersionById(
  scriptId: string,
  versionId: string
): Promise<VersionData | null> {
  try {
    const dtos = await listVersions(scriptId);
    const dto = dtos.find((v) => v.id === versionId);
    if (!dto) return null;
    return {
      ...toVersion(dto),
      createdAt: dto.createdAt,
      content: dto.content,
      createdBy: dto.createdBy ?? undefined,
    };
  } catch (error) {
    console.error("[Versions] Erro ao buscar versão:", error);
    return null;
  }
}

export async function restoreVersion(
  scriptId: string,
  versionId: string,
  _restoredBy: string,
  _restoredByName: string
): Promise<boolean> {
  try {
    const version = await getVersionById(scriptId, versionId);
    if (!version || version.versionNumber === undefined) return false;
    await revertVersion(scriptId, version.versionNumber);
    return true;
  } catch (error) {
    console.error("[Versions] Erro ao restaurar versão:", error);
    return false;
  }
}
