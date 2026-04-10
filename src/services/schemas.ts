import { z } from "zod";

export const ROLES = [
  "SuperAdmin", "Diretor", "Coordenador", "Orientador", "Docente",
  "Especialista", "Assistente", "Analista", "Tutor", "Monitor", "Técnico", "Estagiário",
  "editor", "validador", "publico"
] as const;
export type Role = typeof ROLES[number];

export const USER_STATUSES = ["active", "inactive", "pending"] as const;
export type UserStatus = typeof USER_STATUSES[number];

export const PROJECT_STATUSES = [
  "awaiting", "in-progress", "completed", "paused", "delayed", "backlog",
  "pendente", "em andamento", "concluído", "completo",
] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

export const BUCKETS = [
  "Backlog", "Em Andamento", "Pausado", "Em Revisão", "Em Ajuste", "Concluído",
] as const;
export type Bucket = typeof BUCKETS[number];

// --- WORKSPACE SCHEMA ---
export const WorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ownerId: z.string(),
  plan: z.enum(['free', 'pro', 'enterprise', 'lifetime']).default('free'),
  createdAt: z.string(),
  updatedAt: z.string(),
  trialEndsAt: z.string().optional(),
  roleLabels: z.record(z.string(), z.string()).optional(),
  members: z.array(z.string()).default([]),
  deletedAt: z.string().optional().nullable(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

// --- USER SCHEMA ---
export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().nullable(),
  displayName: z.string().nullable().optional(),
  name: z.string().optional(),
  surname: z.string().optional(),
  role: z.enum(ROLES).default("Estagiário"),
  isSuperAdmin: z.boolean().default(false),
  isEditor: z.boolean().default(false),
  isRevisor: z.boolean().default(false),
  avatarUrl: z.string().optional().default(""),
  photoURL: z.string().nullable().optional(),
  status: z.enum(USER_STATUSES).default("active"),
  workspaceId: z.string().optional(),
  workspaces: z.array(z.string()).default([]),
  createdAt: z.union([z.string(), z.object({ toDate: z.function() })]).optional().nullable(),
  updatedAt: z.union([z.string(), z.object({ toDate: z.function() })]).optional().nullable(),
}).passthrough();

export const ExtendedUserSchema = UserSchema.extend({
  uid: z.string(),
  email: z.string().email(),
});
export type ExtendedUser = z.infer<typeof ExtendedUserSchema>;

// --- TEAM SCHEMA ---
export const TeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  acronym: z.string().optional(),
  members: z.array(z.string()).default([]),
  workspaceId: z.string().optional(),
});
export type Team = z.infer<typeof TeamSchema>;
export const ExtendedTeamSchema = TeamSchema; // No Teleprompt simplificaremos por enquanto
export type ExtendedTeam = Team;
