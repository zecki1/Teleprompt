import { NextRequest, NextResponse } from "next/server";
import { getVertexAI } from "@/lib/vertex-ai";
import {
  rateLimit,
  validatePrompt,
  logRequest,
} from "@/lib/vertex-ai-security";

export async function POST(request: NextRequest) {
  // Verificar rate limiting
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { prompt, maxOutputTokens = 1024, temperature = 0.7 } =
      await request.json();

    // Validar prompt
    const validation = validatePrompt(prompt);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Prompt inválido" },
        { status: 400 }
      );
    }

    // Log da requisição
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    logRequest("/api/vertex-ai/generate-text", prompt, ip);

    const vertexAI = getVertexAI();

    // Usando o modelo Gemini para geração de texto
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const response = await generativeModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxOutputTokens,
        temperature: temperature,
        topP: 0.8,
      },
    });

    const textContent = response.response.candidates?.[0]?.content?.parts?.[0];

    return NextResponse.json({
      success: true,
      data: textContent,
      fullResponse: response.response,
    });
  } catch (error) {
    console.error("Erro ao gerar texto:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao gerar texto",
      },
      { status: 500 }
    );
  }
}
