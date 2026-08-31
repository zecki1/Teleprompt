#!/usr/bin/env bash
# =============================================================================
# Deploy/operação da VM GCP a partir do Mac (via gcloud).
#
# DIFERENÇA:
#   - deploy-vm.sh roda DENTRO da VM (faz build, sobe container, nginx, certbot).
#   - este deploy.sh roda NO SEU MAC e só fala com a VM via `gcloud compute ssh`,
#     enviando os secrets/ e disparando o deploy-vm.sh remoto.
#
# PRÉ-REQUISITOS (no Mac, 1x):
#   1. gcloud instalado e logado:
#        curl https://sdk.cloud.google.com | bash && exec -l $SHELL
#        gcloud auth login
#        gcloud config set project teleprompt-506921
#   2. Service account salva em:
#        ./secrets/firebase-service-account.json
#      (baixar do Firebase Console > Configurações > Contas de serviço)
#
# USO:
#   ./scripts/deploy.sh status      # estado da VM/container (remoto)
#   ./scripts/deploy.sh push-secrets  # envia secrets/ do Mac -> VM
#   ./scripts/deploy.sh deploy      # push-secrets + roda deploy-vm.sh remoto
#   ./scripts/deploy.sh logs        # logs ao vivo do backend
#   ./scripts/deploy.sh health      # checa /health e /swagger externos
# =============================================================================
set -euo pipefail

PROJECT="${GCP_PROJECT:-teleprompt-506921}"
ZONE="${GCP_ZONE:-us-central1-a}"
VM_USER="${GCP_VM_USER:-zeckiregino1}"
VM_NAME="${GCP_VM_NAME:-vps-projeto-final}"
REMOTE_DIR="${GCP_REMOTE_DIR:-Teleprompt}"

SA="$PWD/secrets/firebase-service-account.json"

require_sa() {
  if [ ! -s "$SA" ]; then
    echo "ERRO: $SA não existe."
    echo "Baixe a service account do Firebase Console e salve-a em:"
    echo "  $PWD/secrets/firebase-service-account.json"
    exit 1
  fi
}

gssh() {
  gcloud compute ssh --project="$PROJECT" --zone="$ZONE" "${VM_USER}@${VM_NAME}" --command="$1"
}

cmd_status() {
  echo "==> Estado do container e serviços na VM =="
  gssh "docker compose -f ~/$REMOTE_DIR/docker-compose.api.yml ps 2>&1 || docker ps -a 2>&1; echo '--- nginx ---'; ls /etc/nginx/sites-enabled/ 2>&1; echo '--- cert ---'; sudo test -d /etc/letsencrypt/live/api.teleprompt.zecki1.com.br && echo 'CERT OK' || echo 'SEM CERT'"
}

cmd_push_secrets() {
  require_sa
  echo "==> Criando pastas e enviando secrets para a VM =="
  gssh "mkdir -p ~/$REMOTE_DIR/secrets ~/$REMOTE_DIR/data"
  gcloud compute scp --project="$PROJECT" --zone="$ZONE" \
    "$PWD/secrets/backend.env" "$SA" \
    "${VM_USER}@${VM_NAME}:~/$REMOTE_DIR/secrets/"
  echo "    - backend.env e firebase-service-account.json enviados ✓"
}

cmd_deploy() {
  cmd_push_secrets
  echo "==> Rodando deploy-vm.sh na VM =="
  gssh "cd ~/$REMOTE_DIR && git fetch origin && git checkout dotnet 2>/dev/null || git checkout main; git pull --ff-only; bash scripts/deploy-vm.sh"
}

cmd_logs() {
  echo "==> Logs ao vivo do backend (Ctrl+C para sair) =="
  gssh "docker compose -f ~/$REMOTE_DIR/docker-compose.api.yml logs -f --tail 200 backend"
}

cmd_health() {
  echo "==> Testes externos =="
  curl -s -o /dev/null -w "https://api.teleprompt.zecki1.com.br/health   -> HTTP %{http_code}\n" --max-time 10 "https://api.teleprompt.zecki1.com.br/health" || echo "  /health   -> SEM RESPOSTA"
  curl -s -o /dev/null -w "https://api.teleprompt.zecki1.com.br/swagger  -> HTTP %{http_code}\n" --max-time 10 "https://api.teleprompt.zecki1.com.br/swagger/v1/swagger.json" || echo "  /swagger  -> SEM RESPOSTA"
}

case "${1:-}" in
  status)        cmd_status ;;
  push-secrets)  cmd_push_secrets ;;
  deploy)        cmd_deploy ;;
  logs)          cmd_logs ;;
  health)        cmd_health ;;
  *)
    echo "Uso: $0 {status|push-secrets|deploy|logs|health}"
    exit 1
    ;;
esac
