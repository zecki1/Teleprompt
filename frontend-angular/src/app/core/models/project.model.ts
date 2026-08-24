export interface Project {
  id: string;
  name: string;
  code?: string;
  externalLink?: string;
  workspaceId: string;
  status?: ProjectStatus;
  bucket?: Bucket;
  createdAt: Date;
}

export interface CreateProjectRequest {
  name: string;
  code?: string;
  externalLink?: string;
  status?: ProjectStatus;
  bucket?: Bucket;
}

export enum ProjectStatus {
  Awaiting = 0,
  InProgress = 1,
  Completed = 2,
  Paused = 3,
  Delayed = 4,
  Backlog = 5
}

export enum Bucket {
  Backlog = 0,
  EmAndamento = 1,
  Pausado = 2,
  EmRevisao = 3,
  EmAjuste = 4,
  Concluido = 5
}
