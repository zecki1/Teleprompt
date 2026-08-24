#!/usr/bin/env bash
# ============================================================
# Publica o Teleprompt na VM Oracle — roda NA SUA MÁQUINA (Git Bash)
# Uso: ./publish-to-oracle.sh ubuntu@SEU_IP [caminho-da-chave] [--com-banco]
#   --com-banco  também envia o SQLite local com os dados migrados
# ============================================================
set -euo pipefail

DEST="${1:?uso: ./publish-to-oracle.sh ubuntu@IP [chave] [--com-banco]}"
KEY="${2:-}"
SEND_DB="${3:-}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
KEYARG=()
[ -n "$KEY" ] && KEYARG=(-i "$KEY")

echo "==> Build Angular → wwwroot/app"
bash "$REPO/frontend/build-to-backend.sh" > /dev/null

echo "==> dotnet publish (Release)"
cd "$REPO/backend"
dotnet publish src/Teleprompt.Api -c Release -o publish -v q

echo "==> Enviando arquivos…"
ssh "${KEYARG[@]}" "$DEST" "sudo mkdir -p /opt/teleprompt/app /opt/teleprompt/data /opt/teleprompt/wwwroot && sudo chown -R \$(whoami) /opt/teleprompt"
scp "${KEYARG[@]}" -r publish/. "$DEST:/opt/teleprompt/app/"

if [ "$SEND_DB" = "--com-banco" ]; then
  echo "==> Enviando banco com dados migrados…"
  scp "${KEYARG[@]}" src/Teleprompt.Api/teleprompt-dev.db "$DEST:/opt/teleprompt/data/teleprompt.db"
fi

echo "==> Ajustando permissões e reiniciando serviço…"
ssh "${KEYARG[@]}" "$DEST" "sudo chown -R teleprompt:teleprompt /opt/teleprompt && sudo systemctl restart teleprompt"

echo "==> Status:"
sleep 3
ssh "${KEYARG[@]}" "$DEST" "systemctl is-active teleprompt && curl -s -o /dev/null -w 'app: %{http_code}\n' http://127.0.0.1:8080/"
echo "✅ Publicado! http://$(echo "$DEST" | cut -d@ -f2)/"
