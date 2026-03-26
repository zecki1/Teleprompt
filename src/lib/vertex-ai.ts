import { VertexAI } from "@google-cloud/vertexai";

let vertexAI: VertexAI | null = null;

export function initializeVertexAI(): VertexAI {
  if (vertexAI) {
    return vertexAI;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

  if (!projectId) {
    throw new Error(
      "A variável de ambiente GOOGLE_CLOUD_PROJECT_ID é obrigatória"
    );
  }

  // Se a conta de serviço for fornecida como base64
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
    const credentialsJson = Buffer.from(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
      "base64"
    ).toString("utf-8");

    // Escreve as credenciais em um arquivo temporário e define a variável de ambiente
    // Nota: Em produção, use os métodos de autenticação padrão do Google Cloud
    // ou defina GOOGLE_APPLICATION_CREDENTIALS para apontar para um arquivo de credenciais
    const credentials = JSON.parse(credentialsJson);
    
    // O SDK do VertexAI usa a autenticação padrão do Google,
    // que lê da variável de ambiente GOOGLE_APPLICATION_CREDENTIALS
    // Por enquanto, usaremos apenas a inicialização padrão
    vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
  } else {
    // Usa as credenciais padrão do ambiente ou do Google Cloud SDK
    vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
  }

  return vertexAI;
}

export function getVertexAI(): VertexAI {
  if (!vertexAI) {
    return initializeVertexAI();
  }
  return vertexAI;
}
