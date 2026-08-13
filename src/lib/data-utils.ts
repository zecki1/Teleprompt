/**
 * Utilitários genéricos de dados (sem dependência de Firebase/Firestore).
 */

/**
 * Remove recursivamente valores 'undefined' de um objeto ou array,
 * substituindo-os por 'null' ou removendo a chave.
 */
export function sanitizeData<T>(data: T): T {
  if (data === undefined || data === null) return null as unknown as T;

  const anyData = data as Record<string, unknown>;
  if (anyData?.seconds !== undefined && anyData?.nanoseconds !== undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item)) as unknown as T;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array') {
      return data;
    }

    const sanitized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          sanitized[key] = sanitizeData(obj[key]);
        } catch (e) {
          console.error(`[Sanitize] Erro ao sanitizar chave ${key}:`, e);
          sanitized[key] = null;
        }
      }
    }
    return sanitized as unknown as T;
  }

  return data;
}

/**
 * Converte uma data (string ISO ou objeto com toDate) para objeto Date
 */
export function toDate(date: unknown): Date {
  if (!date) return new Date();
  const d = date as { toDate?: () => { toDate: () => Date } | Date } | string;
  if (typeof d === 'object' && d !== null && 'toDate' in d && typeof d.toDate === 'function') {
    const result = d.toDate();
    return result instanceof Date ? result : new Date();
  }
  if (typeof d === 'string') return new Date(d);
  return new Date();
}
