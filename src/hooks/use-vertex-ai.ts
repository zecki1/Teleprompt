import { useState, useCallback } from "react";
import {
  VertexAIGenerateImageRequest,
  VertexAIGenerateImageResponse,
  VertexAIGenerateTextRequest,
  VertexAIGenerateTextResponse,
  VertexAIGenerateVideoRequest,
  VertexAIGenerateVideoResponse,
  VertexAIAnalyzeImageRequest,
  VertexAIAnalyzeImageResponse,
  VertexAIError,
} from "@/types/vertex-ai";

interface UseVertexAIOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

interface UseVertexAIReturn {
  loading: boolean;
  error: string | null;
  generateText: (request: VertexAIGenerateTextRequest) => Promise<VertexAIGenerateTextResponse | null>;
  generateImage: (request: VertexAIGenerateImageRequest) => Promise<VertexAIGenerateImageResponse | null>;
  generateVideo: (request: VertexAIGenerateVideoRequest) => Promise<VertexAIGenerateVideoResponse | null>;
  analyzeImage: (request: VertexAIAnalyzeImageRequest) => Promise<VertexAIAnalyzeImageResponse | null>;
  clearError: () => void;
}

export function useVertexAI(options?: UseVertexAIOptions): UseVertexAIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (err: string) => {
      setError(err);
      options?.onError?.(err);
    },
    [options]
  );

  const handleSuccess = useCallback(
    (message: string) => {
      options?.onSuccess?.(message);
    },
    [options]
  );

  const generateText = useCallback(
    async (request: VertexAIGenerateTextRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/vertex-ai/generate-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as VertexAIError;
          throw new Error(errorData.error);
        }

        const data = (await response.json()) as VertexAIGenerateTextResponse;
        handleSuccess("Texto gerado com sucesso!");
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar texto";
        handleError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  const generateImage = useCallback(
    async (request: VertexAIGenerateImageRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/vertex-ai/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as VertexAIError;
          throw new Error(errorData.error);
        }

        const data = (await response.json()) as VertexAIGenerateImageResponse;
        handleSuccess("Imagens geradas com sucesso!");
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar imagem";
        handleError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  const generateVideo = useCallback(
    async (request: VertexAIGenerateVideoRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/vertex-ai/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as VertexAIError;
          throw new Error(errorData.error);
        }

        const data = (await response.json()) as VertexAIGenerateVideoResponse;
        handleSuccess("Vídeo em processamento!");
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar vídeo";
        handleError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  const analyzeImage = useCallback(
    async (request: VertexAIAnalyzeImageRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/vertex-ai/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as VertexAIError;
          throw new Error(errorData.error);
        }

        const data = (await response.json()) as VertexAIAnalyzeImageResponse;
        handleSuccess("Imagem analisada com sucesso!");
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao analisar imagem";
        handleError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    generateText,
    generateImage,
    generateVideo,
    analyzeImage,
    clearError,
  };
}
