export interface VertexAIGenerateImageRequest {
  prompt: string;
  numberOfImages?: number;
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:3" | "3:4";
}

export interface VertexAIGenerateImageResponse {
  success: boolean;
  data: unknown;
}

export interface VertexAIGenerateTextRequest {
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface VertexAIGenerateTextResponse {
  success: boolean;
  data: unknown;
  fullResponse: unknown;
}

export interface VertexAIGenerateVideoRequest {
  prompt: string;
  duration?: string;
}

export interface VertexAIGenerateVideoResponse {
  success: boolean;
  data: unknown;
  note?: string;
}

export interface VertexAIAnalyzeImageRequest {
  imageUrl: string;
  prompt?: string;
}

export interface VertexAIAnalyzeImageResponse {
  success: boolean;
  data: unknown;
  fullResponse: unknown;
}

export interface VertexAIError {
  error: string;
}
