export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  plan: WorkspacePlan;
  createdAt: Date;
}

export enum WorkspacePlan {
  Free = 0,
  Pro = 1,
  Enterprise = 2,
  Lifetime = 3
}

export interface CreateWorkspaceRequest {
  name: string;
  plan: WorkspacePlan;
}

export interface JoinWorkspaceRequest {
  token: string;
}

export interface AddMemberRequest {
  email: string;
}
