/**
 * Remove recursivamente valores 'undefined' de um objeto ou array,
 * substituindo-os por 'null' ou removendo a chave.
 * Isso é essencial para o Firestore, que não aceita 'undefined'.
 */
export function sanitizeData<T>(data: T): T {
  if (data === undefined || data === null) return null;

  // Se for um FieldValue (ex: serverTimestamp) ou Timestamp do Firestore, não sanitizar
  const anyData = data as Record<string, unknown>;
  if (anyData?._methodName || (anyData?.seconds !== undefined && anyData?.nanoseconds !== undefined)) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    // Evita loop em objetos que não são POJOs (Plain Old JavaScript Objects)
    if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array') {
      return data;
    }

    const sanitized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeData(obj[key]);
      }
    }
    return sanitized;
  }

  return data;
}
