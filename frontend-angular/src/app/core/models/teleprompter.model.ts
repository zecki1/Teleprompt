export interface TpSession {
  id: string;
  scriptId: string;
  ownerId: string;
  mode: TpScrollMode;
  speed: number;
  scrollStateJson?: string;
  createdAt: Date;
}

export interface CreateTpSessionRequest {
  scriptId: string;
  mode: TpScrollMode;
  speed: number;
}

export interface UpdateTpSessionRequest {
  mode: TpScrollMode;
  speed: number;
  scrollStateJson?: string;
}

export enum TpScrollMode {
  Paragraph = 0,
  Scene = 1,
  HalfScene = 2,
  Continuous = 3
}

export interface ScrollState {
  position: number;
  speed: number;
  mode: string;
}

export interface RemoteCommand {
  command: 'play' | 'pause' | 'next' | 'prev' | 'speed-up' | 'speed-down' | 'reset';
}

export interface TpParticipant {
  user: string;
  role: 'operator' | 'mirror';
}
