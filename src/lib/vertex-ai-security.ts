import { NextRequest, NextResponse } from "next/server";

// Rate limit simples em memória (para produção, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 10, // 10 requisições
  WINDOW_MS: 60 * 1000, // por minuto
};

export function rateLimit(request: NextRequest): NextResponse | null {
  try {
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "anonymous";

    const now = Date.now();
    const limiter = rateLimitMap.get(ip);

    // Se não há registro ou a janela expirou, criar novo
    if (!limiter || now > limiter.resetTime) {
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS,
      });
      return null; // Permitir requisição
    }

    // Incrementar contador
    limiter.count++;

    // Se excedeu o limite
    if (limiter.count > RATE_LIMIT_CONFIG.MAX_REQUESTS) {
      const retryAfter = Math.ceil(
        (limiter.resetTime - now) / 1000
      );

      return NextResponse.json(
        {
          error: "Muitas requisições. Por favor, tente novamente mais tarde.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    return null; // Permitir requisição
  } catch (error) {
    console.error("Rate limit error:", error);
    return null; // Em caso de erro, permitir a requisição
  }
}

// Validar entrada do usuário
export function validatePrompt(
  prompt: string,
  minLength: number = 1,
  maxLength: number = 2000
): { isValid: boolean; error?: string } {
  if (!prompt || typeof prompt !== "string") {
    return { isValid: false, error: "O prompt deve ser uma string não vazia" };
  }

  const trimmed = prompt.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `O prompt deve ter pelo menos ${minLength} caracteres`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `O prompt não deve exceder ${maxLength} caracteres`,
    };
  }

  // Evitar SQL injection e XSS patterns simples
  const suspiciousPatterns = [
    /(<script|javascript:|onerror|onclick)/gi,
    /(drop|delete|insert|update|select|union|exec|execute)/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: "O prompt contém padrões inválidos",
      };
    }
  }

  return { isValid: true };
}

// Validar URL de imagem
export function validateImageUrl(url: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    const imageUrl = new URL(url);

    // Verificar protocolo
    if (!["http:", "https:"].includes(imageUrl.protocol)) {
      return {
        isValid: false,
        error: "A URL da imagem deve usar HTTP ou HTTPS",
      };
    }

    // Verificar extensão
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const pathname = imageUrl.pathname.toLowerCase();

    const hasValidExtension = validExtensions.some((ext) =>
      pathname.endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        isValid: false,
        error: "A URL da imagem deve terminar com uma extensão de imagem válida",
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Formato de URL inválido",
    };
  }
}

// Sanitizar prompt para logs
export function sanitizePrompt(prompt: string): string {
  return prompt.substring(0, 100).replace(/[^a-zA-Z0-9\s]/g, "");
}

// Registrar requisição (para auditoria)
export function logRequest(
  endpoint: string,
  prompt: string,
  ip?: string
): void {
  const timestamp = new Date().toISOString();
  const sanitized = sanitizePrompt(prompt);

  console.log(`[${timestamp}] ${endpoint} | IP: ${ip || "unknown"} | Prompt: "${sanitized}"`);
}
