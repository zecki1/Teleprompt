import { NextRequest, NextResponse } from "next/server";
// import { getVertexAI } from "@/lib/vertex-ai";
// import {
//   rateLimit,
//   validatePrompt,
//   logRequest,
// } from "@/lib/vertex-ai-security";

// DESATIVADO: Esta rota usa uma API antiga do Vertex AI que não é mais compatível
// Para reativar, atualize para o SDK e métodos de API mais recentes do @google-cloud/vertexai

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Este endpoint está desativado no momento. Por favor, atualize a implementação do Vertex AI." },
    { status: 503 }
  );
}

// export async function POST(request: NextRequest) {
//   // Verificar rate limiting
//   const rateLimitResponse = rateLimit(request);
//   if (rateLimitResponse) {
//     return rateLimitResponse;
//   }

//   try {
//     const { prompt, numberOfImages = 1, aspectRatio = "1:1" } =
//       await request.json();

//     // Validar prompt
//     const validation = validatePrompt(prompt);
//     if (!validation.isValid) {
//       return NextResponse.json(
//         { error: validation.error || "Invalid prompt" },
//         { status: 400 }
//       );
//     }

//     // Log da requisição
//     const ip = request.headers.get("x-forwarded-for") || "unknown";
//     logRequest("/api/vertex-ai/generate-image", prompt, ip);

//     const vertexAI = getVertexAI();

//     // Using Imagen 3 model for image generation
//     const request_payload = {
//       instances: [
//         {
//           prompt: prompt,
//         },
//       ],
//       parameters: {
//         sampleCount: numberOfImages,
//         aspectRatio: aspectRatio,
//       },
//     };

//     const generativeServiceClient = vertexAI.preview.getGenerativeServiceClient(
//       {
//         apiVersion: "v1",
//       }
//     );

//     const response = await generativeServiceClient.generateImages(
//       request_payload
//     );

//     return NextResponse.json({
//       success: true,
//       data: response,
//     });
//   } catch (error) {
//     console.error("Error generating image:", error);
//     return NextResponse.json(
//       {
//         error:
//           error instanceof Error ? error.message : "Failed to generate image",
//       },
//       { status: 500 }
//     );
//   }
// }
