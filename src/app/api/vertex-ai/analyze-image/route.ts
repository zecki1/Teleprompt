import { NextRequest, NextResponse } from "next/server";
import { getVertexAI } from "@/lib/vertex-ai";
import {
  rateLimit,
  validatePrompt,
  validateImageUrl,
  logRequest,
} from "@/lib/vertex-ai-security";

export async function POST(request: NextRequest) {
  // Verificar rate limiting
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { imageUrl, prompt = "Descreva esta imagem em detalhes" } =
      await request.json();

    // Validar URL da imagem
    const urlValidation = validateImageUrl(imageUrl);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { error: urlValidation.error || "URL de imagem inválida" },
        { status: 400 }
      );
    }

    // Validar prompt
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      return NextResponse.json(
        { error: promptValidation.error || "Prompt inválido" },
        { status: 400 }
      );
    }

    // Log da requisição
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    logRequest("/api/vertex-ai/analyze-image", prompt, ip);

    const vertexAI = getVertexAI();

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const response = await generativeModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: "image/jpeg",
                fileUri: imageUrl,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const textContent = response.response.candidates?.[0]?.content?.parts?.[0];

    return NextResponse.json({
      success: true,
      data: textContent,
      fullResponse: response.response,
    });
  } catch (error) {
    console.error("Erro ao analisar imagem:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao analisar imagem",
      },
      { status: 500 }
    );
  }
}
