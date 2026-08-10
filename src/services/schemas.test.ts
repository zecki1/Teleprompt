import { describe, it, expect } from "vitest";
import {
  WorkspaceSchema,
  UserSchema,
  ExtendedUserSchema,
  TeamSchema,
  ROLES,
} from "./schemas";

describe("WorkspaceSchema", () => {
  const validWorkspace = {
    id: "ws-1",
    name: "Senai",
    ownerId: "user-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  it("aceita workspace válido com defaults", () => {
    const parsed = WorkspaceSchema.parse(validWorkspace);
    expect(parsed.plan).toBe("free");
    expect(parsed.members).toEqual([]);
  });

  it("rejeita workspace sem name", () => {
    expect(() =>
      WorkspaceSchema.parse({ ...validWorkspace, name: "" })
    ).toThrow();
  });

  it("rejeita sem id", () => {
    const { id: _id, ...withoutId } = validWorkspace;
    expect(() => WorkspaceSchema.parse(withoutId)).toThrow();
  });
});

describe("UserSchema", () => {
  const base = {
    uid: "u-1",
    email: "user@email.com",
    name: "João",
  };

  it("aplica defaults de role e permissões", () => {
    const parsed = UserSchema.parse(base);
    expect(parsed.role).toBe("Estagiário");
    expect(parsed.isSuperAdmin).toBe(false);
    expect(parsed.canCollaborate).toBe(false);
    expect(parsed.canViewAdmin).toBe(false);
    expect(parsed.canViewReports).toBe(false);
    expect(parsed.canViewActivityHistory).toBe(false);
    expect(parsed.canViewDebugLogs).toBe(false);
    expect(parsed.status).toBe("active");
    expect(parsed.requiresChecklist).toBe(true);
  });

  it("aceita role válida da lista ROLES", () => {
    for (const role of ROLES) {
      expect(UserSchema.parse({ ...base, role }).role).toBe(role);
    }
  });

  it("permite email nulo", () => {
    expect(UserSchema.parse({ ...base, email: null }).email).toBeNull();
  });
});

describe("ExtendedUserSchema", () => {
  it("exige email válido", () => {
    expect(() =>
      ExtendedUserSchema.parse({
        uid: "u-1",
        email: "invalido",
        name: "João",
      })
    ).toThrow();
    expect(() =>
      ExtendedUserSchema.parse({ uid: "u-1", email: null, name: "João" })
    ).toThrow();
  });
});

describe("TeamSchema", () => {
  it("aceita time mínimo", () => {
    const parsed = TeamSchema.parse({ id: "t-1", name: "Equipe A" });
    expect(parsed.members).toEqual([]);
  });
});
