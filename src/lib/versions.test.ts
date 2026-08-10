import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

const getDocsMock = vi.fn();
const getDocMock = vi.fn();
const addDocMock = vi.fn();
const setDocMock = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "collection-ref"),
  query: vi.fn(() => "query"),
  orderBy: vi.fn(),
  limit: vi.fn(),
  doc: vi.fn(() => "doc-ref"),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  serverTimestamp: vi.fn(() => "SERVER_TS"),
}));

import { getVersions, getVersionById, restoreVersion } from "./versions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getVersions", () => {
  it("retorna versões com id", async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        { id: "v1", data: () => ({ content: "a", scenes: [] }) },
        { id: "v2", data: () => ({ content: "b", scenes: [] }) },
      ],
    });
    const versions = await getVersions("script-1");
    expect(versions).toHaveLength(2);
    expect(versions[0].id).toBe("v1");
    expect(versions[0].content).toBe("a");
    expect(getDocsMock).toHaveBeenCalled();
  });
});

describe("getVersionById", () => {
  it("retorna a versão quando existe", async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      id: "v1",
      data: () => ({ content: "x" }),
    });
    const v = await getVersionById("s", "v1");
    expect(v?.id).toBe("v1");
    expect(v?.content).toBe("x");
  });

  it("retorna null quando não existe", async () => {
    getDocMock.mockResolvedValue({ exists: () => false });
    expect(await getVersionById("s", "v1")).toBeNull();
  });
});

describe("restoreVersion", () => {
  it("restaura e cria nova versão no sucesso", async () => {
    getDocMock
      .mockResolvedValueOnce({ exists: () => true, id: "v1", data: () => ({ content: "raw", scenes: [{ id: "c1" }] }) })
      .mockResolvedValueOnce({ exists: () => true });
    addDocMock.mockResolvedValue({ id: "new-version" });
    setDocMock.mockResolvedValue(undefined);

    const ok = await restoreVersion("s", "v1", "u1", "João");
    expect(ok).toBe(true);
    expect(setDocMock).toHaveBeenCalledWith("doc-ref", expect.objectContaining({ restoredFrom: "v1" }), { merge: true });
    expect(addDocMock).toHaveBeenCalledWith(
      "collection-ref",
      expect.objectContaining({ content: "raw", restoredFrom: "v1", createdBy: "u1" })
    );
  });

  it("retorna false quando a versão não existe", async () => {
    getDocMock.mockResolvedValueOnce({ exists: () => false });
    expect(await restoreVersion("s", "v1", "u1", "João")).toBe(false);
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("retorna false quando o roteiro atual não existe", async () => {
    getDocMock
      .mockResolvedValueOnce({ exists: () => true, id: "v1", data: () => ({ content: "raw", scenes: [] }) })
      .mockResolvedValueOnce({ exists: () => false });
    expect(await restoreVersion("s", "v1", "u1", "João")).toBe(false);
  });

  it("retorna false e não lança em caso de erro", async () => {
    getDocMock.mockRejectedValue(new Error("network"));
    expect(await restoreVersion("s", "v1", "u1", "João")).toBe(false);
  });
});
