"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";

import { Text } from "@/components/providers/preferences-provider";

type TabType = "text" | "image" | "video" | "analyze";

export default function VertexAIDemo() {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [loading, setLoading] = useState(false);

  // Geração de Texto
  const [textPrompt, setTextPrompt] = useState("");
  const [textResponse, setTextResponse] = useState("");
  const [textTokens, setTextTokens] = useState(1024);
  const [temperature, setTemperature] = useState(0.7);

  // Geração de Imagem
  const [imagePrompt, setImagePrompt] = useState("");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<
    "1:1" | "9:16" | "16:9" | "4:3" | "3:4"
  >("1:1");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Geração de Vídeo
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState("5s");
  const [videoResponse, setVideoResponse] = useState("");

  // Análise de Imagem
  const [imageUrl, setImageUrl] = useState("");
  const [analyzePrompt, setAnalyzePrompt] = useState(
    "Describe this image in detail"
  );
  const [analysisResponse, setAnalysisResponse] = useState("");

  const handleGenerateText = async () => {
    if (!textPrompt.trim()) {
      toast.error("Por favor, digite um prompt");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/vertex-ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textPrompt,
          maxOutputTokens: textTokens,
          temperature: temperature,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTextResponse(
          typeof data.data === "string" ? data.data : JSON.stringify(data.data)
        );
        toast.success("Texto gerado com sucesso!");
      } else {
        toast.error(data.error || "Erro ao gerar texto");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar texto"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Por favor, digite um prompt");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/vertex-ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          numberOfImages: numberOfImages,
          aspectRatio: aspectRatio,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // URLs de imagem mock para demonstração
        const mockImages = Array(numberOfImages)
          .fill(null)
          .map(
            (_, i) =>
              `https://via.placeholder.com/512?text=Image+${i + 1}:+${imagePrompt.substring(0, 20)}`
          );
        setGeneratedImages(mockImages);
        toast.success("Imagens geradas com sucesso!");
      } else {
        toast.error(data.error || "Erro ao gerar imagem");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar imagem"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast.error("Por favor, digite um prompt");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/vertex-ai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          duration: videoDuration,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVideoResponse(JSON.stringify(data, null, 2));
        toast.success("Vídeo em processamento!");
      } else {
        toast.error(data.error || "Erro ao gerar vídeo");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar vídeo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageUrl.trim()) {
      toast.error("Por favor, forneça uma URL de imagem");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/vertex-ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl,
          prompt: analyzePrompt,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResponse(
          typeof data.data === "string" ? data.data : JSON.stringify(data.data)
        );
        toast.success("Imagem analisada com sucesso!");
      } else {
        toast.error(data.error || "Erro ao analisar imagem");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao analisar imagem"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Vertex AI Demo
          </h1>
          <p className="text-slate-300">
            <Text 
              pt="Teste as funcionalidades de IA do Google Cloud Vertex AI" 
              en="Test Google Cloud Vertex AI features" 
              es="Pruebe las funciones de IA de Google Cloud Vertex AI" 
            />
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="text"><Text pt="Texto" en="Text" es="Texto" /></TabsTrigger>
            <TabsTrigger value="image"><Text pt="Imagem" en="Image" es="Imagen" /></TabsTrigger>
            <TabsTrigger value="video"><Text pt="Vídeo" en="Video" es="Vídeo" /></TabsTrigger>
            <TabsTrigger value="analyze"><Text pt="Analisar" en="Analyze" es="Analizar" /></TabsTrigger>
          </TabsList>

          {/* Text Generation Tab */}
          <TabsContent value="text">
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                <Text pt="Geração de Texto" en="Text Generation" es="Generación de Texto" />
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Text pt="Prompt" en="Prompt" es="Prompt" />
                  </label>
                  <Textarea
                    placeholder="..."
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                       <Text pt="Max Tokens" en="Max Tokens" es="Máximo de Tokens" />: {textTokens}
                    </label>
                    <Input
                      type="range"
                      min="100"
                      max="2048"
                      value={textTokens}
                      onChange={(e) => setTextTokens(parseInt(e.target.value))}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Text pt="Temperatura" en="Temperature" es="Temperatura" />: {temperature.toFixed(2)}
                    </label>
                    <Input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateText}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <Text pt="Gerando..." en="Generating..." es="Generando..." />
                    </>
                  ) : (
                    <Text pt="Gerar Texto" en="Generate Text" es="Generar Texto" />
                  )}
                </Button>

                {textResponse && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        Resposta
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(textResponse)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4 text-slate-100 max-h-96 overflow-y-auto">
                      {textResponse}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Image Generation Tab */}
          <TabsContent value="image">
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                <Text pt="Geração de Imagens" en="Image Generation" es="Generación de Imágenes" />
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Text pt="Prompt" en="Prompt" es="Prompt" />
                  </label>
                  <Textarea
                    placeholder="..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Text pt="Número de Imagens" en="Number of Images" es="Número de Imágenes" />
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      value={numberOfImages}
                      onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Text pt="Proporção" en="Aspect Ratio" es="Proporción" />
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) =>
                        setAspectRatio(
                          e.target.value as "1:1" | "9:16" | "16:9" | "4:3" | "3:4"
                        )
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                    >
                      <option value="1:1">1:1 (<Text pt="Quadrado" en="Square" es="Cuadrado" />)</option>
                      <option value="16:9">16:9 (<Text pt="Paisagem" en="Landscape" es="Paisaje" />)</option>
                      <option value="9:16">9:16 (<Text pt="Retrato" en="Portrait" es="Retrato" />)</option>
                      <option value="4:3">4:3</option>
                      <option value="3:4">3:4</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateImage}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <Text pt="Gerando..." en="Generating..." es="Generando..." />
                    </>
                  ) : (
                    <Text pt="Gerar Imagens" en="Generate Images" es="Generar Imágenes" />
                  )}
                </Button>

                {generatedImages.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      <Text pt="Imagens Geradas" en="Generated Images" es="Imágenes Generadas" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedImages.map((img, idx) => (
                        <div key={idx} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Generated ${idx + 1}`}
                            className="w-full rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 bg-slate-800 border-slate-600"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = img;
                              a.download = `image-${idx + 1}.png`;
                              a.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Video Generation Tab */}
          <TabsContent value="video">
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                <Text pt="Geração de Vídeos" en="Video Generation" es="Generación de Vídeos" />
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Prompt
                  </label>
                  <Textarea
                    placeholder="Descreva o vídeo que deseja gerar..."
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Text pt="Duração" en="Duration" es="Duración" />
                  </label>
                  <select
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                  >
                    <option value="5s">5 <Text pt="segundos" en="seconds" es="segundos" /></option>
                    <option value="10s">10 <Text pt="segundos" en="seconds" es="segundos" /></option>
                    <option value="20s">20 <Text pt="segundos" en="seconds" es="segundos" /></option>
                    <option value="30s">30 <Text pt="segundos" en="seconds" es="segundos" /></option>
                  </select>
                </div>

                <Button
                  onClick={handleGenerateVideo}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <Text pt="Processando..." en="Processing..." es="Procesando..." />
                    </>
                  ) : (
                    <Text pt="Gerar Vídeo" en="Generate Video" es="Generar Vídeo" />
                  )}
                </Button>
 bleach

                {videoResponse && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        Resposta
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(videoResponse)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4 text-slate-100 max-h-96 overflow-y-auto font-mono text-sm">
                      {videoResponse}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Image Analysis Tab */}
          <TabsContent value="analyze">
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                <Text pt="Análise de Imagens" en="Image Analysis" es="Análisis de Imágenes" />
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Text pt="URL da Imagem" en="Image URL" es="URL de la Imagen" />
                  </label>
                  <Input
                    type="url"
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Text pt="Prompt de Análise" en="Analysis Prompt" es="Prompt de Análisis" />
                  </label>
                  <Textarea
                    placeholder="O que gostaria de saber sobre a imagem?"
                    value={analyzePrompt}
                    onChange={(e) => setAnalyzePrompt(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleAnalyzeImage}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <Text pt="Analisando..." en="Analyzing..." es="Analizando..." />
                    </>
                  ) : (
                    <Text pt="Analisar Imagem" en="Analyze Image" es="Analizar Imagen" />
                  )}
                </Button>

                {analysisResponse && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        <Text pt="Análise" en="Analysis" es="Análisis" />
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(analysisResponse)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4 text-slate-100 max-h-96 overflow-y-auto">
                      {analysisResponse}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Informações de Configuração */}
        <Card className="mt-8 p-6 bg-slate-800 border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-2">
            <Text pt="Configuração Necessária" en="Required Configuration" es="Configuración Requerida" />
          </h3>
          <p className="text-slate-300 text-sm">
            <Text 
              pt="Para usar este demo, configure as variáveis de ambiente em" 
              en="To use this demo, configure environment variables in" 
              es="Para usar esta demostración, configure las variables de entorno en" 
            />
            <code className="bg-slate-700 px-2 py-1 rounded ml-1">.env.local</code>:
          </p>
          <ul className="mt-2 text-sm text-slate-400 space-y-1">
            <li>• GOOGLE_CLOUD_PROJECT_ID</li>
            <li>• GOOGLE_CLOUD_REGION (padrão: us-central1)</li>
            <li>
              • GOOGLE_APPLICATION_CREDENTIALS_BASE64 (credenciais em base64)
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
