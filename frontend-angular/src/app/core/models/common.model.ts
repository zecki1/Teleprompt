export interface Presenter {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CreatePresenterRequest {
  name: string;
  email?: string;
  phone?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  userId?: string;
  createdAt: Date;
}

export enum ActivityType {
  Create = 0,
  Update = 1,
  Delete = 2,
  Comment = 3,
  Version = 4,
  Revert = 5,
  Assign = 6,
  Record = 7,
  Login = 8,
  Permission = 9,
  Other = 10
}

export interface Report {
  totalScripts: number;
  totalProjects: number;
  byStatus: Record<string, number>;
  byBucket: Record<string, number>;
  growth: number;
  generatedAt: Date;
}

export interface ErrorReport {
  id: string;
  userId?: string;
  screenshotUrl?: string;
  description?: string;
  logsJson?: string;
  status: string;
  createdAt: Date;
}

export interface DebugLog {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  createdAt: Date;
}

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
  Fatal = 4
}

export interface ApiMessage {
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
