#!/usr/bin/env bash
# =============================================================================
# Sobe o backend .NET localmente (dotnet run) carregando o secrets/backend.env.
#
# O `dotnet run` NÃO lê .env por conta própria. Este script:
#   1. carrega secrets/backend.env (ignorado pelo git);
#   2. mapeia JWT_KEY -> Jwt__Key (formato que o .NET espera: __ == :);
#   3. sobrescreve Firebase__ServiceAccountKey com o caminho LOCAL real
#      (o valor /app/secrets/... do arquivo é o caminho DENTRO do Docker);
#   4. define ASPNETCORE_ENVIRONMENT=Development (habilita /swagger).
#
# USO:
#   ./scripts/run-local.sh
#   ./scripts/run-local.sh --watch     # dotnet watch (reinicia ao salvar)
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/backend/src/Teleprompt.Api"
ENV_FILE="$ROOT/secrets/backend.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: $ENV_FILE não existe."
  echo "Copie secrets/backend.env.example para secrets/backend.env e preencha."
  exit 1
fi

JWT_KEY=""
while IFS='=' read -r key value; do
  case "$key" in
    ''|\#*) continue ;;
    # Variáveis que no backend.env são específicas do DOCKER (caminhos /app/...)
    # e que na execução local devem ser ignoradas para não sobrescrever o
    # appsettings.Development.json (que já define SQLite + CORS de localhost):
    Firebase__ServiceAccountKey) ;; # sobrescrito abaixo para o caminho local
    ConnectionStrings__DefaultConnection) ;; # deixa o appsettings.Development definir
    Cors__Origins) ;;                      # deixa o appsettings.Development definir
    Database__Provider) ;;                 # deixa o appsettings.Development definir
    JWT_KEY) JWT_KEY="$value" ;;
    *) export "$key=$value" ;;
  esac
done < <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE")

if [ -z "$JWT_KEY" ]; then
  echo "ERRO: JWT_KEY vazia em $ENV_FILE."
  exit 1
fi
export Jwt__Key="$JWT_KEY"

SA_LOCAL="$ROOT/secrets/firebase-service-account.json"
if [ -f "$SA_LOCAL" ]; then
  export Firebase__ServiceAccountKey="$SA_LOCAL"
  export GOOGLE_APPLICATION_CREDENTIALS="$SA_LOCAL"
  echo "  - service account local: $SA_LOCAL"
else
  echo "  - AVISO: secrets/firebase-service-account.json não encontrada; Firestore não será importado."
fi

export ASPNETCORE_ENVIRONMENT=Development

cd "$API_DIR"
opts=("$@")
if [ "${1:-}" = "--watch" ]; then
  exec dotnet watch run
else
  exec dotnet run
fi
