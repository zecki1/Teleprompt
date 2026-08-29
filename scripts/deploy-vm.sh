#!/usr/bin/env bash
# =============================================================================
# Deploy completo do backend Teleprompt na VM GCP (idempotente).
#
# PRÉ-REQUISITOS (rodar no Cloud Shell ANTES deste script):
#   1. Upload da service account p/ o Cloud Shell (botão "Upload File"): ~/firebase-service-account.json
#   2. gcloud compute ssh --zone=us-central1-a vps-projeto-final --command="mkdir -p ~/Teleprompt/secrets"
#   3. gcloud compute scp --zone=us-central1-a ~/firebase-service-account.json \
#        zeckiregino1@vps-projeto-final:~/Teleprompt/secrets/firebase-service-account.json
#   4. Abrir o firewall (Cloud Shell):
#        gcloud compute firewall-rules-create allow-https --allow=tcp:443 --description="HTTPS API" || true
#
# EXECUÇÃO:
#   Dentro da VM:   cd ~/Teleprompt && git pull && bash scripts/deploy-vm.sh
# =============================================================================
set -euo pipefail

DOMAIN="api.teleprompt.zecki1.com.br"
EMAIL="admin@zecki1.com.br"
DIR="$HOME/Teleprompt"
SA="$DIR/secrets/firebase-service-account.json"

cd "$DIR"
echo "==> [1/7] Atualizando o repo (branch dotnet) e preparando pasta"
git fetch origin
git switch dotnet 2>/dev/null || git checkout dotnet
git pull --ff-only
mkdir -p secrets data
echo "    - Commit atual: $(git rev-parse --short HEAD) em $(pwd)"

if [ ! -s "$SA" ]; then
  echo ""
  echo "ERRO: $SA não existe."
  echo "Sem a service account o sync do Firestore NÃO roda e as contas do Firebase"
  echo "não são importadas (o ezequiel.rmoncao@sp.senai.br não consegue entrar)."
  echo "Siga os passos 1-3 da seção PRÉ-REQUISITOS e rode o script de novo."
  exit 1
fi
echo "==> [2/7] Service account OK: $SA ($(wc -c < "$SA") bytes)"

echo "==> [3/7] Subindo o container (build + background)"
docker compose -f docker-compose.api.yml up -d --build

echo "==> [4/7] Aguardando boot e coletando logs de Firebase/sync"
for i in $(seq 1 20); do
  if curl -sf -o /dev/null http://127.0.0.1:5000/health; then
    echo "    - API de pé após ${i}s (health OK)"
    break
  fi
  sleep 1
done
echo "    - Logs relevantes (Firebase/sync/erro):"
docker compose -f docker-compose.api.yml logs --tail 400 backend \
  | grep -iE "firebase|sync|erro|error|fail|exception|warn" | tail -40 || true

echo "==> [5/7] nginx + certbot (HTTPS)"
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y nginx
fi
if ! command -v certbot >/dev/null 2>&1; then
  sudo apt-get install -y certbot python3-certbot-nginx
fi
sudo cp "$DIR/deploy/api-nginx.conf" "/etc/nginx/sites-available/$DOMAIN"
sudo ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx || sudo systemctl restart nginx

if ! sudo test -d "/etc/letsencrypt/live/$DOMAIN"; then
  echo "    - Emitindo certificado SSL (Let's Encrypt)..."
  sudo certbot --nginx -d "$DOMAIN" --agree-tos -m "$EMAIL" --non-interactive --redirect
else
  echo "    - Certificado já existe; reemitindo/garantindo..."
  sudo certbot --nginx -d "$DOMAIN" --agree-tos -m "$EMAIL" --non-interactive --redirect
fi
sudo systemctl reload nginx

echo "==> [6/7] Verificação externa"
curl -s -o /dev/null -w "    - https://$DOMAIN/swagger/v1/swagger.json -> HTTP %{http_code}\n" "https://$DOMAIN/swagger/v1/swagger.json" || true
curl -s -o /dev/null -w "    - https://$DOMAIN/health          -> HTTP %{http_code}\n" "https://$DOMAIN/health" || true
docker compose -f docker-compose.api.yml ps

echo "==> [7/7] Resumo"
echo "    - API pública: https://$DOMAIN (swagger em /swagger)"
echo "    - Contas importadas do Firestore usam a senha temporária: Migrated@Temp123!"
echo "      (troque depois no Perfil)."
echo "    - Logs ao vivo: docker compose -f docker-compose.api.yml logs -f --tail 200 backend"
echo "    - Sync manual:  POST /api/v1/admin/firebase/sync (SuperAdmin) — logs no console da API."
echo "FEITO."