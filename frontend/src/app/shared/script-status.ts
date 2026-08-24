/**
 * Status de roteiro — valores locais (PT) usados na UI e mapeamento
 * para o enum do backend: Rascunho | EmRevisao | Aprovado | Gravado | Concluido.
 */

export type LocalStatus =
  | 'rascunho'
  | 'em_revisao'
  | 'revisao_realizada'
  | 'aguardando_gravacao'
  | 'gravado'
  | 'rejeitado'
  | 'nao_gravado';

export interface StatusMeta {
  value: LocalStatus;
  label: string;
  color: string;
}

export const SCRIPT_STATUSES: StatusMeta[] = [
  { value: 'rascunho', label: 'Rascunho', color: '#fdab3d' },
  { value: 'em_revisao', label: 'Em Revisão', color: '#ffcb00' },
  { value: 'revisao_realizada', label: 'Revisado', color: '#00c875' },
  { value: 'aguardando_gravacao', label: 'Aguardando Gravação', color: '#a25ddc' },
  { value: 'gravado', label: 'Gravado', color: '#579bfc' },
  { value: 'rejeitado', label: 'Rejeitado', color: '#e2445c' },
  { value: 'nao_gravado', label: 'Não Gravado', color: '#c4354d' },
];

const LOCAL_TO_BACKEND: Record<LocalStatus, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'EmRevisao',
  revisao_realizada: 'Aprovado',
  aguardando_gravacao: 'Aprovado',
  gravado: 'Gravado',
  rejeitado: 'Rascunho',
  nao_gravado: 'Rascunho',
};

const BACKEND_TO_LOCAL: Record<string, LocalStatus> = {
  Rascunho: 'rascunho',
  EmRevisao: 'em_revisao',
  Aprovado: 'aguardando_gravacao',
  Gravado: 'gravado',
  Concluido: 'gravado',
};

export function statusMeta(value: LocalStatus): StatusMeta {
  return SCRIPT_STATUSES.find((s) => s.value === value) ?? SCRIPT_STATUSES[0];
}

export function toBackendStatus(local: LocalStatus): string {
  return LOCAL_TO_BACKEND[local];
}

/** Converte o status do backend para o valor local da UI. */
export function fromBackendStatus(backend: string): LocalStatus {
  return BACKEND_TO_LOCAL[backend] ?? 'rascunho';
}

/** Prioridade de ordenação (menor = mais urgente). */
const SORT_PRIORITY: Record<LocalStatus, number> = {
  aguardando_gravacao: 0,
  rascunho: 1,
  em_revisao: 2,
  revisao_realizada: 3,
  gravado: 4,
  rejeitado: 5,
  nao_gravado: 6,
};

export function statusSortPriority(value: LocalStatus): number {
  return SORT_PRIORITY[value] ?? 9;
}
