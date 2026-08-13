import { describe, it, expect, vi, beforeEach } from "vitest";

const listVersionsMock = vi.fn();
const revertVersionMock = vi.fn();

vi.mock("@/api/versions", () => ({
  listVersions: (...args: unknown[]) => listVersionsMock(...args),
  revertVersion: (...args: unknown[]) => revertVersionMock(...args),
}));

import { getVersions, getVersionById, restoreVersion } from "./versions";

beforeEach(() => {
  vi.clearAllMocks();
});

const dto = (overrides: Partial<{ id: string; versionNumber: number; content: string; createdBy: string | null }>) => ({
  id: "v1",
  versionNumber: 1,
  content: "a",
  createdBy: "u1",
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("getVersions", () => {
  it("retorna versões com id", async () => {
    listVersionsMock.mockResolvedValue([dto({}), dto({ id: "v2", versionNumber: 2, content: "b" })]);
    const versions = await getVersions("script-1");
    expect(versions).toHaveLength(2);
    expect(versions[0].id).toBe("v1");
    expect(versions[0].content).toBe("a");
    expect(versions[0].createdAt).toBe("2024-01-01T00:00:00.000Z");
    expect(listVersionsMock).toHaveBeenCalledWith("script-1");
  });

  it("limita o número de versões pelo parâmetro max", async () => {
    listVersionsMock.mockResolvedValue([dto({}), dto({ id: "v2", versionNumber: 2 })]);
    const versions = await getVersions("script-1", 1);
    expect(versions).toHaveLength(1);
  });

  it("retorna [] em caso de erro", async () => {
    listVersionsMock.mockRejectedValue(new Error("network"));
    expect(await getVersions("s")).toEqual([]);
  });
});

describe("getVersionById", () => {
  it("retorna a versão quando existe", async () => {
    listVersionsMock.mockResolvedValue([dto({ content: "x" })]);
    const v = await getVersionById("s", "v1");
    expect(v?.id).toBe("v1");
    expect(v?.content).toBe("x");
  });

  it("retorna null quando não existe", async () => {
    listVersionsMock.mockResolvedValue([dto({})]);
    expect(await getVersionById("s", "nao-existe")).toBeNull();
  });

  it("retorna null em caso de erro", async () => {
    listVersionsMock.mockRejectedValue(new Error("network"));
    expect(await getVersionById("s", "v1")).toBeNull();
  });
});

describe("restoreVersion", () => {
  it("reverte para a versão no sucesso", async () => {
    listVersionsMock.mockResolvedValue([dto({ versionNumber: 3 })]);
    revertVersionMock.mockResolvedValue({});
    const ok = await restoreVersion("s", "v1", "u1", "João");
    expect(ok).toBe(true);
    expect(revertVersionMock).toHaveBeenCalledWith("s", 3);
  });

  it("retorna false quando a versão não existe", async () => {
    listVersionsMock.mockResolvedValue([dto({})]);
    expect(await restoreVersion("s", "nao-existe", "u1", "João")).toBe(false);
    expect(revertVersionMock).not.toHaveBeenCalled();
  });

  it("retorna false e não lança em caso de erro", async () => {
    listVersionsMock.mockRejectedValue(new Error("network"));
    expect(await restoreVersion("s", "v1", "u1", "João")).toBe(false);
  });
});
