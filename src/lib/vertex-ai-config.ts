// Configuração centralizada para Vertex AI
export const VERTEX_AI_CONFIG = {
  // Modelos disponíveis
  MODELS: {
    TEXT: "gemini-2.0-flash",
    IMAGE: "imagen-3.0-generate-001",
    VIDEO: "veo",
  },

  // Configurações padrão
  DEFAULTS: {
    TEXT: {
      maxOutputTokens: 1024,
      temperature: 0.7,
      topP: 0.8,
    },
    IMAGE: {
      numberOfImages: 1,
      aspectRatio: "1:1" as const,
    },
    VIDEO: {
      duration: "5s",
    },
  },

  // Limites e validações
  LIMITS: {
    MAX_OUTPUT_TOKENS: 2048,
    MIN_OUTPUT_TOKENS: 100,
    MAX_TEMPERATURE: 2,
    MIN_TEMPERATURE: 0,
    MAX_IMAGES: 4,
    MIN_IMAGES: 1,
    MAX_VIDEO_DURATION: "60s",
  },

  // Proporções de imagem suportadas
  ASPECT_RATIOS: [
    { value: "1:1", label: "Quadrado (1:1)" },
    { value: "16:9", label: "Paisagem (16:9)" },
    { value: "9:16", label: "Retrato (9:16)" },
    { value: "4:3", label: "4:3" },
    { value: "3:4", label: "3:4" },
  ],

  // Durações de vídeo suportadas
  VIDEO_DURATIONS: [
    { value: "5s", label: "5 segundos" },
    { value: "10s", label: "10 segundos" },
    { value: "20s", label: "20 segundos" },
    { value: "30s", label: "30 segundos" },
  ],

  // Mensagens de exemplo para testes
  EXAMPLE_PROMPTS: {
    TEXT: [
      "Explique o conceito de inteligência artificial em termos simples",
      "Crie uma receita para um bolo de chocolate",
      "Qual é a diferença entre machine learning e deep learning?",
    ],
    IMAGE: [
      "Uma montanha nevada ao pôr do sol",
      "Um astronauta flutuando no espaço com um planeta ao fundo",
      "Uma cidade futurista com arranha-céus luminosos",
    ],
    VIDEO: [
      "Um pássaro voando pelo céu azul",
      "Água caindo de uma cachoeira",
      "Uma cidade acelerada durante a noite",
    ],
  },
};

// Tipos para validação
export type AspectRatioType = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface TextGenerationConfig {
  maxOutputTokens: number;
  temperature: number;
  topP?: number;
}

export interface ImageGenerationConfig {
  numberOfImages: number;
  aspectRatio: AspectRatioType;
}

// Função auxiliar para validar configurações
export function validateTextConfig(config: Partial<TextGenerationConfig>) {
  const errors: string[] = [];

  if (
    config.maxOutputTokens &&
    config.maxOutputTokens > VERTEX_AI_CONFIG.LIMITS.MAX_OUTPUT_TOKENS
  ) {
    errors.push(
      `Max tokens não pode exceder ${VERTEX_AI_CONFIG.LIMITS.MAX_OUTPUT_TOKENS}`
    );
  }

  if (
    config.temperature &&
    config.temperature > VERTEX_AI_CONFIG.LIMITS.MAX_TEMPERATURE
  ) {
    errors.push(
      `Temperature não pode exceder ${VERTEX_AI_CONFIG.LIMITS.MAX_TEMPERATURE}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateImageConfig(config: Partial<ImageGenerationConfig>) {
  const errors: string[] = [];

  if (
    config.numberOfImages &&
    config.numberOfImages > VERTEX_AI_CONFIG.LIMITS.MAX_IMAGES
  ) {
    errors.push(
      `Número de imagens não pode exceder ${VERTEX_AI_CONFIG.LIMITS.MAX_IMAGES}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
