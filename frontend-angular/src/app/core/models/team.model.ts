export interface Team {
  id: string;
  name: string;
  acronym?: string;
  workspaceId: string;
}

export interface CreateTeamRequest {
  name: string;
  acronym?: string;
  workspaceId: string;
}

export interface AddTeamMemberRequest {
  userId: string;
}
